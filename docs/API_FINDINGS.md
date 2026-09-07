# API Findings

## 573 API

Base:
https://api.smx.573.no

Known endpoint:
GET /charts?q={...}

Example:

{
"edit_display_id": "2P6-239"
}

Known result:

{
"\_id": 7435,
"id": 7435,
"edit_display_id": "2P6-239",
"edit_author": "Adrei",
"edit_style": "single",
"meter": 22,
"song_id": 593,
"game_song_id": 1564,
"is_edit": true
}

The API indexes:

- single
- full
- dual

Team is not present in the normal indexed edit dataset.

## StepManiaX data API

Base:
https://data.stepmaniax.com

Known raw chart endpoint:

POST /chart/{id}/view

Body:

{
"apiVersion": 6
}

Tested with:
7435

Returned:

- success = true
- chart
- song
- gamer
- chart_data

No authentication required for the tested published edit.

## Raw chart format

chart_data contains:

{
"tracks": 5,
"noteData": [...]
}

First noteData object is:

{
"version": 1
}

Subsequent notes include:

{
"track": 0,
"beat": [1, 4],
"time": 118
}

beat is a fractional delta from the previous note.

Simultaneous notes may use:

{
"beat": [0, 1]
}

Holds include:

{
"len": [2, 1],
"slen": 950
}

## Live timing metadata

The documented raw chart endpoint was checked against published charts using
the same `POST /chart/{id}/view` request with `{"apiVersion": 6}`.

Chart `81J-QJQ` (chart id `31710`, `Energizer`) returned:

```text
timing_bpms = "0=303,242.5=295,247=204,249=180.5,250.5=134,252=75.75,267=75.928,268=303"
timing_stops = ""
timing_offset_ms = 0
```

Chart `4Z6-7J4` (chart id `31372`, `Monolith`) returned:

```text
timing_bpms = "0=98,16=196,275=98"
timing_stops = "165.5=0.612,226=0.918"
timing_offset_ms = 0
```

These live values confirm that timing entries are comma-separated, each entry
uses `beat=value`, and BPM change positions are numeric beat values including
fractional positions. Stop durations are seconds: for `Monolith`, the
0.612-second stop at beat 165.5 is reflected by the raw note timestamps as a
918 ms interval to beat 166.5 (306 ms of one beat at 196 BPM plus 612 ms).
The 0.918-second stop at beat 226 similarly produces a 1224 ms interval to
beat 227.
