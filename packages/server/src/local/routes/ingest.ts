/**
 * POST /api/ingest — file ingestion endpoint.
 *
 * Accepts JSON with base64-encoded file content. Detects type and returns
 * processed results suitable for multi-modal LLM messages.
 */

import type { FastifyPluginAsync } from 'fastify';

// ── Types ───────────────────────────────────────────────────────────

interface IngestFileInput {
  name: string;
  /** Base64-encoded file content. */
  content: string;
}

interface IngestBody {
  files: IngestFileInput[];
  workspaceId?: string;
}

interface IngestFileResult {
  name: string;
  type: string;
  summary: string;
  content?: string;
}

// ── Extension → category mapping ────────────────────────────────────

type FileCategory = 'image' | 'pdf' | 'csv' | 'text' | 'unsupported';

const EXT_CATEGORY: Record<string, FileCategory> = {
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image',
  pdf: 'pdf',
  csv: 'csv',
  md: 'text', txt: 'text', json: 'text', xml: 'text', yaml: 'text', yml: 'text',
  ts: 'text', js: 'text', py: 'text', rs: 'text', go: 'text',
};

const MIME_FOR_EXT: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg',
  gif: 'image/gif', webp: 'image/webp',
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ── Helpers ─────────────────────────────────────────────────────────

function extOf(name: string): string {
  return name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
}

function categoryOf(ext: string): FileCategory {
  return EXT_CATEGORY[ext] ?? 'unsupported';
}

/** Validate that a string is well-formed base64. */
function isValidBase64(str: string): boolean {
  return /^[A-Za-z0-9+/]*={0,2}$/.test(str);
}

/**
 * Parse a single CSV line according to RFC 4180.
 *
 * Handles quoted fields containing commas, escaped double-quotes (""),
 * and trims unquoted whitespace.
 */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { fields.push(current.trim()); current = ''; }
      else { current += ch; }
    }
  }
  fields.push(current.trim());
  return fields;
}

function processImage(name: string, ext: string, b64: string): IngestFileResult {
  const mime = MIME_FOR_EXT[ext] ?? 'application/octet-stream';
  return {
    name,
    type: 'image',
    summary: `Image file (${ext.toUpperCase()})`,
    content: `data:${mime};base64,${b64}`,
  };
}

function processPdf(name: string, _b64: string): IngestFileResult {
  // Actual extraction deferred — placeholder
  return { name, type: 'pdf', summary: 'PDF document (text extraction pending)' };
}

function processCsv(name: string, b64: string): IngestFileResult {
  const text = Buffer.from(b64, 'base64').toString('utf-8');
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== '');
  const rowCount = Math.max(0, lines.length - 1);
  const headers = lines.length > 0 ? parseCsvLine(lines[0]) : [];
  return {
    name,
    type: 'csv',
    summary: `CSV — ${headers.length} columns, ${rowCount} rows`,
    content: text,
  };
}

function processText(name: string, ext: string, b64: string): IngestFileResult {
  const text = Buffer.from(b64, 'base64').toString('utf-8');
  const lines = text.split(/\r?\n/).filter((l, i, arr) => i < arr.length - 1 || l !== '');
  const lineCount = lines.length;
  return {
    name,
    type: 'text',
    summary: `${ext.toUpperCase()} file — ${lineCount} lines`,
    content: text,
  };
}

function processFile(input: IngestFileInput): IngestFileResult {
  const ext = extOf(input.name);
  const cat = categoryOf(ext);
  switch (cat) {
    case 'image': return processImage(input.name, ext, input.content);
    case 'pdf':   return processPdf(input.name, input.content);
    case 'csv':   return processCsv(input.name, input.content);
    case 'text':  return processText(input.name, ext, input.content);
    default:
      return { name: input.name, type: 'unsupported', summary: `Unsupported file type (.${ext})` };
  }
}

// ── Route ───────────────────────────────────────────────────────────

export const ingestRoutes: FastifyPluginAsync = async (server) => {
  server.post<{ Body: IngestBody }>('/api/ingest', {
    config: {},
    bodyLimit: 15 * 1024 * 1024, // 15 MB to allow base64 overhead
  }, async (request, reply) => {
    const { files } = request.body ?? {};

    if (!files || !Array.isArray(files) || files.length === 0) {
      return reply.status(400).send({ error: 'files array is required' });
    }

    // Validate each file entry
    for (const f of files) {
      if (!f.name || typeof f.content !== 'string') {
        return reply.status(400).send({ error: `Invalid file entry: ${f.name ?? 'unnamed'}` });
      }
      // Validate base64 encoding
      if (!isValidBase64(f.content)) {
        return reply.status(400).send({ error: `Invalid base64 content for file: ${f.name}` });
      }
      // Check approximate decoded size (base64 is ~4/3 of original)
      const approxSize = Math.ceil(f.content.length * 0.75);
      if (approxSize > MAX_FILE_SIZE) {
        return reply.status(413).send({
          error: `File ${f.name} exceeds 10 MB limit`,
        });
      }
    }

    const results = files.map(processFile);
    return { files: results };
  });
};
