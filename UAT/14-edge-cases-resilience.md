# UAT 14 — Edge Cases and Resilience

Eight scenarios testing error handling, recovery, and graceful degradation. These are not about features working correctly — they are about what happens when things go wrong.

---

## Scenario 14.1: Network Interruption

**Persona**: Mia
**Tier**: SOLO
**Duration**: 15 minutes
**Prerequisites**: Active workspace with an ongoing conversation. The app is connected to the local server.

### Context

Mia is mid-conversation when her network drops. She is on a train, Wi-Fi cuts out. The tool must handle this gracefully — no data loss, no silent failures, no corrupted state.

### Steps

1. Start a conversation in an active workspace. Send a message and receive a response.
2. Send another message that requires the agent to process (e.g., "Draft a project plan for the next quarter").
3. While the agent is processing (SSE streaming in progress), disconnect the network. On Windows: disable the network adapter or enable airplane mode.
4. Observe: what happens to the streaming response? Is an error shown?
5. Wait 10 seconds. Observe: does the app show a disconnection indicator?
6. Attempt to send another message while offline. Observe the behavior.
7. Re-enable the network connection.
8. Observe: does the app detect reconnection? Is there a notification?
9. Send a new message: "Continue where we left off."
10. Verify: is the conversation history intact? Is the partial response preserved or cleanly removed?
11. Verify: no duplicate messages or corrupted state.

### Functional Checkpoints

- [ ] Streaming interruption shows a visible error message (not silent failure)
- [ ] No data loss — prior messages and memories are intact
- [ ] Offline state is indicated to the user (connection status indicator)
- [ ] Offline message attempt is handled gracefully (queued, blocked with message, or retry prompt)
- [ ] Reconnection is detected automatically (within 30 seconds)
- [ ] Reconnection notification or indicator is shown
- [ ] Conversation continues normally after reconnection
- [ ] No duplicate messages in the conversation history
- [ ] No corrupted state in memory or session files
- [ ] Partial streaming response is handled cleanly (removed or marked as incomplete)

### Emotional Checkpoints

- [ ] **Orientation**: User understands what happened (network lost) and what to do (wait, reconnect)
- [ ] **Trust**: No data was lost. The tool handled the disruption responsibly.
- [ ] **Seriousness**: Error handling feels robust, not fragile
- [ ] **Controlled Power**: User can recover without restarting the app

### Features Exercised

- SSE streaming error handling
- Connection state detection
- Reconnection logic
- Session persistence during failure
- Error messaging UX

### Pass Criteria

- Functional: All checkpoints pass
- No data loss under any circumstances
- Recovery without app restart

---

## Scenario 14.2: Server Crash Recovery

**Persona**: Marko
**Tier**: SOLO
**Duration**: 15 minutes
**Prerequisites**: App running with server at localhost:3333. Know the server process PID.

### Context

The Node.js server process crashes unexpectedly. This simulates an unhandled exception, memory leak, or OS-level kill. The app must detect the failure, recover, and resume with no data loss.

### Steps

1. Start the app. Verify server is running on localhost:3333.
2. Have an active conversation with at least 3 messages in the history.
3. Save a memory: "Test memory for crash recovery: Project Alpha status is green."
4. Find the server process PID: `tasklist | findstr node` (Windows) or equivalent.
5. Kill the server process: `taskkill /F /PID <pid>` (Windows).
6. Observe the app: what happens? How long until the failure is detected?
7. Note: is an error message shown to the user?
8. Wait for automatic restart (if watchdog is running) or manually restart the server.
9. Once the server is back, observe the app: does it reconnect automatically?
10. Verify conversation history is intact (all 3+ messages present).
11. Send: "What was the status of Project Alpha?"
12. Verify: the pre-crash memory is intact and retrievable.

### Functional Checkpoints

- [ ] Server crash is detected by the app within 30 seconds
- [ ] Error message is shown to the user (not silent black screen)
- [ ] Previous conversation history is preserved in session files
- [ ] Memory saved before crash is intact in the .mind database
- [ ] Server restarts (automatically or manually) without data corruption
- [ ] App reconnects to restarted server without manual refresh
- [ ] Post-recovery memory query returns pre-crash data
- [ ] No orphaned processes or locked files after crash

