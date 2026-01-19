# Slush Discovery Search (PERN + Elasticsearch)

This project is a **universal discovery search** inspired by the Slush platform.
It demonstrates how **PostgreSQL (system of record)** and **Elasticsearch (read-optimized projection)** can be combined to support high-recall, relevance-driven discovery across mixed entity types.

The focus is on **search quality, index design, and clear data flow**, not feature breadth.


## What this app does

The application provides a single search experience across four entity types:

* **Startups**
* **Investors**
* **People**
* **Events**

Users can:

* enter short, messy, natural queries (e.g. *“pre-seed AI investors US”*)
* optionally narrow results using type and facet filters
* explore results grouped by entity type

Results are retrieved via a single relevance query and then **grouped by entity type**, with ranking preserved **within each group**, optimized for discovery rather than exact matching.

Very short queries (<2 characters) are intentionally not tuned for meaningful relevance.


## Core design principles

* **Postgres is the system of record**
  All canonical data lives in PostgreSQL with an explicit schema.

* **Elasticsearch is a projection, not a source of truth**
  ES stores a read-optimized index built from Postgres for fast, flexible discovery.

* **High recall over perfect precision**
  It’s better to include plausible matches than miss obvious ones, while keeping strong matches at the top.

* **Explicit scope control**
  Every supported behavior is documented; anything not supported is stated clearly.


## Architecture overview

```
Postgres (canonical data)
        ↓
   /admin/reindex
        ↓
Elasticsearch (current-year index + alias)
        ↓
      /search
        ↓
   React discovery UI
```

### Key points

* Only **active entities for the current year (2026)** are indexed.
* Elasticsearch indices are **versioned**, with an alias (`slush_entities_current`) enforcing year validity.
* Reindexing is **batch-based and idempotent**.
* The API may start before Elasticsearch is fully ready; search requests handle short connection retries.


## Tech stack

* **Frontend:** React + TypeScript + Vite
* **Backend:** Node.js + Express + TypeScript
* **Database:** PostgreSQL 16
* **Search:** Elasticsearch 8.x
* **Infra:** Docker Compose


## Running the project locally

### Prerequisites

* Docker + Docker Compose

### Start the stack

```bash
docker compose up --build
```

This will:

* initialize Postgres with schema + seed data (first run only)
* start Elasticsearch as a single node
* start the API and Web apps

### Build the search projection (one-time)

```bash
curl -X POST http://localhost:3001/admin/reindex
```

### Open the app

* Web UI: [http://localhost:5173](http://localhost:5173)
* API: [http://localhost:3001](http://localhost:3001)


## Search behavior & evaluation

Search quality is evaluated using a small, explicit test suite documented in:

📄 **`docs/relevance-notes.md`**

That document defines:

* what counts as a “strong match”
* how results are evaluated per entity group
* example queries with expected top results

This makes relevance decisions **auditable and reviewer-friendly**.


## API overview

### `GET /search`

Searches the Elasticsearch projection.

**Key characteristics**

* Results are **grouped by entity type**
* Repeatable filters use **OR semantics** within a key
* Different filter keys combine with **AND**
* Queries shorter than 2 characters return empty results with a UI hint

### `POST /admin/reindex`

Rebuilds the Elasticsearch projection from Postgres.

* Indexes only `active_2026 = true` entities
* Rebuilds the yearly index from scratch and swaps the alias
* Ensures inactive entities are removed
* Safe to run multiple times


## Trade-offs / Out of scope

To keep the project focused and evaluable, the following are **intentionally out of scope**:

* Free-text negation parsing (e.g. *“investors not startups”*)
* Numeric extraction from queries (e.g. *“50k–200k”*)
* Query-dependent facet counts
* Autocomplete (nice-to-have only)
* Incremental indexing (reindex is rebuild-based in v1)

These trade-offs are deliberate and documented to avoid implied functionality.


## Why this approach

This project is designed to demonstrate:

* sound **schema and index design**
* thoughtful **search relevance tuning**
* clear separation between **data ownership** and **search concerns**
* the ability to scope and ship a **realistic internal tool**

The scope and implementation choices are optimized to make trade-offs and design decisions easy to evaluate within a limited timebox.


## Repository structure

```
apps/
  api/        # Express + TypeScript API
  web/        # React + Vite frontend
infra/
  postgres/
    init.sql
    seed.sql
docs/
  relevance-notes.md
docker-compose.yml
```


## Notes for reviewers

* Postgres init/seed scripts run only on first volume creation.
  *To reset data:* `docker compose down -v`
* Reindexing is intentionally manual to keep behavior explicit.
* All search expectations are defined in `docs/relevance-notes.md`.


**End of README.**

