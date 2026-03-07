import { describe, it, expect } from 'vitest';
import { validateSkillMd } from '../src/validate-skill.js';

describe('validateSkillMd', () => {
  it('parses valid SKILL.md', () => {
    const content = `---
name: summarizer
description: Summarizes long documents
version: 1.0.0
author: waggle-team
---

You are an expert summarizer. Given a document, produce a concise summary.
`;

    const result = validateSkillMd(content);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.metadata).toBeDefined();
    expect(result.metadata!.name).toBe('summarizer');
    expect(result.metadata!.description).toBe('Summarizes long documents');
    expect(result.metadata!.version).toBe('1.0.0');
    expect(result.metadata!.author).toBe('waggle-team');
    expect(result.metadata!.systemPrompt).toBe(
      'You are an expert summarizer. Given a document, produce a concise summary.',
    );
  });

  it('rejects missing name', () => {
    const content = `---
description: A skill without a name
---

Some prompt.
`;

    const result = validateSkillMd(content);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: name');
  });

  it('rejects missing description', () => {
    const content = `---
name: no-desc
---

Some prompt.
`;

    const result = validateSkillMd(content);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing required field: description');
  });

  it('rejects missing frontmatter', () => {
    const content = `Just a plain markdown file with no frontmatter.`;

    const result = validateSkillMd(content);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Missing YAML frontmatter (must be wrapped in --- delimiters)',
    );
  });

  it('extracts system prompt from body', () => {
    const content = `---
name: coder
description: Writes code
---

You are a coding assistant.

Always use TypeScript.
Write clean, tested code.
`;

    const result = validateSkillMd(content);
    expect(result.valid).toBe(true);
    expect(result.metadata!.systemPrompt).toBe(
      'You are a coding assistant.\n\nAlways use TypeScript.\nWrite clean, tested code.',
    );
  });
});