### Emotional Checkpoints

- [ ] **Orientation**: User understands the server went down and is recovering
- [ ] **Trust**: Data survived the crash. Nothing was lost.
- [ ] **Seriousness**: Crash recovery feels handled, not catastrophic
- [ ] **Controlled Power**: User can resume work after recovery without re-doing anything

### Features Exercised

- Server health monitoring
- Crash detection and notification
- Session file persistence
- .mind database integrity after unclean shutdown
- Auto-reconnection
- Watchdog behavior (if implemented)

### Pass Criteria

- Functional: All checkpoints pass
- Zero data loss
- Recovery within 60 seconds (with manual restart) or 30 seconds (with watchdog)

---

## Scenario 14.3: Very Long Conversation

**Persona**: Elena
**Tier**: SOLO
**Duration**: 25 minutes
**Prerequisites**: Active workspace.

### Context

Elena is doing an extended analysis session — 50+ messages back and forth. This tests performance, scroll behavior, memory handling, and UI stability under sustained load.

### Steps

1. Open a workspace. Begin a sustained conversation with 50+ exchanges. Mix of:
   - Short messages ("Yes, continue")
   - Long messages (multi-paragraph analysis requests)
   - Messages that trigger tool usage (web search, memory save)
   - Messages with code blocks or structured data
2. At message 10: check scroll behavior. Scroll up and down. Is it smooth?
3. At message 25: save a memory. Verify it works.
4. At message 25: check app responsiveness. Is there any lag in typing or sending?
5. At message 40: use memory search. Does it return results promptly?
6. At message 50: scroll to the top of the conversation. Is all history present?
7. At message 50: check memory usage of the app process (Task Manager).
8. Send a final complex message: "Summarize the key points from our entire conversation today."
9. Evaluate: does the agent maintain coherent context across 50+ messages?
10. Close and reopen the workspace. Verify session history loads correctly.

### Functional Checkpoints

- [ ] No performance degradation through 50+ messages (response time remains consistent)
- [ ] Scroll behavior is smooth at all conversation lengths
- [ ] Memory save works at any point in the conversation
- [ ] Memory search returns results promptly regardless of conversation length
- [ ] All message history is present when scrolling to the top
- [ ] App memory usage does not grow unbounded (check for memory leaks)
- [ ] Tool cards render correctly throughout (no overflow or layout breaks)
- [ ] Agent maintains coherent context across the full conversation
- [ ] Session history loads correctly on reopen
- [ ] No missing or duplicated messages

### Emotional Checkpoints

- [ ] **Orientation**: User can navigate the conversation at any point (scroll, search)
- [ ] **Momentum**: No performance cliff — the 50th message feels as fast as the 5th
- [ ] **Trust**: Agent still tracks context accurately deep into the conversation
- [ ] **Seriousness**: The tool handles professional-length work sessions

### Features Exercised

- Conversation rendering at scale
- Scroll performance
- Memory operations under load
- Tool card rendering at scale
- Session file size handling
- Agent context window management
- Session reload with large history

### Pass Criteria

- Functional: All checkpoints pass
- No visible performance degradation through 50 messages
- App memory usage stays below 500MB
- Session reloads correctly

---

## Scenario 14.4: Concurrent Workspace Access

**Persona**: Marko
**Tier**: SOLO
**Duration**: 15 minutes
**Prerequisites**: Active workspace with data. Access to a second client (browser, curl, or second app instance).

### Context

Marko has the desktop app open and simultaneously hits the API directly from a terminal (simulating a CLI session or automation script accessing the same workspace). This tests data integrity under concurrent access.

### Steps

1. Open the desktop app. Navigate to a workspace with existing conversation and memories.
2. In a terminal, use curl to hit the server API directly:
   - `GET /api/workspaces` — verify the workspace is listed
   - `GET /api/workspaces/{id}/memories` — verify memories are returned
