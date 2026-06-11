# Carpe Diem — Mobile-First UX Recommendations

> Actionable, implementation-ready guidance to make the Carpe Diem web app feel minimal, intuitive, and thumb-friendly on phones (iPhone SE 375px → iPhone 14 Pro 393px, common Android 360–412px).

## How to read this document

Every recommendation cites the **actual file** to change and ships copy-pasteable Tailwind/CSS. The app already has a clean, mostly mobile-first design system (custom Tailwind, no external UI library, brand-purple palette, `Inter`/`Lora`, dark mode via `class`). So this is **refinement, not a rebuild**.

### Reality check (important)

The original brief assumed "buttons are too large." Inspection of [Button.tsx](../src/components/Common/Button.tsx) shows the opposite: buttons are already compact —

| Variant | Classes | Approx height | Verdict |
|---|---|---|---|
| `sm` | `text-sm px-3 py-1.5` | ~32px | **Below** the 44px touch minimum |
| `md` | `text-sm px-4 py-2.5` | ~40px | Already at the recommended target |
| `lg` | `text-base px-5 py-3` | ~48px | Good for primary CTAs |

The real mobile friction is **sub-44px tap targets**, **drawer-only navigation**, and a few **dense screens** — not button size. The decisions below reflect this:

1. Keep buttons visually compact (~36–40px) but guarantee a **44×44 tappable area** on touch.
2. Add a **fixed bottom tab bar** on mobile; keep the desktop sidebar untouched.
3. All changes are **additive and mobile-scoped** (`lg:` resets desktop) to limit regression risk.

---

## 1. Button & Control Sizing

**Principle:** preserve the minimal aesthetic on desktop (precise pointer) while meeting WCAG 2.5.5 / Apple HIG **44px** touch targets on phones. Decouple *visual* size from *hit* area.

### 1.1 Add a touch-area floor to the shared Button

Target: [src/components/Common/Button.tsx](../src/components/Common/Button.tsx) (`sizes` map, ~lines 25–29).

```ts
// Visuals stay compact; min-h-[44px] guarantees the tap area on mobile,
// and sm:min-h-0 releases it on desktop where the pointer is precise.
const sizes: Record<Size, string> = {
  sm: "text-sm px-3 py-1.5 rounded-lg gap-1.5 min-h-[44px] sm:min-h-0",
  md: "text-sm px-4 py-2.5 rounded-xl gap-2 min-h-[44px] sm:min-h-0",
  lg: "text-base px-5 py-3 rounded-xl gap-2", // already ~48px, leave as-is
};
```

- **Desktop:** unchanged — `sm` renders ~32px, `md` ~40px.
- **Mobile:** every button is at least 44px tall to the finger, with the same compact visual padding.
- **Rationale:** one change in the shared component fixes every screen that already uses `<Button>` (Login, InviteModal, EntryEditor, CommentThread, etc.).

### 1.2 Fix the raw `<button>` offenders (icon-only / pill controls)

These bypass the shared component and are the smallest targets in the app:
- NotificationBell — [src/layouts/AppLayout.tsx](../src/layouts/AppLayout.tsx)
- Reaction toggles — [src/components/Journal/ReactionBar.tsx](../src/components/Journal/ReactionBar.tsx) (`px-3 py-1.5` pills)
- Mood pills — [src/components/Journal/MoodPicker.tsx](../src/components/Journal/MoodPicker.tsx)
- Comment Reply/Edit/Delete — [src/components/Comments/CommentThread.tsx](../src/components/Comments/CommentThread.tsx)
- AI version toggle (Original/Enhanced) — [src/pages/EntryEditor.tsx](../src/pages/EntryEditor.tsx)

Add a reusable utility once, in [src/index.css](../src/index.css) under `@layer components`, and apply `tap-target` to those elements:

```css
/* Guarantee a 44px hit area on coarse pointers without changing the look.
   pointer: coarse targets touch devices specifically (incl. touch laptops/tablets),
   so mouse users keep the tight visuals. */
@media (pointer: coarse) {
  .tap-target { min-width: 44px; min-height: 44px; }
}
```

