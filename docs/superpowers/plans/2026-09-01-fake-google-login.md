# Fake Google Login & Host Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simulate the PRD's "主揪強制 Google 登入" flow with a pure frontend fake-login state, gate the host home behind it, split the logged-in home into "建立活動" + "我揪的團" (PRD Option B), and auto-hide events more than 7 days old from that list — all while leaving participant room links (`#event=...`) fully login-free.

**Architecture:** Add a tiny localStorage-backed fake-auth store (`src/lib/fakeAuth.ts`) with no real OAuth call, mirroring how `src/lib/localEventStore.ts` already fakes a backend. Gate rendering in `src/App.tsx` (the single state owner for both the desktop and mobile trees) on `user` presence, but only when there is no `#event=` hash in the URL — room pages never check `user` at all. Desktop and mobile keep their existing separate component trees (per `CLAUDE.md`), so most UI pieces (LoginScreen, UserMenu, HostDashboard/HostHome) are built twice in parallel, thin, and style-matched to their tree's existing conventions.

**Tech Stack:** React + TypeScript, Vite, inline `style={{ }}` with `var(--color-*)` design tokens, `lucide-react` icons, existing `src/design-system/components` (Button, Avatar). No test runner is configured in this repo (see `CLAUDE.md`) — every task's verification step is `npm run lint` (which runs `tsc --noEmit`) plus a manual check in the running dev server, not an automated test.

**Spec:** `docs/modified-2026-0901/登入權限與路由控制 & AI 聚餐選餐廳 產品修改規格書 (PRD).md`, section 2 (2.1–2.3).

## Global Constraints

- This is a **static, no-backend demo repo** meant to show engineers a flow — see `README.md` → "專案定位（重要）" and `[[project_static_demo_no_real_backend]]`. Do **not** wire up real Google OAuth, a real ID token, or any backend call. `fakeAuth.ts` must only read/write `localStorage`.
- Room-specific URLs (`window.location.hash` containing `event=<id>`) must stay **fully login-free** for participants, per PRD 2.2 — never add a login check inside `EventView`/`EventScreen` or any code path that only runs once `currentEventId` is set.
- Keep the existing hash-based routing (`CLAUDE.md`: "No router") — do not introduce `react-router` or path-based routes.
- Desktop (`src/components/*`) and mobile (`src/mobile/*`) are separate trees sharing only `src/types.ts` and `src/lib/*` — build each UI piece twice, once per tree, matching that tree's existing styling conventions (desktop: `Header.tsx`'s `pillBtnStyle` pattern; mobile: `mobileStyles.tsx`'s `cardStyle`/`SectionLabel`).
- `npm run lint` (`tsc --noEmit`) must pass after every task — this is the only automated safety net in this repo.

---

## File Structure

| File | Change | Responsibility |
|---|---|---|
| `src/lib/fakeAuth.ts` | Create | localStorage-backed fake user store + `useFakeAuth()` hook |
| `src/lib/eventStatus.ts` | Modify | Add `isOlderThanDays()` helper for the 7-day-from-creation list filter |
| `src/lib/api.ts` | Modify | `VisitedEventItem` gains `createdAt`; `saveVisitedEvent` records it; `getVisitedEvents` filters out anything older than 7 days |
| `src/components/UserMenu.tsx` | Create | Desktop avatar + dropdown (登出) |
| `src/components/LoginScreen.tsx` | Create | Desktop fake-login landing screen |
| `src/components/HostDashboard.tsx` | Create | Desktop "建立活動" + "我揪的團" two-block home |
| `src/components/Header.tsx` | Modify | Show `UserMenu` or a fake-login pill instead of the "免登入" badge; gate 我的聚會/發起活動 buttons on `user` |
| `src/mobile/UserMenu.tsx` | Create | Mobile avatar + dropdown (登出) |
| `src/mobile/LoginScreen.tsx` | Create | Mobile fake-login landing screen |
| `src/mobile/HostHome.tsx` | Create | Mobile "建立活動" + "我揪的團" two-block home |
| `src/App.tsx` | Modify | Own `useFakeAuth()` + `homeView` state, pass down to both trees, broaden the history-refresh effect |
| `src/mobile/MobileApp.tsx` | Modify | Accept auth/homeView props, render LoginScreen/HostHome/CreateWizard |

---

### Task 1: Fake auth store + 7-day host-list expiry

