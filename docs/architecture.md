# Celjoe Store — Foundation Architecture (Phase 6)

## Goals

- Preserve the approved UI and interaction design.
- Establish a scalable, CMS-driven, mobile-first architecture that can support future customer, admin, CMS, kitchen, multi-branch, mobile apps, loyalty, and API expansion without redesign.
- Keep the codebase buildable at every milestone.

## Folder Architecture

- `app/` — Next.js App Router routes, metadata, and route-level composition.
- `components/` — Presentational and feature UI components.
- `components/primitives/` — Low-level layout primitives intended for future reuse.
- `config/` — Centralized runtime configuration and design-system constants.
- `lib/` — Shared utilities and cross-feature modules.
- `lib/supabase/` — Database access layer (queries/mutations + mapping).
- `providers/` — Global providers composed once in `app/layout.tsx`.
- `styles/` — Design token and theme foundations (CSS variables).
- `supabase/` — SQL migrations and Supabase project artifacts.

## Design Tokens

- Tokens are defined as CSS variables in `styles/tokens.css`.
- Themes override token variables in `styles/themes.css`.
- Tokens are imported once in `app/globals.css`.

## Theme Foundation

- Theme is controlled by `document.documentElement.dataset.theme`.
- `providers/theme-provider.tsx` persists the theme name in `localStorage`.
- Default theme is `celjoe` and does not change any existing UI.

## State Management

- Current cart uses a single provider with optimistic UI updates (`useOptimistic`).
- Provider composition is centralized in `providers/app-providers.tsx`.
- Future state should remain feature-scoped first; global stores should be introduced only when cross-feature coordination is required.

## Data Layer

- `lib/supabase/*` remains the canonical DB access layer.
- `config/env.ts` centralizes environment key resolution and required values.
- The recommended direction is to keep:
  - DB access (Supabase queries)
  - Mapping (DB rows → domain types)
  - Business logic (pricing rules, order rules)
  separated and testable.

## Authentication + Permissions (Foundation)

- Roles and permissions are declared in `lib/auth/*` as a future-ready foundation.
- No role UI is implemented in this phase.

