/**
 * AgentWatch TypeScript Example — PII Detection and Blocking
 *
 * This example demonstrates how to detect and block personally identifiable
 * information (PII) from being sent through the AgentWatch proxy.
 *
 * Requirements:
 *     npm install openai
 *
 * Environment:
 *     export AGENTWATCH_KEY="aw_live_your_token"
 *     export OPENAI_KEY="sk-proj-your-key"
 */

import OpenAI from "openai";

const AGENTWATCH_KEY = process.env.AGENTWATCH_KEY || "aw_live_your_token";
const OPENAI_KEY = process.env.OPENAI_KEY || "sk-proj-your-key";
const AGENTWATCH_URL = process.env.AGENTWATCH_URL || "http://localhost:8787";

const PII_PATTERNS: Record<string, RegExp> = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  phone: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
};

interface PiiFinding {
  type: string;
  matches: string[];
}

function checkForPii(text: string): PiiFinding[] {
  const findings: PiiFinding[] = [];
  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    const matches = text.match(pattern);
    if (matches) {
      findings.push({ type, matches });
    }
  }
  return findings;
}

async function main() {
  const userInput = process.argv[2] || "My email is test@example.com and SSN is 123-45-6789";

  // --- Client-side PII check ---
  console.log("--- Client-Side PII Check ---");
  const findings = checkForPii(userInput);

  if (findings.length > 0) {
    console.log("PII detected before sending:");
    for (const f of findings) {
      console.log(`  ${f.type}: ${f.matches.join(", ")}`);
    }
    console.log("\nBlocking request to protect sensitive data.");
    process.exit(1);
  }
  console.log("  No PII detected ✓");

  // --- Send through AgentWatch proxy ---
  console.log("\n--- Sending through AgentWatch Proxy ---");

  const client = new OpenAI({
    baseURL: `${AGENTWATCH_URL}/v1/proxy/openai`,
    apiKey: `${AGENTWATCH_KEY}:${OPENAI_KEY}`,
  });

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: userInput }],
      headers: {
        "x-agentwatch-session-id": "pii-ts-example",
        "x-agentwatch-budget-usd": "0.50",
      },
    });
    console.log(`\nResponse: ${response.choices[0].message.content}`);
  } catch (e) {
    console.error(`\nRequest blocked: ${e}`);
    process.exit(1);
  }
}

main();