```tsx
// e.g. NotificationBell trigger / icon buttons
<button className="tap-target inline-flex items-center justify-center …">
```

### 1.3 Inputs

`.input-base` ([src/index.css](../src/index.css)) is `px-3.5 py-2.5` ≈ 40px — acceptable. No change required, but selects/dropdowns in [Search.tsx](../src/pages/Search.tsx) should inherit the same `.input-base` height for a consistent 40px control row.

**Summary table**

| Control | Desktop visual | Mobile tap area | Change |
|---|---|---|---|
| Button `sm` | ~32px | ≥44px | `min-h-[44px] sm:min-h-0` |
| Button `md` | ~40px | ≥44px | `min-h-[44px] sm:min-h-0` |
| Button `lg` | ~48px | ≥48px | none |
| Icon/pill buttons | unchanged | ≥44px | `.tap-target` |
| Inputs/selects | ~40px | ~40px | none |

---

## 2. Layout Restructuring

**Principle:** one clear column, content-first, secondary controls deferred. The shell is already single-column (`mx-auto w-full max-w-5xl px-4 py-6` in [AppLayout.tsx](../src/layouts/AppLayout.tsx)) — keep it. Tighten the dense spots.

### 2.1 SpaceDetail header — stop the button wrap

Today the header packs the space badge + 3 lines of metadata + **Manage** + **Invite** + **+ New entry** into one `flex flex-wrap` row ([src/pages/SpaceDetail.tsx](../src/pages/SpaceDetail.tsx) ~lines 131–162). On a 375px screen this wraps into a ragged stack.

**Recommendation (mobile):**
- Keep **`+ New entry`** as the single full-width primary action.
- Fold **Invite** and **Archive/Delete** into the existing `<details>` "Manage" overflow menu (it already exists at ~lines 133–152 — just move Invite into it under `< sm`).
- Restore the multi-button row at `sm:` and up.

```tsx
{/* primary action: full-width on mobile, inline on sm+ */}
<Button className="w-full sm:w-auto">+ New entry</Button>

{/* secondary actions live in the overflow on mobile, inline on sm+ */}
<div className="hidden sm:flex sm:gap-2">{/* Invite + Manage buttons */}</div>
<details className="relative sm:hidden">{/* Invite + Archive + Delete items */}</details>
```

### 2.2 EntryEditor — let writing dominate the first viewport

The editor stacks title → 14-row body → MoodPicker → tags → AI checkbox → error → 3-button footer ([src/pages/EntryEditor.tsx](../src/pages/EntryEditor.tsx) ~191–266). On mobile the metadata pushes the actual writing surface down.

**Recommendation:**
- Keep **title + body** at the top, unobstructed.
- Group **mood, tags, AI polish** under a collapsible `<details>` labelled "Details" (collapsed by default on mobile, open on `sm:`).

```tsx
<details className="group" open>{/* on mobile, default closed: drop `open` under a sm check */}
  <summary className="tap-target cursor-pointer list-none text-sm font-medium text-stone-600">
    Mood, tags &amp; AI ▾
  </summary>
  <div className="mt-3 space-y-4">{/* MoodPicker, tags input, AI toggle */}</div>
</details>
```

### 2.3 EntryEditor — sticky save bar on mobile

The Save/Cancel/Delete footer scrolls away under a long entry. Pin it on mobile:

```tsx
<div className="sticky bottom-0 -mx-4 border-t border-stone-100 bg-white/90
                px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent
                pb-[calc(0.75rem+env(safe-area-inset-bottom))] dark:bg-stone-900/90">
  {/* Cancel + Save (Delete moved into overflow on mobile) */}
</div>
```

> Note: if the bottom tab bar (Section 3) is present on the editor route, either hide the tab bar on full-screen editor routes or stack the sticky save bar above it. Recommended: **hide tabs on the editor** so the writing flow is distraction-free.

