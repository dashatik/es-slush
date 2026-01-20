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

## Observed results (local, 2026-01-21)

> Regenerate with: `.\scripts\test-relevance.ps1` (PowerShell) or `./scripts/test-relevance.sh` (bash)

| Context | Value |
|---------|-------|
| Commit | `899dd45` |
| Index | `slush_entities_current` → `slush_entities_2026_v1_1768862827586` |
| Dataset | Startups=19, Investors=20, People=20, Events=20 |
| Environment | docker-compose (api + es + pg) |
| API returns | up to 100 hits total, grouped by type; script shows top 3 per group |

---

### Query: `pre-seed AI investors US`

- **Investors** (hits=17, showing top 3): Pre-Seed AI Guild, CloudRail Ventures, Starlink Ventures
- **Startups** (hits=8, showing top 3): AuditTrail AI, ContextScale, VectorDock
- **People** (hits=8, showing top 3): Ethan Brooks, Priya Shah, Hiro Tanaka
- **Events** (hits=10, showing top 3): Pre-Seed Pitch Practice, Investor-Ready Data Room Workshop, Founder Dinner: Seed Stage Stories

✅ **Pass**: Investors top-3 includes US + pre-seed + AI fund (Pre-Seed AI Guild)

### Query: `seed fintech nordics founder`

- **Investors** (hits=16, showing top 3): Nordic Seed Partners, Nordic Fin Angels, Founders First Capital
- **Startups** (hits=14, showing top 3): SeedSpark, LedgerNest, NordPay Rail
- **People** (hits=14, showing top 3): Anna Korhonen, Elina Saarinen, Aino Hämäläinen
- **Events** (hits=13, showing top 3): Fintech in the Nordics: Payments & Compliance, Founder Dinner: Seed Stage Stories, Fintech Fundraising Office Hours

✅ **Pass**: People top-3 includes Nordic fintech founders; Startups includes Nordic fintech

### Query: `CEO fintech`

- **Investors** (hits=7, showing top 3): Fintech Forward VC, Aurora Capital, Civic Fin Partners
- **Startups** (hits=7, showing top 3): LedgerNest, NordPay Rail, SisuKYC
- **People** (hits=7, showing top 3): Anna Korhonen, Marta Nowak, Isabel García
- **Events** (hits=5, showing top 3): Fintech Fundraising Office Hours, KYC & Identity for Fintech Onboarding, Climate + Fintech: Carbon Accounting Workflows

✅ **Pass**: People top-3 includes fintech-connected individuals with CEO/founder roles

### Query: `climate supply chain startups`

- **Investors** (hits=7, showing top 3): Climate Supply Fund Europe, Baltic Climate Capital, Polar VC
- **Startups** (hits=11, showing top 3): CarbonFlow, KelpGrid, FrostFleet
- **People** (hits=8, showing top 3): Lars Nygaard, Sofia Lindström, Oskar Jensen
- **Events** (hits=6, showing top 3): Climate Supply Chain Roundtable, Circular Logistics & Reverse Supply Chains, Machine Learning Infrastructure for Startups

✅ **Pass**: Startups top-3 includes climate + supply chain companies (CarbonFlow, etc.)

### Query: `fundraising workshop`

- **Investors** (hits=1, showing top 3): Founders First Capital
- **Startups** (hits=2, showing top 3): SeedSpark, StageCraft Ops
- **People** (hits=2, showing top 3): Greta Holm, Tommi Lehtinen
- **Events** (hits=8, showing top 3): Fundraising 101 Workshop, Fintech Fundraising Office Hours, Investor-Ready Data Room Workshop

✅ **Pass**: Events top-3 includes workshop-type fundraising events

### Query: `partner venture fund europe`

- **Investors** (hits=17, showing top 3): Climate Supply Fund Europe, EuroFoundry Fund, GreenInfra Ventures
- **Startups** (hits=13, showing top 3): StageCraft Ops, SeedSpark, Reglance
- **People** (hits=15, showing top 3): Lars Nygaard, Samuel Okoye, Isabel García
- **Events** (hits=13, showing top 3): Partner AMA: Venture Fund Europe, Fundraising 101 Workshop, Fintech Fundraising Office Hours

⚠️ **Partial**: People top-3 did not strongly emphasize Partner titles; Investors and Events cover the intent. Grouped results let users find Partners via the event or investor context.

### Query: `machine learnin climate`

- **Investors** (hits=6, showing top 3): Baltic Climate Capital, Climate Supply Fund Europe, GreenInfra Ventures
- **Startups** (hits=7, showing top 3): GreenLedger, VoltRoute, CarbonFlow
- **People** (hits=6, showing top 3): Lars Nygaard, Samuel Okoye, Jonas Eriksen
- **Events** (hits=5, showing top 3): Machine Learning Infrastructure for Startups, Climate Supply Chain Roundtable, Climate Infrastructure: Grid & Optimization

✅ **Pass**: Typo tolerance working - 'learnin' matched ML/learning entities

### Query: `starlink`

- **Investors** (hits=1, showing top 3): Starlink Ventures
- **Startups** (hits=0): (none)
- **People** (hits=0): (none)
- **Events** (hits=0): (none)

✅ **Pass**: Starlink Ventures appears (active_2026=true)

### Query: `tesla`

- **Investors** (hits=0): (none)
- **Startups** (hits=0): (none)
- **People** (hits=0): (none)
- **Events** (hits=0): (none)

✅ **Pass**: No results - Tesla excluded (active_2026=false, year validity enforced)

---

### Edge Cases

#### Query: `a`

- **Investors** (hits=0): (none)
- **Startups** (hits=0): (none)
- **People** (hits=0): (none)
- **Events** (hits=0): (none)

✅ **Expected behavior**: No results returned (min query length = 2 chars)

#### Query: `seed`

- **Investors** (hits=16, showing top 3): Nordic Seed Partners, Pre-Seed AI Guild, Aurora Capital
- **Startups** (hits=11, showing top 3): SeedSpark, CarbonFlow, LedgerNest
- **People** (hits=1, showing top 3): Tommi Lehtinen
- **Events** (hits=3, showing top 3): Pre-Seed Pitch Practice, Founder Dinner: Seed Stage Stories, Operational Excellence for Seed Teams

⚠️ **Note**: Broad results expected - 'seed' matches both 'seed' and 'pre-seed' stage due to tokenization (hyphen splits into separate tokens). This is acceptable for discovery; users can narrow using stage filters if needed.

---

### Score Transparency Example

Query: `CEO fintech` → People group (top 3 with scores)

`Anna Korhonen (5.9), Marta Nowak (5.9), Jonas Eriksen (5.9)`

> Scoring note: `name^4`, `role_title^3`, `industries_text^2` boosts applied.
> Title/role matches rank higher than description-only matches.

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
