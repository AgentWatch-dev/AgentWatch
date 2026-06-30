import { DurableObject } from "cloudflare:workers";

export class SessionTracker extends DurableObject {
  /**
   * Atomically increments the token count for this session and returns the new total.
   * Uses blockConcurrencyWhile to ensure the read-modify-write is atomic —
   * no two concurrent calls can interleave and lose an increment.
   */
  async incrementTokensAndUsd(tokens: number, usd: number): Promise<{ tokens: number, usd: number, runaway_detected: boolean, request_count: number }> {
    // Validate inputs — reject negative values
    if (tokens < 0 || usd < 0) {
      throw new Error("Invalid token/usd values: must be non-negative");
    }

    return this.ctx.blockConcurrencyWhile(async () => {
      let currentTokens: number = (await this.ctx.storage.get("tokens")) || 0;
      let currentUsd: number = (await this.ctx.storage.get("usd")) || 0;
      let requestCount: number = (await this.ctx.storage.get("requestCount")) || 0;
      
      currentTokens += tokens;
      currentUsd += usd;
      requestCount += 1;

      // Heuristic: If an agent makes more than 50 requests in a single session without
      // being reset, we flag it as a runaway quadratic loop.
      const runaway_detected = requestCount > 50;
      
      // Batch writes
      await this.ctx.storage.put({
        "tokens": currentTokens,
        "usd": currentUsd,
        "requestCount": requestCount
      });
      
      return { tokens: currentTokens, usd: currentUsd, runaway_detected, request_count: requestCount };
    });
  }

  async incrementTokens(amount: number): Promise<number> {
    if (amount < 0) {
      throw new Error("Invalid amount: must be non-negative");
    }

    return this.ctx.blockConcurrencyWhile(async () => {
      let current: number = (await this.ctx.storage.get("tokens")) || 0;
      current += amount;
      await this.ctx.storage.put("tokens", current);
      return current;
    });
  }

  /**
   * Resets the token count for this session to zero.
   */
  async resetTokens(): Promise<void> {
    await this.ctx.blockConcurrencyWhile(async () => {
      await this.ctx.storage.delete(["tokens", "usd", "requestCount"]);
    });
  }
}