---

## 3. Navigation & Information Architecture

**Principle:** core destinations should be one thumb-tap away. There are exactly **4** nav items (Dashboard, Search, Profile, Settings) — a textbook fit for a bottom tab bar.

### 3.1 Add a fixed bottom tab bar (mobile only)

Target: [src/layouts/AppLayout.tsx](../src/layouts/AppLayout.tsx). The `navItems` array (~lines 10–15) already carries `to`, `label`, `emoji`, `end` — reuse it verbatim.

```tsx
<nav
  className="fixed inset-x-0 bottom-0 z-40 flex border-t border-stone-100 bg-white
             pb-[env(safe-area-inset-bottom)] lg:hidden dark:border-stone-800 dark:bg-stone-900"
  aria-label="Primary"
>
  {navItems.map((i) => (
    <NavLink
      key={i.to}
      to={i.to}
      end={i.end}
      className={({ isActive }) =>
        cn(
          "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs min-h-[56px]",
          isActive
            ? "text-brand-700 dark:text-brand-200"
            : "text-stone-500 dark:text-stone-400"
        )
      }
    >
      <span className="text-lg">{i.emoji}</span>
      {i.label}
    </NavLink>
  ))}
</nav>
```

- Reuses the existing active styling tokens (`text-brand-700` / `dark:text-brand-200`).
- `min-h-[56px]` exceeds the 44px target — bottom bars want generous height.
- `lg:hidden` → desktop sidebar (`lg:block`) is untouched.

### 3.2 Retire the mobile hamburger for *primary* nav

With the tab bar covering the 4 core sections, the mobile top header + slide-in drawer (~lines 110–138) no longer needs to host primary navigation. Two clean options:

- **Recommended:** remove the drawer entirely on mobile. Move **dark-mode toggle, username, logout** (currently in `SidebarContent`) into the **Profile** and **Settings** screens, where users already expect account controls. The mobile top header shrinks to logo + NotificationBell only.
- Lighter-touch: keep the drawer but demote it to "overflow/account" (no primary links), reachable via a small avatar in the header.

### 3.3 Reserve space so content clears the bar

Add bottom padding to `main` so the tab bar never overlaps the last row:

```tsx
<main className="flex-1 pb-20 lg:pb-0">{/* 5rem clears the ~56px bar + safe area */}</main>
```

---

## 4. Whitespace & Density

**Principle:** progressive disclosure — show the essential control first, reveal the rest on demand. Touch interactions must not depend on hover.

### 4.1 Search filters → collapse behind "Filters"

[src/pages/Search.tsx](../src/pages/Search.tsx) (~47–93) shows query + space + mood + tag in a `grid sm:grid-cols-3`. On mobile, lead with just the query field and Search button; tuck the three filters into a disclosure:

```tsx
<div className="space-y-3">
  <Input placeholder="Search entries…" /> {/* always visible */}
  <details className="sm:open">
    <summary className="tap-target cursor-pointer list-none text-sm text-stone-600">
      Filters ▾
    </summary>
    <div className="mt-3 grid gap-3 sm:grid-cols-3">{/* space, mood, tag */}</div>
  </details>
  <Button className="w-full sm:w-auto">Search</Button>
</div>
```

### 4.2 CommentThread → overflow menu + capped indent

[src/components/Comments/CommentThread.tsx](../src/components/Comments/CommentThread.tsx) shows inline **Reply / Edit / Delete** per comment (~194–207) and indents nested replies with `ml-5 pl-4` (~line 159).

- Collapse the three inline actions into a single "⋯" overflow on mobile (keep them inline at `sm:`). Each menu item gets `.tap-target`.
- **Cap nesting at one visual indent level on narrow screens** so deep threads don't squeeze text into a vertical ribbon:

```tsx
<div className="ml-2 pl-3 sm:ml-5 sm:pl-4 border-l border-stone-100">
```

