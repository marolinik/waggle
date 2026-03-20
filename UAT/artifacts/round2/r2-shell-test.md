# Round 2 UAT -- Shell Test Report

**Date**: 2026-03-21
**Server**: http://localhost:3333 (Node.js via tsx, PID 25704)
**Branch**: phase8-wave-8f-ui-ux
**Server mode**: npx tsx src/local/start.ts --skip-litellm (running from packages/server)

---

## CRITICAL FIX RE-VERIFICATION

### W1.1 SPA Fallback -- FAIL

**Test**: curl -s -o /dev/null -w "%{http_code} %{content_type}" http://localhost:3333/assets/index-CT9Y9Ge1.js
**Expected**: HTTP 200 with application/javascript MIME type (actual JS content)
**Got**: HTTP 200 with text/html; charset=utf-8 (index.html content)

The SPA fallback is intercepting /assets/ requests and returning index.html instead of the actual JS bundle. The setNotFoundHandler in index.ts:1224-1234 does have a guard for /assets/ paths that should return a JSON 404, but fastify/static with wildcard: false is apparently not finding the files before the fallback kicks in. The actual file exists at app/dist/assets/index-CT9Y9Ge1.js. This is a regression or an incomplete fix -- the server likely does not resolve the frontendDir correctly for the running process, causing fastify/static to miss the files and the SPA fallback to serve index.html with wrong MIME type.

### W1.2 CSP Rebuild -- PASS

**Test**: Grep app/src-tauri/resources/service.js for unsafe-eval
**Result**: No matches found. The script-src directive is present (line 1918) but does NOT include unsafe-eval. CSP is clean.

### W1.3 Persona Wiring -- PASS

**Test**: Read packages/server/src/local/routes/chat.ts for composePersonaPrompt() call in buildSystemPrompt()
**Result**: Verified at line 620-624:
- getPersona(activePersonaId) is called when activePersonaId is set
- composePersonaPrompt(prompt, persona) wraps the full system prompt
- Cache key includes personaId (line 294: cached.personaId === activePersonaId)

### W1.4 Ambiguity Detection -- PASS

**Test**: Check system prompt in chat.ts for "ambiguous" or "clarifying questions" text in Step 2 ASSESS
**Result**: Verified at line 345:
"Is this vague, ambiguous, or could be interpreted multiple ways? Ask 1-2 targeted clarifying questions BEFORE acting. Do NOT guess."

---

## MEMORY FORTRESS RE-VERIFICATION

### W2.1 Source Field -- PASS

**Test**: Read packages/core/src/mind/schema.ts for source TEXT column
**Result**: Verified at lines 56-57 in schema.ts:
- source TEXT NOT NULL DEFAULT 'user_stated' with CHECK constraint
- Allowed values: user_stated, tool_verified, agent_inferred, import, system
- Migration in db.ts lines 40-48 adds the column to existing databases via ALTER TABLE

### W2.8 Injection Blocking -- PASS

**Test**: Read chat.ts for score >= 0.7 returning 400
**Result**: Verified at lines 644-655:
- scanForInjection(message, 'user_input') is called
- score >= 0.7 returns reply.code(400).send with error code INJECTION_DETECTED
- score >= 0.3 logs a warning but allows the request

### W2.9 Sub-agent Hooks -- PASS

**Test**: Read packages/agent/src/subagent-tools.ts for hooks: deps.hooks in runLoop call
**Result**: Verified at line 198:
- hooks: deps.hooks is passed to the sub-agent runLoop
- Comment: "W2.9: sub-agents respect approval gates and memory validation hooks"

### W2.10 Rate Limit -- PASS

**Test**: Read packages/agent/src/tools.ts for MAX_SAVES_PER_SESSION = 50
**Result**: Verified at line 83:
- const MAX_SAVES_PER_SESSION = 50
- Enforcement at lines 293-296 returns an error message when exceeded

---

## API SMOKE TESTS (13 endpoints)

| # | Endpoint                          | Method | Status | Result   |
|---|-----------------------------------|--------|--------|----------|
| 1 | /health                           | GET    | 200    | PASS     |
| 2 | /api/workspaces                   | GET    | 200    | PASS (8 workspaces) |
| 3 | /api/memory/frames                | GET    | 200    | PASS (50 frames) |
| 4 | /api/connectors                   | GET    | 200    | PASS (29 connectors) |
| 5 | /api/cron                         | GET    | 200    | PASS (9 schedules) |
| 6 | /api/personas                     | GET    | 200    | PASS (8 personas) |
| 7 | /api/marketplace/search?limit=1   | GET    | 200    | PASS (15238 total packages) |
| 8 | /api/skills                       | GET    | 200    | PASS (56 skills) |
| 9 | /api/fleet                        | GET    | 200    | PASS (0 sessions, max 3) |
| 10| /api/mind/identity                | GET    | 200    | PASS     |
| 11| /api/mind/awareness               | GET    | 200    | PASS     |
| 12| /api/cost/summary                 | GET    | 200    | PASS     |
| 13| /api/notifications                | GET    | 404    | FAIL     |

