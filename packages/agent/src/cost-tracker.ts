export interface ModelPricing {
  inputPer1k: number;
  outputPer1k: number;
}

export interface UsageStats {
  totalInputTokens: number;
  totalOutputTokens: number;
  estimatedCost: number;
  turns: number;
  byModel: Record<string, { input: number; output: number; cost: number }>;
}

export class CostTracker {
  private pricing: Record<string, ModelPricing>;
  private usage: Array<{ model: string; input: number; output: number }> = [];

  constructor(pricing: Record<string, ModelPricing> = {}) {
    this.pricing = pricing;
  }

  addUsage(model: string, inputTokens: number, outputTokens: number): void {
    this.usage.push({ model, input: inputTokens, output: outputTokens });
  }

  getStats(): UsageStats {
    let totalInput = 0, totalOutput = 0, totalCost = 0;
    const byModel: Record<string, { input: number; output: number; cost: number }> = {};

    for (const u of this.usage) {
      totalInput += u.input;
      totalOutput += u.output;
      const price = this.pricing[u.model];
      const cost = price ? (u.input / 1000) * price.inputPer1k + (u.output / 1000) * price.outputPer1k : 0;
      totalCost += cost;
      if (!byModel[u.model]) byModel[u.model] = { input: 0, output: 0, cost: 0 };
      byModel[u.model].input += u.input;
      byModel[u.model].output += u.output;
      byModel[u.model].cost += cost;
    }

    return { totalInputTokens: totalInput, totalOutputTokens: totalOutput, estimatedCost: totalCost, turns: this.usage.length, byModel };
  }

  formatSummary(): string {
    const stats = this.getStats();
    return `Tokens: ${stats.totalInputTokens} in / ${stats.totalOutputTokens} out (${stats.turns} turns) | Est. cost: $${stats.estimatedCost.toFixed(4)}`;
  }
}
