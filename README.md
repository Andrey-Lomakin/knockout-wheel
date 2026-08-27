# Knockout Wheel

A random **elimination wheel** for streams: add participants, spin, and knock them out one by one until the last one stands.

## Features

- 🎡 **Weighted canvas wheel** — segments sized proportionally to each participant's weight (×1 / ×2).
- 🔥 **Knockout rounds** — spin to knock a participant out; keeps going until a single winner remains.
- 🏅 **Medals in the list** — 1st/2nd/3rd place shown right in the participant list (🥇🥈🥉).
- ✋/🙈 **Manual toggle** — decide who takes part in the wheel for this round.
- ⏱️ **Spin duration** — 3 / 5 / 7 / 13 seconds.
- 🎉 **Confetti** — on podium places (canvas-confetti).
- 🎬 **Meme overlays** — a random looping meme plays in the center button while spinning; final winner gets a meme too.
- 🔗 **Share by link** — `?users=...` replaces the roster for anyone opening it.
- 💾 **localStorage** — only the participant list persists; round results are per-session.
- 🎵 **Yandex Music player** — embed any track by its link (`music.yandex.ru/album/.../track/...`).

## Stack

- Vite + React 19 + TypeScript
- Canvas rendering + `requestAnimationFrame`
- canvas-confetti
- vitest (unit tests) for the pure game/model logic

## Getting started

```bash
pnpm install
pnpm dev      # http://localhost:5173
pnpm build    # tsc -b && vite build
pnpm lint     # eslint . --max-warnings 0
pnpm test     # vitest run
```

> pnpm 11: the esbuild install policy and `verifyDepsBeforeRun: false` live in `pnpm-workspace.yaml`.

## Architecture

The logic is split into clean, testable layers:

- `src/game/` — domain state, storage and pure elimination model (`model.ts`).
- `src/hooks/` — reusable hooks (`useLatest`, `useWheelAnimation`, `useMemes`, `useMusicPlayer`).
- `src/wheel/` — pure wheel geometry/drawing + canvas component (`wheelModel`, `wheelDraw`, `Wheel`).
- `src/participants/` — roster components.
- `src/music/` — Yandex Music player components + hook.
- `src/lib/` — pure helpers (share, memes, confetti, yandexMusic).

Unit tests live next to the pure logic (`*.test.ts`).