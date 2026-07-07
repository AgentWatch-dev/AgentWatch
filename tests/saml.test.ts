/**
 * SSO / SAML tests.
 *
 * Tests the SAML module's AuthnRequest generation, Response parsing,
 * signature verification, and tenant mapping.
 *
 * SSO is gated behind SSO_ENABLED=true. The endpoints return 501 when
 * the flag is not set. This test suite verifies the gate behavior.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { generateAuthnRequest, parseSamlResponse, mapSubjectToTenant, buildSamlResponseHtml, type SamlConfig } from "../src/saml";
import { makeEnv, makeRequest, makeCtx } from "./helpers";

let worker: any;
let env: any;
let ctx: any;

beforeEach(async () => {
  vi.resetModules();
  const mod = await import("../src/index");
  worker = mod.default;
  env = makeEnv({ SSO_ENABLED: "true", SUPABASE_URL: "https://test.supabase.co" });
  ctx = makeCtx();
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeSamlConfig(overrides: Partial<SamlConfig> = {}): SamlConfig {
  return {
    tenant_id: "tenant_test",
    idp_entity_id: "https://idp.example.com",
    idp_sso_url: "https://idp.example.com/sso",
    idp_certificate: "MIIC...",
    sp_entity_id: "agentwatch-tenant_test",
    sp_acs_url: "https://agent-watch.dev/v1/sso/saml/acs",
    name_id_format: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
    enabled: true,
    ...overrides,
  };
}

describe("AuthnRequest generation", () => {
  it("generates valid AuthnRequest XML", () => {
    const { requestXml, requestId } = generateAuthnRequest("agentwatch-test", "https://agent-watch.dev/v1/sso/saml/acs");
    expect(requestXml).toContain("samlp:AuthnRequest");
    expect(requestXml).toContain(`ID="${requestId}"`);
    expect(requestXml).toContain("Version=\"2.0\"");
    expect(requestXml).toContain("AssertionConsumerServiceURL");
  });

  it("includes SP issuer", () => {
    const { requestXml } = generateAuthnRequest("agentwatch-test", "https://agent-watch.dev/v1/sso/saml/acs");
    expect(requestXml).toContain("<saml:Issuer>agentwatch-test</saml:Issuer>");
  });

  it("generates unique request IDs", () => {
    const id1 = generateAuthnRequest("sp", "acs").requestId;
    const id2 = generateAuthnRequest("sp", "acs").requestId;
    expect(id1).not.toBe(id2);
  });

  it("generates redirect URL with SAMLRequest", () => {
    const { redirectUrl } = generateAuthnRequest("sp", "acs");
    expect(redirectUrl).toContain("SAMLRequest=");
  });
});

describe("SAML Response parsing", () => {
  const TEST_CERT = "MIIC...";

  it("parses valid SAML Response with valid signature", async () => {
    const { SignedXml } = await import("xml-crypto");
    const mockSig = { loadSignature: vi.fn(), checkSignature: vi.fn().mockReturnValue(true) };
    vi.spyOn(SignedXml.prototype, "loadSignature").mockImplementation(mockSig.loadSignature);
    vi.spyOn(SignedXml.prototype, "checkSignature").mockImplementation(mockSig.checkSignature);

    const xml = `<samlp:Response><saml:Assertion><saml:Subject><saml:NameID>user@example.com</saml:NameID></saml:Subject></saml:Assertion></samlp:Response>`;
    const encoded = btoa(xml);
    const result = parseSamlResponse(encoded, TEST_CERT);
    expect(result.success).toBe(true);
    expect(result.subject).toBe("user@example.com");

    vi.restoreAllMocks();
  });

  it("extracts SessionIndex", async () => {
    const { SignedXml } = await import("xml-crypto");
    vi.spyOn(SignedXml.prototype, "loadSignature").mockImplementation(() => {});
    vi.spyOn(SignedXml.prototype, "checkSignature").mockReturnValue(true);

    const xml = `<saml:Assertion><saml:AuthnStatement SessionIndex="_session123"><saml:Subject><saml:NameID>user@example.com</saml:NameID></saml:Subject></saml:AuthnStatement></saml:Assertion>`;
    const encoded = btoa(xml);
    const result = parseSamlResponse(encoded, TEST_CERT);
    expect(result.sessionIndex).toBe("_session123");

    vi.restoreAllMocks();
  });

  it("rejects response without Assertion", async () => {
    const { SignedXml } = await import("xml-crypto");
    vi.spyOn(SignedXml.prototype, "loadSignature").mockImplementation(() => {});
    vi.spyOn(SignedXml.prototype, "checkSignature").mockReturnValue(true);

    const xml = `<samlp:Response><samlp:Status></samlp:Status></samlp:Response>`;
    const encoded = btoa(xml);
    const result = parseSamlResponse(encoded, TEST_CERT);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Missing SAML Assertion");

    vi.restoreAllMocks();
  });

  it("rejects response without NameID", async () => {
    const { SignedXml } = await import("xml-crypto");
    vi.spyOn(SignedXml.prototype, "loadSignature").mockImplementation(() => {});
    vi.spyOn(SignedXml.prototype, "checkSignature").mockReturnValue(true);

    const xml = `<saml:Assertion><saml:Subject></saml:Subject></saml:Assertion>`;
    const encoded = btoa(xml);
    const result = parseSamlResponse(encoded, TEST_CERT);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Missing NameID");

    vi.restoreAllMocks();
  });

  it("handles malformed base64", async () => {
    const result = parseSamlResponse("not-valid-base64!!!", TEST_CERT);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Failed to parse");
  });

  it("handles empty input", async () => {
    const result = parseSamlResponse("", TEST_CERT);
    expect(result.success).toBe(false);
  });

  it("rejects when signature verification fails", async () => {
    const { SignedXml } = await import("xml-crypto");
    vi.spyOn(SignedXml.prototype, "loadSignature").mockImplementation(() => {});
    vi.spyOn(SignedXml.prototype, "checkSignature").mockReturnValue(false);

    const xml = `<saml:Assertion><saml:Subject><saml:NameID>attacker@evil.com</saml:NameID></saml:Subject></saml:Assertion>`;
    const encoded = btoa(xml);
    const result = parseSamlResponse(encoded, TEST_CERT);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid SAML signature");

    vi.restoreAllMocks();
  });

  it("rejects when signature check throws", async () => {
    const { SignedXml } = await import("xml-crypto");
    vi.spyOn(SignedXml.prototype, "loadSignature").mockImplementation(() => {});
    vi.spyOn(SignedXml.prototype, "checkSignature").mockImplementation(() => { throw new Error("bad sig"); });

    const xml = `<saml:Assertion><saml:Subject><saml:NameID>user@example.com</saml:NameID></saml:Subject></saml:Assertion>`;
    const encoded = btoa(xml);
    const result = parseSamlResponse(encoded, TEST_CERT);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Signature verification failed");

    vi.restoreAllMocks();
  });
});

describe("Tenant mapping", () => {
  it("maps subject to configured tenant when subject matches tenant_id", () => {
    const config = makeSamlConfig({ tenant_id: "user@acme.com" });
    const tenant = mapSubjectToTenant("user@acme.com", config);
    expect(tenant).toBe("user@acme.com");
  });

  it("rejects subject that does not match tenant_id and has no domain map", () => {
    const config = makeSamlConfig({ tenant_id: "tenant_fixed" });
    expect(mapSubjectToTenant("anyone@example.com", config)).toBeNull();
    expect(mapSubjectToTenant("different@example.com", config)).toBeNull();
  });

  it("maps email domain to tenant via tenant_domain_map", () => {
    const config = makeSamlConfig({
      tenant_id: "default_tenant",
      tenant_domain_map: { "acme.com": "tenant_acme", "globex.com": "tenant_globex" },
    });
    expect(mapSubjectToTenant("user@acme.com", config)).toBe("tenant_acme");
    expect(mapSubjectToTenant("admin@globex.com", config)).toBe("tenant_globex");
  });

  it("rejects unmapped domains (no fallback)", () => {
    const config = makeSamlConfig({
      tenant_id: "default_tenant",
      tenant_domain_map: { "acme.com": "tenant_acme" },
    });
    expect(mapSubjectToTenant("user@unknown.com", config)).toBeNull();
  });

  it("rejects subjects without @ when no domain map match", () => {
    const config = makeSamlConfig({
      tenant_id: "default_tenant",
      tenant_domain_map: { "acme.com": "tenant_acme" },
    });
    expect(mapSubjectToTenant("no-email-subject", config)).toBeNull();
  });
});

describe("SSO Response HTML", () => {
  it("generates auto-submit form", () => {
    const html = buildSamlResponseHtml("https://acs.example.com", "base64response", "relay");
    expect(html).toContain("<form");
    expect(html).toContain("method=\"POST\"");
    expect(html).toContain("SAMLResponse");
    expect(html).toContain("RelayState");
    expect(html).toContain(".submit()");
  });

  it("escapes HTML in parameters", () => {
    const html = buildSamlResponseHtml("https://acs.example.com", "<script>alert(1)</script>", "relay");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).not.toContain('value="<script>');
  });
});

describe("SSO gate behavior", () => {
  const TEST_CERT = "MIIC...";

  it("parseSamlResponse works regardless of gate (module-level function)", async () => {
    const { SignedXml } = await import("xml-crypto");
    vi.spyOn(SignedXml.prototype, "loadSignature").mockImplementation(() => {});
    vi.spyOn(SignedXml.prototype, "checkSignature").mockReturnValue(true);

    const xml = `<saml:Assertion><saml:Subject><saml:NameID>user@example.com</saml:NameID></saml:Subject></saml:Assertion>`;
    const result = parseSamlResponse(btoa(xml), TEST_CERT);
    expect(result.success).toBe(true);

    vi.restoreAllMocks();
  });

  it("rejects forged SAML Response without valid signature", async () => {
    const { SignedXml } = await import("xml-crypto");
    vi.spyOn(SignedXml.prototype, "loadSignature").mockImplementation(() => {});
    vi.spyOn(SignedXml.prototype, "checkSignature").mockReturnValue(false);

    const forgedXml = `<saml:Assertion><saml:Subject><saml:NameID>attacker@evil.com</saml:NameID></saml:Subject></saml:Assertion>`;
    const result = parseSamlResponse(btoa(forgedXml), TEST_CERT);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Invalid SAML signature");

    vi.restoreAllMocks();
  });
});

describe("SAML Worker Endpoints", () => {
  it("GET /v1/sso/saml/init returns 302 redirect to IdP", async () => {
    // SSO requires Enterprise plan
    await env.KV.put("tenant:plan:tenant_a", JSON.stringify({ plan: "enterprise" }));

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: string | URL | Request) => {
      const urlStr = typeof url === 'string' ? url : (url as Request).url || url.toString();
      if (urlStr.includes("supabase.co")) {
        return new Response(JSON.stringify({
          idp_sso_url: "https://idp.example.com/sso",
          idp_entity_id: "https://idp.example.com",
          sp_entity_id: "aw-test",
          sp_acs_url: "https://agent-watch.dev/v1/sso/saml/acs"
        }), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response("ok", { status: 200 });
    });

    const req = makeRequest("GET", "/v1/sso/saml/init?tenant_id=tenant_a", {});
    const res = await worker.fetch(req, env, ctx);
    expect(res.status).toBe(302);
    expect(res.headers.get("location")).toContain("https://idp.example.com/sso");
  });

  it("GET /v1/sso/saml/init returns 501 when SSO_ENABLED is false", async () => {
    const noSsoEnv = makeEnv({ SSO_ENABLED: "false" });
    const req = makeRequest("GET", "/v1/sso/saml/init?tenant_id=tenant_a", {});
    const res = await worker.fetch(req, noSsoEnv, ctx);
    expect(res.status).toBe(501);
  });

  it("POST /v1/sso/saml/acs returns HTML response and maps tenant", async () => {
    const { SignedXml } = await import("xml-crypto");
    vi.spyOn(SignedXml.prototype, "loadSignature").mockImplementation(() => {});
    vi.spyOn(SignedXml.prototype, "checkSignature").mockReturnValue(true);
    vi.spyOn(SignedXml.prototype, "getSignedXml").mockReturnValue(
      `<saml:Assertion InResponseTo="_test-request-id"><saml:Subject><saml:NameID>tenant_mapped</saml:NameID></saml:Subject></saml:Assertion>`
    );

    // C3 fix: store a SAML request in KV so InResponseTo validation passes
    await env.KV.put("saml_request:_test-request-id", "aw_test_token_1", { expirationTtl: 300 });

    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: string | URL | Request) => {
      const urlStr = typeof url === 'string' ? url : (url as Request).url || url.toString();
      if (urlStr.includes("supabase.co")) {
        if (urlStr.includes("get_tenant_saml_config")) {
          return new Response(JSON.stringify({
            tenant_id: "tenant_mapped",
            idp_certificate: "MIIC...",
            mapping_rules: [{ attribute: "email", pattern: ".*@test.com", target_tenant: "tenant_mapped" }]
          }), { status: 200, headers: { "content-type": "application/json" } });
        }
        return new Response(JSON.stringify({}), { status: 200, headers: { "content-type": "application/json" } });
      }
      return new Response("ok", { status: 200 });
    });

    const xml = `<saml:Assertion InResponseTo="_test-request-id"><saml:Subject><saml:NameID>tenant_mapped</saml:NameID></saml:Subject></saml:Assertion>`;
    
    const formData = new FormData();
    formData.append("SAMLResponse", btoa(xml));
    formData.append("RelayState", "aw_test_token_1");
    
    const req = new Request("https://agent-watch.dev/v1/sso/saml/acs", {
      method: "POST",
      body: formData
    });
    
    const res = await worker.fetch(req, env, ctx);
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).toContain("SSO Login Successful");

    vi.restoreAllMocks();
  });
});
