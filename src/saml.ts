// AgentWatch SSO / SAML Authentication
//
// Production-ready SAML Response parsing with XML signature verification.
// Uses xml-crypto for signature validation against the IdP certificate.
// Gated behind SSO_ENABLED environment variable.

import { escapeHtml } from "./utils";

declare class DOMParser {
  parseFromString(string: string, mimeType: string): any;
}

export interface SamlConfig {
  tenant_id: string;
  idp_entity_id: string;
  idp_sso_url: string;
  idp_certificate: string;
  sp_entity_id: string;
  sp_acs_url: string;
  name_id_format: string;
  enabled: boolean;
  tenant_claim?: string;
  tenant_domain_map?: Record<string, string>;
}

export interface AuthEvent {
  tenant_id: string;
  event_type: "saml_auth_request" | "saml_auth_response" | "saml_auth_success" | "saml_auth_failure" | "saml_logout";
  subject: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, unknown>;
}

function base64UrlEncode(str: string): string {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function generateAuthnRequest(spEntityName: string, acsUrl: string): { requestXml: string; requestId: string; redirectUrl: string } {
  const requestId = "_" + crypto.randomUUID();
  const issueInstant = new Date().toISOString();

  const requestXml = `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="${requestId}" Version="2.0" IssueInstant="${issueInstant}" AssertionConsumerServiceURL="${acsUrl}" ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"><saml:Issuer>${escapeXml(spEntityName)}</saml:Issuer><samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress" AllowCreate="true"/></samlp:AuthnRequest>`;

  const encoded = base64UrlEncode(requestXml);

  return { requestXml, requestId, redirectUrl: `?SAMLRequest=${encoded}` };
}

import { SignedXml } from "xml-crypto";

export function parseSamlResponse(
  samlResponseBase64: string,
  idpCertificate: string,
  expectedRequestId?: string,
): { success: boolean; subject: string | null; sessionIndex: string | null; inResponseTo: string | null; error: string | null } {
  try {
    const xml = atob(samlResponseBase64.replace(/-/g, "+").replace(/_/g, "/"));

    if (!xml.includes("saml:Assertion") && !xml.includes("Assertion")) {
      return { success: false, subject: null, sessionIndex: null, inResponseTo: null, error: "Missing SAML Assertion" };
    }

    let signedXmlContent: string | null = null;
    try {
      const sig = new SignedXml();
      // loadSignature exists on SignedXml but is not in the type definitions
      (sig as unknown as { loadSignature(xml: string, options: { allowedAlgorithms: string[] }): void }).loadSignature(xml, {
        allowedAlgorithms: [
          "http://www.w3.org/2001/04/xmlenc#rsa-sha256",
          "http://www.w3.org/2001/04/xmlenc#rsa-sha384",
          "http://www.w3.org/2001/04/xmlenc#rsa-sha512",
          "http://www.w3.org/2000/09/xmldsig#rsa-sha256",
          "http://www.w3.org/2000/09/xmldsig#rsa-sha384",
          "http://www.w3.org/2000/09/xmldsig#rsa-sha512",
        ],
      });
      const cert = "-----BEGIN CERTIFICATE-----\n" + idpCertificate + "\n-----END CERTIFICATE-----";
      const valid = sig.checkSignature(cert);
      if (!valid) {
        return { success: false, subject: null, sessionIndex: null, inResponseTo: null, error: "Invalid SAML signature" };
      }
      signedXmlContent = sig.getSignedXml();
    } catch (sigErr) {
      return { success: false, subject: null, sessionIndex: null, inResponseTo: null, error: "Signature verification failed: " + (sigErr instanceof Error ? sigErr.message : String(sigErr)) };
    }

    const sourceXml = signedXmlContent || xml;
    let subject: string | null = null;
    let sessionIndex: string | null = null;
    let inResponseTo: string | null = null;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(sourceXml, "application/xml");
      const parserError = doc.querySelector("parsererror");
      if (!parserError) {
        const nameIdEl = doc.getElementsByTagName("saml:NameID")[0]
          || doc.getElementsByTagName("NameID")[0];
        subject = nameIdEl?.textContent || null;

        const assertionEl = doc.getElementsByTagName("saml:Assertion")[0]
          || doc.getElementsByTagName("Assertion")[0];
        if (assertionEl) {
          sessionIndex = assertionEl.getAttribute("SessionIndex");
          inResponseTo = assertionEl.getAttribute("InResponseTo");
        }

        if (!inResponseTo) {
          const rootEl = doc.documentElement;
          inResponseTo = rootEl?.getAttribute("InResponseTo") || null;
        }

        const conditionsEl = doc.getElementsByTagName("saml:Conditions")[0]
          || doc.getElementsByTagName("Conditions")[0];
        if (conditionsEl) {
          const notOnOrAfter = conditionsEl.getAttribute("NotOnOrAfter");
          if (notOnOrAfter && new Date(notOnOrAfter) < new Date()) {
            return { success: false, subject: null, sessionIndex: null, inResponseTo: null, error: "SAML Assertion expired" };
          }
          const notBefore = conditionsEl.getAttribute("NotBefore");
          if (notBefore && new Date(notBefore) > new Date()) {
            return { success: false, subject: null, sessionIndex: null, inResponseTo: null, error: "SAML Assertion not yet valid" };
          }
        }
      }
    } catch {
      // DOMParser failed — fall through to regex fallback
    }

    if (!subject) {
      const nameIdMatch = sourceXml.match(/<saml:NameID[^>]*>([^<]+)<\/saml:NameID>/)
        || sourceXml.match(/<NameID[^>]*>([^<]+)<\/NameID>/);
      subject = nameIdMatch ? nameIdMatch[1] : null;
    }
    if (!sessionIndex) {
      const sessionMatch = sourceXml.match(/SessionIndex="([^"]+)"/);
      sessionIndex = sessionMatch ? sessionMatch[1] : null;
    }
    if (!inResponseTo) {
      const inResponseToMatch = sourceXml.match(/InResponseTo="([^"]+)"/);
      inResponseTo = inResponseToMatch ? inResponseToMatch[1] : null;
    }

    if (!sourceXml.includes("NotOnOrAfter") || !subject) {
      const notOnOrAfterMatch = sourceXml.match(/NotOnOrAfter="([^"]+)"/);
      if (notOnOrAfterMatch) {
        const expiry = new Date(notOnOrAfterMatch[1]);
        if (expiry < new Date()) {
          return { success: false, subject: null, sessionIndex: null, inResponseTo: null, error: "SAML Assertion expired" };
        }
      }
      const notBeforeMatch = sourceXml.match(/NotBefore="([^"]+)"/);
      if (notBeforeMatch) {
        const notBefore = new Date(notBeforeMatch[1]);
        if (notBefore > new Date()) {
          return { success: false, subject: null, sessionIndex: null, inResponseTo: null, error: "SAML Assertion not yet valid" };
        }
      }
    }

    if (!subject) {
      return { success: false, subject: null, sessionIndex: null, inResponseTo: null, error: "Missing NameID in SAML Response" };
    }

    if (expectedRequestId && inResponseTo !== expectedRequestId) {
      return { success: false, subject: null, sessionIndex: null, inResponseTo, error: "InResponseTo does not match expected RequestId" };
    }

    return { success: true, subject, sessionIndex, inResponseTo, error: null };
  } catch (err) {
    return { success: false, subject: null, sessionIndex: null, inResponseTo: null, error: "Failed to parse SAML Response: " + (err instanceof Error ? err.message : String(err)) };
  }
}

export function mapSubjectToTenant(subject: string, config: SamlConfig): string | null {
  if (config.tenant_domain_map && subject.includes("@")) {
    const domain = subject.split("@")[1].toLowerCase();
    const mappedTenant = config.tenant_domain_map[domain];
    if (mappedTenant) return mappedTenant;
  }

  if (subject === config.tenant_id) return config.tenant_id;

  return null;
}

export function buildSamlResponseHtml(acsUrl: string, samlResponse: string, relayState: string): string {
  return `<!DOCTYPE html>
<html>
<head><title>Completing SSO Login...</title><link rel="icon" type="image/svg+xml" href="/favicon.svg"></head>
<body>
<form method="POST" action="${escapeHtml(acsUrl)}" id="samlForm">
  <input type="hidden" name="SAMLResponse" value="${escapeHtml(samlResponse)}">
  <input type="hidden" name="RelayState" value="${escapeHtml(relayState)}">
</form>
<script>document.getElementById('samlForm').submit();</script>
</body>
</html>`;
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
