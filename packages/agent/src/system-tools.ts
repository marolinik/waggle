import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { execFile, type ChildProcess } from 'node:child_process';
import { glob } from 'glob';
import type { ToolDefinition } from './tools.js';
import { SearchCache, RateLimiter } from './web-search-utils.js';

// Module-level instances — shared across all tool invocations
const searchCache = new SearchCache(300_000); // 5 min TTL
const searchRateLimiter = new RateLimiter(10, 60_000); // 10 searches per minute

/** Image file extensions (binary, should not be read as text) */
const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp']);

/** Background task tracking */
interface BackgroundTask {
  process: ChildProcess;
  stdout: string;
  stderr: string;
  status: 'running' | 'completed' | 'failed' | 'killed';
  exitCode?: number;
}

const backgroundTasks = new Map<string, BackgroundTask>();

/**
 * Resolve a relative path within a workspace, rejecting traversal outside it.
 * Returns the resolved absolute path or throws.
 */
function resolveSafe(workspace: string, filePath: string): string {
  const resolved = path.resolve(workspace, filePath);
  if (!resolved.startsWith(path.resolve(workspace))) {
    throw new Error(`Path resolves outside workspace: ${filePath}`);
  }
  return resolved;
}

export function createSystemTools(workspace: string): ToolDefinition[] {
  return [
    // 1. bash — Execute shell commands
    {
      name: 'bash',
      description: 'Execute a shell command in the workspace directory',
      offlineCapable: true,
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Shell command to execute' },
          timeout: { type: 'number', description: 'Timeout in milliseconds (default: 120000)' },
          run_in_background: { type: 'boolean', description: 'When true, start process and return immediately with a task ID (default: false)' },
        },
        required: ['command'],
      },
      execute: async (args) => {
        const command = args.command as string;
        const timeout = (args.timeout as number) ?? 120_000;
        const runInBackground = (args.run_in_background as boolean) ?? false;

        const isWindows = process.platform === 'win32';
        const shell = isWindows ? 'cmd.exe' : '/bin/sh';
        const shellArgs = isWindows ? ['/c', command] : ['-c', command];

        if (runInBackground) {
          const taskId = crypto.randomUUID();
          const child = execFile(shell, shellArgs, {
            cwd: workspace,
            maxBuffer: 10 * 1024 * 1024,
          });

          const task: BackgroundTask = {
            process: child,
            stdout: '',
            stderr: '',
            status: 'running',
          };
          backgroundTasks.set(taskId, task);

          child.stdout?.on('data', (data: string) => { task.stdout += data; });
          child.stderr?.on('data', (data: string) => { task.stderr += data; });
          child.on('close', (code) => {
            task.exitCode = code ?? undefined;
            task.status = code === 0 ? 'completed' : 'failed';
          });
          child.on('error', (err) => {
            task.stderr += err.message;
            task.status = 'failed';
          });

          return `Background task started. Task ID: ${taskId}`;
        }

        const ac = new AbortController();
        const timer = setTimeout(() => ac.abort(), timeout);

        return new Promise<string>((resolve) => {
          execFile(shell, shellArgs, {
            cwd: workspace,
            maxBuffer: 1024 * 1024,
            signal: ac.signal,
          }, (error, stdout, stderr) => {
            clearTimeout(timer);
            if (error) {
              if ((error as any).code === 'ABORT_ERR') {
                resolve(`Error: Command timeout after ${timeout}ms`);
                return;
              }
              // Return stderr + stdout on non-zero exit
              const output = (stderr || '') + (stdout || '');
              resolve(output || `Error: ${error.message}`);
              return;
            }
            resolve(stdout);
          });
        });
      },
    },

    // 2. read_file — Read file contents
    {
      name: 'read_file',
      description: 'Read the contents of a file (path relative to workspace). Supports offset/limit for partial reads and line numbers.',
      offlineCapable: true,
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to workspace' },
          offset: { type: 'number', description: 'Line number to start reading from (1-based, default: 1)' },
          limit: { type: 'number', description: 'Maximum number of lines to return (default: all)' },
          line_numbers: { type: 'boolean', description: 'When true, prefix each line with right-aligned line number (default: false)' },
        },
        required: ['path'],
      },
      execute: async (args) => {
        try {
          const filePath = args.path as string;
          const resolved = resolveSafe(workspace, filePath);
          const ext = path.extname(resolved).toLowerCase();

          // Image file detection — don't read binary content
          if (IMAGE_EXTENSIONS.has(ext)) {
            const stat = fs.statSync(resolved);
            return `[Image file: ${filePath}, ${stat.size} bytes]`;
          }

          // PDF file detection
          if (ext === '.pdf') {
            const stat = fs.statSync(resolved);
            try {
              const pdfParse = await import('pdf-parse');
              const buffer = fs.readFileSync(resolved);
              const data = await (pdfParse.default ?? pdfParse)(buffer);
              const text = data.text as string;
              return text || `[PDF file: ${filePath}, ${stat.size} bytes, no text content extracted]`;
            } catch {
              return `[PDF file: ${filePath}, ${stat.size} bytes. Install pdf-parse for text extraction: npm install pdf-parse]`;
            }
          }

          const content = fs.readFileSync(resolved, 'utf-8');
          let lines = content.split('\n');

          const offset = (args.offset as number) ?? 1;
          const limit = args.limit as number | undefined;
          const lineNumbers = (args.line_numbers as boolean) ?? false;

          // Apply offset (1-based)
          const startIdx = Math.max(0, offset - 1);
          lines = lines.slice(startIdx);

          // Apply limit
          if (limit !== undefined && limit > 0) {
            lines = lines.slice(0, limit);
          }

          // Apply line numbers
          if (lineNumbers) {
            const maxLineNum = startIdx + lines.length;
            const padWidth = String(maxLineNum).length;
            lines = lines.map((line, i) => {
              const lineNum = String(startIdx + i + 1).padStart(padWidth, ' ');
              return `${lineNum}\t${line}`;
            });
          }

          return lines.join('\n');
        } catch (err: any) {
          return `Error: ${err.message}`;
        }
      },
    },

    // 3. write_file — Create/overwrite files
    {
      name: 'write_file',
      description: 'Write content to a file, creating parent directories if needed',
      offlineCapable: true,
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to workspace' },
          content: { type: 'string', description: 'Content to write' },
        },
        required: ['path', 'content'],
      },
      execute: async (args) => {
        try {
          const resolved = resolveSafe(workspace, args.path as string);
          fs.mkdirSync(path.dirname(resolved), { recursive: true });
          fs.writeFileSync(resolved, args.content as string);
          return `Successfully wrote ${args.path}`;
        } catch (err: any) {
          return `Error: ${err.message}`;
        }
      },
    },

    // 4. edit_file — Exact string replacement
    {
      name: 'edit_file',
      description: 'Replace an exact string in a file. old_string must appear exactly once unless replace_all is true.',
      offlineCapable: true,
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to workspace' },
          old_string: { type: 'string', description: 'Exact string to find' },
          new_string: { type: 'string', description: 'Replacement string' },
          replace_all: { type: 'boolean', description: 'When true, replace ALL occurrences (default: false)' },
        },
        required: ['path', 'old_string', 'new_string'],
      },
      execute: async (args) => {
        try {
          const resolved = resolveSafe(workspace, args.path as string);
          const oldStr = args.old_string as string;
          const newStr = args.new_string as string;
          const replaceAll = (args.replace_all as boolean) ?? false;

          const content = fs.readFileSync(resolved, 'utf-8');
          const occurrences = content.split(oldStr).length - 1;

          if (occurrences === 0) {
            return `Error: old_string not found in ${args.path}`;
          }

          if (!replaceAll && occurrences > 1) {
            return `Error: old_string found multiple times (${occurrences}) in ${args.path}. Must appear exactly once. Use replace_all: true to replace all occurrences.`;
          }

          const updated = replaceAll
            ? content.split(oldStr).join(newStr)
            : content.replace(oldStr, newStr);
          fs.writeFileSync(resolved, updated);

          const countMsg = replaceAll && occurrences > 1 ? ` (${occurrences} occurrences)` : '';
          return `Successfully edited ${args.path}${countMsg}`;
        } catch (err: any) {
          return `Error: ${err.message}`;
        }
      },
    },

    // 5. search_files — Glob pattern matching
    {
      name: 'search_files',
      description: 'Search for files matching a glob pattern in the workspace',
      offlineCapable: true,
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Glob pattern (e.g., "**/*.ts")' },
        },
        required: ['pattern'],
      },
      execute: async (args) => {
        try {
          const matches = await glob(args.pattern as string, {
            cwd: workspace,
            ignore: ['node_modules/**', '.git/**'],
            nodir: true,
          });
          if (matches.length === 0) return 'No files found.';
          return matches.join('\n');
        } catch (err: any) {
          return `Error: ${err.message}`;
        }
      },
    },

    // 6. search_content — Regex search through file contents
    {
      name: 'search_content',
      description: 'Search file contents using a regex pattern. Returns file:line: match format. Supports context lines, output modes, file type filter, and max results.',
      offlineCapable: true,
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Regex pattern to search for' },
          glob: { type: 'string', description: 'Glob pattern to filter files (default: "**/*")' },
          context_before: { type: 'number', description: 'Number of lines to show before each match' },
          context_after: { type: 'number', description: 'Number of lines to show after each match' },
          output_mode: { type: 'string', description: 'Output mode: "content" (default), "files" (file paths only), "count" (match counts per file)' },
          file_type: { type: 'string', description: 'Filter by file extension, e.g., "ts", "js", "py"' },
          max_results: { type: 'number', description: 'Maximum total results to return' },
        },
        required: ['pattern'],
      },
      execute: async (args) => {
        try {
          let filePattern = (args.glob as string) ?? '**/*';
          const regex = new RegExp(args.pattern as string);
          const contextBefore = (args.context_before as number) ?? 0;
          const contextAfter = (args.context_after as number) ?? 0;
          const outputMode = (args.output_mode as string) ?? 'content';
          const fileType = args.file_type as string | undefined;
          const maxResults = args.max_results as number | undefined;

          // If file_type is specified, override glob with extension-specific pattern
          if (fileType) {
            filePattern = `**/*.${fileType}`;
          }

          const files = await glob(filePattern, {
            cwd: workspace,
            ignore: ['node_modules/**', '.git/**'],
            nodir: true,
          });

          if (outputMode === 'files') {
            // Return only file paths that contain matches
            const matchingFiles: string[] = [];
            for (const file of files) {
              if (maxResults !== undefined && matchingFiles.length >= maxResults) break;
              const absPath = path.join(workspace, file);
              try {
                const content = fs.readFileSync(absPath, 'utf-8');
                if (regex.test(content)) {
                  matchingFiles.push(file);
                }
              } catch {
                // Skip binary/unreadable files
              }
            }
            if (matchingFiles.length === 0) return 'No matches found.';
            return matchingFiles.join('\n');
          }

          if (outputMode === 'count') {
            // Return file paths with match counts
            const counts: string[] = [];
            for (const file of files) {
              const absPath = path.join(workspace, file);
              try {
                const content = fs.readFileSync(absPath, 'utf-8');
                const lines = content.split('\n');
                let count = 0;
                for (const line of lines) {
                  if (regex.test(line)) count++;
                }
                if (count > 0) {
                  counts.push(`${file}: ${count}`);
                  if (maxResults !== undefined && counts.length >= maxResults) break;
                }
              } catch {
                // Skip binary/unreadable files
              }
            }
            if (counts.length === 0) return 'No matches found.';
            return counts.join('\n');
          }

          // Default: content mode
          const results: string[] = [];
          let totalResults = 0;

          for (const file of files) {
            if (maxResults !== undefined && totalResults >= maxResults) break;
            const absPath = path.join(workspace, file);
            try {
              const content = fs.readFileSync(absPath, 'utf-8');
              const lines = content.split('\n');
              for (let i = 0; i < lines.length; i++) {
                if (maxResults !== undefined && totalResults >= maxResults) break;
                if (regex.test(lines[i])) {
                  if (contextBefore > 0 || contextAfter > 0) {
                    // Show context lines
                    const startCtx = Math.max(0, i - contextBefore);
                    const endCtx = Math.min(lines.length - 1, i + contextAfter);
                    for (let j = startCtx; j <= endCtx; j++) {
                      const marker = j === i ? '>' : ' ';
                      results.push(`${file}:${j + 1}:${marker} ${lines[j]}`);
                    }
                    results.push('---');
                  } else {
                    results.push(`${file}:${i + 1}: ${lines[i]}`);
                  }
                  totalResults++;
                }
              }
            } catch {
              // Skip binary/unreadable files
            }
          }

          if (results.length === 0) return 'No matches found.';
          return results.join('\n');
        } catch (err: any) {
          return `Error: ${err.message}`;
        }
      },
    },

    // 7. web_search — Search the web via DuckDuckGo HTML
    {
      name: 'web_search',
      description: 'Search the web for current information. Use for recent events, news, product updates, documentation, or anything requiring up-to-date info.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query' },
          max_results: { type: 'number', description: 'Max results (default: 5, max: 10)' },
        },
        required: ['query'],
      },
      execute: async (args) => {
        try {
          const query = args.query as string;
          const maxResults = Math.min((args.max_results as number) ?? 5, 10);

          // Check cache first
          const cacheKey = `${query}|${maxResults}`;
          const cached = searchCache.get(cacheKey);
          if (cached) return cached;

          // Rate limit check
          if (!searchRateLimiter.canProceed()) {
            return 'Search rate limit exceeded. Please wait a moment before searching again.';
          }

          const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

          const response = await fetch(url, {
            headers: { 'User-Agent': 'Waggle/1.0 (AI Assistant)' },
          });

          if (!response.ok) {
            return `Search failed (${response.status}): ${response.statusText}`;
          }

          const html = await response.text();

          // Parse DuckDuckGo HTML results
          const results: Array<{ title: string; url: string; snippet: string }> = [];
          const resultRegex = /<a[^>]+class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
          let match;

          while ((match = resultRegex.exec(html)) !== null && results.length < maxResults) {
            const rawUrl = match[1];
            const title = match[2].replace(/<[^>]+>/g, '').trim();
            const snippet = match[3].replace(/<[^>]+>/g, '').trim();

            // DuckDuckGo wraps URLs in a redirect — extract the real URL
            let realUrl = rawUrl;
            const uddgMatch = rawUrl.match(/[?&]uddg=([^&]+)/);
            if (uddgMatch) {
              realUrl = decodeURIComponent(uddgMatch[1]);
            }

            if (title && realUrl) {
              results.push({ title, url: realUrl, snippet });
            }
          }

          if (results.length === 0) return 'No search results found.';

          const output = results
            .map((r, i) => `[${i + 1}] ${r.title}\n    ${r.url}\n    ${r.snippet}`)
            .join('\n\n');

          // Cache successful results
          searchCache.set(cacheKey, output);

          return output;
        } catch (err: any) {
          return `Search error: ${err.message}`;
        }
      },
    },

    // 8. web_fetch — Fetch and extract text from a URL
    {
      name: 'web_fetch',
      description: 'Fetch a web page and extract its text content. Use to read documentation, articles, or any web page.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: 'URL to fetch' },
          max_length: { type: 'number', description: 'Max characters to return (default: 10000)' },
        },
        required: ['url'],
      },
      execute: async (args) => {
        try {
          const url = args.url as string;
          const maxLength = (args.max_length as number) ?? 10_000;

          let parsed: URL;
          try {
            parsed = new URL(url);
          } catch {
            return 'Error: Invalid URL';
          }
          if (!['http:', 'https:'].includes(parsed.protocol)) {
            return 'Error: Only http and https URLs are supported';
          }

          const ac = new AbortController();
          const timer = setTimeout(() => ac.abort(), 15_000);

          const response = await fetch(url, {
            headers: {
              'User-Agent': 'Waggle/1.0 (AI Assistant)',
              Accept: 'text/html,application/xhtml+xml,text/plain,application/json',
            },
            signal: ac.signal,
            redirect: 'follow',
          });

          clearTimeout(timer);

          if (!response.ok) {
            return `Fetch failed (${response.status}): ${response.statusText}`;
          }

          const contentType = response.headers.get('content-type') ?? '';
          const body = await response.text();

          // JSON — return formatted
          if (contentType.includes('application/json')) {
            try {
              return JSON.stringify(JSON.parse(body), null, 2).slice(0, maxLength);
            } catch {
              return body.slice(0, maxLength);
            }
          }

          // HTML — extract text
          const text = body
            .replace(/<script[\s\S]*?<\/script>/gi, '')
            .replace(/<style[\s\S]*?<\/style>/gi, '')
            .replace(/<nav[\s\S]*?<\/nav>/gi, '')
            .replace(/<header[\s\S]*?<\/header>/gi, '')
            .replace(/<footer[\s\S]*?<\/footer>/gi, '')
            .replace(/<\/?(p|div|br|h[1-6]|li|tr|blockquote|section|article)[^>]*>/gi, '\n')
            .replace(/<[^>]+>/g, '')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ')
            .replace(/[ \t]+/g, ' ')
            .replace(/\n{3,}/g, '\n\n')
            .trim();

          if (!text) return 'Page fetched but no text content found.';
          return text.slice(0, maxLength);
        } catch (err: any) {
          if (err.name === 'AbortError') return 'Error: Request timed out (15s)';
          return `Fetch error: ${err.message}`;
        }
      },
    },

    // 9. multi_edit — Atomic multi-file edits
    {
      name: 'multi_edit',
      description: 'Apply multiple edits atomically across one or more files. If any edit fails validation, none are applied.',
      offlineCapable: true,
      parameters: {
        type: 'object',
        properties: {
          edits: {
            type: 'array',
            description: 'Array of edits to apply',
            items: {
              type: 'object',
              properties: {
                file_path: { type: 'string', description: 'File path relative to workspace' },
                old_string: { type: 'string', description: 'Exact string to find (must appear exactly once per file)' },
                new_string: { type: 'string', description: 'Replacement string' },
              },
              required: ['file_path', 'old_string', 'new_string'],
            },
          },
        },
        required: ['edits'],
      },
      execute: async (args) => {
        try {
          const edits = args.edits as Array<{ file_path: string; old_string: string; new_string: string }>;

          if (!edits || edits.length === 0) {
            return 'Error: No edits provided';
          }

          // Phase 1: Read all files and validate all old_strings exist exactly once
          const fileContents = new Map<string, string>();
          const resolvedPaths = new Map<string, string>();

          for (const edit of edits) {
            const resolved = resolveSafe(workspace, edit.file_path);
            resolvedPaths.set(edit.file_path, resolved);

            if (!fileContents.has(resolved)) {
              fileContents.set(resolved, fs.readFileSync(resolved, 'utf-8'));
            }

            const content = fileContents.get(resolved)!;
            const occurrences = content.split(edit.old_string).length - 1;

            if (occurrences === 0) {
              return `Error: old_string not found in ${edit.file_path}. No edits applied (atomic rollback).`;
            }
            if (occurrences > 1) {
              return `Error: old_string found multiple times (${occurrences}) in ${edit.file_path}. No edits applied (atomic rollback).`;
            }
          }

          // Phase 2: Apply all edits (in memory first)
          for (const edit of edits) {
            const resolved = resolvedPaths.get(edit.file_path)!;
            const content = fileContents.get(resolved)!;
            fileContents.set(resolved, content.replace(edit.old_string, edit.new_string));
          }

          // Phase 3: Write all files
          for (const [resolved, content] of fileContents) {
            fs.writeFileSync(resolved, content);
          }

          // Summarize
          const fileCounts = new Map<string, number>();
          for (const edit of edits) {
            fileCounts.set(edit.file_path, (fileCounts.get(edit.file_path) ?? 0) + 1);
          }
          const summary = Array.from(fileCounts.entries())
            .map(([file, count]) => `  ${file}: ${count} edit(s)`)
            .join('\n');

          return `Successfully applied ${edits.length} edit(s) across ${fileCounts.size} file(s):\n${summary}`;
        } catch (err: any) {
          return `Error: ${err.message}`;
        }
      },
    },

    // 10. get_task_output — Get output from a background task
    {
      name: 'get_task_output',
      description: 'Get the current output and status of a background task started with run_in_background.',
      offlineCapable: true,
      parameters: {
        type: 'object',
        properties: {
          task_id: { type: 'string', description: 'Task ID returned by run_in_background' },
        },
        required: ['task_id'],
      },
      execute: async (args) => {
        const taskId = args.task_id as string;
        const task = backgroundTasks.get(taskId);

        if (!task) {
          return `Error: No background task found with ID: ${taskId}`;
        }

        const parts: string[] = [
          `Status: ${task.status}`,
        ];

        if (task.exitCode !== undefined) {
          parts.push(`Exit code: ${task.exitCode}`);
        }

        if (task.stdout) {
          parts.push(`\n--- stdout ---\n${task.stdout}`);
        }

        if (task.stderr) {
          parts.push(`\n--- stderr ---\n${task.stderr}`);
        }

        return parts.join('\n');
      },
    },

    // 11. kill_task — Kill a background task
    {
      name: 'kill_task',
      description: 'Kill a running background task.',
      offlineCapable: true,
      parameters: {
        type: 'object',
        properties: {
          task_id: { type: 'string', description: 'Task ID to kill' },
        },
        required: ['task_id'],
      },
      execute: async (args) => {
        const taskId = args.task_id as string;
        const task = backgroundTasks.get(taskId);

        if (!task) {
          return `Error: No background task found with ID: ${taskId}`;
        }

        if (task.status !== 'running') {
          return `Task ${taskId} is already ${task.status}`;
        }

        task.process.kill();
        task.status = 'killed';
        return `Task ${taskId} has been killed`;
      },
    },
  ];
}

/** Expose backgroundTasks for testing */
export { backgroundTasks };
