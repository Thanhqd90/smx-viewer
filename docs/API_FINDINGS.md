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

## 573 homepage metadata

The public chart lookup accepts pagination fields inside the existing `q`
JSON object. A request using `{"_take":100,"_skip":0}` returned 100 records;
the next page uses `{"_take":100,"_skip":100}`. Published edit retrieval
filters with `is_edit: true` and `edit_publicity: "published"`.

The public song metadata resource is:

```text
GET https://api.smx.573.no/songs?q={"id":593}
```

It returns lightweight song records including `id`, `game_song_id`, `title`,
and `artist`. Homepage cards use `song_id` from the 573 edit record to resolve
titles through this resource; they do not call the full StepManiaX chart
endpoint.

## Account access investigation

Account/bookmark retrieval is not implemented because the authenticated
bookmark contract could not be verified without credentials or an official
endpoint reference.

Verified facts:

- The explicitly named authentication endpoint is `POST
https://data.stepmaniax.com/sign/in`.
- An empty, non-credentialed JSON request returns validation errors identifying
  the required fields as `account` and `password`.
- A public `GET /sign/in` response reports `invalid-api` and `Endpoint unknown`.
- The response shape for successful authentication, token/session headers, and
  expiration were not available from public documentation or this repository.
- No official bookmarked-edits endpoint, method, pagination contract, or
  response shape is documented in this repository or exposed by the public
  service responses inspected.
- Public `GET /charts` records may contain a per-record `user_bookmarked`
  boolean, but public lookup returns `false`; adding `user_bookmarked: true` to
  the public query does not establish a bookmarked-edits feed.

Per the read-only account requirements, no login/session UI, credential route,
bookmark route, token storage, or mutation action has been added until the
official authenticated bookmark endpoint and session contract are provided.

## SMX Tools source verification

The official source archive linked from the SMX Tools reference was inspected:

```text
https://gustavn.se/smx-tools/smx-tools-source.zip
```

The relevant source file is `smx-tools/main.py`.

### Login contract

`LoginFrame.try_login()` sends:

```text
POST https://data.stepmaniax.com/sign/in
Content-Type: application/json
```

with this JSON body:

```json
{
  "account": "...",
  "password": "...",
  "uuid": "generated per login attempt",
  "apiVersion": 6
}
```

On success, the source reads these exact fields:

```text
data["account"]["username"]
data["account"]["id"]
data["auth_token"]
```

The source passes the token and account ID in the JSON body of later requests;
it does not use an `Authorization` header. The authenticated payload fields
are `auth_token`, `auth_gamer`, and, for `/edit/list`, `gamer_id`.

### Authenticated edit list

`MainFrame.__init__()` sends:

```text
POST https://data.stepmaniax.com/edit/list
Content-Type: application/json
```

with:

```json
{
  "apiVersion": 6,
  "auth_token": "...",
  "auth_gamer": "account id",
  "gamer_id": "account id"
}
```

The source reads the response as:

```text
data["songs"]
data["charts"]
```

`songs` is a mapping keyed by song ID and `charts` is the user's edit list.
The source does not send pagination fields or perform pagination.

This operation is an authenticated list of the user's edits, not a verified
bookmarked-edits operation. The source contains no request or filtering logic
for `bookmark`, `bookmarked`, `favorite`, `favourites`, or `user_bookmarked`.
There is therefore still no verified read endpoint for a user's bookmarked
edits. `/edit/list` must not be treated as a bookmark feed without additional
official evidence.

The source also contains mutation operations such as `/edit/update/{id}`;
those are explicitly out of scope and were not implemented or investigated
for this read-only feature.

## Native note types: Mine, Mine Pit (long mine), Roll

Verified using the documented public flow only: `GET
https://api.smx.573.no/charts?q={"_take":N,"_skip":N,"is_edit":true,"edit_publicity":"published"}`
to list published edits, then `POST https://data.stepmaniax.com/chart/{id}/view`
`{"apiVersion":6}` for each chart id, inspecting `chart_data.noteData`
directly. 500 published charts were scanned this way.

Primary example chart: id `32284`, display id `7Q7-234` ("Sylo", single,
meter 21). This one chart alone contains real examples of all three types.

### Mine

Raw shape: `{track, beat, mine: true, time}` — same shape as a Tap, plus a
`mine: true` boolean, and never a `len`.

Exact raw object (chart 32284, `7Q7-234`):

```json
{ "track": 2, "beat": [0, 1], "mine": true, "time": 0 }
```

### Mine Pit / long mine

Raw shape: `{track, beat, mine: true, len, time, slen}` — a Mine with a
`len`/`slen` pair added, identical in shape to how a Hold adds `len`/`slen`
to a Tap.

Exact raw object (chart 32284, `7Q7-234`):

```json
{ "track": 4, "beat": [0, 1], "mine": true, "len": [1, 1], "time": 0, "slen": 429 }
```

