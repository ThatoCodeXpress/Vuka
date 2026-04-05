# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains the Smart Dual-Verification Alarm System — a React Native (Expo) mobile app for Group 1 Mainstream assignment.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM (shared backend), SQLite (on-device via expo-sqlite)
- **Mobile**: React Native + Expo (~54)
- **AI**: TensorFlow.js + MobileNet (on-device object classification)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

- `artifacts/smart-alarm` — Smart Dual-Verification Alarm mobile app (Expo)
- `artifacts/api-server` — Shared Express API server
- `artifacts/mockup-sandbox` — UI mockup sandbox

## App Features (smart-alarm)

- **4 Tabs**: Alarms, History, Library, Settings
- **Dual-stage alarm**: Stage 1 (object photo) + Stage 2 (activity photo, 30 min later)
- **AI Verification**: TensorFlow.js MobileNet — real on-device inference, 75% confidence threshold
- **SQLite**: expo-sqlite for local data logging (alarm events, sleep scores)
- **Sleep Score Engine**: 0–100 score based on wake time compliance and attempts
- **Custom Libraries**: Add/remove objects and activities for verification
- **Strict Mode**: Disables dismissal until both stages complete
- **Randomised selection**: Anti-cheat random object/activity each morning

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Assignment Details (Assessment 1)

**Group 1 — Mainstream:**
- NDLOVU PS (222295963)
- NDARANE N (221733320)
- XAUKA T (221766989)
- MASHEGO TE (222263255)
- NETSHIFHEFHE Z (222609437)
- TOMPANE R (242249372)
