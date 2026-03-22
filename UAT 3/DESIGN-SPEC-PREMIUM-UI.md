# Waggle Premium UI/UX Design Specification
## "The Hive Mind — Your AI Operating System"

**Target:** Transform Waggle from functional dev tool (7.5/10) to addictive premium experience (9+/10)
**Stack:** React + shadcn/ui + Tailwind CSS
**Design DNA:** Bee/Hive metaphor — hexagonal geometry, honeycomb patterns, warm honey glow on dark surfaces. NOT cute/cartoonish — sophisticated, warm, alive. Like looking into the engine of a living machine.

**Brand assets available in `app/public/brand/`:**
- Waggle bee mascots (various roles: wizard, researcher, analyst, marketer, builder, coder)
- Waggle logo (hexagonal bee, minimal geometric)
- HIVE concept art (hexagonal dark hardware with internal honey glow — THE visual DNA)

---

## 1. VISUAL THESIS: The Living Hive

### Core Concept
Imagine opening a hexagonal window into a living machine. Dark, precision-engineered surfaces. Inside, warm honey-amber light pulses through honeycomb channels. Everything is hexagonal — but subtly. Not a kids' game — an operating system built by bees for knowledge work.

**The HIVE render (last image) IS the design bible:** Dark carbon-fiber shell. Hexagonal mesh texture. Copper/amber internal glow. Glass panels revealing structured internals. That's the Waggle UI.

### Inspiration
- **HIVE render** → Background textures, card borders, ambient glow
- **Waggle logo** → App icon, loading spinner, favicon
- **Bee mascots** → Empty states, onboarding, capability pack icons, error pages, tooltips
- **Linear** → Information architecture, keyboard-first
- **Raycast** → Command palette warmth
- **Bloomberg Terminal** → Information density as beauty

### Color System — "Honey on Dark Steel"

