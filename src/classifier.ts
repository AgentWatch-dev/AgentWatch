export type RiskTag =
  | "PII_EMAIL"
  | "PII_SSN"
  | "PII_PHONE"
  | "FINANCIAL_CREDIT_CARD"
  | "SECRET_AWS_ACCESS_KEY"
  | "SECRET_AZURE_KEY"
  | "SECRET_STRIPE"
  | "SECRET_GITHUB"
  | "SECRET_SLACK_TOKEN"
  | "SECRET_JWT"
  | "SECRET_SSH_KEY"
  | "SECRET_DB_CONNECTION";

const MAX_SCAN_CHARS = 256 * 1024;
const EDGE_SCAN_CHARS = MAX_SCAN_CHARS / 2;
const MAX_STRUCTURED_CANDIDATES = 256;

const EMAIL_RE = /\b[A-Z0-9._%+-]{1,64}@[A-Z0-9.-]{1,253}\.[A-Z]{2,63}\b/i;
const SSN_RE = /\b(?!000|666|9\d{2})\d{3}[- ]?(?!00)\d{2}[- ]?(?!0000)\d{4}\b/;
const PHONE_RE = /\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;
const AWS_ACCESS_KEY_RE = /\b(?:AKIA|ASIA|AIDA|AROA|AGPA|ANPA)[A-Z0-9]{16}\b/;
const AZURE_KEY_RE = /\b[A-Za-z0-9]{40}\b(?=.*(?:azure|api.?key|subscription))/i;
const STRIPE_SECRET_KEY_RE = /\bsk_(?:live|test)_[A-Za-z0-9]{16,}\b/;
const GITHUB_TOKEN_RE = /\b(?:gh[pousr]_[A-Za-z0-9_]{36,255}|github_pat_[A-Za-z0-9_]{22,255})\b/;
const SLACK_TOKEN_RE = /\bxox[bpsar]-[0-9]{10,}-[a-zA-Z0-9-]+/;
const SSH_KEY_RE = /-----BEGIN (?:RSA |EC |DSA |OPENSSH )?PRIVATE KEY-----/;
const DB_CONNECTION_RE = /(?:postgresql|mongodb|mysql|redis):\/\/[^\s]{10,}/i;
const CREDIT_CARD_CANDIDATE_RE = /(?=(?:^|[^\d])((?:\d[ -]?){13,19})(?!\d))/g;
const JWT_CANDIDATE_RE = /\b[A-Za-z0-9_-]{10,512}\.[A-Za-z0-9_-]{10,4096}\.[A-Za-z0-9_-]{16,1024}\b/g;

const JWT_SIGNATURE_MIN_ENTROPY = 3.5;

const TAG_ORDER: RiskTag[] = [
  "PII_EMAIL",
  "PII_SSN",
  "PII_PHONE",
  "FINANCIAL_CREDIT_CARD",
  "SECRET_AWS_ACCESS_KEY",
  "SECRET_AZURE_KEY",
  "SECRET_STRIPE",
  "SECRET_GITHUB",
  "SECRET_SLACK_TOKEN",
  "SECRET_JWT",
  "SECRET_SSH_KEY",
  "SECRET_DB_CONNECTION",
];

const enum RiskFlag {
  PiiEmail = 1 << 0,
  PiiSsn = 1 << 1,
  PiiPhone = 1 << 2,
  FinancialCreditCard = 1 << 3,
  SecretAwsAccessKey = 1 << 4,
  SecretAzureKey = 1 << 5,
  SecretStripe = 1 << 6,
  SecretGithub = 1 << 7,
  SecretSlackToken = 1 << 8,
  SecretJwt = 1 << 9,
  SecretSshKey = 1 << 10,
  SecretDbConnection = 1 << 11,
}

