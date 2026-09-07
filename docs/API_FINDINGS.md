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
