export interface ExtractedEntity {
  name: string;
  type: 'person' | 'project' | 'technology' | 'organization' | 'tool' | 'concept';
  confidence: number;
}

const TECH_TERMS = new Set([
  'javascript', 'typescript', 'python', 'rust', 'go', 'java', 'ruby',
  'react', 'vue', 'angular', 'svelte', 'nextjs', 'nuxt',
  'node', 'nodejs', 'deno', 'bun',
  'postgresql', 'postgres', 'sqlite', 'mysql', 'mongodb', 'redis', 'qdrant',
  'docker', 'kubernetes', 'aws', 'gcp', 'azure',
  'git', 'github', 'gitlab',
  'fastify', 'express', 'flask', 'django',
  'tauri', 'electron',
  'graphql', 'rest', 'grpc',
  'openai', 'anthropic', 'litellm', 'claude', 'gpt',
  'vitest', 'jest', 'pytest',
  'drizzle', 'prisma', 'sequelize',
  'bullmq', 'clerk', 'stripe',
  'webpack', 'vite', 'esbuild', 'rollup',
]);

const PROPER_NOUN_RE = /\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\b/g;
const SKIP_WORDS = new Set(['The', 'This', 'That', 'These', 'What', 'When', 'Where', 'Which', 'Who', 'How', 'Why', 'And', 'But', 'For', 'Not', 'You', 'Your', 'They', 'Has', 'Have', 'Was', 'Were', 'Are', 'Will', 'Would', 'Could', 'Should', 'Can', 'May', 'Let', 'Use', 'Set', 'Get', 'Run', 'Add', 'See', 'Also', 'Just', 'Now', 'Here', 'Then', 'All', 'Any', 'Each', 'Some', 'Yes', 'Hi', 'Hey', 'Thanks', 'Please', 'Sorry', 'Sure', 'Switch', 'Error']);

// F3: Classification heuristics for multi-word proper nouns
const CONCEPT_INDICATORS = /\b(analysis|assessment|review|strategy|planning|framework|methodology|approach|decision|pattern|principle|design|optimization|evaluation|implementation|migration|integration|configuration|architecture|pipeline|workflow|summary|overview|comparison|benchmark|audit|standard|guideline|requirement|specification|matrix|model|protocol|phase|milestone|roadmap)\b/i;
const ORG_INDICATORS = /\b(inc|corp|ltd|llc|gmbh|group|company|foundation|institute|university|team|department|ministry|agency|council|board|association|partnership|venture|capital|labs?|studio|consulting)\b/i;
const PROJECT_INDICATORS = /^(project|initiative|program|campaign|operation|mission|sprint|milestone|phase|version)\b/i;

/** F3: Classify a proper noun phrase into an entity type */
function classifyProperNoun(name: string): ExtractedEntity['type'] {
  if (CONCEPT_INDICATORS.test(name)) return 'concept';
  if (ORG_INDICATORS.test(name)) return 'organization';
  if (PROJECT_INDICATORS.test(name)) return 'project';
  return 'person';
}

export function extractEntities(text: string): ExtractedEntity[] {
  if (text.length < 10) return [];

  const seen = new Set<string>();
  const entities: ExtractedEntity[] = [];

  function add(name: string, type: ExtractedEntity['type'], confidence: number) {
    const key = `${type}:${name.toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    entities.push({ name, type, confidence });
  }

  // Extract technology terms
  const words = text.toLowerCase().split(/[\s,;:.!?()/]+/);
  for (const word of words) {
    if (TECH_TERMS.has(word)) {
      add(word.charAt(0).toUpperCase() + word.slice(1), 'technology', 0.9);
    }
  }

  // Extract proper nouns (multi-word = likely person names)
  let match;
  while ((match = PROPER_NOUN_RE.exec(text)) !== null) {
    const name = match[1];
    const firstWord = name.split(' ')[0];
    if (SKIP_WORDS.has(firstWord)) continue;
    if (name.length < 3) continue;
    add(name, classifyProperNoun(name), 0.7);
  }

  return entities;
}
