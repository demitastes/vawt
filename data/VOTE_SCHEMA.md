# Vote Schema & Endpoints (Task 21)

Comprehensive design for the voting system architecture, data structures, and REST API endpoints.

## Vote Data Structure

### Core Vote Record

```json
{
  "id": "uuid",
  "boutId": "R1B1",
  "participantId": "distillery-name",
  "voterId": "user-id-or-null",
  "source": "website",
  "sourceId": "optional-external-id",
  "timestamp": "2026-05-15T14:30:00Z",
  "ipHash": "optional-for-deduplication"
}
```

### Vote Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | UUID | Yes | Unique vote identifier |
| `boutId` | String | Yes | Reference to bout (e.g., "R1B1") |
| `participantId` | String | Yes | Reference to distillery/participant |
| `voterId` | String or null | No | User ID if authenticated; null for anonymous |
| `source` | Enum | Yes | Origin: "website", "discord", "twitter", "instagram", "mastodon", "bluesky", "threads" |
| `sourceId` | String or null | No | External ID (discord user ID, tweet ID, etc.) |
| `timestamp` | ISO8601 | Yes | When vote was cast (UTC) |
| `ipHash` | String or null | No | SHA256(IP) for deduplication if needed |

### Example Vote

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "boutId": "R1B1",
  "participantId": "Catoctin",
  "voterId": "user-123",
  "source": "website",
  "sourceId": null,
  "timestamp": "2026-05-15T14:30:00Z",
  "ipHash": null
}
```

---

## REST API Endpoints

### POST /api/votes - Submit Vote

**Request:**
```json
{
  "boutId": "R1B1",
  "participantId": "Catoctin"
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "voterId": "user-123",
  "timestamp": "2026-05-15T14:30:00Z"
}
```

**Headers:**
- `Authorization: Bearer <token>` (optional for authenticated votes)
- `X-Forwarded-For` or client IP (for IP-based deduplication)

**Status Codes:**
- `201 Created` — Vote recorded successfully
- `400 Bad Request` — Invalid boutId or participantId
- `409 Conflict` — Duplicate vote detected (user/IP already voted this bout)
- `503 Service Unavailable` — Voting window closed for this bout

---

### GET /api/votes/active-bout

Returns the currently active bout for voting (the bout where voting window is open).

**Response (200 OK):**
```json
{
  "boutId": "R2B3",
  "round": 2,
  "bout": 3,
  "participants": [
    {
      "name": "Catoctin",
      "flags": ["veteran-owned"],
      "notes": "Founded 2018"
    },
    {
      "name": "Old Rag",
      "flags": [],
      "notes": "Since 2010"
    }
  ],
  "votingEndsAt": "2026-05-16T23:59:59Z"
}
```

**Status Codes:**
- `200 OK` — Active bout found
- `404 Not Found` — No active bout (voting window closed)

---

### GET /api/votes/results?boutId={boutId}

Returns vote counts aggregated by participant for a specific bout.

**Query Parameters:**
- `boutId` (required) — Bout ID to retrieve results for

**Response (200 OK):**
```json
{
  "boutId": "R1B1",
  "totalVotes": 1250,
  "results": [
    {
      "participantId": "Catoctin",
      "voteCount": 720
    },
    {
      "participantId": "Old Rag",
      "voteCount": 530
    }
  ]
}
```

**Status Codes:**
- `200 OK` — Results found
- `400 Bad Request` — Missing or invalid boutId
- `404 Not Found` — Bout not found

---

### GET /api/votes/results/by-source?boutId={boutId}

Returns vote breakdown by source (website, discord, twitter, etc.).

**Query Parameters:**
- `boutId` (required) — Bout ID to retrieve results for

**Response (200 OK):**
```json
{
  "boutId": "R1B1",
  "totalVotes": 1250,
  "resultsBySource": [
    {
      "source": "website",
      "voteCount": 600,
      "breakdown": [
        { "participantId": "Catoctin", "count": 350 },
        { "participantId": "Old Rag", "count": 250 }
      ]
    },
    {
      "source": "discord",
      "voteCount": 400,
      "breakdown": [
        { "participantId": "Catoctin", "count": 240 },
        { "participantId": "Old Rag", "count": 160 }
      ]
    },
    {
      "source": "twitter",
      "voteCount": 250,
      "breakdown": [
        { "participantId": "Catoctin", "count": 130 },
        { "participantId": "Old Rag", "count": 120 }
      ]
    }
  ]
}
```

**Status Codes:**
- `200 OK` — Results found
- `400 Bad Request` — Missing or invalid boutId
- `404 Not Found` — Bout not found

---

## Design Decisions

### 1. Anonymous Votes (voterId=null)

**Decision:** ✅ **Allow anonymous votes**

**Rationale:**
- Broader participation from non-registered users
- Lower friction for casual voters
- Can gate registered-only voting features later if needed

**Deduplication Strategy:**
- Website: IP-based deduplication (IP hash in vote record)
- Discord: Discord user ID (native to platform)
- Social media: Handle/profile ID unique to platform
- Implement "one vote per user per bout" validation per source

---

### 2. Duplicate Vote Prevention

**Strategy: Per-source deduplication windows**

- **Website:** One vote per IP per bout per 24-hour window
- **Discord:** One vote per Discord user ID per bout per voting window
- **Twitter/X:** One vote per authenticated account per bout
- **Other platforms:** Platform-specific account/profile ID

**Implementation:**
- Check vote history before recording: `votes.filter(v => v.boutId == boutId && v.source == source && v.voterId/ipHash == current)`
- Return 409 Conflict if duplicate detected
- Log duplicate attempts for analytics

---

### 3. Real-Time vs Cached Aggregation

**Decision:** ✅ **Hybrid approach**

- **Recording:** Real-time (write vote immediately to storage)
- **Aggregation:** Cached with ~30-60 second TTL
  - `/api/votes/results` returns cached aggregation
  - Refresh cache on every N votes or on interval timer
  - In-memory cache (HashMaps) initially; migrate to Redis if load increases

**Rationale:**
- Users see their vote recorded instantly
- Prevents thundering herd during final voting minutes
- Reduced database/file I/O
- Good enough for tournament use case

---

### 4. Historical Vote Import

**Approach: Admin endpoint for CSV bulk import**

**Endpoint:** `POST /api/admin/votes/import` (protected, requires admin JWT)

**CSV Format:**
```csv
boutId,participantId,voterId,source,timestamp,count
R1B1,Catoctin,user-123,website,2026-05-15T10:00:00Z,1
R1B1,Old Rag,user-124,website,2026-05-15T10:05:00Z,1
R1B2,Catoctin,,discord,2026-05-15T11:00:00Z,50
```

**Deduplication:**
- Check existing votes before import
- Skip duplicates with 409 response
- Return import summary: `{imported: 150, skipped: 10, errors: 2}`

---

### 5. Persistence Layer

**Primary:** ✅ **JSON file storage** (`/data/votes/`)

**Directory Structure:**
```
/data/votes/
  ├── 2026/
  │   ├── votes.jsonl        (append-only log)
  │   └── votes-cache.json   (aggregated counts, TTL 60s)
  └── 2025/
      ├── votes.jsonl
      └── votes-cache.json
