/**
 * Drag-drop file ingestion utilities.
 *
 * Categorizes dropped files, validates sizes, formats summaries,
 * and parses CSV previews — all pure functions, no DOM dependency.
 */

// ── Types ───────────────────────────────────────────────────────────

export type FileCategory = 'image' | 'pdf' | 'csv' | 'text' | 'unsupported';

export interface DroppedFile {
  name: string;
  type: string;
  size: number;
  extension: string;
  category: FileCategory;
}

// ── Constants ───────────────────────────────────────────────────────

/** Mapping from file extension → category. */
export const SUPPORTED_EXTENSIONS: Record<string, FileCategory> = {
  png: 'image', jpg: 'image', jpeg: 'image', gif: 'image', webp: 'image',
  pdf: 'pdf',
  csv: 'csv',
  md: 'text', txt: 'text', json: 'text', xml: 'text', yaml: 'text', yml: 'text',
  ts: 'text', js: 'text', py: 'text', rs: 'text', go: 'text',
};

/** Maximum allowed file size in bytes (10 MB). */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ── Helpers ─────────────────────────────────────────────────────────

/** Check if an extension is in the supported list. */
export function isSupported(extension: string): boolean {
  return extension.toLowerCase() in SUPPORTED_EXTENSIONS;
}

/** Categorize a file by its name and size. */
export function categorizeFile(name: string, size: number): DroppedFile {
  const ext = name.includes('.') ? name.split('.').pop()!.toLowerCase() : '';
  const category: FileCategory = SUPPORTED_EXTENSIONS[ext] ?? 'unsupported';
  return { name, type: ext, size, extension: ext, category };
}

/** Validate that a file does not exceed the size limit. */
export function validateFileSize(size: number): { valid: boolean; error?: string } {
  if (size > MAX_FILE_SIZE) {
    const limitMB = (MAX_FILE_SIZE / (1024 * 1024)).toFixed(0);
    const actualMB = (size / (1024 * 1024)).toFixed(1);
    return { valid: false, error: `File exceeds ${limitMB} MB limit (${actualMB} MB)` };
  }
  return { valid: true };
}

/** Format a byte count into a human-readable string. */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Summarize a list of dropped files by category counts, e.g. "2 images, 1 CSV". */
export function formatDropSummary(files: DroppedFile[]): string {
  const counts: Record<string, number> = {};
  for (const f of files) {
    const label = f.category === 'image' ? 'image'
      : f.category === 'pdf' ? 'PDF'
      : f.category === 'csv' ? 'CSV'
      : f.category === 'text' ? 'text file'
      : 'unsupported file';
    counts[label] = (counts[label] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([label, n]) => `${n} ${label}${n > 1 ? 's' : ''}`)
    .join(', ');
}

/**
 * Build a preliminary agent notification message describing shared files.
 *
 * This is a client-side summary generated before the server processes the file.
 * After ingestion, the caller should replace this with the server's richer
 * summary returned from the POST /api/ingest response.
 */
export function getDropMessage(files: DroppedFile[]): string {
  return files
    .map((f) => `User shared ${f.name} — ${f.category} file (${formatSize(f.size)})`)
    .join('\n');
}

/**
 * Parse a single CSV line according to RFC 4180.
 *
 * Handles quoted fields containing commas, escaped double-quotes (""),
 * and trims unquoted whitespace.
 */
export function parseCsvLine(line: string): string[] {
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

/**
 * Parse CSV content and return a preview.
 *
 * @param content  Raw CSV string
 * @param maxRows  Maximum data rows to include (default 5)
 */
export function parseCsvPreview(
  content: string,
  maxRows = 5,
): { headers: string[]; rows: string[][]; totalRows: number } {
  const lines = content.split(/\r?\n/).filter((l) => l.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [], totalRows: 0 };

  const headers = parseCsvLine(lines[0]);
  const dataLines = lines.slice(1);
  const rows = dataLines.slice(0, maxRows).map(parseCsvLine);
  return { headers, rows, totalRows: dataLines.length };
}
