/**
 * Skill validator — parses and validates SKILL.md files.
 *
 * SKILL.md format:
 * ```
 * ---
 * name: my-skill
 * description: What this skill does
 * version: 1.0.0
 * author: Someone
 * ---
 *
 * System prompt content goes here...
 * ```
 */

export interface SkillMetadata {
  name: string;
  description: string;
  version?: string;
  author?: string;
  systemPrompt: string;
}

export interface ValidationResult {
  valid: boolean;
  metadata?: SkillMetadata;
  errors: string[];
}

/**
 * Parse YAML frontmatter from a string delimited by `---`.
 * Returns key-value pairs (all values as strings).
 */
function parseFrontmatter(raw: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    const value = trimmed.slice(colonIdx + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

/**
 * Validate a SKILL.md file content.
 *
 * Extracts YAML frontmatter (name, description, version, author)
 * and the body as the system prompt.
 */
export function validateSkillMd(content: string): ValidationResult {
  const errors: string[] = [];

  // Check for frontmatter delimiters
  const fmMatch = content.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!fmMatch) {
    errors.push('Missing YAML frontmatter (must be wrapped in --- delimiters)');
    return { valid: false, errors };
  }

  const frontmatterRaw = fmMatch[1];
  const body = fmMatch[2];
  const fields = parseFrontmatter(frontmatterRaw);

  if (!fields.name) {
    errors.push('Missing required field: name');
  }
  if (!fields.description) {
    errors.push('Missing required field: description');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  const metadata: SkillMetadata = {
    name: fields.name,
    description: fields.description,
    version: fields.version || undefined,
    author: fields.author || undefined,
    systemPrompt: body.trim(),
  };

  return { valid: true, metadata, errors: [] };
}