const TAG_FLAGS: Record<RiskTag, RiskFlag> = {
  PII_EMAIL: RiskFlag.PiiEmail,
  PII_SSN: RiskFlag.PiiSsn,
  PII_PHONE: RiskFlag.PiiPhone,
  FINANCIAL_CREDIT_CARD: RiskFlag.FinancialCreditCard,
  SECRET_AWS_ACCESS_KEY: RiskFlag.SecretAwsAccessKey,
  SECRET_AZURE_KEY: RiskFlag.SecretAzureKey,
  SECRET_STRIPE: RiskFlag.SecretStripe,
  SECRET_GITHUB: RiskFlag.SecretGithub,
  SECRET_SLACK_TOKEN: RiskFlag.SecretSlackToken,
  SECRET_JWT: RiskFlag.SecretJwt,
  SECRET_SSH_KEY: RiskFlag.SecretSshKey,
  SECRET_DB_CONNECTION: RiskFlag.SecretDbConnection,
};

export function analyzePayload(text: string): string[] {
  if (text.length === 0) {
    return [];
  }

  const scanText = boundedScanText(text);
  let flags = 0;

  if (EMAIL_RE.test(scanText)) {
    flags |= RiskFlag.PiiEmail;
  }

  if (SSN_RE.test(scanText)) {
    flags |= RiskFlag.PiiSsn;
  }

  if (PHONE_RE.test(scanText)) {
    flags |= RiskFlag.PiiPhone;
  }

  if (hasCreditCard(scanText)) {
    flags |= RiskFlag.FinancialCreditCard;
  }

  if (hasAwsAccessKey(scanText)) {
    flags |= RiskFlag.SecretAwsAccessKey;
  }

  if (AZURE_KEY_RE.test(scanText)) {
    flags |= RiskFlag.SecretAzureKey;
  }

  if (hasStripeSecretKey(scanText)) {
    flags |= RiskFlag.SecretStripe;
  }

  if (GITHUB_TOKEN_RE.test(scanText)) {
    flags |= RiskFlag.SecretGithub;
  }

  if (SLACK_TOKEN_RE.test(scanText)) {
    flags |= RiskFlag.SecretSlackToken;
  }

  if (hasHighEntropyJwt(scanText)) {
    flags |= RiskFlag.SecretJwt;
  }

  if (SSH_KEY_RE.test(scanText)) {
    flags |= RiskFlag.SecretSshKey;
  }

  if (DB_CONNECTION_RE.test(scanText)) {
    flags |= RiskFlag.SecretDbConnection;
  }

  return TAG_ORDER.filter((tag) => (flags & TAG_FLAGS[tag]) !== 0);
}

function boundedScanText(text: string): string {
  if (text.length <= MAX_SCAN_CHARS) {
    return text;
  }

  const midStart = Math.floor((text.length - EDGE_SCAN_CHARS) / 2);
  const midChunk = text.slice(midStart, midStart + EDGE_SCAN_CHARS);
  return `${text.slice(0, EDGE_SCAN_CHARS)}\n${midChunk}\n${text.slice(-EDGE_SCAN_CHARS)}`;
}

function hasCreditCard(text: string): boolean {
  CREDIT_CARD_CANDIDATE_RE.lastIndex = 0;
  let checked = 0;
  let match: RegExpExecArray | null;

  while ((match = CREDIT_CARD_CANDIDATE_RE.exec(text)) !== null && checked < MAX_STRUCTURED_CANDIDATES) {
    checked += 1;

    CREDIT_CARD_CANDIDATE_RE.lastIndex = match.index + 1;

    const digits = digitsOnly(match[1]);
    if (isLikelyCreditCard(digits)) {
      return true;
    }
  }

  return false;
}

function isLikelyCreditCard(digits: string): boolean {
  return digits.length >= 13 && digits.length <= 19 && hasKnownCardPrefix(digits) && passesLuhn(digits);
}

