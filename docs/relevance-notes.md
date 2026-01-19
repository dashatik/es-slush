# `docs/relevance-notes.md`

## Relevance tuning notes

This project is a **universal discovery search** across four entity types:

* **Startups**
* **Investors**
* **People**
* **Events**

Results are **grouped by entity type** in the UI. Because of that, expectations are defined **per group**, not globally:

* We optimize for **high recall** on short, messy attendee queries.
* We tune ranking so that **strong matches appear in the top 3** within the most relevant group.
* Other groups may contain related matches; that’s acceptable (and often useful) for discovery.
* “Type” and facet filters are the primary way to narrow results in v1.

Facets in v1 are global (based on the full current-year dataset), not query-dependent. This is an intentional simplification to keep the focus on index design and relevance rather than aggregation complexity.

### Query length behavior

Queries shorter than 2 characters are not tuned for meaningful relevance and may return broad or noisy results. This is an intentional trade-off to keep the relevance model focused on realistic attendee discovery queries.

### What counts as a “strong match”

A strong match typically hits at least one of:

* `name` (highest weight)
* controlled tags (e.g., `industries/topics`) and key attributes (e.g., stage, country)
* role/title fields for people
* event type/topics for events

Descriptions provide recall but are weighted lower than name/tags.

---

## Core query suite (v1 acceptance)

### 1) `pre-seed AI investors US`

**Expectations**

* **Investors:** at least one US investor with pre-seed focus and AI/ML-related tags appears in top 3
* **Startups:** may include US pre-seed AI startups (optional)
* **People/Events:** optional

**Notes**

* Tests: multi-term query, geography + stage constraints, investor discovery.

---

### 2) `seed fintech nordics founder`

**Expectations**

* **People:** at least one founder/CEO in fintech appears in top 3
* **Startups:** fintech startups in Nordics and/or seed stage should appear near the top
* **Investors/Events:** optional

**Notes**

* Tests: cross-entity discovery, stage + geo + role signals.

---

### 3) `CEO fintech`

**Expectations**

* **People:** at least one CEO-tagged person connected to fintech appears in top 3
* **Startups:** may include fintech startups (optional)
* **Investors/Events:** optional

**Notes**

* Tests: role-title weighting vs description noise.

---

### 4) `climate supply chain startups`

**Expectations**

* **Startups:** climate + supply chain/logistics startups appear in top 3
* **Events:** may include relevant talks/workshops (optional)
* **People/Investors:** optional

**Notes**

* Tests: topic discovery using tags + description, and “startup-ish” keyword intent.

---

### 5) `fundraising workshop`

**Expectations**

* **Events:** at least one workshop related to fundraising appears in top 3
* **People/Startups:** may include entities mentioning fundraising (optional)
* **Investors:** optional

**Notes**

* Tests: event discovery, phrase matching, reducing non-event dominance.

---

### 6) `partner venture fund europe`

**Expectations**

* **People:** at least one Partner (or equivalent senior investor role) appears in top 3
* **Investors:** relevant EU funds may appear near the top
* **Startups/Events:** optional

**Notes**

* Tests: investor/person ambiguity handled by grouping; role-title importance.

---

### 7) `machine learnin climate`

*(typo intentional)*

**Expectations**

* **Startups / People / Events:** at least one relevant ML/AI + climate entity appears in top 3 of the most relevant group(s)
* It is acceptable if results are broader due to fuzziness.

**Notes**

* Tests: typo tolerance + domain terminology coverage.

---

### 8) Presence/year validity pair: `starlink` and `tesla`

**Expectations**

* `starlink`: appears (active in 2026, indexed into the current-year alias)
* `tesla`: does **not** appear (present historically but inactive for 2026 and therefore excluded from the 2026 index)

**Notes**

* Tests: current-year validity rule. “Inactive in 2026” must mean “not searchable.”

---

## Stretch queries (only if time)

### 9) `preseed`

**Expectations**

* Should behave similarly to “pre-seed” (normalization/synonym handling)
* Relevant startups/investors appear in the appropriate groups

---

### 10) `<Real attendee name>`

**Expectations**

* **People:** exact match appears in top 1–3 for People group

---

## Optional “AI / systems” discovery queries (max 3)

These are intentionally **topic discovery** tests only. They do not imply any LLM or semantic interpretation—only robust search over tags and descriptions.

### 11) `data engineering optimization`

**Expectations**

* At least one entity (startup/person/event) related to data engineering or performance appears in top 3 of the relevant group(s)

---

### 12) `large context window llm`

**Expectations**

* At least one entity connected to LLM infrastructure/tooling appears in top 3 of the relevant group(s)

---

### 13) `ml system performance`

**Expectations**

* At least one entity related to ML systems / infra performance appears in top 3 of the relevant group(s)

---

# README additions

## Architecture / Design decisions

PostgreSQL is the system of record (PERN compliance), and Elasticsearch is a read-optimized projection used for discovery search. The ES index for the current Slush year is versioned (e.g., `slush_entities_2026_v1`) and accessed through an alias (`slush_entities_current`) to enforce year validity without complex query logic. A batch reindex job rebuilds the projection from Postgres on demand to keep the project scope focused on index design, relevance tuning, and a clear data flow. Search quality is validated using a small “relevance-notes” test suite (see `docs/relevance-notes.md`) that defines expected top hits per entity group.

---

## Trade-offs / Out of scope

To keep the project focused on search relevance, index design, and clear data flow, the following trade-offs were made intentionally:

* Free-text negation (e.g., “investors not startups”) is not parsed in v1. Type and facet filters are the intended mechanism for exclusion.
* Facets are global (not query-dependent) to avoid additional aggregation complexity and edge cases.
* Numeric extraction from free text (e.g., “50k–200k”) is not supported; structured metadata and filters are the source of truth.
* Autocomplete is treated as a nice-to-have and omitted if it risks UI or relevance polish.
* Ranking favors high recall within a bounded dataset; relevance tuning focuses on keeping strong matches at the top rather than perfect precision.