**Pass rate**: 12/13 (92.3%)

---

## NEW ENDPOINT VALIDATION

| # | Fix  | Endpoint                  | Method | Status | Result  | Notes |
|---|------|---------------------------|--------|--------|---------|-------|
| 1 | W5.9 | /api/memory/frames        | POST   | 404    | FAIL    | Route exists in source but not live |
| 2 | W5.10| /api/notifications        | GET    | 404    | FAIL    | Route exists in source but not live |
| 3 | W5.12| /api/cron/:id/history     | GET    | 404    | FAIL    | Route exists in source but not live |

**Root cause**: All three new endpoints (W5.9, W5.10, W5.12) are present in the TypeScript source code at:
- packages/server/src/local/routes/memory.ts (POST /api/memory/frames -- line 99)
- packages/server/src/local/routes/notifications.ts (GET /api/notifications -- line 141)
- packages/server/src/local/routes/notifications.ts (GET /api/cron/:id/history -- line 168)

However, the running server (tsx from packages/server) returns 404 for all three. Possible causes:
1. The server process was started before these routes were added and has not been restarted
2. A module caching issue in tsx is serving stale compiled output
3. The route registration might be failing silently at runtime

**Recommendation**: Restart the server process and retest these endpoints.

---

## CONSOLIDATED FIX VERIFICATION TABLE

| Fix   | Description                      | Source Code | Live Server | Verdict   |
|-------|----------------------------------|-------------|-------------|-----------|
| W1.1  | SPA fallback (JS assets)         | PRESENT     | FAILING     | **FAIL**  |
| W1.2  | CSP no unsafe-eval               | PRESENT     | N/A (sidecar) | **PASS** |
| W1.3  | Persona wiring                   | PRESENT     | N/A (code)  | **PASS**  |
| W1.4  | Ambiguity detection              | PRESENT     | N/A (code)  | **PASS**  |
| W2.1  | Source field in schema           | PRESENT     | N/A (code)  | **PASS**  |
| W2.8  | Injection blocking (400)         | PRESENT     | N/A (code)  | **PASS**  |
| W2.9  | Sub-agent hooks                  | PRESENT     | N/A (code)  | **PASS**  |
| W2.10 | Rate limit (50/session)          | PRESENT     | N/A (code)  | **PASS**  |
| W5.9  | POST /api/memory/frames          | PRESENT     | 404         | **FAIL**  |
| W5.10 | GET /api/notifications           | PRESENT     | 404         | **FAIL**  |
| W5.12 | GET /api/cron/:id/history        | PRESENT     | 404         | **FAIL**  |

---

## FINDINGS SUMMARY

### Passing (7/11 verifications)
- W1.2 CSP rebuild: unsafe-eval confirmed absent from sidecar service.js
- W1.3 Persona wiring: composePersonaPrompt() called, cache key includes personaId
- W1.4 Ambiguity detection: Step 2 ASSESS includes explicit "ambiguous" + "clarifying questions" text
- W2.1 Source field: Column in schema with CHECK constraint + migration for existing DBs
- W2.8 Injection blocking: score >= 0.7 returns HTTP 400 with INJECTION_DETECTED code
- W2.9 Sub-agent hooks: hooks: deps.hooks passed to sub-agent runLoop
- W2.10 Rate limit: MAX_SAVES_PER_SESSION = 50, enforced in save_memory handler

### Failing (4/11 verifications)
1. **W1.1 SPA fallback**: JS assets at /assets/*.js return text/html (index.html) instead of JavaScript with correct MIME type. The fastify/static plugin is not serving files from the frontend dist directory. Severity: HIGH -- web mode is broken (scripts cannot load).
2. **W5.9 POST /api/memory/frames**: Returns 404. Route exists in source but not live on server.
3. **W5.10 GET /api/notifications**: Returns 404. Route exists in source but not live on server.
4. **W5.12 GET /api/cron/:id/history**: Returns 404. Route exists in source but not live on server.

### API Smoke Tests: 12/13 PASS
All original endpoints are healthy. Only /api/notifications (new W5.10 endpoint) fails.

### Recommendations
1. **Restart server** to pick up latest source code changes and retest W5.9, W5.10, W5.12
2. **Investigate SPA fallback** (W1.1): The frontendDir resolution may not find app/dist when running from packages/server/. Debug what frontendDir resolves to at startup. The three candidate paths in the code are:
   - cwd()/app/dist (from monorepo root)
   - cwd()/../../app/dist (from packages/server/)
   - cwd()/../app/dist (from packages/)
   When tsx runs from packages/server/, cwd() is likely packages/server, making the correct path ../../app/dist. Verify this resolves correctly.
3. **Rebuild sidecar** after all source fixes are confirmed working to ensure Tauri desktop mode matches

---

Report COMPLETE