3. From the desktop app, send a message to the agent.
4. Simultaneously, from the terminal, save a memory via API:
   - `POST /api/workspaces/{id}/memories` with body `{"content": "Concurrent access test memory"}`
5. In the desktop app, send: "Search memories for 'concurrent access test'."
6. Verify: the API-created memory appears in the app search results.
7. From the app, save another memory.
8. From the terminal, query memories again. Verify the app-created memory appears.
9. Verify: no data corruption, no locked database errors, no missing data.

### Functional Checkpoints

- [ ] API returns consistent data while app is active
- [ ] Memory created via API is visible in app (after refresh or search)
- [ ] Memory created via app is visible via API
- [ ] No SQLite database locking errors
- [ ] No data corruption from concurrent writes
- [ ] Conversation state is not affected by API access
- [ ] Session files remain intact

### Emotional Checkpoints

- [ ] **Trust**: Data is consistent regardless of access method
- [ ] **Seriousness**: The system handles concurrent access like a real database-backed app
- [ ] **Controlled Power**: Multiple access paths work without conflict

### Features Exercised

- API endpoint availability under concurrent use
- SQLite concurrent access handling
- Memory CRUD from multiple sources
- Data consistency
- Session isolation

### Pass Criteria

- Functional: All checkpoints pass
- Zero data corruption
- No database locking errors

---

## Scenario 14.5: Empty State Handling

**Persona**: Sara
**Tier**: SOLO
**Duration**: 15 minutes
**Prerequisites**: Fresh install or clean state. No workspaces, no memories, no sessions.

### Context

Sara just installed Waggle. Everything is empty. Every view, every panel, every list — all empty. The test: does the app handle this gracefully? No error screens, no blank voids, no confusing placeholder data. Empty states should be helpful and guide the user toward first actions.

### Steps

1. Launch the app with a clean state (no workspaces).
2. Observe the home screen. Is there a helpful empty state message? A call-to-action to create a workspace?
3. Create a workspace but do not send any messages. Open it.
4. Observe the conversation view. Is there a helpful empty state (e.g., "Start a conversation" prompt)?
5. Open the Memory Browser with no memories. Is there a helpful empty state?
6. Open the Cockpit with no cron jobs. Is there a helpful empty state?
7. Open the Install Center (if capability packs are not pre-loaded). Is the empty or initial state clear?
8. Open Settings. Verify all settings have sensible defaults and are not blank.
9. Check the sidebar with a single workspace. Is the layout clean or does it feel barren?
10. Search for memories when none exist. Is the empty result handled gracefully?

### Functional Checkpoints

- [ ] Home screen with no workspaces shows a clear empty state with CTA
- [ ] Empty workspace shows a conversation starter prompt (not blank)
- [ ] Memory Browser with no memories shows an empty state message
- [ ] Cockpit with no cron jobs shows an empty state message
- [ ] Install Center initial state is clear and navigable
- [ ] Settings have sensible defaults (no blank or undefined values)
- [ ] Memory search with no results returns a friendly "no results" message (not an error)
- [ ] No JavaScript errors or blank screens on any empty view
- [ ] No "undefined" or "null" text displayed anywhere
- [ ] All empty states suggest a next action (not just "nothing here")

### Emotional Checkpoints

- [ ] **Orientation**: Every empty view tells Sara where she is and what to do next
- [ ] **Relief**: No confusion or anxiety from blank screens
- [ ] **Trust**: The app feels complete and polished, even when empty
- [ ] **Alignment**: Empty states guide Sara naturally toward productive use

### Features Exercised

- Empty state UX across all views
- Default configuration
- Onboarding guidance
- Error-free rendering with no data

### Pass Criteria

- Functional: All checkpoints pass
- No blank screens or error messages on any empty view
- Every empty state suggests a next action

---

## Scenario 14.6: Large File Handling

**Persona**: Elena
**Tier**: SOLO
**Duration**: 15 minutes
**Prerequisites**: Prepare test files: a 1MB text file, a 5MB text file, a PDF document (if supported).

### Context

Elena uploads or references a large file during her analysis work. The tool must handle it without crashing, freezing, or losing other functionality.

### Steps