The palette is extracted from the brand art: warm honey/amber (#E5A000–#FCD34D range) on near-black with subtle blue-cold undertones.

```css
:root {
  /* ── Hive Core (backgrounds, near-black with cold undertone) ── */
  --hive-950: #08090c;       /* Deepest — like looking into the HIVE shell */
  --hive-900: #0c0e14;       /* Primary background */
  --hive-850: #11141c;       /* Card surfaces — the glass panel */
  --hive-800: #171b26;       /* Sidebar, elevated panels */
  --hive-700: #1f2433;       /* Borders, dividers — the hex mesh seams */
  --hive-600: #2a3044;       /* Subtle borders, inactive */
  --hive-500: #3d4560;       /* Muted text, placeholders */
  --hive-400: #5a6380;       /* Secondary text */
  --hive-300: #7d869e;       /* Tertiary text */
  --hive-200: #b0b7cc;       /* Body text */
  --hive-100: #dce0eb;       /* Primary text */
  --hive-50:  #f0f2f7;       /* Headings, emphasis — like light hitting the glass */

  /* ── Honey (the lifeblood — extracted from brand art) ── */
  --honey-600: #b87a00;      /* Deep honey — pressed states */
  --honey-500: #e5a000;      /* Primary honey — THE brand color from the bee */
  --honey-400: #f5b731;      /* Warm hover — lighter honey */
  --honey-300: #fcd34d;      /* Bright accent — selected, active */
  --honey-200: #fde68a;      /* Soft highlight */
  --honey-100: #fef3c7;      /* Honey text on dark */
  --honey-50:  #fffbeb;      /* Lightest honey tint */
  --honey-glow: rgba(229, 160, 0, 0.12);  /* Ambient glow — the internal light */
  --honey-pulse: rgba(229, 160, 0, 0.06); /* Very subtle bg tint */

  /* ── Status (clear, not conflicting with honey) ── */
  --status-healthy: #34d399;  /* Emerald — distinctly NOT honey */
  --status-warning: #fbbf24;  /* Shares honey range — intentional (amber = attention) */
  --status-error: #f87171;    /* Soft red */
  --status-info: #60a5fa;     /* Blue */
  --status-ai: #a78bfa;       /* Soft purple — agent activity */

  /* ── Semantic Surfaces ── */
  --surface-card: var(--hive-850);
  --surface-panel: var(--hive-800);
  --surface-overlay: rgba(8, 9, 12, 0.88);
  --surface-hover: var(--honey-pulse);    /* Warm tint on hover */
  --surface-selected: var(--honey-glow);  /* Honey selection */
  --surface-hexgrid: url("data:image/svg+xml,...");  /* CSS hex pattern — see below */
}

/* ── Light theme: warm beeswax paper, dark text, honey accent stays ── */
.light {
  /* Background scale: warm off-whites like beeswax/parchment */
  --hive-950: #fdfcf9;      /* Lightest bg — warm ivory */
  --hive-900: #f8f6f0;      /* Primary bg — like honey-tinted paper */
  --hive-850: #f0ede4;      /* Card surfaces */
  --hive-800: #e8e4d9;      /* Sidebar, panels */
  --hive-700: #d9d4c5;      /* Borders — visible but soft */
  --hive-600: #c4bfae;      /* Subtle borders */
  --hive-500: #9b9585;      /* Muted/placeholder text */
  --hive-400: #736d60;      /* Secondary text */
  --hive-300: #57524a;      /* Tertiary text */
  --hive-200: #3a3630;      /* Body text — dark warm brown */
  --hive-100: #1f1c18;      /* Primary text — near-black warm */
  --hive-50:  #0e0d0a;      /* Headings — darkest */

  /* Honey adjusts slightly for contrast on light bg */
  --honey-600: #a06800;      /* Deeper for better contrast on light */
  --honey-500: #c78500;      /* Primary — darkened honey for AA contrast */
  --honey-400: #e5a000;      /* Hover — the standard honey (works on light) */
  --honey-glow: rgba(199, 133, 0, 0.08);  /* Softer glow on light */
  --honey-pulse: rgba(199, 133, 0, 0.04); /* Very subtle */

  /* Surfaces */
  --surface-card: var(--hive-850);
  --surface-panel: var(--hive-800);
  --surface-overlay: rgba(253, 252, 249, 0.92);
  --surface-hover: rgba(199, 133, 0, 0.04);
  --surface-selected: rgba(199, 133, 0, 0.08);

  /* Honeycomb bg: dark hexagons on light — inverted */
  --surface-hexgrid-stroke: #3a3630;  /* Dark hex lines */
  --surface-hexgrid-opacity: 0.04;    /* Even more subtle on light */
}

/* ── Light theme specific rules ── */
.light .honeycomb-bg {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9z' fill='%233a3630' fill-opacity='0.04'/%3E%3C/svg%3E");
}

/* Light theme shadows: softer, warmer */
.light {
  --shadow-card: 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04);
  --shadow-elevated: 0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04);
  --shadow-honey: 0 0 16px rgba(199,133,0,0.08), 0 0 4px rgba(199,133,0,0.04);
}
```

### Hexagonal Design Language

**The hex is Waggle's signature shape.** Not everywhere — just enough to feel it.

Where hexagons appear:
- **Card borders:** Optionally clipped to subtle hex shape (CSS `clip-path`) on feature cards only
- **Background texture:** Extremely faint honeycomb grid on main background (CSS SVG pattern, ~3% opacity)
- **Avatar shapes:** User and bot avatars in hex-clipped circles
- **Progress indicators:** Hex-shaped fill instead of round (health bars, embedding %)
- **Section dividers:** Thin line of tiny hexagons between major sections
- **Loading spinner:** The Waggle logo (hex bee) rotating slowly
- **Favicon:** Hex bee

Where hexagons DON'T appear (to avoid cheesiness):
- Button shapes (stay rounded rect)
- Input fields
- Regular text cards / chat messages
- Navigation labels
- Dropdown menus

**CSS Honeycomb Background Pattern:**
```css
.honeycomb-bg {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9z' fill='%23e5a000' fill-opacity='0.03'/%3E%3C/svg%3E");
}
```

### Typography

**Font pairing:** Inter (UI/body) + JetBrains Mono (code/data only)

Why Inter? Clean, modern, doesn't compete with the hex/bee visual identity. The personality comes from the shapes and colors, not the font.

```
Page titles:          Inter 600, 28-36px, tracking -0.02em, hive-50
Section headings:     Inter 600, 20-24px, tracking -0.01em, hive-100
Card titles:          Inter 500, 15-16px, hive-100
Body text:            Inter 400, 14px, line-height 1.6, hive-200
Secondary/muted:      Inter 400, 13px, hive-400
Small/captions:       Inter 400, 12px, hive-500
Code/data/tokens:     JetBrains Mono 400, 13px, hive-300
Status bar:           JetBrains Mono 400, 11px, hive-400
Brand text "WAGGLE":  Inter 700, tracking 0.1em, uppercase, honey-500
```

**Rule:** Mono ONLY for: code blocks, token counts, model IDs, file paths, cost numbers, timestamps in data views, the status bar. Everything else is Inter.

### Spacing, Radius, Depth

```
Spacing scale:    4 8 12 16 20 24 32 40 48 64 (base 4px)
Card radius:      12px
Button radius:    8px
Input radius:     8px  
Hex avatar:       clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)
Card padding:     20px
Section gap:      32-48px

Shadows:
  Card:           0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.3)
  Elevated:       0 4px 16px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.3)
  Overlay:        0 8px 32px rgba(0,0,0,0.7)
  Honey glow:     0 0 24px rgba(229,160,0,0.12), 0 0 4px rgba(229,160,0,0.08)
  Focus ring:     0 0 0 2px var(--honey-500), 0 0 8px rgba(229,160,0,0.2)
```

---

## 2. BEE MASCOT SYSTEM — Character Badges

Each brand image corresponds to a capability/role in Waggle. These become **capability pack icons, empty state illustrations, and onboarding characters**.

### Character Assignments

| Image | Character | Use In UI | Role Badge |
|-------|-----------|-----------|------------|
| Bee #1: Wizard with glowing hex | **The Architect** | Onboarding welcome, main logo, loading screen | Core Waggle |
| Bee #2: Glasses + magnifier | **The Researcher** | Research Workflow pack, /research command, web search tool | 🔬 Research |
| Bee #3: Determined + fishing hook | **The Hunter** | Lead generation, data extraction, /extract command | 🎯 Extract |
| Bee #4: Pen + ink drops + wings | **The Writer** | Writing Suite pack, /draft command, document tools | ✍️ Writing |
| Bee #5: Satellite dish | **The Connector** | API/integration pack, connectors, vault, MCP plugins | 📡 Connect |
| Bee #6: Glasses + chart hologram | **The Analyst** | Analytics, Cockpit dashboard, cost tracking, /status | 📊 Analysis |
| Bee #7: Megaphone + fierce | **The Marketer** | Marketing pack, outreach tools, campaign workspace | 📣 Marketing |
| Bee #8: Goggles + hex chains | **The Builder** | Planning Master pack, /plan, task breakdown, code tools | 🔧 Build |
| Bee #9: Waggle logo (geometric) | **The Brand** | Favicon, sidebar logo, app icon, loading spinner | Brand mark |
| Bee #10: HIVE hardware render | **The Hive** | Hero background, about page, onboarding backdrop, premium feel | Ambiance |

### Where Characters Appear

**Empty states (when a view has no data):**
```
Memory Browser (empty):
  [The Researcher bee, 120px, centered]
  "No memories yet"
  "Start a conversation and I'll remember what matters."
  [/catchup to begin]

Events View (empty):
  [The Analyst bee, 120px]
  "No events recorded"
  "Events appear as you use Waggle — chat, tools, memory saves."

Capabilities (marketplace empty):
  [The Builder bee, 120px]
  "Marketplace coming soon"
  "Check back for community-built capability packs."
```

**Capability pack cards:**
```
Each pack gets its character as icon (48px):
  🔬 Research Workflow → The Researcher
  📋 Planning Master → The Builder  
  ✍️ Writing Suite → The Writer
  🤝 Team Collaboration → The Architect
  🧭 Decision Framework → The Analyst
```

**Onboarding wizard:**
```
Step 1 (Welcome): The Architect bee, large (200px), subtle float animation
Step 2 (API Key): The Connector bee (64px) next to provider cards
Step 3 (Workspace): The Builder bee (64px)
Final step: The Architect again with glowing hex → "Your hive is ready"
```

**Error states:**
```
Generic error: The Hunter bee looking confused (if we generate one)
Network error: The Connector bee with broken signal
AI error: The Researcher bee scratching head
```

### Images We Need to Generate (Nano Banana Pro)

| # | Description | Use | Size |
|---|-------------|-----|------|
| 1 | Confused/error bee (same style) | Error states | 512x512 |
| 2 | Sleeping/idle bee | Empty chat, nighttime heartbeat | 512x512 |
| 3 | Celebrating bee (confetti hex) | Onboarding complete, first message success | 512x512 |
| 4 | Team of 3 bees working together | Team features, collaboration pack | 512x512 |
| 5 | Hex honeycomb pattern tile (seamless) | CSS background texture | 256x256 |
| 6 | HIVE render cropped as chat bg | Subtle chat background texture | 1920x1080 |
| 7 | Each bee character as 48x48 icon (simplified/silhouette) | Pack icons, nav badges | 48x48 each |
| 8 | Animated bee wing-flutter (2 frame) | Loading spinner overlay | 128x128 |

---

## 3. COMPONENT-LEVEL REDESIGN

### 3.1 App Shell & Sidebar

**Background:** The app background gets the ultra-subtle honeycomb CSS pattern (3% opacity). The HIVE render can be a one-time ambient element on the welcome/empty state only.

```
┌─────────────────────────────┐
│ ⬡ WAGGLE              [⌘K] │  ← Hex logo (honey-500) + "WAGGLE" in brand text
│─────────────────────────────│
│ Workspaces                  │
│  ├ ⬡ Sales Pipeline      2 │  ← Honey hex bullet = active workspace
│  ├ ○ Research Proj        5 │  ← Hollow hex = inactive
│  └ ○ Code Review          1 │
│─────────────────────────────│
│ ⌘1  💬 Chat                │  ← Inter 400, 14px, emoji icon, NOT mono
│ ⌘2  🧩 Capabilities        │
│ ⌘3  📊 Cockpit          ●  │  ← honey dot = has updates  
│ ⌘4  🗺️ Mission Control     │
│ ⌘5  🧠 Memory           173│  ← frame count badge
│ ⌘6  📋 Events            +3│
│ ⌘7  ⚙️ Settings            │
│─────────────────────────────│
│ [+ New Workspace]           │
│ ☀/☾ Theme                   │
│─────────────────────────────│
│ ⬡ claude-sonnet-4-6        │  ← Status bar, mono OK here
│   7.4M tokens  $22.69      │  ← Honey highlight if over budget
└─────────────────────────────┘

Active nav item:
  - 2px left border, honey-500
  - Background: honey-glow
  - Text: hive-50
  - Icon: honey-400

Hover:
  - Background: honey-pulse (very subtle)
  - Text: hive-100
  - 150ms transition
```

### 3.2 Chat View — The Heart of the Hive

**Background:** Faint honeycomb texture (2% opacity), darker than sidebar.

**User message:**
```
Right-aligned. hive-800 bg, radius 12, max-width 70%.
Inter 400, 14px, hive-100.
Timestamp: JetBrains Mono 11px, hive-500.
Avatar: hex-clipped user photo/initial, 28px, honey-500 border.
```

**AI response (The Waggle Response):**
```
Full width. hive-850 bg, radius 12.
Left border: 3px honey-500 (solid, warm, alive).
Avatar: hex-clipped Waggle logo, 28px, honey-500 fill.
"Waggle" label: Inter 500, 13px, honey-400, with tiny ⬡ before name.
Body: Inter 400, 14px, hive-200, line-height 1.7.

Tool cards (auto_recall, search, etc.):
  hive-800 bg, radius 8, honey-500 left accent (2px).
  Icon: honey-400. Expand/collapse with smooth 200ms height.
  Header: Inter 500 13px hive-300.
  
Copy button: appears on hover, hive-500 → honey-400.
```

**Streaming effect:**
```
Tokens fade in with 40ms stagger (opacity 0→1).
Cursor: honey-500 blinking block (1s pulse).
Tool execution: pulsing honey dot + "Searching memory..." in hive-400 italic.
When done: cursor fades out, response border gets brief honey-glow pulse (200ms).
```

**Empty chat state:**
```
Center of viewport:
  [The Architect bee, 160px, subtle hover/float animation (CSS translateY oscillation 3px, 3s)]
  
  "What are you working on?"  ← Inter 500, 24px, hive-100
  
  Three starter honeycomb cards:
  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
  │ 🔄 Catch up  │ │ 🔍 Research  │ │ 📝 Draft     │
  │ on this      │ │ a topic      │ │ a document   │
  │ workspace    │ │              │ │              │
  └──────────────┘ └──────────────┘ └──────────────┘
  
  Cards: hive-850 bg, radius 12.
  Hover: honey-glow border, card lifts 2px.
  Click → populates input with /catchup, /research, /draft
  
  Below cards: "or type anything to start" ← hive-500, 13px
```

**Input area:**
```
Fixed bottom. hive-800 bg, radius 12, border 1px hive-700.
Focus: border → honey-500, honey-glow shadow.
Placeholder: "Message Waggle... (/ for commands)" ← hive-500, Inter 400.
Send button: honey-500 bg, hive-950 icon. Hover: honey-400, scale 1.05.
Model chip (left of input): hive-700 bg, mono 11px, shows current model. Click → model picker.
```

### 3.3 Cockpit — The Hive Dashboard

Already best view (8.5). Evolve to 9.5.

**Hero metric row (full width, top):**
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ 🧠 FRAMES   │ │ ⚡ TOKENS    │ │ 💰 COST     │ │ ⬡ HEALTH    │
│   173       │ │   7.4M      │ │   $22.69    │ │   ● OK      │
│   ↑12 today │ │   today     │ │   today     │ │   3/3 up    │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘

Cards: hive-850 bg, radius 12.
Numbers: Inter 600, 28px, hive-50.
Labels: Inter 400, 11px, hive-500, uppercase, tracking 0.05em.
Health dot: status-healthy, 8px, subtle pulse (2s).
Cost over budget: honey-500 text + honey-glow background.
Hover: lift 1px, honey-pulse bg.
```

**Cost chart (fix empty area — IMP-6):**
```
7-day mini bar chart using CSS/SVG.
Bars: honey-500 fill, hive-700 empty track.
Hover bar: honey-400 + tooltip with cost + workspace breakdown.
Today's bar: honey-300 top edge (brighter = current).
Height: 80px. Clean, minimal.
```

**Cards:**
```
All: hive-850 bg, radius 12, 20px padding.
Header: Inter 500 14px hive-100, icon in hive-400.
Top border: 1px hive-700 (only top, for separation).
Hover: honey-pulse bg.
Active items within cards: honey-500 dot/indicator.
```

### 3.4 Memory Browser — The Knowledge Hive

**Frame cards:**
```
┌──────────────────────────────────────────────────┐
│ ⬡ user_stated              Mar 22, 14:30        │
│                                                  │
│ "Revenue target updated to $500K for Q2..."      │
│                                                  │
│ 🏷 sales  🏷 q2-targets    ████░ important      │
└──────────────────────────────────────────────────┘

Source type hex dot:
  honey-500 for user_stated
  status-ai purple for agent_inferred
  status-info blue for tool_verified
  hive-400 for import/system

Importance bar: hex-segmented fill (5 hex segments, filled = honey-500)
Tags: hive-700 bg, rounded pill, 11px, hive-300 text
Hover: card lifts 2px, honey-glow border pulse
```

**Embedding health widget (IMP-9):**
```
┌──────────────────────────────────────┐
│ 🧠 Memory Health                     │
│ ⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡⬡  34%        │  ← Hex-segmented bar!
│ ⚠ 114 frames need embedding          │
│ [Run Embedding ▸]                    │
└──────────────────────────────────────┘
Bar: filled hexes = honey-500, empty = hive-700.
Warning: status-warning.
CTA: ghost button, honey-500 border + text.
```

### 3.5 Capabilities / Marketplace

Each pack gets its **bee character** as icon:

```
┌─────────────────────────────────────┐
│ [Researcher Bee 48px]    Installed ✓│
│ Research Workflow                    │
│ Complete research pipeline:         │
│ investigate, synthesize, explain    │
│                                     │
│ ⬡ Research Synthesis               │
│ ⬡ Explain Concept                  │
│ ⬡ Research Team                    │
│                                     │
│ [Configure]  [Disable]              │
└─────────────────────────────────────┘

Card: hive-850 bg, radius 12.
Top accent: 3px top border in pack's character color.
Character icon: actual bee image from brand assets.
Skills: honey-500 hex bullet.
Installed badge: status-healthy, right-aligned.
Hover: lift 2px, glow in pack color.
```

**Remove "Wave 8A" → replace with:**
"More packs coming soon. [Suggest a skill →]"

### 3.6 Onboarding Wizard — Welcome to the Hive

```
Background: hive-950 with ultra-subtle HIVE render as bg-image (5% opacity, blurred).

Step 1 (Welcome):
  [The Architect bee, 200px, gentle float animation]
  
  "YOUR AI OPERATING SYSTEM"  ← 11px, honey-500, uppercase, tracking 0.12em
  "Welcome to the Hive"       ← 36px, Inter 600, hive-50
  "Persistent memory. Workspace-native.
   Built for knowledge work." ← 16px, Inter 400, hive-300
  
  [What should I call you?]   ← Input, centered, 360px, honey focus ring
  
  Continue →                  ← honey-500, Inter 500

Progress indicator (bottom):
  ⬡ ⬡ ⬡ ⬡ ⬡ ⬡ ⬡     Step 2 of 7
  Filled: honey-500
  Empty: hive-600
  Current: honey-500 + pulse
  
API Key step:
  [The Connector bee, 64px]
  Provider cards: Anthropic, OpenAI, Google, Other
  Selected: honey border + honey-glow
  
Final step:
  [The Architect bee with glowing hex, 200px]
  "Your hive is ready ⬡"
  [Start Working →]
  
  [Celebrating bee confetti animation if we have it]
```

### 3.7 Global Search (⌘K) — Command Palette

```
Overlay: surface-overlay (dark frosted)
Modal: hive-850 bg, radius 16, max-width 640px.
Border: 1px hive-700.
Top: honey-500 accent line (1px).

┌─────────────────────────────────────────┐
│ ⬡ Search everything...                  │
│─────────────────────────────────────────│
│ Recent                                   │
│  ▸ Sales Pipeline workspace             │
│  ▸ /research AI agents                  │
│  ▸ "Revenue target Q2" frame            │
│─────────────────────────────────────────│
│ Commands                          ⌘H    │
│  /help    Show all commands             │
│  /draft   Draft a document              │
│  /status  Workspace status              │
│─────────────────────────────────────────│
│ Workspaces                               │
│  ⬡ Sales Pipeline          3 frames    │
│  ⬡ Research Project       12 frames    │
└─────────────────────────────────────────┘

Active item: honey-glow bg + honey-500 left 2px indicator
Keyboard: ↑↓ navigate, Enter execute, Esc close
Transition: fade 150ms + scale 0.96→1.0
```

### 3.8 Context Panel (Right Rail)

```
┌──────────────────────────────────┐
│ ⬡ Context                  [×]  │
│──────────────────────────────────│
│ 📊 Sales Pipeline                │
│ Model: claude-sonnet-4-6         │
│ Budget: $45/$100  ⬡⬡⬡⬡⬡░░░░░   │  ← Hex progress bar!
│ Frames: 23 │ Sessions: 7        │
│ Last: 2 min ago                  │
│──────────────────────────────────│
│ 🧠 Recent Memory                │
│ ⬡ Revenue target → $500K (Q2)   │
│ ⬡ John Smith: lead investor     │
│ ⬡ PostgreSQL > MongoDB          │
│ [View all →]                     │
│──────────────────────────────────│
│ ⚡ Quick Actions                 │
│ [/catchup] [/status] [/draft]    │
└──────────────────────────────────┘
```

### 3.9 Settings — Model Grid Enhancement

**Default model card (IMP-3):**
```
honey-500 border (2px) + honey-glow shadow
"DEFAULT" badge: top-right, honey-500 bg, hive-950 text, 9px uppercase
Hex icon overlay in corner
```

**Other cards:**
```
hive-700 border (1px)
Hover: border → hive-500, honey-pulse bg
Cost badges: $ = emerald, $$ = honey, $$$ = red
Speed badges: fast = emerald pill, medium = honey pill, slow = red pill
```

---

## 4. MICRO-INTERACTIONS — The "Alive" Feeling

### The Hive Heartbeat
The UI should feel alive — like a real hive has a pulse.

1. **Honey pulse on memory save:** Memory nav badge does single honey pulse (300ms). Subconscious "something was learned."

2. **Cost counter live tick:** Status bar cost number ticks during AI responses. Like watching the hive burn fuel.

3. **Health heartbeat:** Green dot in Cockpit: tiny 2s pulse. "The hive is alive."

4. **Workspace switch:** Content cross-fades 100ms. Context panel slides data. Smooth.

5. **First keyboard shortcut toast:** "Pro tip: ⌘K searches everything" — once, stored in localStorage.

6. **Send satisfaction:** Message slides up into chat area with elastic ease. Input field briefly flashes honey border (150ms).

7. **Tool execution:** Honey spinner (rotating ⬡) next to "Searching memory..." text.

8. **Streaming cursor:** Honey blinking hex (⬡) instead of standard cursor.

### Loading States

```
App loading:
  hive-950 bg + Waggle logo (hex bee) centered, 64px
  Gentle pulse animation (opacity 0.7 → 1.0, 1.5s)
  "Loading hive..." in hive-400

Chat waiting:
  Three honey hex dots, staggered pulse:  ⬡ ⬡ ⬡
  Like iMessage typing but hexagonal + honey

Memory/Settings:
  Skeleton with pulse (already implemented — keep but use hive-800 color)
```

### Error States

```
Generic error:
  Toast: status-error left border
  "Something went wrong. [Retry ↻]" — honey retry link

AI error:
  In chat: hive-850 card, status-error left border
  If recalledContext exists: show below error (P1-4 already implemented)
  
Empty workspace:
  [Appropriate bee character, 120px]
  "No data yet"
  Context-specific CTA
```

---

## 5. RESPONSIVE BREAKPOINTS

```
Desktop (1440+):    3-column (sidebar 260px + main + context 320px)
Laptop (1024-1439): 3-column (sidebar 220px + main + context 280px)
Tablet (768-1023):  2-column (sidebar 200px + main), context as overlay
Mobile (< 768):     1-column, sidebar as drawer, bottom nav

Settings tabs at 1024px:
  "Models", "Vault", "Permissions", "Backup", "Team", "Advanced"
  (shorter labels — BUG-R2-03 fix)
```

---

## 6. IMAGE ASSETS NEEDED

### Already Have (from brand art)
1. ✅ The Architect bee (wizard with glowing hex)
2. ✅ The Researcher bee (glasses + magnifier)
3. ✅ The Hunter bee (determined + hook)
4. ✅ The Writer bee (pen + ink)
5. ✅ The Connector bee (satellite dish)
6. ✅ The Analyst bee (glasses + chart)
7. ✅ The Marketer bee (megaphone)
8. ✅ The Builder bee (goggles + hex chains)
9. ✅ Waggle logo (geometric hex bee)
10. ✅ HIVE render (hexagonal hardware)

### Need to Generate (Nano Banana Pro)

**DARK MODE variants (honey/gold bees on dark/transparent bg):**
| # | Description | Style | Size | Priority |
|---|-------------|-------|------|----------|
| G1 | Confused/lost bee | Same flat geometric golden style, dark/transparent bg | 512x512 | HIGH |
| G2 | Sleeping/idle bee | Same style, eyes closed, zzz, dark/transparent bg | 512x512 | HIGH |
| G3 | Celebrating bee with hex confetti | Same style, arms up, hexagons flying, dark/transparent bg | 512x512 | HIGH |
| G4 | Team of 3 bees collaborating | Same style, different accessories, dark/transparent bg | 512x512 | MED |
| G5 | Each bee as 48px simplified icon | Monochrome honey on transparent | 48x48 ×8 | HIGH |
| G6 | Seamless honeycomb texture tile (dark) | Light honey hex lines on dark, for CSS bg | 256x256 | HIGH |
| G7 | HIVE render as wide banner | For onboarding bg / about page | 1920x400 | MED |
| G8 | 2-frame wing flutter animation | Simple for loading spinner | 128x128 ×2 | LOW |

**LIGHT MODE variants (dark/brown bees on light/transparent bg):**
| # | Description | Style | Size | Priority |
|---|-------------|-------|------|----------|
| L1 | Waggle logo LIGHT | Dark brown/charcoal hex bee on transparent — same geometry as dark logo | 512x512 | HIGH |
| L2 | The Architect bee LIGHT | Same pose/style but darker bee colors (brown/charcoal body, dark gold accents) on transparent/light bg | 512x512 | HIGH |
| L3 | The Researcher bee LIGHT | Same pose, dark variant | 512x512 | HIGH |
| L4 | The Writer bee LIGHT | Same pose, dark variant | 512x512 | HIGH |
| L5 | The Analyst bee LIGHT | Same pose, dark variant | 512x512 | HIGH |
| L6 | The Builder bee LIGHT | Same pose, dark variant | 512x512 | HIGH |
| L7 | The Connector bee LIGHT | Same pose, dark variant | 512x512 | HIGH |
| L8 | The Marketer bee LIGHT | Same pose, dark variant | 512x512 | HIGH |
| L9 | The Hunter bee LIGHT | Same pose, dark variant | 512x512 | HIGH |
| L10 | Confused bee LIGHT | Dark variant of G1 | 512x512 | HIGH |
| L11 | Sleeping bee LIGHT | Dark variant of G2 | 512x512 | HIGH |
| L12 | Celebrating bee LIGHT | Dark variant of G3 | 512x512 | HIGH |
| L13 | Seamless honeycomb texture (light) | Dark brown hex lines on light/transparent, for CSS bg | 256x256 | HIGH |
| L14 | Team bees LIGHT | Dark variant of G4 | 512x512 | MED |

**How light/dark image switching works in code:**
```jsx
// In component:
<img 
  src={theme === 'dark' ? '/brand/bee-architect-dark.png' : '/brand/bee-architect-light.png'} 
  alt="Waggle"
/>

// Or via CSS:
.bee-architect { background-image: url('/brand/bee-architect-dark.png'); }
.light .bee-architect { background-image: url('/brand/bee-architect-light.png'); }

// File naming convention:
//   /brand/bee-{role}-dark.png   — gold bee on dark/transparent
//   /brand/bee-{role}-light.png  — dark bee on light/transparent
//   /brand/logo-dark.png         — honey logo for dark mode
//   /brand/logo-light.png        — charcoal logo for light mode
//   /brand/hex-texture-dark.png  — honeycomb tile for dark
//   /brand/hex-texture-light.png — honeycomb tile for light
```

**Total image count:**
- Dark mode: 8 new (G1-G8) + 10 existing = 18
- Light mode: 14 new (L1-L14)
- **Grand total: ~32 images** (some existing can be reused if transparent bg)

---

## 7. IMPLEMENTATION ORDER

### Phase 1: Foundation (do first — affects everything)
1. Add brand images to `app/public/brand/`
2. Update CSS variables (hive/honey system) in `globals.css`
3. Update Tailwind config with hive/honey tokens
4. Add honeycomb CSS background pattern
5. Set Inter as default font, JetBrains Mono for code only
6. Remove `font-mono` from all non-code elements

### Phase 2: Core Experience
7. Chat view complete redesign (messages, input, empty state with bee)
8. Sidebar redesign (nav labels, workspace items, logo)
9. Command palette after crash fix (⌘K)

### Phase 3: Dashboard & Data Views
10. Cockpit hero metrics + cost chart + card restyling
11. Memory browser (frame cards, hex importance bar, embedding widget)
12. Events view (pagination fix)
13. Settings (model highlight, responsive tabs)

### Phase 4: Character & Polish
14. Capability pack cards with bee characters
15. Onboarding wizard with bees + progress dots
16. Context panel redesign
17. Empty states with appropriate bee characters
18. Error states with bee characters

### Phase 5: Micro-interactions & Animation
19. Streaming hex cursor + token fade
20. Honey pulse on memory save
21. Health heartbeat
22. Loading spinner (rotating hex bee logo)
23. Send satisfaction animation
24. Keyboard shortcut toast

---

## 8. ACCEPTANCE CRITERIA

| View | Target Score | Key Element |
|------|-------------|-------------|
| Chat | 9/10 | Honey-bordered AI responses, bee empty state, hex streaming cursor |
| Cockpit | 9.5/10 | Hero metrics, working cost chart, hex health dots |
| Models | 9.5/10 | Honey default highlight, cost/speed badges |
| Memory | 8.5/10 | Source-type hex dots, embedding health bar |
| Capabilities | 8.5/10 | Bee character icons, pack colors, no Wave 8A |
| Onboarding | 9/10 | Architect bee, progress hexagons, "Welcome to the Hive" |
| Search (⌘K) | 8.5/10 | Working!, honey active item, categories |
| Context | 8/10 | Workspace stats, hex budget bar |
| **Overall** | **9+/10** | "Would you leave this open all day? Yes." |
| **Addiction** | **8.5+/10** | The warm honey glow makes you feel at home |

**The ultimate test:** Does it feel like a living hive? Not a website. Not a tool. A *place* where knowledge lives and grows. When you open Waggle, do you feel the warmth of 10,000 interconnected memories humming beneath the surface?

---

## 9. LIGHT MODE — COMPLETE DESIGN NOTES

Light mode isn't "dark mode with white background." It's a different material — warm beeswax paper instead of dark steel. Same honey accent, same hex language, different feel.

### Light Mode Material Metaphor
- **Dark mode** = looking INTO the hive (dark, glowing internals, honey light)
- **Light mode** = the hive in sunlight (warm paper, golden accents, natural warmth)

### Per-Component Light Mode Rules

**Sidebar:**
- Background: hive-800 (#e8e4d9) — warm cream
- Active item: honey-500 left border, hive-850 bg
- Logo: switch to dark logo variant (charcoal hex bee)
- Workspace items: hive-300 text, hover → honey-pulse

**Chat:**
- Background: hive-900 (#f8f6f0) with dark honeycomb texture (4% opacity)
- User message: hive-850 bg, hive-100 text
- AI response: hive-850 bg, honey-500 left border (same as dark — brand constant)
- AI avatar: dark logo variant
- Tool cards: hive-800 bg
- Input: white (#fff) bg, hive-700 border, honey focus ring

**Cockpit:**
- Metric cards: white bg, hive-700 border (1px), soft shadow
- Numbers: hive-50 (near-black)
- Cost chart bars: honey-500 (same)
- Health dot: same emerald

**Memory:**
- Frame cards: white bg, hive-700 border, soft shadow
- Source dots: same colors (honey, purple, blue)
- Tags: hive-800 bg (darker pills on light)

**Settings:**
- Card grid: white bg, hive-700 border
- Default model: honey-500 border (darker honey for contrast)
- Tab bar: hive-850 bg, active tab has honey-500 bottom border

**Onboarding:**
- Background: hive-900 (warm cream) NOT pure white
- Bee character: dark variant
- Input fields: white bg, hive-700 border
- Progress hexagons: honey-500 filled, hive-700 empty (same logic, different contrast)

**Command Palette (⌘K):**
- Modal: white bg, hive-700 border, larger shadow
- Active item: honey-glow (softer on light)
- Input: white bg

**Key rule:** Honey-500 is the anchor. In dark mode it glows. In light mode it grounds. Both feel warm.

### Contrast Requirements (WCAG AA)
- Body text on light bg: hive-200 (#3a3630) on hive-900 (#f8f6f0) = contrast 9.2:1 ✅
- Honey text on light bg: honey-600 (#a06800) on hive-900 (#f8f6f0) = contrast 4.8:1 ✅ (AA large text)
- Honey-500 (#c78500) on hive-900: contrast 3.8:1 — use for icons/accents only, not body text
- Headings: hive-50 (#0e0d0a) on hive-900: contrast 15.8:1 ✅

---

## 10. REFERENCE FILES

- `UAT 3/RETEST-R2-UX.md` — current per-view scores and issues
- `UAT 3/screenshots-retest/` — 35 screenshots of current state
- `UAT 3/SPRINT-1-FIX-PROMPT.md` — all bugs to fix alongside design
- `UAT 3/FINAL-RETEST-REPORT-2026-03-22.md` — consolidated test results
- `app/public/brand/` — bee mascots, logo, HIVE render
- `app/src/` — React app source
- `app/src/components/ui/` — shadcn components
