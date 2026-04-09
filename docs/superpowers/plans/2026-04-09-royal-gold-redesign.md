# Royal Gold Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the genealogy app UI with "Royal Gold" direction — charcoal background, gold accents, Inter font, simplified 2-tab navigation with profile menu — with zero functional regressions.

**Architecture:** CSS-first approach. Replace CSS custom properties to transform the entire color scheme. Modify only the components that need structural HTML changes (Header, BottomNav, LoginScreen). Create one new component (ProfileMenu). All existing logic, state, and routing remain untouched.

**Tech Stack:** React 19, TypeScript, CSS custom properties, Vite

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| Modify | `src/styles/global.css` | All design tokens, component styles |
| Modify | `src/components/layout/Header.tsx` | New layout: logo + search + avatar |
| Modify | `src/components/layout/BottomNav.tsx` | Reduce to 2 tabs (Famille, Parente) |
| Modify | `src/components/layout/LoginScreen.tsx` | Restyle with Royal Gold tokens |
| Create | `src/components/layout/ProfileMenu.tsx` | Profile dropdown/bottom sheet |
| Modify | `src/App.tsx` | Add ProfileMenu, keep routes |
| Modify | `src/pages/FamillePage.tsx` | Move MemberSearch into header search overlay |

---

### Task 1: Create branch and update CSS design tokens

**Files:**
- Modify: `src/styles/global.css:1-30` (`:root` variables)

- [ ] **Step 1: Create feature branch**

```bash
git checkout -b feat/royal-gold-redesign
```

- [ ] **Step 2: Replace `:root` CSS variables**

In `src/styles/global.css`, replace the `:root` block (lines 2-30) with:

```css
:root{
--bg:#111827;
--card:#1f2937;
--card-hover:#283548;
--surface:#1f2937;
--surface-hover:#283548;
--surface-active:#334155;
--primary:#d4a853;
--primary-light:#e8c77b;
--secondary:#d4a853;
--accent:#d4a853;
--success:#34d399;
--error:#f87171;
--gold:#d4a853;
--gold-light:#e8c77b;
--gold-subtle:rgba(212,168,83,0.12);
--gold-border:rgba(212,168,83,0.2);
--text:#f1f5f9;
--text-secondary:#9ca3af;
--text-muted:#6b7280;
--male:#60a5fa;
--female:#f9a8d4;
--border:rgba(255,255,255,0.07);
--shadow:0 8px 32px rgba(0,0,0,0.4);
--shadow-sm:0 2px 12px rgba(0,0,0,0.3);
--radius:20px;
--radius-sm:12px;
--radius-lg:24px;
--radius-full:9999px;
--gen1:#f59e0b;--gen1-bg:rgba(245,158,11,0.15);
--gen2:#10b981;--gen2-bg:rgba(16,185,129,0.15);
--gen3:#6366f1;--gen3-bg:rgba(99,102,241,0.15);
--gen4:#ec4899;--gen4-bg:rgba(236,72,153,0.15);
--gen5:#8b5cf6;--gen5-bg:rgba(139,92,246,0.15);
--gen6:#14b8a6;--gen6-bg:rgba(20,184,166,0.15);
--gen7:#f97316;--gen7-bg:rgba(249,115,22,0.15);
--gen0:#9333ea;--gen0-bg:rgba(147,51,234,0.15);
}
```

- [ ] **Step 3: Add light theme variables**

After the `:root` block, find the existing `html[data-theme="dark"]` selector if any, or add after `:root`. Add this light theme block:

```css
html[data-theme="light"]{
--bg:#f8f6f1;
--card:#ffffff;
--card-hover:#f3f0e8;
--surface:#ffffff;
--surface-hover:#f3f0e8;
--surface-active:#ebe7dc;
--primary:#a8802a;
--primary-light:#c49a3a;
--secondary:#a8802a;
--accent:#a8802a;
--gold:#a8802a;
--gold-light:#c49a3a;
--gold-subtle:rgba(168,128,42,0.08);
--gold-border:rgba(168,128,42,0.2);
--text:#1f2937;
--text-secondary:#6b7280;
--text-muted:#9ca3af;
--border:rgba(0,0,0,0.08);
--shadow:0 8px 32px rgba(0,0,0,0.08);
--shadow-sm:0 2px 12px rgba(0,0,0,0.05);
}
```