1. Open a workspace.
2. Upload or reference a 1MB text file (e.g., a large CSV or log file).
3. Observe: does the file upload succeed? Is there a progress indicator?
4. Send: "Summarize the contents of the uploaded file."
5. Evaluate: does the agent reference the file content? Is the response timely?
6. Upload or reference a 5MB text file.
7. Observe: does the upload succeed? Any timeout or error?
8. If upload fails: is the error message clear and actionable?
9. Send: "How many lines are in this file?" (tests file processing capability)
10. Verify: the app remains responsive throughout (UI does not freeze).
11. Check: can Elena still send regular messages and search memories while a file is processing?

### Functional Checkpoints

- [ ] 1MB file upload/reference succeeds
- [ ] Agent can process and summarize 1MB file content
- [ ] 5MB file upload/reference succeeds or fails gracefully with clear error
- [ ] No app crash or freeze during file processing
- [ ] Progress indicator shown during upload/processing
- [ ] UI remains responsive during file operations
- [ ] Error messages for unsupported file sizes or types are clear
- [ ] Other features (chat, memory search) remain functional during file processing

### Emotional Checkpoints

- [ ] **Orientation**: Elena understands file size limits and capabilities
- [ ] **Trust**: File processing works reliably or fails informatively
- [ ] **Seriousness**: Large file handling feels production-grade
- [ ] **Controlled Power**: Elena can continue other work while files process

### Features Exercised

- File upload/ingest
- File content processing
- Large payload handling
- Error messaging for size limits
- UI responsiveness under load

### Pass Criteria

- Functional: All checkpoints pass
- No crash or freeze
- Clear error for any unsupported operation

---

## Scenario 14.7: Special Characters and Unicode

**Persona**: Mia
**Tier**: SOLO
**Duration**: 15 minutes
**Prerequisites**: Active workspace.

### Context

Mia works with international clients. Her messages include unicode characters, accented names, code blocks, markdown formatting, and occasionally emoji. Everything must render correctly, save correctly to memory, and be searchable.

### Steps

1. Open a workspace. Send a message with accented characters: "Schedule a meeting with Rene Muller about the Zurcher Kantonalbank project. Cc: Francoise Lefevre."
2. Verify: all characters render correctly in the conversation view.
3. Send a message with code blocks:
   ````
   Here's the SQL query:
   ```sql
   SELECT * FROM users WHERE name LIKE '%Muller%';
   ```
   ````
4. Verify: code block renders with syntax highlighting.
5. Send a message with markdown: "**Bold**, *italic*, ~~strikethrough~~, and a [link](https://example.com)."
6. Verify: markdown renders correctly.
7. Send a message with unicode symbols: "Budget: 50,000 EUR. Growth: 15%. Temperature: 22C. Arrow: indicates progress."
8. Verify: all symbols render correctly.
9. Save a memory containing special characters: "Client: Rene Muller, Zurcher Kantonalbank. Budget: 50,000 EUR."
10. Search memory: "Search for Muller."
11. Verify: search returns the memory with correct characters.
12. Search memory: "Search for Zurcher."
13. Verify: search handles the umlaut correctly (or at minimum finds the entry).

### Functional Checkpoints

- [ ] Accented characters (umlauts, accents) render correctly
- [ ] Code blocks render with proper formatting and syntax highlighting
- [ ] Markdown formatting renders correctly (bold, italic, strikethrough, links)
- [ ] Unicode symbols and special characters render correctly
- [ ] Memory save preserves special characters accurately
- [ ] Memory search finds entries with accented characters
- [ ] Memory search handles unicode (or degrades gracefully with a note)
- [ ] No encoding errors or mojibake anywhere in the UI
- [ ] Copy-paste of special character content works correctly

### Emotional Checkpoints

- [ ] **Orientation**: No confusion from rendering issues
- [ ] **Trust**: Data integrity is maintained for all character types
- [ ] **Seriousness**: International content is handled professionally
- [ ] **Alignment**: Works naturally for international users

### Features Exercised

- Text rendering (unicode, markdown, code blocks)
- Memory save with special characters
- Memory search with unicode
- Copy-paste functionality
- SQLite FTS5 unicode handling

