# Hive UI Polish — Critical Fixes

## Context
The Hive UI redesign landed (20 files, hive/honey colors, honeycomb bg, bee onboarding). But live screenshots reveal several issues. Fix all of these.

**Reference images:**
- Live screenshots: `UAT 3/screenshots-hive/` (5 actual screenshots of current state)
- Concept mockups (the TARGET): `UAT 3/concept-mockups/` (8 images showing how it should look)
- Brand bee images: `app/public/brand/` (29 images: 14 dark + 15 light variants)

Look at the concept mockups to understand the vision. Look at the live screenshots to see what's wrong. Fix the gap.

## CRITICAL — Text Readability (Chat)

### C1: AI response text is too muted / unreadable
- **Problem:** AI response body text color is too low contrast against dark bg. Looks faded, hard to read.
- **Fix:** AI response body text must be `hive-200` (#b0b7cc) minimum, ideally `hive-100` (#dce0eb) for main content. Headers within response should be `hive-50` (#f0f2f7) + `font-weight: 600`.
- **Where:** `ChatMessage.tsx` or equivalent — the `.chat-message-body` or markdown renderer styles.

### C2: Chat message markdown rendering inconsistent
- **Problem:** Bullet points mix `•` and `—` em-dashes, indentation levels are uneven, paragraph spacing is too tight.
- **Fix:** Set response prose to `font-size: 14px; line-height: 1.7; color: var(--hive-100)`. Paragraph margin-bottom: 12px. Nested lists: consistent 24px padding-left per level. Bold text: `hive-50` + `font-weight: 600`. Code blocks: `hive-850` bg, mono font.

### C3: Helper text below input fails contrast
- "Ask a follow-up, try /help for commands" is ~3.0:1 contrast — fails WCAG AA.
- **Fix:** `color: var(--hive-400)` minimum (#5a6380).

### C4: Send button is invisible dark gray
- **Problem:** Send button has dark bg, doesn't look like CTA.
- **Fix:** `background: var(--honey-500); color: var(--hive-950);` — golden honey send button, the brand accent. Same as concept mockup.

## CRITICAL — Icons (Entire App)

### C5: Replace ALL emoji icons with custom brand icon images
- **Problem:** Sidebar nav uses raw emoji (💬 ✨ 🗂 🩷 ⚙), Cockpit KPIs use wrong emoji (🩷 for frames, 🔥 for tokens, 🔒 for cost). These are inconsistent, OS-dependent, blurry, semantically wrong.
- **Solution:** Custom hex-themed icon images are now in `app/public/brand/`. All are JPEG, dark/light variants. Use `<img>` tags with theme switching.

**Image naming convention:**
- Dark mode: `/brand/icon-{name}-dark.jpeg`
- Light mode: `/brand/icon-{name}-light.jpeg`
- Logo dark: `/brand/logo.jpeg`
- Logo light: `/brand/logo-light.jpeg`

**Fix for sidebar nav — replace emoji with brand icon images (24px display size):**
  - Chat → `/brand/icon-chat-{theme}.jpeg`
  - Capabilities → `/brand/icon-capabilities-{theme}.jpeg`
  - Cockpit → `/brand/icon-cockpit-{theme}.jpeg`
  - Mission Control → `/brand/icon-mission-{theme}.jpeg`
  - Memory → `/brand/icon-memory-{theme}.jpeg`
  - Events → `/brand/icon-events-{theme}.jpeg`
  - Settings → `/brand/icon-settings-{theme}.jpeg`

**Fix for Cockpit KPI cards (32px display size):**
  - Frames → `/brand/icon-frames-{theme}.jpeg`
  - Tokens → `/brand/icon-tokens-{theme}.jpeg`
  - Cost → `/brand/icon-cost-{theme}.jpeg`
  - Health → `/brand/icon-health-{theme}.jpeg`

**Fix for onboarding feature icons (40px display size):**
  - Research → `/brand/icon-research-{theme}.jpeg`
  - Draft → `/brand/icon-draft-{theme}.jpeg`
  - Plan → `/brand/icon-plan-{theme}.jpeg`
  - Code → `/brand/icon-code-{theme}.jpeg`
  - Remember → `/brand/icon-remember-{theme}.jpeg`

**Fix for sidebar logo:** Replace text "WAGGLE" or current logo with:
  - Dark: `/brand/logo.jpeg` (40px height)
  - Light: `/brand/logo-light.jpeg` (40px height)

**Theme-aware icon helper component:**
```tsx
function HiveIcon({ name, size = 24, className }: { name: string; size?: number; className?: string }) {
  // Access theme from your theme context/store
  const isDark = document.documentElement.classList.contains('dark') || !document.documentElement.classList.contains('light');
  const variant = isDark ? 'dark' : 'light';
  return <img src={`/brand/icon-${name}-${variant}.jpeg`} width={size} height={size} className={`inline-block ${className || ''}`} alt="" />;
}
```

Use this component everywhere instead of emoji. Example:
```tsx
// Before (BAD):
<span>💬</span> Chat

// After (GOOD):  
<HiveIcon name="chat" size={20} /> Chat
```

- **Remove ALL emoji from UI chrome/navigation.** Emoji is for chat message content only, never for app chrome.

## HIGH — Brand Bee Images Not Used

### H1: Bee images exist in app/public/brand/ but aren't shown anywhere except onboarding
- **Problem:** 29 bee mascot images generated but only the onboarding architect bee is used. The concept mockups show bees in empty states, capability cards, memory browser.
- **Fix — implement these:**

**Chat empty state (no messages):**
```jsx
<img src={theme === 'dark' ? '/brand/bee-architect-dark.png' : '/brand/bee-architect-light.png'} 
     className="w-32 h-32 mx-auto opacity-80" />
<h2>What are you working on?</h2>
```

**Memory empty state (no frames):**
```jsx
<img src={theme === 'dark' ? '/brand/bee-researcher-dark.png' : '/brand/bee-researcher-light.png'}
     className="w-28 h-28 mx-auto opacity-80" />
<p>No memories yet. Start a conversation and I'll remember what matters.</p>
```

**Events empty state:**
```jsx
<img src={theme === 'dark' ? '/brand/bee-analyst-dark.png' : '/brand/bee-analyst-light.png'}
     className="w-28 h-28 mx-auto opacity-80" />
```

**Capabilities pack cards — replace generic icons with bee characters:**
- Research Workflow → `bee-researcher-{theme}.png` (48px)
- Planning Master → `bee-builder-{theme}.png`
- Writing Suite → `bee-writer-{theme}.png`
- Team Collaboration → `bee-team-{theme}.png`
- Decision Framework → `bee-analyst-{theme}.png`

**Error states:**
```jsx
<img src="/brand/bee-confused-dark.png" className="w-24 h-24 mx-auto opacity-70" />
<p>Something went wrong.</p>
```

**Celebrating (onboarding complete):**
```jsx
<img src="/brand/bee-celebrating-dark.png" className="w-32 h-32" />
<h2>Your hive is ready!</h2>
```

### H2: Theme-aware image switching
All bee images must switch between dark/light variants. Use a helper:
```tsx
function BeeImage({ role, className }: { role: string; className?: string }) {
  const theme = useTheme(); // or however theme is accessed
  const variant = theme === 'dark' ? 'dark' : 'light';
  return <img src={`/brand/bee-${role}-${variant}.png`} className={className} alt="" />;
}
```
Available roles: `architect, researcher, writer, analyst, builder, connector, marketer, hunter, orchestrator, confused, sleeping, celebrating, team`

## HIGH — Color Consistency

### H3: Unify green shades — ONE success color
- **Problem:** At least 5 different greens across views (health dots, status text, embedded %, ON badges, cost value).
- **Fix:** All success/healthy indicators use `var(--status-healthy)` = `#34d399` (emerald-400). Define in globals.css, use everywhere:
  - Health dots: `color: var(--status-healthy)`
  - "healthy" / "OK" / "running" / "connected" text: `color: var(--status-healthy)`
  - "ON" badges: `background: var(--status-healthy); color: var(--hive-950)`
  - "34% EMBEDDED" — if it's LOW, show in `var(--status-warning)` (#fbbf24), not green

### H4: Honey accent shade consistency
- Sidebar active indicator, onboarding CTA, chat border, WAGGLE wordmark all use slightly different yellows.
- **Fix:** ALL use `var(--honey-500)` = `#e5a000`. One token, one color, everywhere.

### H5: Card backgrounds too similar to page background
- **Problem:** Cards at `hive-850` on `hive-900` bg — only ~1.15:1 contrast ratio. Cards don't "lift."
- **Fix:** Cards need `box-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.2)` AND `border: 1px solid var(--hive-700)` (not hive-600 which is too subtle).

## MEDIUM — Sidebar Polish

### M1: Workspace item count badges invisible
- Numbers (4, 6, 1) float at right edge in same gray as text, no visual container.
- **Fix:** `background: rgba(255,255,255,0.08); border-radius: 10px; padding: 1px 6px; font-size: 11px; font-weight: 600; color: var(--hive-300);`

### M2: Sidebar text contrast too low
- Workspace names at ~3.2:1 contrast — fails WCAG AA.
- **Fix:** Inactive workspace text: `var(--hive-300)` (#7d869e). Active: `var(--hive-50)`. Hover: `var(--hive-100)`.

### M3: "-- Persona" label in chat area
- Renders as raw text, looks like debug output.
- **Fix:** Either remove, or style as: `background: var(--hive-800); border-radius: 6px; padding: 2px 10px; font-size: 11px; color: var(--hive-400);`

## MEDIUM — Cockpit Specific

### M4: Cost chart area is completely blank
- Between date labels, just empty dark space. No axes, no zero-line, no empty state.
- **Fix:** When no data, show: `<p class="text-hive-400 text-sm text-center py-8">No usage data yet</p>`

### M5: Vault "0 ACTIVE" shown in green = misleading
- Zero active connectors is arguably a WARNING state, not success.
- **Fix:** Show "0 ACTIVE" in `var(--hive-400)` (neutral) or `var(--status-warning)` if all are inactive.

### M6: "23. map 00:54" locale bug
- Month abbreviation rendering incorrectly.
- **Fix:** Force English locale on date formatting: `new Date().toLocaleDateString('en-US', { ... })`

## MEDIUM — Memory View

### M7: Frame list has zero visual hierarchy
- Every row looks identical — same font, same gray, same spacing. Title and metadata indistinguishable.
- **Fix:**
  - Frame title: `font-weight: 600; color: var(--hive-100); font-size: 14px;`
  - Metadata ("From you" / "8 hours ago"): `font-weight: 400; color: var(--hive-500); font-size: 12px;`
  - Source-type dot: colored hex dot (honey for user_stated, purple for agent_inferred, blue for tool_verified) — `8px` circle left of title
  - "normal" badge: remove or make very subtle. Only show non-default badges (deprecated, important).

### M8: Empty detail pane wastes 50% of screen
- "Select a frame to view details" — big empty white space.
- **Fix:** Show memory stats summary (frame count, top tags, embedding status) with bee-researcher image when nothing is selected.

## LOW — Polish Items

### L1: Right panel session entries truncate mid-word
- "Hello Waggle! Give me a quick statu..." — truncates at "statu"
- **Fix:** Ensure `word-break: break-word` or truncate at word boundary.

### L2: Status bar too small
- 10px, very low contrast.
- **Fix:** `font-size: 11px; color: var(--hive-400); border-top: 1px solid var(--hive-700);`

### L3: Selected sidebar item barely visible
- Background tint is ~1.15:1 contrast with sidebar bg.
- **Fix:** Selected item bg: `var(--honey-glow)` (rgba(229,160,0,0.12)) — warm amber tint, clearly distinct.

### L4: Chat session search input invisible
- Transparent bg, faint border, invisible placeholder.
- **Fix:** `background: var(--hive-850); border: 1px solid var(--hive-700); color: var(--hive-200);` Placeholder: `var(--hive-500)`.

## CONSTRAINTS
- `npm run build` must pass with 0 errors
- Do not change component architecture — CSS/className changes only where possible
- Use Lucide icons (already a shadcn dependency) — import from `lucide-react`
- Brand images are at `/brand/bee-{role}-{dark|light}.png` — paths are relative to public dir
- Test both dark and light modes visually after changes
