# SMX Viewer

## Goal

Build a browser-based viewer for StepManiaX edit charts.

Example input:

https://edits.stepmaniax.com/2P6-239

The user should be able to:

- view the chart
- hear synchronized audio
- seek
- pause
- change playback speed
- change scroll speed
- adjust viewer perspective
- apply global sync calibration

This is a viewer, not a simulator or editor.

## MVP support

Supported:

- Single
- Dual
- Full

Not supported initially:

- Team

Team charts can continue to be reviewed in the StepManiaX Link app.

## Data flow

Public edit display ID
→ 573 chart lookup
→ numeric chart ID
→ StepManiaX /chart/{id}/view
→ raw chart_data
→ normalized SMX chart
→ Canvas renderer

## Known example

Display ID:
2P6-239

573 result:

- id: 7435
- song_id: 593
- game_song_id: 1564
- style: single
- meter: 22
- author: Adrei

StepManiaX raw chart endpoint:

POST https://data.stepmaniax.com/chart/7435/view

Body:

{
"apiVersion": 6
}

This returns:

- chart
- song
- gamer
- chart_data

No authentication was required in testing.

## Milestones

1. Create 573 API client
2. Resolve display ID to chart metadata
3. Fetch raw StepManiaX chart
4. Define normalized chart model
5. Parse noteData
6. Build static Canvas renderer
7. Add audio playback
8. Sync chart movement to audio.currentTime
9. Add Single
10. Add Dual
11. Add Full
12. Add viewer settings
13. Add paste-link homepage
14. Add shareable /edit/[displayId] route
15. Polish UI
