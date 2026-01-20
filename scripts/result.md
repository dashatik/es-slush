## Observed results (local, 2026-01-21)

| Context | Value |
|---------|-------|
| Commit | `899dd45` |
| Index | `slush_entities_current` â†’ `slush_entities_2026_v1_1768862827586` |
| Dataset | Startups=19, Investors=20, People=20, Events=20 |
| Environment | docker-compose (api + es + pg) |
| API returns | up to 100 hits total, grouped by type; script shows top 3 per group |

---

## Core Query Suite

### Query: `pre-seed AI investors US`

- **Investors** (hits=17, showing top 3): Pre-Seed AI Guild, CloudRail Ventures, Starlink Ventures
- **Startups** (hits=8, showing top 3): AuditTrail AI, ContextScale, VectorDock
- **People** (hits=8, showing top 3): Ethan Brooks, Priya Shah, Hiro Tanaka
- **Events** (hits=10, showing top 3): Pre-Seed Pitch Practice, Investor-Ready Data Room Workshop, Founder Dinner: Seed Stage Stories

  - âœ… **Pass**: Investors top-3 includes US + pre-seed + AI fund (Pre-Seed AI Guild)

### Query: `seed fintech nordics founder`

- **Investors** (hits=16, showing top 3): Nordic Seed Partners, Nordic Fin Angels, Founders First Capital
- **Startups** (hits=14, showing top 3): SeedSpark, LedgerNest, NordPay Rail
- **People** (hits=14, showing top 3): Anna Korhonen, Elina Saarinen, Aino Hämäläinen
- **Events** (hits=13, showing top 3): Fintech in the Nordics: Payments & Compliance, Founder Dinner: Seed Stage Stories, Fintech Fundraising Office Hours

  - âœ… **Pass**: People top-3 includes Nordic fintech founders; Startups includes Nordic fintech

### Query: `CEO fintech`

- **Investors** (hits=7, showing top 3): Fintech Forward VC, Aurora Capital, Civic Fin Partners
- **Startups** (hits=7, showing top 3): LedgerNest, NordPay Rail, SisuKYC
- **People** (hits=7, showing top 3): Anna Korhonen, Marta Nowak, Isabel García
- **Events** (hits=5, showing top 3): Fintech Fundraising Office Hours, KYC & Identity for Fintech Onboarding, Climate + Fintech: Carbon Accounting Workflows

  - âœ… **Pass**: People top-3 includes fintech-connected individuals with CEO/founder roles

### Query: `climate supply chain startups`

- **Investors** (hits=7, showing top 3): Climate Supply Fund Europe, Baltic Climate Capital, Polar VC
- **Startups** (hits=11, showing top 3): CarbonFlow, KelpGrid, FrostFleet
- **People** (hits=8, showing top 3): Lars Nygaard, Sofia Lindström, Oskar Jensen
- **Events** (hits=6, showing top 3): Climate Supply Chain Roundtable, Circular Logistics & Reverse Supply Chains, Machine Learning Infrastructure for Startups

  - âœ… **Pass**: Startups top-3 includes climate + supply chain companies (CarbonFlow, etc.)

### Query: `fundraising workshop`

- **Investors** (hits=1, showing top 3): Founders First Capital
- **Startups** (hits=2, showing top 3): SeedSpark, StageCraft Ops
- **People** (hits=2, showing top 3): Greta Holm, Tommi Lehtinen
- **Events** (hits=8, showing top 3): Fundraising 101 Workshop, Fintech Fundraising Office Hours, Investor-Ready Data Room Workshop

  - âœ… **Pass**: Events top-3 includes workshop-type fundraising events

### Query: `partner venture fund europe`

- **Investors** (hits=17, showing top 3): Climate Supply Fund Europe, EuroFoundry Fund, GreenInfra Ventures
- **Startups** (hits=13, showing top 3): StageCraft Ops, SeedSpark, Reglance
- **People** (hits=15, showing top 3): Lars Nygaard, Samuel Okoye, Isabel García
- **Events** (hits=13, showing top 3): Partner AMA: Venture Fund Europe, Fundraising 101 Workshop, Fintech Fundraising Office Hours

  - âœ… **Pass**: Investors top-3 includes European funds; Events includes Partner AMA

### Query: `machine learnin climate`

- **Investors** (hits=6, showing top 3): Baltic Climate Capital, Climate Supply Fund Europe, GreenInfra Ventures
- **Startups** (hits=7, showing top 3): GreenLedger, VoltRoute, CarbonFlow
- **People** (hits=6, showing top 3): Lars Nygaard, Samuel Okoye, Jonas Eriksen
- **Events** (hits=5, showing top 3): Machine Learning Infrastructure for Startups, Climate Supply Chain Roundtable, Climate Infrastructure: Grid & Optimization

  - âœ… **Pass**: Typo tolerance working - 'learnin' matched ML/learning entities

### Query: `starlink`

- **Investors** (hits=1, showing top 3): Starlink Ventures
- **Startups** (hits=0): (none)
- **People** (hits=0): (none)
- **Events** (hits=0): (none)

  - âœ… **Pass**: Starlink Ventures appears (active_2026=true)

### Query: `tesla`

- **Investors** (hits=0): (none)
- **Startups** (hits=0): (none)
- **People** (hits=0): (none)
- **Events** (hits=0): (none)

  - âœ… **Pass**: No results - Tesla excluded (active_2026=false, year validity enforced)

---

## Edge Cases

### Query: `a`

- **Investors** (hits=0): (none)
- **Startups** (hits=0): (none)
- **People** (hits=0): (none)
- **Events** (hits=0): (none)

  - âœ… **Expected behavior**: No results returned (min query length = 2 chars)

### Query: `seed`

- **Investors** (hits=16, showing top 3): Nordic Seed Partners, Pre-Seed AI Guild, Aurora Capital
- **Startups** (hits=11, showing top 3): SeedSpark, CarbonFlow, LedgerNest
- **People** (hits=1, showing top 3): Tommi Lehtinen
- **Events** (hits=3, showing top 3): Pre-Seed Pitch Practice, Founder Dinner: Seed Stage Stories, Operational Excellence for Seed Teams

  - âš ï¸ **Note**: Broad results expected - 'seed' matches both 'seed' and 'pre-seed' stage due to tokenization (see search design)

---

## Score Transparency Example

Query: `CEO fintech` â†’ People group (top 3 with scores)

`Anna Korhonen (5.9), Marta Nowak (5.9), Jonas Eriksen (5.9)`

> Scoring note: `name^4`, `role_title^3`, `industries_text^2` boosts applied.
> Title/role matches rank higher than description-only matches.

---
Generated by `scripts/test-relevance.ps1`