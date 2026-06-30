import { DurableObject } from "cloudflare:workers";
import type { Env } from "./types";

export class TenantBalance extends DurableObject<Env> {
  async addCredits(amountUsd: number, tenantId: string): Promise<number> {
    return this.ctx.blockConcurrencyWhile(async () => {
      let current: number = (await this.ctx.storage.get("balance_usd")) || 0;
      current += amountUsd;
      await this.ctx.storage.put("balance_usd", current);
      
      if (current > 0) {
        await this.env.KV.put(`tenant:balance_ok:${tenantId}`, "true");
      }
      return current;
    });
  }

  async deductCost(costUsd: number, tenantId: string): Promise<number> {
    return this.ctx.blockConcurrencyWhile(async () => {
      let current: number = (await this.ctx.storage.get("balance_usd")) || 0;

      // Refuse deduction if balance is insufficient
      if (current < costUsd) {
        await this.env.KV.put(`tenant:balance_ok:${tenantId}`, "false");
        return current;
      }

      current -= costUsd;
      
      await this.ctx.storage.put("balance_usd", current);

      if (current <= 0) {
        await this.env.KV.put(`tenant:balance_ok:${tenantId}`, "false");
      }
      return current;
    });
  }

  async getBalance(): Promise<number> {
    return (await this.ctx.storage.get("balance_usd")) || 0;
  }
}
