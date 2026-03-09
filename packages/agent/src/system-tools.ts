import * as fs from 'node:fs';
import * as path from 'node:path';
import { execFile } from 'node:child_process';
import { glob } from 'glob';
import type { ToolDefinition } from './tools.js';
import { SearchCache, RateLimiter } from './web-search-utils.js';

// Module-level instances — shared across all tool invocations
const searchCache = new SearchCache(300_000); // 5 min TTL
const searchRateLimiter = new RateLimiter(10, 60_000); // 10 searches per minute

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
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Shell command to execute' },
          timeout: { type: 'number', description: 'Timeout in milliseconds (default: 30000)' },
        },
        required: ['command'],
      },
      execute: async (args) => {
        const command = args.command as string;
        const timeout = (args.timeout as number) ?? 30_000;

        const isWindows = process.platform === 'win32';
        const shell = isWindows ? 'cmd.exe' : '/bin/sh';
        const shellArgs = isWindows ? ['/c', command] : ['-c', command];

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
      description: 'Read the contents of a file (path relative to workspace)',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to workspace' },
        },
        required: ['path'],
      },
      execute: async (args) => {
        try {
          const resolved = resolveSafe(workspace, args.path as string);
          return fs.readFileSync(resolved, 'utf-8');
        } catch (err: any) {
          return `Error: ${err.message}`;
        }
      },
    },

    // 3. write_file — Create/overwrite files
    {
      name: 'write_file',
      description: 'Write content to a file, creating parent directories if needed',
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
      description: 'Replace an exact string in a file. old_string must appear exactly once.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path relative to workspace' },
          old_string: { type: 'string', description: 'Exact string to find (must appear once)' },
          new_string: { type: 'string', description: 'Replacement string' },
        },
        required: ['path', 'old_string', 'new_string'],
      },
      execute: async (args) => {
        try {
          const resolved = resolveSafe(workspace, args.path as string);
          const oldStr = args.old_string as string;
          const newStr = args.new_string as string;

          const content = fs.readFileSync(resolved, 'utf-8');
          const occurrences = content.split(oldStr).length - 1;

          if (occurrences === 0) {
            return `Error: old_string not found in ${args.path}`;
          }
          if (occurrences > 1) {
            return `Error: old_string found multiple times (${occurrences}) in ${args.path}. Must appear exactly once.`;
          }

          const updated = content.replace(oldStr, newStr);
          fs.writeFileSync(resolved, updated);
          return `Successfully edited ${args.path}`;
        } catch (err: any) {
          return `Error: ${err.message}`;
        }
      },
    },

    // 5. search_files — Glob pattern matching
    {
      name: 'search_files',
      description: 'Search for files matching a glob pattern in the workspace',
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
      description: 'Search file contents using a regex pattern. Returns file:line: match format.',
      parameters: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Regex pattern to search for' },
          glob: { type: 'string', description: 'Glob pattern to filter files (default: "**/*")' },
        },
        required: ['pattern'],
      },
      execute: async (args) => {
        try {
          const filePattern = (args.glob as string) ?? '**/*';
          const regex = new RegExp(args.pattern as string);

          const files = await glob(filePattern, {
            cwd: workspace,
            ignore: ['node_modules/**', '.git/**'],
            nodir: true,
          });

          const results: string[] = [];

          for (const file of files) {
            const absPath = path.join(workspace, file);
            try {
              const content = fs.readFileSync(absPath, 'utf-8');
              const lines = content.split('\n');
              for (let i = 0; i < lines.length; i++) {
                if (regex.test(lines[i])) {
                  results.push(`${file}:${i + 1}: ${lines[i]}`);
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
  ];
}
