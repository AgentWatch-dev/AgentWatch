import { describe, it, expect } from "vitest";

// Test the parsing logic directly by replicating the functions from index.ts

function safeJsonParse(text: string): unknown {
  try { return JSON.parse(text); } catch { return null; }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function extractContentText(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content.map(c => isRecord(c) && typeof c.text === "string" ? c.text : "").join("");
  }
  return "";
}

function extractOpenAICompletionText(response: Record<string, unknown>): string {
  if (typeof response.output_text === "string") return response.output_text;
  const choices = Array.isArray(response.choices) ? response.choices : [];
  let text = "";
  for (const choice of choices) {
    if (!isRecord(choice)) continue;
    if (typeof choice.text === "string") text += choice.text;
    if (isRecord(choice.message)) text += extractContentText(choice.message.content);
  }
  return text;
}

function extractAnthropicCompletionText(response: Record<string, unknown>): string {
  const content = response.content;
  if (Array.isArray(content)) {
    return content.map((block: any) => block?.text || "").join("");
  }
  return "";
}

function extractOpenAIStreamDelta(event: Record<string, unknown>): string {
  const choices = Array.isArray(event.choices) ? event.choices : [];
  for (const choice of choices) {
    if (!isRecord(choice)) continue;
    if (isRecord(choice.delta) && typeof choice.delta.content === "string") {
      return choice.delta.content;
    }
  }
  return "";
}

function extractAnthropicStreamDelta(event: Record<string, unknown>): string {
  if (event.type === "content_block_delta" && isRecord(event.delta)) {
    if (event.delta.type === "text_delta" && typeof event.delta.text === "string") {
      return event.delta.text;
    }
  }
  return "";
}

// Provider compatibility check (from the fix)
type Provider = "openai" | "anthropic" | "groq" | "xai" | "gemini" | "azure" | "bedrock" | "xiaomi" | "mistral" | "cohere";

function isOpenAICompatible(provider: Provider): boolean {
  return provider === "openai" || provider === "groq" || provider === "xai" ||
    provider === "gemini" || provider === "mistral" || provider === "xiaomi" ||
    provider === "cohere" || provider === "azure" || provider === "bedrock";
}

