# Slush Discovery Search — V2

A production-style discovery search application built to demonstrate **search relevance, data modeling, and operational judgment**.

The system is intentionally scoped and structured around a clear architectural boundary:

- **PostgreSQL is the System of Record (SoR)**
- **Elasticsearch is a read-optimized projection for discovery search**

Version **V2** extends the baseline search system with:
- Chunk-based full-text indexing
- Deterministic reindexing
- Highlighted search results
- Entity detail pages backed by a relational knowledge graph

---

## What the application does

### Discovery Search
Users can search across four entity types:

- Startups  
- Investors  
- People  
- Events  

Search supports:
- Full-text BM25 relevance
- Typo tolerance
- Prefix matching
- Highlighted snippets from long-form descriptions

Results are **grouped by entity type**, not mixed into a single ranked list.

---

### Entity Detail Pages (V2 extension)

Each search result is clickable.

Clicking a result opens an **Entity Detail page** that displays:
- Full entity data (from PostgreSQL)
- Structured relationship blocks (team, investors, portfolio, events, speakers)

Navigation is SPA-style (no page reloads).

---

## Architecture overview

### Data ownership
- **PostgreSQL**
  - Owns all entities and relationships
  - Serves entity detail pages
- **Elasticsearch**
  - Stores chunked documents for search
  - Can be fully rebuilt at any time

There are **no joins, graph traversal, or parent-child relations inside Elasticsearch**.

---

## Search architecture (Elasticsearch)

### Chunking strategy
Long-form descriptions are split into overlapping chunks to avoid BM25 dilution.

Each chunk document contains:
- Deterministic `_id = "${entity_id}_${chunk_index}"`
- `entity_id` (keyword, used for collapse)
- `entity_type`
- `chunk_index`
- `name` / `title` (duplicated identically across chunks)
- `content` (chunk text, with term vectors enabled)

### Index behavior
- Search queries use `multi_match` with field weighting
- Results are collapsed by `entity_id`
- Highlighting is applied to `content` chunks

This ensures:
- One search result per entity
- Snippets come from the most relevant text fragment

---

## Database model (PostgreSQL)

### `entities`
A single table storing all domain objects, distinguished by `entity_type`:

- `startup`
- `investor`
- `person`
- `event`

This table is the **authoritative source** for all entity data.

---

### `entity_links` (knowledge graph edges)

A universal relationship table connecting entities.

Each row represents a **directed edge**:
- `from_entity_id → to_entity_id`
- `type` (`link_type` enum)
- Optional context fields:
  - `role_title`
  - `context`
  - `meta` (JSONB)

Supported relationship types:
- `works_at`
- `founded`
- `invests_in`
- `partner_at`
- `speaks_at`
- `organizes`
- `attends`
- `volunteers_at`
- `related`

Constraints and guarantees:
- Foreign keys with `ON DELETE CASCADE`
- Unique constraint on `(from_entity_id, to_entity_id, type)`
- Indexed for directional lookups

---

## API

### `GET /search`
Returns grouped search results from Elasticsearch.

---

### `GET /entity/:id`

Returns a **single JSON payload** containing:
- `entity`: core fields from PostgreSQL
- `connections`: relationship blocks resolved from `entity_links`

UUID format is validated before querying.

#### Response shape
```json
{
  "entity": {
    "id": "uuid",
    "name": "CarbonFlow",
    "entity_type": "startup",
    "description": "...",
    "country": "FI",
    "location": "Helsinki",
    "industries": [],
    "topics": [],
    "stage": "seed",
    "role_title": null,
    "company_name": null,
    "event_type": null,
    "speakers": []
  },
  "connections": {
    "team": [],
    "investors": [],
    "portfolio": [],
    "events": [],
    "speakers": [],
    "related": []
  }
}
````

---

### Connection grouping rules (backend-owned)

Grouping logic is implemented entirely in SQL and returned ready for rendering.

* **team**

  * `works_at`, `founded`, `partner_at`
  * Direction: `person → startup` or `person → investor`

* **investors** *(startup pages)*

  * `invests_in`
  * Direction: `investor → startup`

* **portfolio** *(investor pages)*

  * `invests_in`
  * Direction: `investor → startup`

* **events**

  * `speaks_at`, `organizes`, `attends`, `volunteers_at`
  * Always scoped to links involving the requested entity

* **speakers** *(event pages)*

  * `speaks_at`, `organizes`
  * Direction: `entity → event`

* **related**

  * Generic fallback links

If the `entity_links` table is not present, the API safely falls back to returning the entity with empty connection arrays.

---

## Frontend behavior

* Search results are clickable cards
* Cards support keyboard navigation (Enter / Space)
* Clicking a card opens the entity detail view
* Highlight snippets are rendered using trusted `<mark>` tags from Elasticsearch

---

## Running locally

### Requirements

* Node.js
* Docker + Docker Compose

### Start infrastructure

```bash
docker compose up -d

curl -X POST http://localhost:3001/admin/reindex
```

This initializes:

* PostgreSQL schema (`infra/postgres/init.sql`)
* Seed data (`infra/postgres/seed.sql`)
* Elasticsearch


## Reindexing Elasticsearch

PostgreSQL remains the System of Record.

Elasticsearch is rebuilt explicitly via the admin reindex endpoint.
Entity pages do **not** depend on Elasticsearch.

---

## Scope decisions (intentional)

The following are explicitly **out of scope for V2**:

* Vector search
* Semantic embeddings
* Synonym expansion beyond basic normalization
* Authorization or user accounts
* Graph traversal inside Elasticsearch

The focus of V2 is:

* Correct relevance behavior
* Deterministic ingestion
* Clear data ownership
* Maintainable evolution path

---

## Status

**V2 is complete and stable**:

* Chunked search with highlighting
* Deterministic reindexing
* Entity detail pages
* Relational knowledge graph in Postgres

The system is ready for further iteration without architectural rewrites.
