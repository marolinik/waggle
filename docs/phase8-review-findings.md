# Phase 8 Code Review Findings

**Date**: 2026-03-18
**Scope**: 73 files, 11,498 lines added across Waves 8A-8D
**Reviewer**: Claude (automated + manual review)

---

## Critical Findings

None found.

## High Findings

None found.

## Medium Findings

### M1: Connector error responses include raw API text
**Severity**: Medium
**Files**: All 5 connectors (github, slack, jira, email, gcal)
**Issue**: Error paths use `await res.text()` which could return large HTML error pages or debugging info. While unlikely to contain auth tokens (tokens are in request headers, not responses), it's a defense-in-depth concern.
**Fix**: Truncate error text to 500 chars max.
**Status**: FIXED

### M2: _connectorMeta in tool parameters schema
**Severity**: Medium (cosmetic, functionally correct)
**Files**: `connector-registry.ts`
**Issue**: Risk metadata is injected at the root of the JSON Schema `parameters` object. While the LLM only fills `properties`, the metadata is visible in the schema sent to the model.
**Fix**: Acceptable as-is — stripping happens in `execute()`. Could move to a separate metadata map in future.
**Status**: Documented, not blocking.

### M3: Email rate limiter resets on server restart
**Severity**: Medium
**Files**: `email-connector.ts`
**Issue**: `dailySendCount` is in-memory. Server restart resets the counter, allowing more than 100 emails/day.
**Fix**: Acceptable for V1 — persistent rate limiting would require storage. Document as known limitation.
**Status**: Documented, not blocking.

## Low Findings

### L1: Jira connector requires separate email and base_url vault entries
**Severity**: Low
**Files**: `jira-connector.ts`
**Issue**: User must set `connector:jira:email` and `connector:jira:base_url` in vault separately from the main credential. The connect route only stores the API token.
**Fix**: Document in connector setup instructions. Consider adding email field to connect route body (already added — `body.email` support exists in connectors.ts).
**Status**: Documented.

### L2: Google Calendar connector needs client_id + client_secret for token refresh
**Severity**: Low
**Files**: `gcal-connector.ts`
**Issue**: OAuth2 token refresh requires `connector:gcal:client_id` and `connector:gcal:client_secret` in vault. Without them, expired tokens can't refresh.
**Fix**: Document as part of OAuth2 setup flow. The connect route could accept these as extra fields.
**Status**: Documented.

### L3: WorkspaceSessionManager.create() doesn't validate workspaceId
**Severity**: Low
**Files**: `workspace-sessions.ts`
**Issue**: No validation that workspaceId is a real workspace. Could create sessions for non-existent workspaces.
**Fix**: Acceptable — callers (server routes) validate workspace existence before creating sessions.
**Status**: Documented.

## Dependencies

### D1: npm audit — 5 vulnerabilities
- **esbuild <=0.24.2** (moderate): Dev-only, in drizzle-kit transitive dep. No fix without breaking change.
- **xlsx** (high): Prototype pollution. No fix available. Used for document generation only.
**Status**: Documented. No action needed for V1.