function hasKnownCardPrefix(digits: string): boolean {
  const prefix2 = Number(digits.slice(0, 2));
  const prefix3 = Number(digits.slice(0, 3));
  const prefix4 = Number(digits.slice(0, 4));
  const prefix6 = Number(digits.slice(0, 6));

  if (digits.startsWith("4") && (digits.length === 13 || digits.length === 16 || digits.length === 19)) {
    return true;
  }

  if (digits.length === 15 && (prefix2 === 34 || prefix2 === 37)) {
    return true;
  }

  if (digits.length === 16 && ((prefix2 >= 51 && prefix2 <= 55) || (prefix4 >= 2221 && prefix4 <= 2720))) {
    return true;
  }

  if (
    (digits.length === 16 || digits.length === 19) &&
    (digits.startsWith("6011") ||
      digits.startsWith("65") ||
      (prefix3 >= 644 && prefix3 <= 649) ||
      (prefix6 >= 622126 && prefix6 <= 622925))
  ) {
    return true;
  }

  return (digits.length === 16 || digits.length === 17 || digits.length === 18 || digits.length === 19) &&
    prefix4 >= 3528 &&
    prefix4 <= 3589;
}

function passesLuhn(digits: string): boolean {
  let sum = 0;
  let shouldDouble = false;

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = digits.charCodeAt(index) - 48;

    if (digit < 0 || digit > 9) {
      return false;
    }

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

const HIGH_ENTROPY_MIN_SCORE = 3.25;

function hasAwsAccessKey(text: string): boolean {
  let match: RegExpExecArray | null;
  const re = new RegExp(AWS_ACCESS_KEY_RE.source, "g");
  while ((match = re.exec(text)) !== null) {
    if (shannonEntropy(match[0]) >= HIGH_ENTROPY_MIN_SCORE) {
      return true;
    }
  }
  return false;
}

function hasStripeSecretKey(text: string): boolean {
  let match: RegExpExecArray | null;
  const re = new RegExp(STRIPE_SECRET_KEY_RE.source, "g");
  while ((match = re.exec(text)) !== null) {
    const tail = match[0].split("_").slice(2).join("_");
    if (tail.length >= 20 && shannonEntropy(tail) >= HIGH_ENTROPY_MIN_SCORE) {
      return true;
    }
  }
  return false;
}

function hasHighEntropyJwt(text: string): boolean {
  JWT_CANDIDATE_RE.lastIndex = 0;
  let checked = 0;
  let match: RegExpExecArray | null;

  while ((match = JWT_CANDIDATE_RE.exec(text)) !== null && checked < MAX_STRUCTURED_CANDIDATES) {
    checked += 1;

    if (isHighEntropyJwt(match[0])) {
      return true;
    }
  }

  return false;
}

function isHighEntropyJwt(token: string): boolean {
  const parts = token.split(".");

  if (parts.length !== 3 || !looksLikeJwtHeader(parts[0])) {
    return false;
  }

  return shannonEntropy(parts[2]) >= JWT_SIGNATURE_MIN_ENTROPY;
}

function looksLikeJwtHeader(segment: string): boolean {
  const decoded = base64UrlDecode(segment);
  return decoded.includes('"alg"') && decoded.includes('"typ"');
}

function base64UrlDecode(value: string): string {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (normalized.length % 4)) % 4;

  try {
    return atob(normalized + "=".repeat(paddingLength));
  } catch {
    return "";
  }
}

function shannonEntropy(value: string): number {
  if (value.length === 0) {
    return 0;
  }

  const counts = new Map<string, number>();
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    counts.set(char, (counts.get(char) || 0) + 1);
  }

  let entropy = 0;
  for (const count of counts.values()) {
    const probability = count / value.length;
    entropy -= probability * Math.log2(probability);
  }

  return entropy;
}

function digitsOnly(value: string): string {
  let digits = "";

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code >= 48 && code <= 57) {
      digits += value[index];
    }
  }

  return digits;
}

export function shouldBlockOnPii(text: string, blockOnPii: boolean): { blocked: boolean; risks: string[] } {
  if (!blockOnPii || text.length === 0) {
    return { blocked: false, risks: [] };
  }

  const risks = analyzePayload(text);
  const hasPiiOrSecret = risks.length > 0;
  return { blocked: hasPiiOrSecret, risks };
}
