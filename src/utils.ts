export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

export function escapeJsString(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t")
    .replace(/\0/g, "\\0");
}

export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function cspHeaders(nonce: string): Record<string, string> {
  // TODO: Inline onclick handlers in dashboard.ts, demo.ts, index.ts (onboarding), and login.ts
  // require unsafe-inline to function. These should be refactored to use addEventListener
  // with nonce-aware script tags, or extracted to external JS files loaded with the nonce.
  return {
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "Content-Security-Policy": `default-src 'self'; script-src 'self' 'nonce-${nonce}' https://cdn.tailwindcss.com https://cdn.jsdelivr.net https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://fonts.googleapis.com; img-src 'self' data: https:; connect-src 'self' https://cdn.jsdelivr.net; frame-src 'self'`,
  };
}