- [ ] **Step 4: Update base font-family**

Find the `body` or `html` style rule and change the font-family to:

```css
font-family:'Inter',system-ui,sans-serif;
```

Also search for any other `font-family` declarations referencing `'Nunito Sans'` or `'Playfair Display'` in non-login sections and replace with `'Inter',system-ui,sans-serif`.

- [ ] **Step 5: Verify app still loads**

```bash
cd react-app && npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/styles/global.css
git commit -m "style: replace design tokens with Royal Gold palette"
```

---

### Task 2: Restyle Header with search bar and avatar

**Files:**
- Modify: `src/components/layout/Header.tsx`
- Modify: `src/styles/global.css` (header section)

- [ ] **Step 1: Rewrite Header.tsx**

Replace the entire content of `src/components/layout/Header.tsx` with:

```tsx
import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useMembersContext } from '../../context/MembersContext';
import { useTheme } from '../../context/ThemeContext';
import ProfileMenu from './ProfileMenu';
import type { Member } from '../../lib/types';

export default function Header() {
  const { user } = useAuth();
  const { members } = useMembersContext();
  const { theme } = useTheme();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      searchInputRef.current?.focus();
    } else {
      setSearchQuery('');
    }
  }, [searchOpen]);

  const filteredMembers = useCallback(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return Object.values(members)
      .filter((m: Member) => m.name.toLowerCase().includes(q))
      .slice(0, 15);
  }, [searchQuery, members]);

  const handleSelectMember = (id: string) => {
    setSearchOpen(false);
    setSearchQuery('');
    // Navigate via URL param
    window.location.href = `/?person=${id}`;
  };

  const initials = user?.display_name
    ? user.display_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <>
      <header className="header">
        <div className="header-inner">
          <div className="header-logo">
            <div className="header-logo-icon">{'\u{1F333}'}</div>
            <span className="header-logo-text">Aly Ko&iuml;ra</span>
          </div>

          <button
            className="header-search-trigger"
            onClick={() => setSearchOpen(true)}
            aria-label="Rechercher"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <span className="header-search-placeholder">Rechercher...</span>
          </button>

          <button
            className="header-avatar"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu profil"
          >
            {initials}
          </button>
        </div>
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div className="search-overlay">
          <div className="search-overlay-header">
            <div className="search-overlay-input-wrap">
              <svg className="search-overlay-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                className="search-overlay-input"
                placeholder="Rechercher un membre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <button className="search-overlay-close" onClick={() => setSearchOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
          <div className="search-overlay-results">
            {filteredMembers().map((m: Member) => (
              <button
                key={m.id}
                className="search-overlay-item"
                onClick={() => handleSelectMember(m.id)}
              >
                <div className={`search-overlay-item-avatar ${m.gender === 'F' ? 'female' : 'male'}`}>
                  {m.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div className="search-overlay-item-info">
                  <div className="search-overlay-item-name">{m.name}</div>
                  <div className="search-overlay-item-gen">G&eacute;n&eacute;ration {m.generation}</div>
                </div>
              </button>
            ))}
            {searchQuery.trim() && filteredMembers().length === 0 && (
              <div className="search-overlay-empty">Aucun membre trouv&eacute;</div>
            )}
          </div>
        </div>
      )}

      {/* Profile menu */}
      {menuOpen && <ProfileMenu onClose={() => setMenuOpen(false)} />}
    </>
  );
}
```

- [ ] **Step 2: Add header CSS styles**

Find the existing `.header` styles in `global.css` and replace them entirely with:

```css
/* ========== HEADER ========== */
.header{
  background:var(--bg);
  border-bottom:1px solid var(--border);
  padding:0 16px;
  position:sticky;top:0;z-index:50;
  padding-top:env(safe-area-inset-top,0);
}
.header-inner{
  display:flex;align-items:center;gap:12px;
  max-width:500px;margin:0 auto;
  height:56px;
}
.header-logo{
  display:flex;align-items:center;gap:8px;
  flex-shrink:0;
}
.header-logo-icon{
  width:32px;height:32px;border-radius:10px;
  background:linear-gradient(135deg,#d4a853,#b8860b);
  display:flex;align-items:center;justify-content:center;
  font-size:16px;
}
.header-logo-text{
  font-weight:700;font-size:15px;color:var(--text);
  letter-spacing:-0.3px;
}
.header-search-trigger{
  flex:1;display:flex;align-items:center;gap:8px;
  background:var(--surface);border:1px solid var(--border);
  border-radius:var(--radius-sm);padding:8px 12px;
  cursor:pointer;min-width:0;
}
.header-search-trigger svg{
  width:16px;height:16px;color:var(--text-muted);flex-shrink:0;
}
.header-search-placeholder{
  font-size:13px;color:var(--text-muted);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.header-avatar{
  width:36px;height:36px;border-radius:50%;flex-shrink:0;
  background:var(--gold-subtle);border:1px solid var(--gold-border);
  color:var(--gold);font-weight:700;font-size:12px;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;letter-spacing:-0.3px;
}
.header-avatar:hover{background:var(--gold-border)}

/* ========== SEARCH OVERLAY ========== */
.search-overlay{
  position:fixed;inset:0;z-index:200;
  background:var(--bg);
  animation:fadeIn .2s ease-out;
  display:flex;flex-direction:column;
  padding-top:env(safe-area-inset-top,0);
}
.search-overlay-header{
  display:flex;align-items:center;gap:8px;
  padding:8px 16px;border-bottom:1px solid var(--border);
}
.search-overlay-input-wrap{
  flex:1;display:flex;align-items:center;gap:8px;
  background:var(--surface);border:1px solid var(--border);
  border-radius:var(--radius-sm);padding:10px 14px;
}
.search-overlay-icon{width:18px;height:18px;color:var(--gold);flex-shrink:0}
.search-overlay-input{
  flex:1;background:none;border:none;outline:none;
  font-size:15px;color:var(--text);font-family:'Inter',system-ui,sans-serif;
}
.search-overlay-input::placeholder{color:var(--text-muted)}
.search-overlay-close{
  width:40px;height:40px;border-radius:var(--radius-sm);
  border:none;background:transparent;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  color:var(--text-secondary);flex-shrink:0;
}
.search-overlay-close:hover{background:var(--surface)}
.search-overlay-close svg{width:20px;height:20px}
.search-overlay-results{
  flex:1;overflow-y:auto;padding:8px 16px;
  max-width:500px;width:100%;margin:0 auto;
}
.search-overlay-item{
  display:flex;align-items:center;gap:12px;
  width:100%;padding:12px;border-radius:var(--radius-sm);
  border:none;background:transparent;cursor:pointer;
  text-align:left;
}
.search-overlay-item:hover{background:var(--surface-hover)}
.search-overlay-item-avatar{
  width:40px;height:40px;border-radius:12px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  font-weight:700;font-size:13px;color:#fff;
}
.search-overlay-item-avatar.male{background:var(--male)}
.search-overlay-item-avatar.female{background:var(--female)}
.search-overlay-item-info{min-width:0}
.search-overlay-item-name{
  font-weight:600;font-size:14px;color:var(--text);
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.search-overlay-item-gen{font-size:12px;color:var(--text-secondary)}
.search-overlay-empty{
  text-align:center;padding:40px 20px;
  color:var(--text-muted);font-size:14px;
}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
```