### Roll

Raw shape: `{track, beat, len, time, slen, taps}` — a Hold with an added
`taps` field giving the required hit count. Across the 500-chart scan,
`taps` appeared 1218 times; `mine` and `taps` never co-occurred on the same
note, so `mine` vs. `taps` is an unambiguous discriminator.

Exact raw object (chart 32284, `7Q7-234`):

```json
{ "track": 4, "beat": [1, 4], "len": [3, 4], "time": 107, "slen": 321, "taps": 4 }
```

Observed `taps` values across the scan ranged from 1 to 96 (distinct values:
1-10, 12-16, 19, 20, 30, 59, 64, 96), consistent with a required-hit count
that scales with roll length rather than a fixed enum.

### SMX Tools source cross-check

The same official source archive referenced above
(`smx-tools/smx-tools/convert.py`) was inspected for its SMX-native
noteData round-trip logic:

```python
def convert_smx_to_sm(smx_chart_data, meter, edit_style):
    ...
    for smx_note in smx_note_data:
        beat += Beat(*smx_note['beat'])
        column = smx_note['track']
        if 'mine' in smx_note:
            note_type = NoteType.MINE
        elif 'len' in smx_note:
            note_type = NoteType.HOLD_HEAD
        else:
            note_type = NoteType.TAP
```

This checks `'mine' in smx_note` **before** `'len' in smx_note`, so a Mine
Pit (`mine` + `len`) round-trips as a plain `NoteType.MINE` with the length
silently dropped — independently confirming "long mines are converted to
ordinary mines when exported." The function never reads `taps` at all, so a
Roll (`len` + `taps`) round-trips as a plain `NoteType.HOLD` — independently
confirming "rolls are converted to ordinary holds when exported." Both
match the field-level evidence above and corroborate `mine`/`taps` as the
correct discriminators rather than some other undiscovered field.

`convert.py`'s `convert_sm_to_smx` (the reverse direction) only ever
produces `mine` or `len`, never `taps` or a long-mine `len`+`mine`
combination — consistent with SM/SSC's simpler note model lacking a native
Roll or long-Mine concept to convert from.

### Lift (found, not implemented — out of scope)

A `lift: true` field was also observed on hold-shaped notes, e.g. chart
`32148` (`WV4-Q5P`):

```json
{ "track": 3, "beat": [0, 1], "len": [1, 2], "time": 0, "slen": 1545, "lift": true }
```

`lift` does not appear anywhere in the SMX Tools source (`main.py` or
`convert.py`), so its conversion/export behavior is unconfirmed by that
reference. It is out of scope for this task (only Mine, Mine Pit, and Roll
were requested) and was left unimplemented: the parser does not read the
`lift` field, so a Lift note currently parses as an ordinary Hold — safe,
no regression, and it can be added later with the same
field-discriminator pattern once/if verified.

### Unresolved: `taps` without `len`

Of 1218 `taps` occurrences in the 500-chart scan, 84 (~7%) appeared on
notes with **no** `len` field, e.g. chart 32284 (`7Q7-234`) index 142:

```json
{ "track": 1, "beat": [1, 4], "time": 107, "taps": 4 }
```

This does not fit the Roll shape (no length to hold), is not referenced by
the SMX Tools source, and no alternative explanation could be verified from
the public data alone. **This is not implemented.** It is recorded here for
future investigation only; nothing in this codebase currently reads or
special-cases a bare `taps` field without `len`.

### Sprite atlas verification (`public/assets/smx/arrows.png`, 1152×1152)

Verified via pixel-level inspection (using `sharp` to extract per-column
alpha bounding boxes), not guessed:

- Column 3, row 0 (`x:384, y:0, width:128, height:128`): a circular
  red/yellow/white target icon — content bbox x[399,500] y[13,114]. All
  other rows in column 3 are empty. This is the **Mine** icon, matching the
  previously identified candidate region exactly. Used unrotated (the icon
  is rotation-symmetric) and without quantization coloring.
- Column 4 (`x:512`): a plain gray tapered bar, content bbox x[532,619]
  y[0,822]. This appears to be an unused reference asset for an ordinary
  Hold body; the current Hold rendering uses a flat-color rect and this was
  not changed.
- Column 5 (`x:640`): a red/black diagonal hazard-stripe tapered bar,
  content bbox x[658,749] y[0,754]. Used as the **Mine Pit** body texture
  (stretched to the pit's rendered length), isolated in `lib/smx/sprites.ts`
  as `PIT_BODY_REGION`.
- Column 6 (`x:768`): a gold chevron-patterned tapered bar, content bbox
  x[788,875] y[0,826]. Used as the **Roll** body texture (stretched to the
  roll's rendered length), isolated in `lib/smx/sprites.ts` as
  `ROLL_BODY_REGION`.
- Column 7 onward: confirmed empty by the same bounding-box scan.
