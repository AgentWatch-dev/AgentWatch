import { DurableObject } from "cloudflare:workers";
import type { Env } from "./types";

export class BudgetTracker extends DurableObject<Env> {
  async checkSessionBudget(sessionId: string, budgetUsd: number, estimatedCostUsd: number): Promise<{ allowed: boolean; spentUsd: number; budgetUsd: number }> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const key = `session:${sessionId}:usd`;
      const spentUsd: number = (await this.ctx.storage.get(key)) || 0;
      if (spentUsd + estimatedCostUsd > budgetUsd) {
        return { allowed: false, spentUsd, budgetUsd };
      }
      return { allowed: true, spentUsd, budgetUsd };
    });
  }

  async deductSessionCost(sessionId: string, costUsd: number): Promise<number> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const key = `session:${sessionId}:usd`;
      const current: number = (await this.ctx.storage.get(key)) || 0;
      const updated = current + costUsd;
      await this.ctx.storage.put(key, updated);
      return updated;
    });
  }

  async setSessionBudget(sessionId: string, budgetUsd: number): Promise<number> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const key = `session:${sessionId}:budget`;
      const existing: number | undefined = await this.ctx.storage.get(key);
      if (existing === undefined) {
        await this.ctx.storage.put(key, budgetUsd);
        return budgetUsd;
      }
      return existing;
    });
  }

  async getSessionSpent(sessionId: string): Promise<number> {
    const key = `session:${sessionId}:usd`;
    return (await this.ctx.storage.get(key)) || 0;
  }

  async incrementMonthlyRequests(tenantId: string, month: string, limit: number): Promise<{ count: number; allowed: boolean }> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const key = `monthly:${month}:count`;
      const current: number = (await this.ctx.storage.get(key)) || 0;
      const next = current + 1;
      await this.ctx.storage.put(key, next);
      return { count: next, allowed: next <= limit };
    });
  }

  async getMonthlyRequestCount(month: string): Promise<number> {
    const key = `monthly:${month}:count`;
    return (await this.ctx.storage.get(key)) || 0;
  }

  async trackSessionState(
    sessionId: string,
    stateHash: string,
    maxRepeats: number
  ): Promise<{ isRepeat: boolean; repeatCount: number; previousIndex: number }> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const key = `session:${sessionId}:states`;
      const states: string[] = (await this.ctx.storage.get(key)) || [];
      const existingIndex = states.indexOf(stateHash);
      if (existingIndex >= 0) {
        let repeatCount = 0;
        for (const s of states) {
          if (s === stateHash) repeatCount++;
        }
        states.push(stateHash);
        if (states.length > maxRepeats + 5) {
          states.splice(0, states.length - (maxRepeats + 5));
        }
        await this.ctx.storage.put(key, states);
        return { isRepeat: true, repeatCount: repeatCount + 1, previousIndex: existingIndex };
      }
      states.push(stateHash);
      if (states.length > maxRepeats + 5) {
        states.splice(0, states.length - (maxRepeats + 5));
      }
      await this.ctx.storage.put(key, states);
      return { isRepeat: false, repeatCount: 1, previousIndex: -1 };
    });
  }

  async getSessionStates(sessionId: string): Promise<string[]> {
    const key = `session:${sessionId}:states`;
    return (await this.ctx.storage.get(key)) || [];
  }

  async resetSessionStates(sessionId: string): Promise<void> {
    await this.ctx.storage.delete(`session:${sessionId}:states`);
  }

  async checkToolBudget(sessionId: string, toolName: string, budgetUsd: number): Promise<{ allowed: boolean; spentUsd: number; count: number }> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const spendKey = `tool:${sessionId}:${toolName}:usd`;
      const countKey = `tool:${sessionId}:${toolName}:count`;
      const spentUsd: number = (await this.ctx.storage.get(spendKey)) || 0;
      const count: number = (await this.ctx.storage.get(countKey)) || 0;
      if (spentUsd >= budgetUsd) {
        return { allowed: false, spentUsd, count };
      }
      return { allowed: true, spentUsd, count };
    });
  }

  async deductToolCost(sessionId: string, toolName: string, costUsd: number): Promise<{ spentUsd: number; count: number }> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const spendKey = `tool:${sessionId}:${toolName}:usd`;
      const countKey = `tool:${sessionId}:${toolName}:count`;
      const currentUsd: number = (await this.ctx.storage.get(spendKey)) || 0;
      const currentCount: number = (await this.ctx.storage.get(countKey)) || 0;
      const updatedUsd = currentUsd + costUsd;
      const updatedCount = currentCount + 1;
      await this.ctx.storage.put(spendKey, updatedUsd);
      await this.ctx.storage.put(countKey, updatedCount);
      return { spentUsd: updatedUsd, count: updatedCount };
    });
  }

  async checkWorkflowBudget(sessionId: string, workflowId: string, budgetUsd: number): Promise<{ allowed: boolean; spentUsd: number }> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const key = `workflow:${sessionId}:${workflowId}:usd`;
      const spentUsd: number = (await this.ctx.storage.get(key)) || 0;
      if (spentUsd >= budgetUsd) {
        return { allowed: false, spentUsd };
      }
      return { allowed: true, spentUsd };
    });
  }

  async deductWorkflowCost(sessionId: string, workflowId: string, costUsd: number): Promise<number> {
    return this.ctx.blockConcurrencyWhile(async () => {
      const key = `workflow:${sessionId}:${workflowId}:usd`;
      const current: number = (await this.ctx.storage.get(key)) || 0;
      const updated = current + costUsd;
      await this.ctx.storage.put(key, updated);
      return updated;
    });
  }
}