### 4.3 AttachmentPanel → no hover-only controls

[src/components/Journal/AttachmentPanel.tsx](../src/components/Journal/AttachmentPanel.tsx) reveals the delete button on `group-hover` (~line 100). **Hover doesn't exist on touch**, so the delete is unreachable on phones. Make it always visible on coarse pointers:

```tsx
{/* was: opacity-0 group-hover:opacity-100 */}
<button className="tap-target absolute right-1 top-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 …">
  ✕
</button>
```

### 4.4 Keep what already works

- Dashboard stats `grid-cols-2 sm:grid-cols-4` and spaces grid `sm:grid-cols-2 lg:grid-cols-3` — good, leave them.
- [Modal.tsx](../src/components/Common/Modal.tsx) is already a mobile bottom-sheet (`items-end` → `sm:items-center`) — no change.

---

## 5. Implementation Notes

### 5.1 Scope & risk
- **No new dependencies.** Everything reuses existing tokens: `brand-*`, `stone-*`, `.card`, `.input-base`, `animate-fade-in`.
- **Mobile-scoped.** Every change either lives below a `sm:`/`lg:` reset or behind `@media (pointer: coarse)`, so desktop is untouched. Low regression risk.

### 5.2 Centralize, don't sprinkle
- Tap-area floor belongs in **two places only**: the `sizes` map in [Button.tsx](../src/components/Common/Button.tsx) and the `.tap-target` utility in [index.css](../src/index.css). Avoid per-button `min-h` hacks.

### 5.3 Use capability queries, not just width
- Prefer `@media (pointer: coarse)` for touch-area rules so touchscreen laptops and tablets get accessible targets even at wide viewports — width breakpoints alone miss them.

### 5.4 Safe areas
- Bottom bar and sticky save bar must include `env(safe-area-inset-bottom)` for notched/gesture-bar devices (already in the snippets above).

### 5.5 Suggested file change-set (for the follow-up implementation PR)
| File | Change |
|---|---|
| `src/components/Common/Button.tsx` | add `min-h-[44px] sm:min-h-0` to `sm`/`md` |
| `src/index.css` | add `.tap-target` coarse-pointer utility |
| `src/layouts/AppLayout.tsx` | add bottom tab bar; trim mobile drawer; `main` bottom padding |
| `src/pages/SpaceDetail.tsx` | collapse header actions into overflow on mobile |
| `src/pages/EntryEditor.tsx` | "Details" disclosure + sticky mobile save bar |
| `src/pages/Search.tsx` | "Filters" disclosure on mobile |
| `src/components/Comments/CommentThread.tsx` | overflow menu + capped indent |
| `src/components/Journal/AttachmentPanel.tsx` | always-visible delete on touch |
| `ReactionBar.tsx`, `MoodPicker.tsx`, NotificationBell | apply `.tap-target` |

### 5.6 Verification (when implemented)
- `npm run dev` in `frontend/`, open devtools device toolbar at **375px** (iPhone SE) and **393px** (iPhone 14 Pro).
- Confirm: all primary buttons ≥44px to the tap; bottom tab bar reachable by thumb and not overlapping content; SpaceDetail / EntryEditor / Search no longer wrap awkwardly or overflow; attachment delete works without a mouse; deep comment threads stay readable.
- Re-check desktop at `lg` to confirm sidebar and existing layouts are visually unchanged.

---

## Self-check against the brief
- ✅ Touch targets & accessibility — 44px floor via `min-h` + `.tap-target`, WCAG 2.5.5 / HIG cited.
- ✅ Button sizes practical & still usable — compact visuals retained, hit area guaranteed.
- ✅ Clutter reduced without hiding critical features — progressive disclosure keeps primary actions visible; only secondary controls deferred.
- ✅ Specific & implementable — every item names a real file and ships pasteable classes.
- ✅ Reasoning tied to mobile UX best practices — thumb reach (bottom tabs), pointer capability queries, safe-area insets, content-first hierarchy.