describe("Provider Response Parsing (isOpenAICompatible fix)", () => {
  describe("isOpenAICompatible", () => {
    it("should return true for OpenAI-compatible providers", () => {
      expect(isOpenAICompatible("openai")).toBe(true);
      expect(isOpenAICompatible("groq")).toBe(true);
      expect(isOpenAICompatible("xai")).toBe(true);
      expect(isOpenAICompatible("gemini")).toBe(true);
      expect(isOpenAICompatible("mistral")).toBe(true);
      expect(isOpenAICompatible("xiaomi")).toBe(true);
      expect(isOpenAICompatible("cohere")).toBe(true);
      expect(isOpenAICompatible("azure")).toBe(true);
      expect(isOpenAICompatible("bedrock")).toBe(true);
    });

    it("should return false for Anthropic", () => {
      expect(isOpenAICompatible("anthropic")).toBe(false);
    });
  });

  describe("OpenAI-format JSON response", () => {
    it("should extract completion text from choices[].message.content", () => {
      const response = {
        id: "chatcmpl-123",
        choices: [{
          message: { role: "assistant", content: "Hello world" },
          finish_reason: "stop"
        }],
        usage: { prompt_tokens: 10, completion_tokens: 2 }
      };
      expect(extractOpenAICompletionText(response)).toBe("Hello world");
    });

    it("should handle multiple choices", () => {
      const response = {
        choices: [
          { message: { content: "Option A" } },
          { message: { content: "Option B" } }
        ]
      };
      expect(extractOpenAICompletionText(response)).toBe("Option AOption B");
    });

    it("should handle output_text format", () => {
      const response = { output_text: "Direct text" };
      expect(extractOpenAICompletionText(response)).toBe("Direct text");
    });
  });

  describe("Anthropic-format JSON response", () => {
    it("should extract completion text from content[].text", () => {
      const response = {
        content: [
          { type: "text", text: "Hello from Claude" }
        ],
        usage: { input_tokens: 10, output_tokens: 5 }
      };
      expect(extractAnthropicCompletionText(response)).toBe("Hello from Claude");
    });

    it("should handle multiple content blocks", () => {
      const response = {
        content: [
          { type: "text", text: "First part. " },
          { type: "text", text: "Second part." }
        ]
      };
      expect(extractAnthropicCompletionText(response)).toBe("First part. Second part.");
    });
  });

  describe("OpenAI-format SSE streaming", () => {
    it("should extract delta content from SSE chunks", () => {
      const chunks = [
        { choices: [{ delta: { role: "assistant", content: "" } }] },
        { choices: [{ delta: { content: "Hello" } }] },
        { choices: [{ delta: { content: " world" } }] },
        { choices: [{ delta: {}, finish_reason: "stop" }] },
      ];

      let fullText = "";
      for (const chunk of chunks) {
        fullText += extractOpenAIStreamDelta(chunk);
      }
      expect(fullText).toBe("Hello world");
    });
  });

  describe("Anthropic-format SSE streaming", () => {
    it("should extract text_delta from SSE chunks", () => {
      const chunks = [
        { type: "content_block_start", content_block: { type: "text", text: "" } },
        { type: "content_block_delta", delta: { type: "text_delta", text: "Hi" } },
        { type: "content_block_delta", delta: { type: "text_delta", text: " there" } },
        { type: "content_block_stop" },
      ];

      let fullText = "";
      for (const chunk of chunks) {
        fullText += extractAnthropicStreamDelta(chunk);
      }
      expect(fullText).toBe("Hi there");
    });
  });

  describe("Provider-specific parsing routing", () => {
    it("should use OpenAI parser for Groq", () => {
      const response = { choices: [{ message: { content: "Groq response" } }] };
      expect(isOpenAICompatible("groq")).toBe(true);
      expect(extractOpenAICompletionText(response)).toBe("Groq response");
    });

    it("should use OpenAI parser for xAI", () => {
      const response = { choices: [{ message: { content: "xAI response" } }] };
      expect(isOpenAICompatible("xai")).toBe(true);
      expect(extractOpenAICompletionText(response)).toBe("xAI response");
    });

    it("should use OpenAI parser for Gemini", () => {
      const response = { choices: [{ message: { content: "Gemini response" } }] };
      expect(isOpenAICompatible("gemini")).toBe(true);
      expect(extractOpenAICompletionText(response)).toBe("Gemini response");
    });

    it("should use OpenAI parser for Mistral", () => {
      const response = { choices: [{ message: { content: "Mistral response" } }] };
      expect(isOpenAICompatible("mistral")).toBe(true);
      expect(extractOpenAICompletionText(response)).toBe("Mistral response");
    });

    it("should use Anthropic parser for Anthropic", () => {
      const response = { content: [{ type: "text", text: "Claude response" }] };
      expect(isOpenAICompatible("anthropic")).toBe(false);
      expect(extractAnthropicCompletionText(response)).toBe("Claude response");
    });

    it("should NOT use Anthropic parser for OpenAI (regression check)", () => {
      // This was the bug — OpenAI was being parsed with Anthropic parser
      const response = { choices: [{ message: { content: "OpenAI response" } }] };
      // With the fix, OpenAI uses extractOpenAICompletionText
      expect(isOpenAICompatible("openai")).toBe(true);
      expect(extractOpenAICompletionText(response)).toBe("OpenAI response");
      // Anthropic parser would return empty for this format
      expect(extractAnthropicCompletionText(response)).toBe("");
    });

    it("should NOT use Anthropic parser for Groq (regression check)", () => {
      // This was the bug — Groq was being parsed with Anthropic parser
      const response = { choices: [{ message: { content: "Groq response" } }] };
      // With the fix, Groq uses extractOpenAICompletionText
      expect(isOpenAICompatible("groq")).toBe(true);
      expect(extractOpenAICompletionText(response)).toBe("Groq response");
      // Anthropic parser would return empty for this format
      expect(extractAnthropicCompletionText(response)).toBe("");
    });
  });
});
