# QueueBeats — PRD

## Problem Statement (Original)
QueueBeats ist eine Web-App für Music Crowd / Party Queue Systeme. Host (Admin) erstellt eine Party, Gäste scannen einen QR-Code und können via YouTube Music Titel suchen und zur Queue hinzufügen. Backend: Python FastAPI + SQLite. Frontend: React (CRA). Streaming: `ytmusicapi` (unauthenticated) + YouTube IFrame Player API.

## User Personas
- **Host**: DJ/Party-Veranstalter, verwaltet Partys, spielt Musik ab (Desktop-first).
- **Gast**: Party-Teilnehmer, wirft Songs in die Queue via Mobile (Mobile-first).

## Core Requirements
- Admin-Auth via `ADMIN_PASSWORD` (Default: ADMIN)
- Party-Erstellung mit eindeutigen IDs
- QR-Code-Generierung für Gäste-Zugang
- YouTube Music Search (`ytmusicapi`, unauthenticated)
- Queue-Management mit Normal/Priorität
- YouTube IFrame Player mit Auto-Advance (ENDED-Event)
- Play/Pause/Skip Controls
- Live-Warteschlange Sync

## Architecture (What's Been Implemented — 2026-08-19)
- Backend: FastAPI + aiosqlite, SQLite DB in `queuebeats.db`
- API: `/api/admin/login`, `/api/admin/verify`, `/api/search`, `/api/parties` (CRUD), `/api/parties/:id/queue` (add/list/next/delete)
- Auth: Bearer-Token (in-memory session store)
- Frontend Routes:
  - `/` — Landing
  - `/admin` — Host Login
  - `/admin/dashboard` — Party-Übersicht + QR-Codes
  - `/admin/party/:id` — Host Player mit Split-Screen Queue
  - `/party/:id` — Guest Join
  - `/party/:id/room` — Guest Search + Queue
- Design: Modern Minimal (Off-white bg, Obsidian primary, Electric Red accent), Outfit/Plus Jakarta Sans

## Prioritized Backlog
- P1: Voting/Likes für Queue-Songs
- P1: Skip-Voting durch Gäste
- P2: Party-Historie / Statistiken
- P2: Song-Duplikat-Erkennung
- P2: Volume / Playback-Speed Controls
- P2: Multi-Host Kollaboration