**Files:**
- Create: `src/lib/fakeAuth.ts`
- Modify: `src/lib/eventStatus.ts:1-6` (add helper near `EXPIRE_AFTER_DAYS`)
- Modify: `src/lib/api.ts:126-174` (`VisitedEventItem`, `saveVisitedEvent`, `getVisitedEvents`)

**Interfaces:**
- Produces: `FakeUser { name: string; email: string }`, `getFakeUser(): FakeUser | null`, `fakeLogin(): FakeUser`, `fakeLogout(): void`, `useFakeAuth(): { user: FakeUser | null; login: () => void; logout: () => void }` — all later tasks import these from `../lib/fakeAuth` (mobile) or `./lib/fakeAuth` (App.tsx).
- Produces: `isOlderThanDays(iso: string, days: number): boolean` in `eventStatus.ts` — consumed by Task 1's own `api.ts` change.
- Produces: `VisitedEventItem.createdAt: string` (new required field) — consumed by Task 3/9's list-rendering code if it wants to show "建立於 X 天前" (optional; not required to just filter).

- [ ] **Step 1: Create the fake auth store**

```ts
// src/lib/fakeAuth.ts
// This project is a static, no-backend demo (see README.md "專案定位（重要）").
// "Google SSO" is simulated entirely client-side: logging in just writes a
// canned user object to localStorage — there is no real OAuth redirect, no ID
// token, and no verification of any kind.
import { useCallback, useState } from "react";

const STORAGE_KEY = "gathertime_fake_user";

export interface FakeUser {
  name: string;
  email: string;
}

const DEMO_USER: FakeUser = { name: "王小明", email: "demo.host@gmail.com" };

export function getFakeUser(): FakeUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function fakeLogin(): FakeUser {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_USER));
  } catch {}
  return DEMO_USER;
}

export function fakeLogout(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export function useFakeAuth() {
  const [user, setUser] = useState<FakeUser | null>(() => getFakeUser());

  const login = useCallback(() => {
    setUser(fakeLogin());
  }, []);

  const logout = useCallback(() => {
    fakeLogout();
    setUser(null);
  }, []);

  return { user, login, logout };
}
```

- [ ] **Step 2: Add the 7-day-from-creation helper to `eventStatus.ts`**

In `src/lib/eventStatus.ts`, right after the `EXPIRE_AFTER_DAYS` constant (currently line 5), add:

```ts
// Elapsed-time check (not calendar-day) — used for the host's "我揪的團" list,
// which hides based on when an event was *created*, unlike isLinkExpired()
// below which hides based on days since the finalized meetup *ended*.
export function isOlderThanDays(iso: string, days: number): boolean {
  return Date.now() - new Date(iso).getTime() > days * DAY_MS;
}
```

- [ ] **Step 3: Track `createdAt` on visited-event snapshots and filter on read**

In `src/lib/api.ts`, update the imports at the top to also pull in `isOlderThanDays`:

```ts
import { isOlderThanDays } from "./eventStatus.js";
```

Change the `VisitedEventItem` interface (currently `src/lib/api.ts:126-135`) to add the field:

```ts
export interface VisitedEventItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isHost: boolean;
  mode?: EventMode;
  status?: EventData["status"];
  responseDeadline?: string;
  finalSlotDate?: string;
}
```

Change `saveVisitedEvent`'s signature and body (currently `src/lib/api.ts:139-165`) to accept and record `createdAt`:

```ts
export function saveVisitedEvent(event: Pick<EventData, "id" | "title" | "mode" | "status" | "responseDeadline" | "slots" | "finalSlotId" | "createdAt">) {
  try {
    const { id, title, createdAt } = event;
    const isHost = Boolean(getHostToken(id));
    const raw = localStorage.getItem(LOCAL_MY_EVENTS_KEY);
    let list: VisitedEventItem[] = raw ? JSON.parse(raw) : [];

    const finalSlotDate = event.finalSlotId ? event.slots?.find((s) => s.id === event.finalSlotId)?.date : undefined;

    // Remove if exists
    list = list.filter((item) => item.id !== id);
    // Add to top
    list.unshift({
      id,
      title,
      createdAt,
      updatedAt: new Date().toISOString(),
      isHost,
      mode: event.mode,
      status: event.status,
      responseDeadline: event.responseDeadline,
      finalSlotDate,
    });
    // Keep max 20
    list = list.slice(0, 20);
    localStorage.setItem(LOCAL_MY_EVENTS_KEY, JSON.stringify(list));
  } catch {}
}
```

