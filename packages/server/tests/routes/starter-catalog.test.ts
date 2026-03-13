import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { MindDB } from '@waggle/core';
import { buildLocalServer } from '../../src/local/index.js';
import type { FastifyInstance } from 'fastify';

describe('Starter Skill Catalog', () => {
  let server: FastifyInstance;
  let tmpDir: string;

  beforeAll(async () => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'waggle-catalog-test-'));
    const personalPath = path.join(tmpDir, 'personal.mind');
    const mind = new MindDB(personalPath);
    mind.close();
    server = await buildLocalServer({ dataDir: tmpDir });
  });

  afterAll(async () => {
    await server.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('GET /api/skills/starter-pack/catalog returns all starter skills', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/skills/starter-pack/catalog',
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.skills).toBeDefined();
    expect(Array.isArray(body.skills)).toBe(true);
    expect(body.skills.length).toBe(18);
  });

  it('each skill has the correct shape', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/skills/starter-pack/catalog',
    });

    const body = res.json();
    for (const skill of body.skills) {
      expect(skill).toHaveProperty('id');
      expect(skill).toHaveProperty('name');
      expect(skill).toHaveProperty('description');
      expect(skill).toHaveProperty('family');
      expect(skill).toHaveProperty('familyLabel');
      expect(skill).toHaveProperty('state');
      expect(skill).toHaveProperty('isWorkflow');
      expect(typeof skill.id).toBe('string');
      expect(typeof skill.name).toBe('string');
      expect(typeof skill.description).toBe('string');
      expect(typeof skill.family).toBe('string');
      expect(typeof skill.familyLabel).toBe('string');
      expect(['active', 'installed', 'available']).toContain(skill.state);
      expect(typeof skill.isWorkflow).toBe('boolean');
    }
  });

  it('families array is populated with correct shape', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/skills/starter-pack/catalog',
    });

    const body = res.json();
    expect(body.families).toBeDefined();
    expect(Array.isArray(body.families)).toBe(true);
    expect(body.families.length).toBeGreaterThan(0);
    for (const family of body.families) {
      expect(family).toHaveProperty('id');
      expect(family).toHaveProperty('label');
      expect(typeof family.id).toBe('string');
      expect(typeof family.label).toBe('string');
    }
  });

  it('workflow skills have isWorkflow: true', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/skills/starter-pack/catalog',
    });

    const body = res.json();
    const workflowIds = ['research-team', 'review-pair', 'plan-execute'];
    for (const wfId of workflowIds) {
      const skill = body.skills.find((s: { id: string }) => s.id === wfId);
      expect(skill, `workflow skill ${wfId} should exist`).toBeDefined();
      expect(skill.isWorkflow).toBe(true);
    }

    // Non-workflow skills should have isWorkflow: false
    const nonWorkflow = body.skills.filter(
      (s: { id: string }) => !workflowIds.includes(s.id),
    );
    for (const skill of nonWorkflow) {
      expect(skill.isWorkflow).toBe(false);
    }
  });

  it('all skills map to a known family (no "other")', async () => {
    const res = await server.inject({
      method: 'GET',
      url: '/api/skills/starter-pack/catalog',
    });

    const body = res.json();
    const knownFamilies = ['writing', 'research', 'decision', 'planning', 'communication', 'code', 'creative'];
    for (const skill of body.skills) {
      expect(
        knownFamilies,
        `skill "${skill.id}" has unknown family "${skill.family}"`,
      ).toContain(skill.family);
    }
  });
});