### Pass Criteria

- Functional: All checkpoints pass
- No encoding errors
- Search returns results for unicode content

---

## Scenario 14.8: Rapid Message Sending and Rate Limits

**Persona**: Marko
**Tier**: SOLO
**Duration**: 15 minutes
**Prerequisites**: Active workspace. Note: this test involves rapid API calls and may consume model tokens.

### Context

Marko is testing the system under stress. He sends many messages in rapid succession — either intentionally (batch work) or accidentally (double-click, impatient re-sends). The system must handle this without duplicate responses, race conditions, or cost tracking errors.

### Steps

1. Open a workspace.
2. Send 3 messages in rapid succession (within 5 seconds):
   - "What is the capital of France?"
   - "What is the capital of Germany?"
   - "What is the capital of Japan?"
3. Observe: are all 3 messages queued and processed? Or is there rate limiting?
4. Verify: no duplicate responses. Each question gets exactly one answer.
5. Check: are the responses in the correct order?
6. Check the cost tracking display. Does it accurately reflect the tokens consumed?
7. Send the same message twice rapidly (double-click simulation): "Tell me a fun fact."
8. Observe: is the duplicate prevented? Or are two identical responses generated?
9. While an agent response is streaming, send another message.
10. Observe: does the new message queue behind the streaming response? Is the streaming interrupted?
11. Check the session file. Verify message order and no duplicates.
12. Verify: total token cost aligns with the number of actual exchanges (no phantom charges).

### Functional Checkpoints

- [ ] Rapid sequential messages are all processed (no dropped messages)
- [ ] No duplicate responses generated
- [ ] Response order matches message order
- [ ] Cost tracking accurately reflects actual token consumption
- [ ] Duplicate message detection prevents double-processing (or handles gracefully)
- [ ] Mid-stream message send is handled gracefully (queued or error-messaged)
- [ ] Session file has clean message history (no duplicates, correct order)
- [ ] No race conditions in memory or session state
- [ ] UI remains responsive during rapid message handling

### Emotional Checkpoints

- [ ] **Orientation**: User understands if messages are queued, processing, or rate-limited
- [ ] **Trust**: Cost tracking is accurate — no surprise charges from rapid sends
- [ ] **Seriousness**: System handles stress gracefully, not fragily
- [ ] **Controlled Power**: User can send at their pace; system adapts

### Features Exercised

- Message queue handling
- Rate limiting (if implemented)
- Duplicate detection
- SSE streaming under concurrent requests
- Cost tracking accuracy
- Session file integrity under rapid writes

### Pass Criteria

- Functional: All checkpoints pass
- No duplicate responses
- Cost tracking within 10% of expected token usage
- No data corruption in session or memory

---

## Resilience Summary

| Scenario | What breaks | Recovery expectation | Severity if failed |
|----------|-----------|---------------------|-------------------|
| 14.1 Network | SSE stream, connection | Auto-detect, reconnect, no data loss | HIGH — common real-world event |
| 14.2 Server crash | Server process | Detect, restart, resume, no data loss | HIGH — must not lose work |
| 14.3 Long conversation | Performance, memory | Consistent performance through 50+ messages | MEDIUM — affects power users |
| 14.4 Concurrent access | Data integrity | No corruption from dual access | MEDIUM — edge case but critical if hit |
| 14.5 Empty states | UX clarity | Every view has helpful empty state | LOW — cosmetic but affects first impression |
| 14.6 Large files | Memory, UI | Graceful handling or clear limits | MEDIUM — affects analyst workflows |
| 14.7 Unicode | Rendering, search | All characters preserved and searchable | MEDIUM — affects international users |
| 14.8 Rate limits | Consistency, cost | No duplicates, accurate cost tracking | HIGH — affects trust and billing |

### Aggregate Pass Criteria

- All 8 scenarios pass individually
- Zero data loss scenarios across all edge cases
- No app crashes in any scenario
- All error messages are user-friendly (no stack traces, no "undefined")
- Recovery is possible without app restart in all applicable scenarios
