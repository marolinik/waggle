export { MindDB } from './mind/db.js';
export { IdentityLayer, type Identity } from './mind/identity.js';
export { AwarenessLayer, type AwarenessItem, type AwarenessCategory } from './mind/awareness.js';
export { FrameStore, type MemoryFrame, type FrameType, type Importance } from './mind/frames.js';
export { SessionStore, type Session } from './mind/sessions.js';
export { HybridSearch, type SearchResult } from './mind/search.js';
export { KnowledgeGraph, type Entity, type Relation, type ValidationSchema } from './mind/knowledge.js';
export { SCHEMA_SQL, VEC_TABLE_SQL, SCHEMA_VERSION } from './mind/schema.js';
export {
  computeRelevance,
  computeTemporalScore,
  computePopularityScore,
  computeContextualScore,
  computeImportanceScore,
  SCORING_PROFILES,
  type ScoringProfile,
  type ScoringWeights,
} from './mind/scoring.js';
export type { Embedder } from './mind/embeddings.js';
export { createLiteLLMEmbedder, type LiteLLMEmbedderConfig } from './mind/litellm-embedder.js';
export { normalizeEntityName, findDuplicates } from './mind/entity-normalizer.js';
export { Ontology, validateEntity, type EntitySchema, type ValidationResult } from './mind/ontology.js';
export { WaggleConfig, type ProviderEntry } from './config.js';
export { MultiMind, type MultiMindSearchResult, type MindSource, type SearchScope } from './multi-mind.js';
export { WorkspaceManager, type WorkspaceConfig, type CreateWorkspaceOptions } from './workspace-config.js';
export { needsMigration, migrateToMultiMind } from './migration.js';