```

**Rationale:**
- Simple, version-controllable, human-readable
- No database setup required
- Easy to backup and restore
- Sufficient for <100k votes per tournament

**Migration Path to SQLite:**
- When votes exceed 100k or concurrent voting spikes occur
- Criteria: >5k concurrent users, <100ms response time requirement, need for complex analytics
- Script: `scripts/votes-jsonl-to-sqlite.py` will handle migration

**In-Memory Cache:**
- HashMap<String, VoteAggregate> keyed by `boutId`
- Updated every 30-60 seconds from file
- Refreshed on every POST /api/votes

---

## Implementation Dependencies

### Task 22: Implement Vote Endpoints
- Depends on: Task 15 (API server), Task 17 (user auth)
- Blocked by: None
- Implements: All endpoints above

### Task 24: Vote Aggregation by Source
- Depends on: Task 22 (vote recording)
- Implements: Enhanced /api/votes/results/by-source aggregation

### Task 25: Historical Vote Import
- Depends on: Task 22 (vote recording)
- Implements: POST /api/admin/votes/import endpoint

### Website Voting UI
- Depends on: Task 22 (vote endpoints)
- Tasks 33-34 (voting UI, vote display)

### Discord Bot Voting
- Depends on: Task 22 (vote endpoints)
- Task 29 (Discord vote command)

---

## Task 22 Implementation Checklist

When implementing Task 22 (Implement Vote Endpoints), follow this checklist:

- [ ] Create `api/src/handlers/votes.rs` with 4 endpoint handlers
- [ ] Create `api/src/models/vote.rs` with Vote, VoteAggregate data structures
- [ ] Implement vote directory structure: `/data/votes/{year}/votes.jsonl`
- [ ] Implement in-memory cache: HashMap<String, VoteAggregate>
- [ ] Implement deduplication logic per source
- [ ] Add POST /api/votes with duplicate check
- [ ] Add GET /api/votes/active-bout (get current bout from tournament data)
- [ ] Add GET /api/votes/results (aggregate from cache)
- [ ] Add GET /api/votes/results/by-source (aggregate by source)
- [ ] Write vote records to `/data/votes/{year}/votes.jsonl` (append-only)
- [ ] Implement cache refresh on interval (60s)
- [ ] Test with `cargo test` (include duplicate vote scenarios)
- [ ] Run `cargo build` to verify no compilation errors
- [ ] Update TODO.md Task 22 to ✅ Complete
- [ ] Create commit: "Implement vote endpoints with caching (Task 22)"

---

## Related Documents

- **TODO.md**: Task breakdown and parallel work allocation
- **DECISIONS.md**: Architectural decisions (Decision 7: No Database Initially)
- **API.md** (future): Complete REST API documentation

---

**Last Updated:** 2026-05-15  
**Design Status:** Ready for Task 22 Implementation  
**Author:** Claude Code