Change `getVisitedEvents` (currently `src/lib/api.ts:167-174`) to drop anything older than 7 days, and drop any pre-existing stored item that predates this change and has no `createdAt` (treat missing `createdAt` as "keep it" rather than crashing — `isOlderThanDays(undefined as any, 7)` would throw, so guard explicitly):

```ts
export function getVisitedEvents(): VisitedEventItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_MY_EVENTS_KEY);
    const list: VisitedEventItem[] = raw ? JSON.parse(raw) : [];
    return list.filter((item) => !item.createdAt || !isOlderThanDays(item.createdAt, 7));
  } catch {
    return [];
  }
}
```

- [ ] **Step 4: Verify types compile**

Run: `npm run lint`
Expected: FAILS at this point — `fetchEvent`/`createEvent`/etc. in `api.ts` still call `saveVisitedEvent(data)` / `saveVisitedEvent(data.event)` where `data`/`data.event` are full `EventData` objects that already include `createdAt` (see `src/types.ts:51`), so those call sites are fine as-is; the only expected error is unused-import or similar. If `tsc` reports a real mismatch, read the message and fix the `Pick<...>` field list in Step 3 to match what callers actually pass.

- [ ] **Step 5: Manual check**

Run: `npm run dev`, open the app, create a new event. Open browser devtools → Application → Local Storage → find `gathertime_my_events` → confirm the new entry has a `createdAt` field matching `gathertime_events_db`'s entry for the same event id.

- [ ] **Step 6: Commit**

```bash
git add src/lib/fakeAuth.ts src/lib/eventStatus.ts src/lib/api.ts
git commit -m "feat: add fake auth store and 7-day host-list expiry filter"
```

---

### Task 2: Desktop UserMenu (avatar + logout dropdown)

**Files:**
- Create: `src/components/UserMenu.tsx`

**Interfaces:**
- Consumes: `FakeUser` from `../lib/fakeAuth`, `Avatar` from `../design-system/components`.
- Produces: `<UserMenu user={FakeUser} onLogout={() => void} />` — consumed by Task 4's `Header.tsx` change.

- [ ] **Step 1: Write the component**

```tsx
// src/components/UserMenu.tsx
import React, { useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { Avatar } from "../design-system/components";
import { FakeUser } from "../lib/fakeAuth";

interface UserMenuProps {
  user: FakeUser;
  onLogout: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 2 }}
      >
        <Avatar name={user.name} size="sm" />
        <ChevronDown size={14} color="#fff" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms ease" }} />
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 90 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              background: "#fff",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-md)",
              border: "1px solid var(--color-border)",
              minWidth: 160,
              zIndex: 100,
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--color-ink)" }}>{user.name}</div>
              <div style={{ fontSize: 10, color: "var(--color-muted)", marginTop: 1 }}>{user.email}</div>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                width: "100%",
                padding: "10px 12px",
                border: "none",
                background: "none",
                color: "var(--color-hot)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <LogOut size={14} />
              登出
            </button>
          </div>
        </>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Verify types compile**

Run: `npm run lint`
Expected: PASS (component isn't imported anywhere yet, so this only checks the file itself is valid TypeScript/JSX).

- [ ] **Step 3: Commit**

```bash
git add src/components/UserMenu.tsx
git commit -m "feat: add desktop UserMenu avatar/logout dropdown"
```

---

### Task 3: Desktop LoginScreen

**Files:**
- Create: `src/components/LoginScreen.tsx`

**Interfaces:**
- Consumes: `Button` from `../design-system/components`.
- Produces: `<LoginScreen onLogin={() => void} />` — consumed by Task 6's `App.tsx` change.

- [ ] **Step 1: Write the component**

```tsx
// src/components/LoginScreen.tsx
import React from "react";
import { LogIn, CalendarHeart } from "lucide-react";
import { Button } from "../design-system/components";

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: 24, textAlign: "center" }}>
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "var(--radius-lg)",
          background: "var(--color-primary)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 20,
        }}
      >
        <CalendarHeart size={30} />
      </div>
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 20, color: "var(--color-ink)", margin: 0 }}>
        主揪請先登入
      </h2>
      <p style={{ fontSize: 13, color: "var(--color-muted)", marginTop: 8, marginBottom: 4, maxWidth: 320 }}>
        建立活動與管理「我揪的團」需要先登入。團員收到活動連結後不需要登入即可投票。
      </p>
      <p style={{ fontSize: 11, color: "var(--color-muted)", opacity: 0.75, marginBottom: 24 }}>
        （Demo 展示用，僅模擬登入畫面，不會真的呼叫 Google）
      </p>
      <Button variant="primary" size="lg" icon={<LogIn size={18} />} onClick={onLogin}>
        使用 Google 帳號登入
      </Button>
    </div>
  );
};
```

- [ ] **Step 2: Verify types compile**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/LoginScreen.tsx
git commit -m "feat: add desktop fake-login screen"
```

