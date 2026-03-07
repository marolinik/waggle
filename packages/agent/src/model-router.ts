/**
 * Model Router — resolves model names to provider configurations.
 *
 * Supports any number of providers, each with a list of model names,
 * an API key, and an optional base URL for OpenAI-compatible endpoints.
 */

export interface ProviderEntry {
  apiKey: string;
  models: string[];
  baseUrl?: string;
}

export interface ProviderConfig {
  providers: Record<string, ProviderEntry>;
  defaultModel: string;
}

export interface ResolvedModel {
  provider: string;
  model: string;
  apiKey: string;
  baseUrl?: string;
}

export class ModelRouter {
  private readonly config: ProviderConfig;
  /** model-name → provider-name lookup */
  private readonly modelIndex: Map<string, string>;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.modelIndex = new Map();

    for (const [providerName, entry] of Object.entries(config.providers)) {
      for (const model of entry.models) {
        this.modelIndex.set(model, providerName);
      }
    }
  }

  /**
   * Resolve a model name (or the default) to its provider config.
   * Throws if the model is not registered with any provider.
   */
  resolve(model?: string): ResolvedModel {
    const modelName = model ?? this.config.defaultModel;
    const providerName = this.modelIndex.get(modelName);

    if (!providerName) {
      throw new Error(`Unknown model: ${modelName}`);
    }

    const entry = this.config.providers[providerName];
    const resolved: ResolvedModel = {
      provider: providerName,
      model: modelName,
      apiKey: entry.apiKey,
    };

    if (entry.baseUrl !== undefined) {
      resolved.baseUrl = entry.baseUrl;
    }

    return resolved;
  }

  /** Return all registered model names across every provider. */
  listModels(): string[] {
    return Array.from(this.modelIndex.keys());
  }

  /** Return the configured default model name. */
  getDefaultModel(): string {
    return this.config.defaultModel;
  }
}