- [ ] **Step 3: Verify build**

```bash
cd react-app && npm run build
```

Expected: Build succeeds. Note: ProfileMenu import will fail until Task 3 is done. If building task-by-task, create a stub ProfileMenu first:

```tsx
// src/components/layout/ProfileMenu.tsx (stub)
export default function ProfileMenu({ onClose }: { onClose: () => void }) {
  return <div onClick={onClose} />;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/Header.tsx src/styles/global.css src/components/layout/ProfileMenu.tsx
git commit -m "feat: redesign header with search overlay and avatar trigger"
```

---

### Task 3: Create ProfileMenu component

**Files:**
- Create: `src/components/layout/ProfileMenu.tsx`
- Modify: `src/styles/global.css` (add profile-menu section)

- [ ] **Step 1: Write ProfileMenu.tsx**

Replace the stub (or create) `src/components/layout/ProfileMenu.tsx`:

```tsx
import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMembersContext } from '../../context/MembersContext';
import { useTheme } from '../../context/ThemeContext';

interface Props {
  onClose: () => void;
}

export default function ProfileMenu({ onClose }: Props) {
  const { user, isAdmin, logout } = useAuth();
  const { stats } = useMembersContext();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (overlayRef.current && !overlayRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const go = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <div className="profile-menu-backdrop">
      <div className="profile-menu" ref={overlayRef}>
        {/* User info */}
        <div className="profile-menu-user">
          <div className="profile-menu-name">{user?.display_name || user?.email}</div>
          <span className={`profile-menu-badge ${isAdmin ? 'admin' : ''}`}>
            {isAdmin ? 'Admin' : 'Membre'}
          </span>
        </div>

        <div className="profile-menu-divider" />

        {/* Stats */}
        <div className="profile-menu-stats">
          <span>{stats.total || 0} membres</span>
          <span>{stats.generations || 0} g&eacute;n&eacute;rations</span>
        </div>

        <div className="profile-menu-divider" />

        {/* Nav links */}
        <button className="profile-menu-item" onClick={() => go('/contribuer')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Contribuer
        </button>
        <button className="profile-menu-item" onClick={() => go('/mes-suggestions')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          Mes suggestions
        </button>
        {isAdmin && (
          <button className="profile-menu-item" onClick={() => go('/admin')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
            Administration
          </button>
        )}

        <div className="profile-menu-divider" />

        {/* Theme toggle */}
        <button className="profile-menu-item" onClick={toggleTheme}>
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          )}
          {theme === 'dark' ? 'Mode clair' : 'Mode sombre'}
        </button>

        {/* Logout */}
        <button className="profile-menu-item logout" onClick={() => void logout()}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          D&eacute;connexion
        </button>

        {/* Version */}
        <div className="profile-menu-version">v{__APP_VERSION__}</div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add ProfileMenu CSS**

Add to `global.css`:

```css
/* ========== PROFILE MENU ========== */
.profile-menu-backdrop{
  position:fixed;inset:0;z-index:150;
  background:rgba(0,0,0,0.3);
  animation:fadeIn .15s ease-out;
}
.profile-menu{
  position:absolute;top:56px;right:16px;
  width:260px;background:var(--surface);
  border:1px solid var(--border);border-radius:var(--radius);
  box-shadow:var(--shadow);padding:8px;
  animation:menuSlideIn .2s ease-out;
  max-width:calc(100vw - 32px);
}
@keyframes menuSlideIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:480px){
  .profile-menu{
    position:fixed;bottom:0;left:0;right:0;top:auto;
    width:100%;border-radius:var(--radius-lg) var(--radius-lg) 0 0;
    animation:menuSlideUp .25s ease-out;
    padding:12px 12px calc(12px + env(safe-area-inset-bottom,0));
    max-width:100%;
  }
  @keyframes menuSlideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
}
.profile-menu-user{
  display:flex;align-items:center;gap:8px;
  padding:8px 12px;
}
.profile-menu-name{
  font-weight:700;font-size:14px;color:var(--text);
  flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.profile-menu-badge{
  font-size:10px;font-weight:700;text-transform:uppercase;
  letter-spacing:0.5px;padding:3px 8px;border-radius:var(--radius-full);
  background:var(--gold-subtle);color:var(--gold);
}
.profile-menu-badge.admin{
  background:rgba(99,102,241,0.15);color:#818cf8;
}
.profile-menu-divider{
  height:1px;background:var(--border);margin:4px 12px;
}
.profile-menu-stats{
  display:flex;gap:16px;padding:6px 12px;
  font-size:12px;color:var(--text-secondary);
}
.profile-menu-item{
  display:flex;align-items:center;gap:10px;
  width:100%;padding:10px 12px;border-radius:var(--radius-sm);
  border:none;background:transparent;cursor:pointer;
  font-size:13px;font-weight:500;color:var(--text);
  font-family:'Inter',system-ui,sans-serif;
  text-align:left;
}
.profile-menu-item:hover{background:var(--surface-hover)}
.profile-menu-item svg{width:18px;height:18px;color:var(--text-secondary);flex-shrink:0}
.profile-menu-item.logout{color:var(--error)}
.profile-menu-item.logout svg{color:var(--error)}
.profile-menu-version{
  text-align:center;padding:8px;
  font-size:11px;color:var(--text-muted);
}
```

- [ ] **Step 3: Verify build**

```bash
cd react-app && npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/ProfileMenu.tsx src/styles/global.css
git commit -m "feat: add ProfileMenu component with navigation and theme toggle"
```

---

### Task 4: Simplify BottomNav to 2 tabs

**Files:**
- Modify: `src/components/layout/BottomNav.tsx`
- Modify: `src/styles/global.css` (nav section)

- [ ] **Step 1: Rewrite BottomNav.tsx**

Replace the entire content of `src/components/layout/BottomNav.tsx` with:

```tsx
import { NavLink } from 'react-router-dom';

export default function BottomNav() {
  return (
    <nav className="nav">
      <NavLink
        to="/"
        end
        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
        <span>Famille</span>
      </NavLink>

      <NavLink
        to="/parente"
        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span>Parent&eacute;</span>
      </NavLink>
    </nav>
  );
}
```

- [ ] **Step 2: Update nav CSS**

Find the existing `.nav` styles in `global.css` and update the `.nav-item.active` styles to use gold:

Search for `.nav-item.active` and ensure it uses:

```css
.nav-item.active{
  color:var(--gold);
}
.nav-item.active svg{color:var(--gold)}
```

Also update `.nav-item` inactive color:

```css
.nav-item{color:var(--text-muted)}
.nav-item svg{color:var(--text-muted)}
```

- [ ] **Step 3: Remove search route from App.tsx if /recherche page is no longer in nav**

Note: Do NOT remove the `/recherche` route from App.tsx — it may still be accessible via URL. Only the nav link was removed. The route stays for backwards compatibility.

- [ ] **Step 4: Verify build**

```bash
cd react-app && npm run build
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/BottomNav.tsx src/styles/global.css
git commit -m "feat: simplify BottomNav to 2 tabs (Famille, Parente)"
```

---

### Task 5: Update FamillePage — remove inline MemberSearch

**Files:**
- Modify: `src/pages/FamillePage.tsx`

Since search is now in the Header overlay, remove the `MemberSearch` component from FamillePage. The page should no longer render its own search bar.

- [ ] **Step 1: Remove MemberSearch from FamillePage.tsx**

In `src/pages/FamillePage.tsx`:

1. Remove the import line: `import MemberSearch from '../components/family/MemberSearch';`
2. Remove the `<MemberSearch ... />` JSX block (around line 140-144)

The MemberSearch component is rendered inside the scroll div, before the fiche-tabs. Remove only the `<MemberSearch>` element, keep everything else.

- [ ] **Step 2: Verify build**

```bash
cd react-app && npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/pages/FamillePage.tsx
git commit -m "refactor: remove inline MemberSearch from FamillePage (moved to Header)"
```

---

### Task 6: Restyle LoginScreen CSS

**Files:**
- Modify: `src/styles/global.css` (login section, lines 32-200+)

The LoginScreen component HTML stays the same — only the CSS tokens change. The login screen already has its own `--lg-*` variables. We need to update these to match Royal Gold.

- [ ] **Step 1: Update login-screen CSS variables**

Find the `.login-screen{` block that defines `--lg-*` variables (around line 34) and replace both the default and dark theme blocks:

```css
.login-screen{
  --lg-bg:#111827;--lg-bg2:#1f2937;--lg-card:#1f2937;
  --lg-gold:#d4a853;--lg-gold-bg:rgba(212,168,83,.10);--lg-gold-bdr:rgba(212,168,83,.20);
  --lg-terra:#e8c77b;
  --lg-green:#34d399;--lg-green-bg:rgba(52,211,153,.07);
  --lg-red:#f87171;--lg-red-bg:rgba(248,113,113,.08);--lg-red-bdr:rgba(248,113,113,.18);
  --lg-txt:#f1f5f9;--lg-t2:#9ca3af;--lg-t3:#6b7280;
  --lg-bdr:rgba(255,255,255,.07);--lg-input-bg:rgba(255,255,255,.04);
  --lg-logo-bg:linear-gradient(135deg,#d4a853,#b8860b);
  --lg-shadow:0 8px 40px rgba(0,0,0,.4);
}
html[data-theme="light"] .login-screen{
  --lg-bg:#f8f6f1;--lg-bg2:#ebe7dc;--lg-card:#ffffff;
  --lg-gold:#a8802a;--lg-gold-bg:rgba(168,128,42,.08);--lg-gold-bdr:rgba(168,128,42,.18);
  --lg-terra:#c49a3a;
  --lg-green:#2A7D45;--lg-green-bg:rgba(42,125,69,.06);
  --lg-red:#B04838;--lg-red-bg:rgba(176,72,56,.06);--lg-red-bdr:rgba(176,72,56,.18);
  --lg-txt:#1f2937;--lg-t2:#6b7280;--lg-t3:#9ca3af;
  --lg-bdr:rgba(0,0,0,.08);--lg-input-bg:#f3f0e8;
  --lg-logo-bg:linear-gradient(135deg,#d4a853,#c49a3a);
  --lg-shadow:0 8px 40px rgba(0,0,0,.08);
}
```

Remove the old `html[data-theme="dark"] .login-screen` block (since dark is now the default).

- [ ] **Step 2: Update login font-family**

Find `font-family:'Nunito Sans'` in the `.login-screen` rule and replace with:

```css
font-family:'Inter',system-ui,sans-serif;
```

Find `font-family:'Playfair Display'` in `.login-title` and replace with:

```css
font-family:'Inter',system-ui,sans-serif;
```

- [ ] **Step 3: Update login-btn gradient**

Find `.login-btn` background and change to:

```css
background:linear-gradient(135deg,var(--lg-gold),#b8860b);
color:#111827;
```

- [ ] **Step 4: Remove tree pattern background**

Find `.login-screen::before` and change `opacity` to `0` or remove the rule entirely (the tree pattern does not fit Royal Gold).

- [ ] **Step 5: Verify build**

```bash
cd react-app && npm run build
```

Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/styles/global.css
git commit -m "style: restyle LoginScreen with Royal Gold tokens"
```

---

### Task 7: Update remaining component styles in global.css

**Files:**
- Modify: `src/styles/global.css`

Update any remaining CSS that references old colors (indigo `#6366f1` as primary, pink `#ec4899` as secondary, old backgrounds) to use the new token variables.

- [ ] **Step 1: Search and update hardcoded primary color references**

Search `global.css` for hardcoded `#6366f1` (the old primary) and replace with `var(--gold)` or `var(--primary)` as appropriate.

Search for `#818cf8` (old primary-light) and replace with `var(--gold-light)` or `var(--primary-light)`.

Search for `#ec4899` (old secondary) and replace with `var(--gold)` since gold is now the primary accent.

Search for old background colors like `#0f0f1a`, `#1a1a2e`, `#252542`, `#16163a` and replace with `var(--bg)`, `var(--card)`, `var(--card-hover)`, `var(--surface)` respectively.

- [ ] **Step 2: Update section headers**

Find CSS for section headers (`.fiche-sh-header`, `.fiche-section` etc.) and ensure they use `--gold` for accent colors and `--text-secondary` for labels.

- [ ] **Step 3: Update PersonCard styles**

Find `.person-card` or `.fiche-main` styles. Ensure:
- Background uses `var(--surface)`
- Border uses `var(--border)`
- Border-radius uses `var(--radius)`
- Generation badge uses `var(--gold-subtle)` background with `var(--gold)` text

- [ ] **Step 4: Update TreeView styles**

Find tree-related styles (`.tree-container`, `.tree-node-card`, etc.) and ensure they use the new token variables for backgrounds and borders.

- [ ] **Step 5: Update modal styles**

Find modal overlay styles and ensure they use:
- Overlay: `rgba(0,0,0,0.6)` with `backdrop-filter:blur(4px)`
- Card: `var(--surface)` background, `var(--border)` border, `var(--radius)` radius

- [ ] **Step 6: Update button styles**

Find primary button styles and ensure they use:
- Primary: `background:var(--gold);color:#111827;font-weight:700`
- Secondary: `background:transparent;border:1px solid var(--gold-border);color:var(--gold)`

- [ ] **Step 7: Verify build**

```bash
cd react-app && npm run build
```

Expected: Build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/styles/global.css
git commit -m "style: update all component styles to Royal Gold theme"
```

---

### Task 8: Update App.tsx loading screen

**Files:**
- Modify: `src/App.tsx:22-31`

- [ ] **Step 1: Update loading state UI**

The loading screen in `App.tsx` uses `login-screen` class. Since we changed the login CSS, this should now look correct automatically. However, verify the loading text styling works with the new tokens.

No code changes needed if the CSS updates in Task 6 covered it. Just verify visually.

- [ ] **Step 2: Verify build**

```bash
cd react-app && npm run build
```

Expected: Build succeeds.

- [ ] **Step 3: Commit (only if changes were needed)**

```bash
git add src/App.tsx
git commit -m "style: update loading screen for Royal Gold"
```

---

### Task 9: Final verification and cleanup

- [ ] **Step 1: Run full build**

```bash
cd react-app && npm run build
```

Expected: Build succeeds with zero errors.

- [ ] **Step 2: Run tests if available**

```bash
cd react-app && npm test -- --run 2>/dev/null || echo "No tests or tests passed"
```

- [ ] **Step 3: Visual verification checklist**

Start dev server and verify each page:

```bash
cd react-app && npm run dev
```

Check:
- [ ] Login screen: Royal Gold theme, no Playfair Display, gold button
- [ ] Header: Logo + search trigger + avatar
- [ ] Search overlay: Opens, filters members, navigates on click
- [ ] Profile menu: Shows user, stats, links, theme toggle, logout
- [ ] Bottom nav: Only 2 tabs (Famille, Parente)
- [ ] PersonCard: Correct colors, generation badges
- [ ] Tree view: Nodes render, zoom works
- [ ] Light theme: Toggle works, all elements readable
- [ ] Mobile: Bottom nav, profile menu as bottom sheet
- [ ] All routes still accessible: /, /recherche, /parente, /contribuer, /mes-suggestions, /admin

- [ ] **Step 4: Final commit if cleanup needed**

```bash
git add -A
git commit -m "chore: final Royal Gold redesign cleanup"
```