---

### Task 4: Desktop HostDashboard (建立活動 + 我揪的團)

**Files:**
- Create: `src/components/HostDashboard.tsx`

**Interfaces:**
- Consumes: `VisitedEventItem` from `../lib/api`, `getLifecycleStatusFromSnapshot` from `../lib/eventStatus`, `Badge`/`Button` from `../design-system/components`.
- Produces: `<HostDashboard events={VisitedEventItem[]} onCreateEvent={() => void} onSelectEvent={(id: string) => void} />` — consumed by Task 6's `App.tsx` change.

- [ ] **Step 1: Write the component**

This reuses the same list-item layout `MyEventsModal.tsx` already uses (`src/components/MyEventsModal.tsx:40-63`) so the "我揪的團" block looks consistent with the existing "我的聚會紀錄" modal — just inline on the page instead of in a popup, and pre-filtered to `isHost` events only (participant-only visits don't belong in "我揪的**團**").

```tsx
// src/components/HostDashboard.tsx
import React from "react";
import { PlusCircle } from "lucide-react";
import { VisitedEventItem } from "../lib/api";
import { getLifecycleStatusFromSnapshot } from "../lib/eventStatus";
import { Badge, Button } from "../design-system/components";

interface HostDashboardProps {
  events: VisitedEventItem[];
  onCreateEvent: () => void;
  onSelectEvent: (id: string) => void;
}

export const HostDashboard: React.FC<HostDashboardProps> = ({ events, onCreateEvent, onSelectEvent }) => {
  const hostedEvents = events.filter((e) => e.isHost);

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "40px 24px", display: "flex", flexDirection: "column", gap: 24 }}>
      <div
        style={{
          background: "var(--color-ink)",
          color: "#fff",
          borderRadius: "var(--radius-card)",
          padding: 28,
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 800 }}>成團後，讓 AI 幫忙決定去哪吃</div>
        <Button variant="secondary" size="lg" icon={<PlusCircle size={18} />} onClick={onCreateEvent}>
          建立活動
        </Button>
      </div>

      <div>
        <div style={{ fontSize: 15, fontWeight: 900, fontFamily: "var(--font-display)", color: "var(--color-ink)", marginBottom: 12 }}>
          我揪的團
        </div>
        {hostedEvents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: "var(--color-muted)", fontSize: 12, border: "1px dashed var(--color-border-strong)", borderRadius: "var(--radius-md)" }}>
            目前尚無紀錄，點上方「建立活動」開始揪團吧！
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {hostedEvents.map((h) => {
              const lifecycle = getLifecycleStatusFromSnapshot(h);
              return (
                <div
                  key={h.id}
                  onClick={() => onSelectEvent(h.id)}
                  style={{ padding: 12, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", cursor: "pointer", background: "var(--color-surface)" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: "var(--color-ink)" }}>{h.title}</span>
                    <Badge variant="secondary" size="sm">主揪</Badge>
                    <Badge variant={lifecycle.sublabel === "尚未投完" ? "success" : lifecycle.sublabel === "已取消" ? "hot" : "muted"} size="sm">{lifecycle.label}</Badge>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--color-muted)", marginTop: 4 }}>
                    上次查看：{new Date(h.updatedAt).toLocaleString("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify types compile**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/HostDashboard.tsx
git commit -m "feat: add desktop host dashboard (create + my-hosted-events)"
```

---

### Task 5: Wire login gate + dashboard into desktop `Header.tsx` and `App.tsx`

**Files:**
- Modify: `src/components/Header.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useFakeAuth`, `FakeUser` (Task 1), `UserMenu` (Task 2), `LoginScreen` (Task 3), `HostDashboard` (Task 4).

- [ ] **Step 1: Update `Header.tsx` to show login/avatar state**

Replace the whole file's props and right-hand button cluster. First, update imports and the props interface (currently `src/components/Header.tsx:1-9`):

```tsx
import React from "react";
import { CalendarHeart, PlusCircle, History, Share2, LogIn } from "lucide-react";
import { FakeUser } from "../lib/fakeAuth";
import { UserMenu } from "./UserMenu";

interface HeaderProps {
  onNewEvent: () => void;
  onOpenHistory: () => void;
  onOpenShareModal?: () => void;
  activeEventTitle?: string;
  user: FakeUser | null;
  onLogin: () => void;
  onLogout: () => void;
}
```

Then update the destructured props (currently line 28) and remove the "免登入" badge block (currently lines 48-56), replacing it with just the app name:

```tsx
export const Header: React.FC<HeaderProps> = ({ onNewEvent, onOpenHistory, onOpenShareModal, activeEventTitle, user, onLogin, onLogout }) => {
```

```tsx
          <div>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 18, lineHeight: 1.1 }}>揪甘心</span>
            <p style={{ fontSize: 11, opacity: 0.85, margin: 0, marginTop: 1 }}>聚會時間協調神器</p>
          </div>
```

Finally, replace the right-hand button cluster (currently lines 80-98) so the host-only actions and the login/avatar state are gated on `user`:

```tsx
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {onOpenShareModal && (
            <button onClick={onOpenShareModal} style={pillBtnStyle} title="分享這個活動的連結">
              <Share2 size={14} />
              分享
            </button>
          )}
          {user ? (
            <>
              <button onClick={onOpenHistory} style={pillBtnStyle} title="查看瀏覽或建立過的活動紀錄">
                <History size={14} />
                我的聚會
              </button>
              <button
                onClick={onNewEvent}
                style={{ ...pillBtnStyle, background: "var(--color-ink)", border: "1.5px solid var(--color-ink)" }}
              >
                <PlusCircle size={14} />
                發起活動
              </button>
              <UserMenu user={user} onLogout={onLogout} />
            </>
          ) : (
            <button onClick={onLogin} style={pillBtnStyle}>
              <LogIn size={14} />
              使用 Google 登入
            </button>
          )}
        </div>
```

- [ ] **Step 2: Wire `useFakeAuth` + `homeView` into `App.tsx`**

Add imports (near the top of `src/App.tsx`, alongside the other component imports at lines 2-8):

```tsx
import { LoginScreen } from "./components/LoginScreen";
import { HostDashboard } from "./components/HostDashboard";
import { useFakeAuth } from "./lib/fakeAuth";
```

Add state, right after the existing `historyList` state (currently `src/App.tsx:47`):

```tsx
  const { user, login, logout } = useFakeAuth();
  const [homeView, setHomeView] = useState<"dashboard" | "create">("dashboard");
```

- [ ] **Step 3: Broaden the history-refresh effect so the dashboard has data without opening the modal**

Replace the existing effect (currently `src/App.tsx:126-131`):

```tsx
  // Refresh the visited-events list whenever the "我的聚會" modal opens, or
  // whenever we land on the logged-in host home (no event in the hash) —
  // HostDashboard/HostHome need this list without the user opening the modal.
  useEffect(() => {
    if (isHistoryOpen || (!currentEventId && user)) {
      setHistoryList(getVisitedEvents());
    }
  }, [isHistoryOpen, currentEventId, user]);
```

- [ ] **Step 4: Reset `homeView` when returning home**

In `handleGoHome` (currently `src/App.tsx:241-246`), add the reset:

```tsx
  const handleGoHome = () => {
    window.location.hash = "";
    setPageError(null);
    setCurrentEventId(null);
    setEventData(null);
    setHomeView("dashboard");
  };
```

- [ ] **Step 5: Pass the new props to `Header` and gate the desktop body**

Update the `<Header ... />` call (currently `src/App.tsx:287-292`):

```tsx
      <Header
        onNewEvent={handleGoHome}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenShareModal={eventData ? () => setIsShareModalOpen(true) : undefined}
        activeEventTitle={eventData?.title}
        user={user}
        onLogin={login}
        onLogout={logout}
      />
```

Replace the "no event → show create form" block (currently `src/App.tsx:319-321`) so it branches on login state and `homeView`:

```tsx
        {!isLoading && !pageError && !currentEventId && (
          !user ? (
            <LoginScreen onLogin={login} />
          ) : homeView === "create" ? (
            <CreateEvent onSubmit={handleCreateEvent} isLoading={isLoading} />
          ) : (
            <HostDashboard
              events={historyList}
              onCreateEvent={() => setHomeView("create")}
              onSelectEvent={(id) => {
                window.location.hash = `event=${id}`;
              }}
            />
          )
        )}
```

**Note on room-link login-free access:** this whole branch is guarded by `!currentEventId` — as soon as the hash contains `event=...`, `currentEventId` is set (see `parseHashParams`/`loadEvent`, `src/App.tsx:65-95`) and the app renders `<EventView>` (`src/App.tsx:323-337`) regardless of `user`. No change needed there — this is what keeps participant links login-free.

- [ ] **Step 6: Verify types compile**

Run: `npm run lint`
Expected: PASS. If it fails on `Header` props, double check every `<Header ... />` call site was updated (there's only one, in the desktop branch of `App.tsx`).

- [ ] **Step 7: Manual check**

Run: `npm run dev`, open the desktop-width browser window:
1. Clear `localStorage` (devtools → Application → Clear site data) → reload → confirm you land on the "主揪請先登入" screen, not the create-event form.
2. Click "使用 Google 帳號登入" → confirm you land on a "建立活動" + "我揪的團" two-block home, and the header top-right now shows an avatar instead of a login button.
3. Click the avatar → confirm the dropdown shows your name/email and a "登出" button; click it → confirm you're back on the login screen.
4. Log in again, click "建立活動", finish creating a demo event → confirm the app navigates to the event's `#event=...&hostToken=...` URL as before.
5. Copy that URL, open it in a private/incognito window (no fake-login state) → confirm the event page loads and lets you vote **without** ever seeing the login screen.

- [ ] **Step 8: Commit**

```bash
git add src/components/Header.tsx src/App.tsx
git commit -m "feat: gate desktop host home behind fake login, add host dashboard"
```

---

### Task 6: Mobile UserMenu + LoginScreen

**Files:**
- Create: `src/mobile/UserMenu.tsx`
- Create: `src/mobile/LoginScreen.tsx`

**Interfaces:**
- Consumes: `FakeUser` from `../lib/fakeAuth`, `Avatar`/`Button` from `../design-system/components`, `cardStyle` from `./mobileStyles`.
- Produces: `<UserMenu user={FakeUser} onLogout={() => void} />` and `<LoginScreen onLogin={() => void} />` — consumed by Task 7's `HostHome.tsx` and Task 8's `MobileApp.tsx`.

- [ ] **Step 1: Write the mobile UserMenu**

Same behavior as the desktop one (Task 2), but the trigger uses dark text (mobile's TopBar background is the same `var(--color-primary)`, so keep white text there too — this component will be dropped into `TopBar`'s `right` slot).

```tsx
// src/mobile/UserMenu.tsx
import React, { useState } from "react";
import { ChevronDown, LogOut } from "lucide-react";
import { Avatar } from "../design-system/components";
import { FakeUser } from "../lib/fakeAuth";

interface UserMenuProps {
  user: FakeUser;
  onLogout: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: 2 }}
      >
        <Avatar name={user.name} size="xs" />
        <ChevronDown size={12} color="#fff" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 150ms ease" }} />
      </button>

      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 90 }} onClick={() => setOpen(false)} />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 8px)",
              right: 0,
              background: "#fff",
              borderRadius: "var(--radius-md)",
              boxShadow: "var(--shadow-md)",
              border: "1px solid var(--color-border)",
              minWidth: 150,
              zIndex: 100,
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "var(--color-ink)" }}>{user.name}</div>
              <div style={{ fontSize: 10, color: "var(--color-muted)", marginTop: 1 }}>{user.email}</div>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                width: "100%",
                padding: "10px 12px",
                border: "none",
                background: "none",
                color: "var(--color-hot)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <LogOut size={14} />
              登出
            </button>
          </div>
        </>
      )}
    </div>
  );
};
```

- [ ] **Step 2: Write the mobile LoginScreen**

```tsx
// src/mobile/LoginScreen.tsx
import React from "react";
import { LogIn, CalendarHeart } from "lucide-react";
import { Button } from "../design-system/components";

interface LoginScreenProps {
  onLogin: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, textAlign: "center", gap: 4 }}>
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "var(--radius-lg)",
          background: "var(--color-primary)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
        }}
      >
        <CalendarHeart size={26} />
      </div>
      <h2 style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 17, color: "var(--color-ink)", margin: 0 }}>
        主揪請先登入
      </h2>
      <p style={{ fontSize: 12, color: "var(--color-muted)", marginTop: 6, maxWidth: 280 }}>
        建立活動與管理「我揪的團」需要先登入。團員收到活動連結後不需要登入即可投票。
      </p>
      <p style={{ fontSize: 10, color: "var(--color-muted)", opacity: 0.75, marginBottom: 20 }}>
        （Demo 展示用，僅模擬登入畫面，不會真的呼叫 Google）
      </p>
      <Button variant="primary" size="md" fullWidth icon={<LogIn size={16} />} onClick={onLogin}>
        使用 Google 帳號登入
      </Button>
    </div>
  );
};
```

- [ ] **Step 3: Verify types compile**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/mobile/UserMenu.tsx src/mobile/LoginScreen.tsx
git commit -m "feat: add mobile fake-login screen and avatar/logout menu"
```

---

### Task 7: Mobile HostHome (建立活動 + 我揪的團)

**Files:**
- Create: `src/mobile/HostHome.tsx`

**Interfaces:**
- Consumes: `TopBar` from `./TopBar`, `UserMenu` from `./UserMenu` (Task 6), `VisitedEventItem` from `../lib/api`, `getLifecycleStatusFromSnapshot` from `../lib/eventStatus`, `Badge`/`Button` from `../design-system/components`, `cardStyle`/`SectionLabel` from `./mobileStyles`, `FakeUser` from `../lib/fakeAuth`.
- Produces: `<HostHome user={FakeUser} onLogout={() => void} events={VisitedEventItem[]} onCreateEvent={() => void} onSelectEvent={(id: string) => void} />` — consumed by Task 8's `MobileApp.tsx` change.

- [ ] **Step 1: Write the component**

```tsx
// src/mobile/HostHome.tsx
import React from "react";
import { PlusCircle } from "lucide-react";
import { TopBar } from "./TopBar";
import { UserMenu } from "./UserMenu";
import { VisitedEventItem } from "../lib/api";
import { getLifecycleStatusFromSnapshot } from "../lib/eventStatus";
import { Badge, Button } from "../design-system/components";
import { cardStyle, SectionLabel } from "./mobileStyles";
import { FakeUser } from "../lib/fakeAuth";

interface HostHomeProps {
  user: FakeUser;
  onLogout: () => void;
  events: VisitedEventItem[];
  onCreateEvent: () => void;
  onSelectEvent: (id: string) => void;
}

export const HostHome: React.FC<HostHomeProps> = ({ user, onLogout, events, onCreateEvent, onSelectEvent }) => {
  const hostedEvents = events.filter((e) => e.isHost);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      <TopBar title="揪甘心" right={<UserMenu user={user} onLogout={onLogout} />} />
      <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 14 }}>
        <div
          style={{
            background: "var(--color-ink)",
            color: "#fff",
            borderRadius: "var(--radius-card)",
            padding: 20,
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800 }}>成團後，讓 AI 幫忙決定去哪吃</div>
          <Button variant="secondary" fullWidth icon={<PlusCircle size={16} />} onClick={onCreateEvent}>
            建立活動
          </Button>
        </div>

        <div style={cardStyle}>
          <SectionLabel title="我揪的團" />
          {hostedEvents.length === 0 ? (
            <div style={{ textAlign: "center", padding: "18px 0", color: "var(--color-muted)", fontSize: 12 }}>
              目前尚無紀錄，點上方「建立活動」開始揪團吧！
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {hostedEvents.map((h) => {
                const lifecycle = getLifecycleStatusFromSnapshot(h);
                return (
                  <div
                    key={h.id}
                    onClick={() => onSelectEvent(h.id)}
                    style={{ padding: 12, borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "var(--color-ink)" }}>{h.title}</span>
                      <Badge variant="secondary" size="sm">主揪</Badge>
                      <Badge variant={lifecycle.sublabel === "尚未投完" ? "success" : lifecycle.sublabel === "已取消" ? "hot" : "muted"} size="sm">{lifecycle.label}</Badge>
                    </div>
                    <div style={{ fontSize: 10, color: "var(--color-muted)", marginTop: 4 }}>
                      上次查看：{new Date(h.updatedAt).toLocaleString("zh-TW", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify types compile**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/mobile/HostHome.tsx
git commit -m "feat: add mobile host home (create + my-hosted-events)"
```

---

### Task 8: Wire login gate + HostHome into `MobileApp.tsx` and `App.tsx`

**Files:**
- Modify: `src/mobile/MobileApp.tsx`
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `useFakeAuth`/`FakeUser` (Task 1, already wired into `App.tsx` by Task 5), `LoginScreen`/`HostHome` (Task 6/7).

- [ ] **Step 1: Add auth/homeView props to `MobileAppProps`**

In `src/mobile/MobileApp.tsx`, add to the imports (currently lines 1-8):

```tsx
import { FakeUser } from "../lib/fakeAuth";
import { LoginScreen } from "./LoginScreen";
import { HostHome } from "./HostHome";
```

Add to `MobileAppProps` (currently `src/mobile/MobileApp.tsx:10-34`), right after `pageError`:

```tsx
  user: FakeUser | null;
  onLogin: () => void;
  onLogout: () => void;
  homeView: "dashboard" | "create";
  onOpenCreate: () => void;
```

- [ ] **Step 2: Destructure the new props**

Update the component's destructured props (currently `src/mobile/MobileApp.tsx:36-60`) to include `user, onLogin, onLogout, homeView, onOpenCreate` alongside the existing ones.

- [ ] **Step 3: Branch the "no current event" render on login + homeView**

Replace the existing block (currently `src/mobile/MobileApp.tsx:96-98`):

```tsx
        {!isLoading && !pageError && !currentEventId && (
          !user ? (
            <LoginScreen onLogin={onLogin} />
          ) : homeView === "create" ? (
            <CreateWizard onSubmit={onCreateEvent} isLoading={isLoading} onOpenHistory={() => setIsHistoryOpen(true)} />
          ) : (
            <HostHome
              user={user}
              onLogout={onLogout}
              events={historyList}
              onCreateEvent={onOpenCreate}
              onSelectEvent={onSelectEvent}
            />
          )
        )}
```

Note `setIsHistoryOpen` here refers to the prop `setIsHistoryOpen` already destructured — no change needed to that prop.

- [ ] **Step 4: Pass the new props from `App.tsx`**

In `src/App.tsx`, update the `<MobileApp ... />` call (currently lines 253-281) to add:

```tsx
        user={user}
        onLogin={login}
        onLogout={logout}
        homeView={homeView}
        onOpenCreate={() => setHomeView("create")}
```

(insert alongside the other props, e.g. right after `pageError={pageError}`).

- [ ] **Step 5: Make sure going home from a mobile event screen also resets `homeView`**

`onGoHome={handleGoHome}` is already passed (`src/App.tsx:261`) and `handleGoHome` was updated in Task 5 Step 4 to reset `homeView` — no further change needed here, this step is just confirming it via the manual check below.

- [ ] **Step 6: Verify types compile**

Run: `npm run lint`
Expected: PASS.

- [ ] **Step 7: Manual check**

Resize the dev-server browser window to mobile width (or use devtools device toolbar), repeat the same 5 checks as Task 5 Step 7 (clear storage → login screen; log in → HostHome with avatar in TopBar; open avatar menu → logout; log in → create event → lands on event screen; open the event link in a private window → no login screen, can vote).

- [ ] **Step 8: Commit**

```bash
git add src/mobile/MobileApp.tsx src/App.tsx
git commit -m "feat: gate mobile host home behind fake login, add HostHome"
```

---

## Self-Review Notes

- **Spec coverage:** 2.1 (Google SSO — faked per user's explicit instruction, `README.md` updated separately), header avatar+logout (Task 2/6), "已定案採選項 B" home split (Task 4/7), Header as shared/persistent element (Task 5/8, still two separate components per tree per existing architecture) — covered. 2.2 (participant pages login-free) — covered by construction (gate only applies inside the `!currentEventId` branch). 2.3 (7-day auto-hide from creation) — covered by Task 1. 2.4/2.5 (soft-delete, nickname-per-event) — **out of scope for this plan**, no existing per-event "host nickname" concept to wire into fake auth; flag to the user if they want it folded in later.
- **Type consistency:** `FakeUser`, `useFakeAuth`, `VisitedEventItem.createdAt` are defined once (Task 1) and referenced identically (`user: FakeUser | null`, `onLogin: () => void`, `onLogout: () => void`) across `Header`, `UserMenu` ×2, `LoginScreen` ×2, `HostDashboard`/`HostHome`, `App.tsx`, `MobileApp.tsx`.
- **No placeholders:** every step above has complete, copy-pasteable code.
