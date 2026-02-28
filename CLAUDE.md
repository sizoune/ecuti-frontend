# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

E-Cuti is a leave management system (Sistem Manajemen Cuti) for Kabupaten Tabalong. This is the frontend application that connects to a Laravel backend API.

## Commands

```bash
pnpm dev          # Start dev server on port 3000
pnpm build        # Production build (vite build)
pnpm test         # Run tests (vitest run)
pnpm check        # Biome lint + format check
pnpm lint         # Biome lint only
pnpm format       # Biome format only
```

Package manager is **pnpm** (not npm/yarn).

## Tech Stack

- **React 19** with **TypeScript** (strict mode)
- **TanStack Router** - file-based routing with auto code-splitting (`src/routes/`)
- **TanStack React Query v5** - server state management via custom hooks (`src/hooks/`)
- **shadcn/ui** + **Radix UI** - component library (`src/components/ui/`)
- **Tailwind CSS v4** with `@tailwindcss/vite` plugin
- **Vite 7** - bundler with `vite-tsconfig-paths`
- **Biome** - linter/formatter (tabs, double quotes)
- **Axios** - HTTP client with JWT interceptors
- **react-hook-form** + **zod** - form handling and validation

## Architecture

### Import Alias
`#/` maps to `src/` (configured in both `package.json` imports and `tsconfig.json` paths).

### Routing (`src/routes/`)
TanStack Router file-based routing. The route tree is auto-generated at `src/routeTree.gen.ts` (do not edit).

- `__root.tsx` - Root layout with QueryClientProvider and ThemeProvider
- `_authenticated.tsx` - Layout route: checks JWT in localStorage, renders sidebar + header + `<Outlet />`
- `_authenticated/` - All protected pages live here
- `login.tsx` - Public login page

### Auth (`src/lib/auth.tsx`)
React Context-based auth. JWT stored in `localStorage` as `access_token`, user object as `user`. The Axios instance (`src/lib/api.ts`) auto-attaches Bearer token and redirects to `/login` on 401.

### Roles
Four roles with hierarchical access: `Super Admin` > `Admin SKPD` > `Admin Uker` > `Pegawai`. Route-level guards use `beforeLoad` with `localStorage` checks. Sidebar visibility is role-filtered.

### Data Hooks (`src/hooks/`)
Each domain has a dedicated hook file wrapping TanStack Query:
- `use-cuti.ts` - Leave requests CRUD, balance, statistics
- `use-pegawai.ts` - Employee data
- `use-laporan.ts` - Reports (dashboard, monthly, recap, buku cuti)
- `use-master.ts` - Reference data (SKPD, subunit, jenis cuti, golongan, jabatan, eselon)
- `use-cuti-bersama.ts`, `use-cuti-kontrak.ts`, `use-kode-cuti.ts`, `use-manajemen-user.ts`

### Types (`src/types/index.ts`)
Single file with all TypeScript interfaces organized by domain (Auth, Pegawai, Cuti, Master Data, Laporan, etc.).

### Backend API
Base URL configured via `VITE_API_BASE_URL` env var. The backend returns numeric values as strings in some endpoints (e.g., laporan dashboard) — always coerce with `Number()` when doing arithmetic.

## Key Gotchas

- **Recharts is incompatible with React 19** — the project uses custom SVG chart components instead (see `DonutChart` in `laporan.tsx`).
- **Backend numeric strings** — API responses may return numbers as strings. Always use `Number()` coercion before arithmetic to avoid string concatenation bugs.
- **Route tree is auto-generated** — never edit `src/routeTree.gen.ts`. It regenerates from file structure in `src/routes/`.
- **Biome config** — uses tabs for indentation and double quotes for JS strings. The config excludes `routeTree.gen.ts` and `styles.css`.
