# SMX Viewer Copilot Instructions

This repository implements a browser-based viewer for StepManiaX edit charts.

Read docs/PROJECT_PLAN.md and docs/API_FINDINGS.md before making substantial changes.

## Tech stack

Use:

- Next.js
- React
- TypeScript
- HTML Canvas for the chart renderer
- HTMLAudioElement for audio playback

## Scope

Initial supported edit styles:

- single
- dual
- full

Team is intentionally out of scope for the MVP.

Do not add gameplay scoring or chart editing.

## Architecture

Keep external APIs isolated behind adapters.

Use:

- lib/smx573 for api.smx.573.no
- lib/smx for StepManiaX parsing, timing, layouts, and domain types

UI components must not depend directly on raw external API response shapes.

## Rendering

React handles controls and metadata.

Canvas handles:

- lanes
- receptors
- taps
- holds
- mines
- scrolling

Do not create one React component per note.

## Timing

Use audio.currentTime as the playback clock.

Support:

- BPM changes
- stops
- timing offsets
- delta-encoded fractional beats

Raw SMX beat values are fractions and may be relative to the previous note.

## Viewer settings

V1 should support:

- scroll speed
- flat / SMX perspective
- normal / reverse direction
- measure lines
- lane guides
- fullscreen
- playback speed
- global viewer sync calibration

Global calibration:

- stored locally
- browser/device specific
- default 0 ms
- does not modify chart data

## API safety

Do not invent undocumented endpoints.

Known public lookup flow:

1. Query api.smx.573.no by edit_display_id.
2. Use returned numeric chart id.
3. POST to https://data.stepmaniax.com/chart/{id}/view with apiVersion 6.

Do not require login for MVP.

## Code quality

Use strict TypeScript.

Avoid any except at untrusted API boundaries.

Add tests for:

- note parsing
- fractional beats
- timing conversion
- layout handling
