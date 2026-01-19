# Slush Discovery Search

A small, production-style **discovery search system** spanning startups, investors, people, and events.

The goal of this project is not feature breadth, but to show **clear judgment around data ownership, search relevance, and operational safety**. PostgreSQL is treated as the system of record; Elasticsearch is a read-optimized projection built explicitly for discovery.

**GCP: Live demo:** [http://146.148.18.228](http://146.148.18.228)


## What this app does

The application provides a single search experience across four entity types:

* **Startups** — companies with industry, stage, and geography
* **Investors** — funds with focus areas and regions
* **People** — founders, partners, and professionals
* **Events** — talks, workshops, and sessions

Users can type short, informal queries such as:

* `pre-seed AI investors US`
* `climate supply chain startups`
* `CEO fintech`
* `machine learnin climate` (typo intentional)

Results are **grouped by entity type**, not mixed into a single ranked list.
Relevance is tuned *within each group*, which reflects how discovery tools are typically used: you decide *what kind of thing* you’re looking for first, then scan the best matches.

Very short queries (< 2 characters) intentionally return no results to avoid noisy, misleading output.


## Architecture at a glance

```
PostgreSQL (system of record)
        ↓
   POST /admin/reindex
        ↓
Elasticsearch (versioned index + alias)
        ↓
     GET /search
        ↓
   React discovery UI
```

### Core principles

* **Postgres is authoritative**
  All writes and canonical state live in PostgreSQL.

* **Elasticsearch is derived**
  ES is treated as a disposable, rebuildable projection optimized for search.

* **Reindexing is explicit**
  Index rebuilds are triggered manually to keep behavior predictable and easy to reason about.

* **Zero-downtime rebuilds**
  Versioned indices and atomic alias swaps ensure search never sees partial data.

* **Eventual consistency by design**
  Search reflects the state of Postgres at the time of the most recent successful reindex.

Only entities marked `active_2026 = true` are indexed, enforcing current-year validity at the projection level.


## Tech stack

| Layer    | Technology                    |
| -------- | ----------------------------- |
| Frontend | React 18, TypeScript, Vite    |
| Backend  | Node.js, Express, TypeScript  |
| Database | PostgreSQL 16                 |
| Search   | Elasticsearch 8.x             |
| Infra    | Docker Compose, Nginx, GCP VM |


## Running locally

**Prerequisites:** Docker + Docker Compose

```bash
# Start all services
docker compose up --build

# Build the search projection (required once)
curl -X POST http://localhost:3001/admin/reindex

# Open the app
# UI:  http://localhost:5173
# API: http://localhost:3001
```

To reset all data:

```bash
docker compose down -v
```


## API overview

### `GET /search`

Returns results grouped by entity type.

**Query parameters**

| Name       | Type     | Notes                         |
| ---------- | -------- | ----------------------------- |
| `q`        | string   | Free-text query (min 2 chars) |
| `type`     | string   | Entity type filter            |
| `industry` | string[] | OR within the same key        |
| `country`  | string[] | OR within the same key        |
| `stage`    | string[] | OR within the same key        |

Different filter keys combine with **AND** semantics.


### `POST /admin/reindex`

Rebuilds the Elasticsearch projection from PostgreSQL.

**What it does:**

1. Acquires a Postgres advisory lock (prevents concurrent runs)
2. Fetches all `active_2026 = true` entities
3. Creates a new versioned ES index
4. Bulk indexes all documents (idempotent by Postgres ID)
5. Atomically swaps the search alias
6. Cleans up old indices
7. Releases the lock

Search traffic continues uninterrupted throughout the process.

Reindexing is intentionally manual to keep behavior explicit and failure modes obvious.


## Search relevance

The search system is tuned for **high recall on short, messy discovery queries**.

The primary goal is simple and measurable:

> Strong matches should appear in the **top 3** of the most relevant entity group.

Implemented relevance features include:

* Multi-field matching (name, description, tags, roles)
* Fuzzy matching for typo tolerance
* Prefix matching via edge n-grams
* Lightweight keyword normalization (e.g. “preseed” → “pre-seed”)
* Entity-type–aware field boosting

All relevance expectations and example queries are documented in
**`docs/relevance-notes.md`**, which acts as a small, auditable test suite.


## Trade-offs and scope decisions

This project intentionally avoids:

| Feature                | Reason                                                  |
| ---------------------- | ------------------------------------------------------- |
| Incremental indexing   | Rebuild-based projection keeps logic simple and correct |
| Query-time joins       | All search data is denormalized                         |
| Query-dependent facets | Global facets avoid aggregation complexity              |
| Numeric extraction     | Structured filters are the source of truth              |
| Free-text negation     | Type and facet filters handle exclusion                 |
| Authentication         | Not required for demo scope                             |


## Repository structure

```
apps/
  api/ # Express + TypeScript API
  web/ # React + Vite frontend
infra/
  nginx/ # Reverse proxy config
  postgres/ # Schema + seed data
docs/
  relevance-notes.md
docker-compose.yml
docker-compose.prod.yml
```


## Notes for reviewers

* All search expectations are explicitly defined in `docs/relevance-notes.md`
* Reindexing is rebuild-based and idempotent by design
* Trade-offs are documented intentionally rather than implied
* The code favors readability and correctness over cleverness
