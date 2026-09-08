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
