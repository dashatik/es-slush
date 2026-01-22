-- Seed for Slush Discovery Search (v1)
-- Assumes a table named `entities` exists with the columns described in your schema doc.

-- Optional but recommended: UUID generation in dev
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Clean slate (dev only) - CASCADE required because entity_links references entities
TRUNCATE TABLE entities CASCADE;

-- ============================================================
-- STARTUPS (20)
-- Notes:
-- - Keep Tesla as inactive_2026 = FALSE for the presence/year validity test.
-- - Stages are only meaningful for startups/investors.
-- ============================================================
INSERT INTO entities (
  id, entity_type, name, description, country, location,
  industries, topics, stage, role_title, company_name,
  event_type, speakers, active_2026, created_at, updated_at
) VALUES
-- 1
(
  gen_random_uuid(), 'startup', 'CarbonFlow',
  'Climate-focused supply chain startup optimizing logistics and operations.',
  'FI', 'Helsinki',
  ARRAY['climate','supply_chain'],
  ARRAY['logistics','optimization'],
  'seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 2
(
  gen_random_uuid(), 'startup', 'LedgerNest',
  'Fintech startup building modern payments infrastructure for SMEs.',
  'SE', 'Stockholm',
  ARRAY['fintech'],
  ARRAY['payments'],
  'seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 3
(
  gen_random_uuid(), 'startup', 'ContextScale',
  'LLM infrastructure startup focused on large context windows and model tooling.',
  'US', 'New York',
  ARRAY['ai'],
  ARRAY['llm','context_window','ml_infra'],
  'pre-seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 4
(
  gen_random_uuid(), 'startup', 'PipeForge',
  'Data engineering startup building robust pipelines and performance optimization tooling.',
  'DE', 'Berlin',
  ARRAY['data_engineering'],
  ARRAY['pipelines','optimization'],
  'pre-seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 5
(
  gen_random_uuid(), 'startup', 'GreenLedger',
  'Climate + fintech startup for carbon accounting and reporting workflows.',
  'NO', 'Oslo',
  ARRAY['climate','fintech'],
  ARRAY['carbon_accounting','reporting'],
  'seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 6 (inactive in 2026 on purpose)
(
  gen_random_uuid(), 'startup', 'Tesla',
  'Automotive and energy company.',
  'US', 'Austin',
  ARRAY['climate','automotive'],
  ARRAY['energy'],
  'series-b', NULL, NULL,
  NULL, ARRAY[]::text[],
  FALSE, now(), now()
),
-- 7
(
  gen_random_uuid(), 'startup', 'NordPay Rail',
  'API-first payments orchestration for European merchants with strong compliance tooling.',
  'FI', 'Espoo',
  ARRAY['fintech'],
  ARRAY['payments','compliance','apis'],
  'seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 8
(
  gen_random_uuid(), 'startup', 'KelpGrid',
  'Ocean-based carbon removal monitoring with supply chain traceability for biomass inputs.',
  'IS', 'Reykjavik',
  ARRAY['climate','supply_chain'],
  ARRAY['traceability','monitoring','carbon_removal'],
  'pre-seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 9
(
  gen_random_uuid(), 'startup', 'FrostFleet',
  'Cold-chain logistics optimization to reduce spoilage and emissions across Nordics.',
  'SE', 'Gothenburg',
  ARRAY['climate','supply_chain'],
  ARRAY['logistics','optimization','cold_chain'],
  'seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 10
(
  gen_random_uuid(), 'startup', 'SisuKYC',
  'Identity verification and KYC automation for fintech onboarding.',
  'FI', 'Helsinki',
  ARRAY['fintech'],
  ARRAY['kyc','identity','automation'],
  'pre-seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 11
(
  gen_random_uuid(), 'startup', 'VoltRoute',
  'EV routing and charging optimization for fleets with demand forecasting.',
  'DE', 'Munich',
  ARRAY['climate','automotive'],
  ARRAY['routing','forecasting','energy'],
  'seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 12
(
  gen_random_uuid(), 'startup', 'AuditTrail AI',
  'Governance tooling for AI systems: logging, evaluation, and policy checks for model changes.',
  'US', 'San Francisco',
  ARRAY['ai','data_engineering'],
  ARRAY['governance','evaluation','ml_infra'],
  'seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 13
(
  gen_random_uuid(), 'startup', 'FinScope',
  'Open banking analytics for lenders and fintechs, focusing on risk and affordability.',
  'GB', 'London',
  ARRAY['fintech'],
  ARRAY['open_banking','risk','analytics'],
  'series-a', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 14
(
  gen_random_uuid(), 'startup', 'StageCraft Ops',
  'Operational tooling for early-stage teams: KPI tracking and fundraising readiness checklists.',
  'NL', 'Amsterdam',
  ARRAY['data_engineering'],
  ARRAY['operations','fundraising','dashboards'],
  'pre-seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 15
(
  gen_random_uuid(), 'startup', 'SeedSpark',
  'Founder-friendly fundraising workspace to manage outreach, notes, and data rooms.',
  'US', 'Boston',
  ARRAY['fundraising','fintech'],
  ARRAY['fundraising','crm','workflow'],
  'seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 16
(
  gen_random_uuid(), 'startup', 'ArcticTrace',
  'Supplier traceability and carbon footprint attribution for manufacturing supply chains.',
  'NO', 'Trondheim',
  ARRAY['climate','supply_chain'],
  ARRAY['traceability','manufacturing','carbon_accounting'],
  'series-a', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 17
(
  gen_random_uuid(), 'startup', 'HelioWarehouse',
  'Warehouse automation and inventory optimization for sustainable retail operations.',
  'DK', 'Copenhagen',
  ARRAY['supply_chain'],
  ARRAY['warehousing','optimization','automation'],
  'seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 18
(
  gen_random_uuid(), 'startup', 'VectorDock',
  'Vector database tooling and retrieval infrastructure for LLM applications.',
  'US', 'Seattle',
  ARRAY['ai','data_engineering'],
  ARRAY['retrieval','ml_infra','llm'],
  'pre-seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 19
(
  gen_random_uuid(), 'startup', 'Reglance',
  'Compliance automation for European fintechs with audit-ready reporting.',
  'DE', 'Frankfurt',
  ARRAY['fintech'],
  ARRAY['compliance','reporting','automation'],
  'seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 20
(
  gen_random_uuid(), 'startup', 'BioLoop Logistics',
  'Reverse logistics and circular supply chain platform for reusable packaging.',
  'FI', 'Tampere',
  ARRAY['climate','supply_chain'],
  ARRAY['reverse_logistics','circular_economy','optimization'],
  'seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
);

-- ============================================================
-- INVESTORS (20)
-- Notes:
-- - Keep stage (pre-seed/seed/series-a etc.) in stage column.
-- - Topics are thematic (do not encode stage in topics).
-- ============================================================
INSERT INTO entities (
  id, entity_type, name, description, country, location,
  industries, topics, stage, role_title, company_name,
  event_type, speakers, active_2026, created_at, updated_at
) VALUES
-- 1
(
  gen_random_uuid(), 'investor', 'NorthBridge Ventures',
  'Early-stage investor backing AI-first teams with a focus on pre-seed.',
  'US', 'San Francisco',
  ARRAY['ai','ml'],
  ARRAY['early_stage','ml_infra'],
  'pre-seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 2
(
  gen_random_uuid(), 'investor', 'Aurora Capital',
  'Seed-stage investor focused on fintech and payments infrastructure.',
  'FI', 'Helsinki',
  ARRAY['fintech'],
  ARRAY['payments','infrastructure'],
  'seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 3
(
  gen_random_uuid(), 'investor', 'Polar VC',
  'Investor focused on climate and supply chain innovations across the Nordics.',
  'SE', 'Stockholm',
  ARRAY['climate','supply_chain'],
  ARRAY['energy','logistics'],
  'seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 4 (presence/year validity pair: should appear)
(
  gen_random_uuid(), 'investor', 'Starlink Ventures',
  'Pre-seed investor interested in AI infrastructure and space-adjacent technology.',
  'US', 'Los Angeles',
  ARRAY['ai'],
  ARRAY['infrastructure','space','early_stage'],
  'pre-seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 5
(
  gen_random_uuid(), 'investor', 'Nordic Seed Partners',
  'Pre-seed and seed fund investing in Nordic founders across fintech and climate.',
  'DK', 'Copenhagen',
  ARRAY['fintech','climate'],
  ARRAY['early_stage','nordics'],
  'seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 6
(
  gen_random_uuid(), 'investor', 'EuroFoundry Fund',
  'European venture fund backing B2B infrastructure and data engineering teams.',
  'DE', 'Berlin',
  ARRAY['data_engineering'],
  ARRAY['b2b','infrastructure','pipelines'],
  'series-a', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 7
(
  gen_random_uuid(), 'investor', 'Baltic Climate Capital',
  'Early-stage climate investor targeting circular supply chains and carbon accounting.',
  'EE', 'Tallinn',
  ARRAY['climate','supply_chain'],
  ARRAY['circular_economy','carbon_accounting'],
  'pre-seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 8
(
  gen_random_uuid(), 'investor', 'Fintech Forward VC',
  'Seed investor in open banking, payments, and compliance automation.',
  'GB', 'London',
  ARRAY['fintech'],
  ARRAY['open_banking','payments','compliance'],
  'seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 9
(
  gen_random_uuid(), 'investor', 'Alpine Growth',
  'Series A fund investing in enterprise software and analytics across Europe.',
  'CH', 'Zurich',
  ARRAY['data_engineering'],
  ARRAY['enterprise','analytics'],
  'series-a', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 10
(
  gen_random_uuid(), 'investor', 'Horizon DeepTech',
  'Pre-seed investor focused on AI tooling, ML systems performance, and developer platforms.',
  'NL', 'Amsterdam',
  ARRAY['ai','ml'],
  ARRAY['developer_tools','performance','ml_infra'],
  'pre-seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 11
(
  gen_random_uuid(), 'investor', 'Sisu Angel Syndicate',
  'Founder-friendly angel syndicate investing in Finland-based seed startups.',
  'FI', 'Helsinki',
  ARRAY['fintech','ai','climate'],
  ARRAY['angels','early_stage'],
  'seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 12
(
  gen_random_uuid(), 'investor', 'Ops & Scale Partners',
  'Seed fund investing in operational tooling, data pipelines, and internal platforms.',
  'US', 'New York',
  ARRAY['data_engineering'],
  ARRAY['operations','pipelines','platforms'],
  'seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 13
(
  gen_random_uuid(), 'investor', 'GreenInfra Ventures',
  'Early-stage investor backing climate infrastructure and grid optimization.',
  'NO', 'Oslo',
  ARRAY['climate'],
  ARRAY['energy','infrastructure'],
  'seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 14
(
  gen_random_uuid(), 'investor', 'Pre-Seed AI Guild',
  'Micro-fund focused on pre-seed AI teams building applied ML products.',
  'US', 'Boston',
  ARRAY['ai','ml'],
  ARRAY['early_stage','applied_ml'],
  'pre-seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 15
(
  gen_random_uuid(), 'investor', 'Civic Fin Partners',
  'Seed investor interested in fintech access, lending analytics, and risk tooling.',
  'SE', 'Stockholm',
  ARRAY['fintech'],
  ARRAY['risk','lending','analytics'],
  'seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 16
(
  gen_random_uuid(), 'investor', 'SupplyChain Catalyst',
  'European investor focused on logistics, warehousing automation, and traceability.',
  'NL', 'Rotterdam',
  ARRAY['supply_chain'],
  ARRAY['logistics','warehousing','traceability'],
  'series-a', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 17
(
  gen_random_uuid(), 'investor', 'CloudRail Ventures',
  'Pre-seed investor in data engineering and infrastructure for AI applications.',
  'US', 'Seattle',
  ARRAY['ai','data_engineering'],
  ARRAY['infrastructure','retrieval','ml_infra'],
  'pre-seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 18
(
  gen_random_uuid(), 'investor', 'Nordic Fin Angels',
  'Angel network supporting fintech founders across Nordics at pre-seed.',
  'FI', 'Turku',
  ARRAY['fintech'],
  ARRAY['angels','nordics','early_stage'],
  'pre-seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 19
(
  gen_random_uuid(), 'investor', 'Climate Supply Fund Europe',
  'Europe-based venture fund investing in climate supply chain and circular economy startups.',
  'DE', 'Hamburg',
  ARRAY['climate','supply_chain'],
  ARRAY['circular_economy','logistics'],
  'seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 20
(
  gen_random_uuid(), 'investor', 'Founders First Capital',
  'Seed-stage investor backing founder-led teams, with strong support on fundraising execution.',
  'GB', 'Manchester',
  ARRAY['fundraising','fintech'],
  ARRAY['founders','fundraising','early_stage'],
  'seed', NULL, NULL,
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
);

-- ============================================================
-- PEOPLE (20)
-- Notes:
-- - stage should be NULL for people.
-- - Use role_title + company_name to support “CEO fintech”, “partner venture fund europe”, etc.
-- ============================================================
INSERT INTO entities (
  id, entity_type, name, description, country, location,
  industries, topics, stage, role_title, company_name,
  event_type, speakers, active_2026, created_at, updated_at
) VALUES
-- 1
(
  gen_random_uuid(), 'person', 'Anna Korhonen',
  'CEO building fintech products and partnerships.',
  'FI', 'Helsinki',
  ARRAY['fintech'],
  ARRAY['founder','payments'],
  NULL, 'CEO', 'LedgerNest',
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 2
(
  gen_random_uuid(), 'person', 'James Miller',
  'Partner investing in early-stage AI teams.',
  'SE', 'Stockholm',
  ARRAY['ai','ml'],
  ARRAY['investing','early_stage'],
  NULL, 'Partner', 'NorthBridge Ventures',
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 3
(
  gen_random_uuid(), 'person', 'Sofia Lindström',
  'Founder working on climate and supply chain operations.',
  'SE', 'Stockholm',
  ARRAY['climate','supply_chain'],
  ARRAY['operations','logistics'],
  NULL, 'Founder', 'CarbonFlow',
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 4
(
  gen_random_uuid(), 'person', 'Markus Weber',
  'ML engineer working on ML systems performance and infrastructure.',
  'DE', 'Berlin',
  ARRAY['ai','data_engineering'],
  ARRAY['ml_systems','performance','ml_infra'],
  NULL, 'ML Engineer', 'ContextScale',
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 5
(
  gen_random_uuid(), 'person', 'Elina Saarinen',
  'Founder focused on KYC automation and identity workflows for fintech onboarding.',
  'FI', 'Helsinki',
  ARRAY['fintech'],
  ARRAY['kyc','identity','automation'],
  NULL, 'Founder', 'SisuKYC',
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 6
(
  gen_random_uuid(), 'person', 'Lars Nygaard',
  'Partner at a climate fund investing in circular supply chains across Europe.',
  'NO', 'Oslo',
  ARRAY['climate','supply_chain'],
  ARRAY['investing','circular_economy','europe'],
  NULL, 'Partner', 'Climate Supply Fund Europe',
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 7
(
  gen_random_uuid(), 'person', 'Marta Nowak',
  'CEO building compliance automation for European fintechs.',
  'DE', 'Frankfurt',
  ARRAY['fintech'],
  ARRAY['compliance','reporting'],
  NULL, 'CEO', 'Reglance',
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 8
(
  gen_random_uuid(), 'person', 'Oskar Jensen',
  'Head of Logistics improving cold-chain operations and optimization systems.',
  'SE', 'Gothenburg',
  ARRAY['climate','supply_chain'],
  ARRAY['logistics','optimization','cold_chain'],
  NULL, 'Head of Logistics', 'FrostFleet',
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 9
(
  gen_random_uuid(), 'person', 'Priya Shah',
  'Partner investing in AI infrastructure, retrieval systems, and developer tooling.',
  'US', 'Seattle',
  ARRAY['ai','data_engineering'],
  ARRAY['investing','retrieval','developer_tools'],
  NULL, 'Partner', 'CloudRail Ventures',
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 10
(
  gen_random_uuid(), 'person', 'Tommi Lehtinen',
  'CFO helping startups prepare for fundraising, budgeting, and investor outreach.',
  'FI', 'Espoo',
  ARRAY['fundraising','fintech'],
  ARRAY['fundraising','operations'],
  NULL, 'CFO', 'SeedSpark',
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 11
(
  gen_random_uuid(), 'person', 'Claire Dubois',
  'Founder working on carbon accounting and supplier traceability for manufacturers.',
  'NL', 'Amsterdam',
  ARRAY['climate','supply_chain'],
  ARRAY['carbon_accounting','traceability'],
  NULL, 'Founder', 'ArcticTrace',
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 12
(
  gen_random_uuid(), 'person', 'Hiro Tanaka',
  'CTO building vector retrieval infrastructure for LLM applications.',
  'US', 'Seattle',
  ARRAY['ai','data_engineering'],
  ARRAY['retrieval','llm','ml_infra'],
  NULL, 'CTO', 'VectorDock',
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 13
(
  gen_random_uuid(), 'person', 'Nina Berg',
  'COO improving warehousing automation and inventory accuracy.',
  'DK', 'Copenhagen',
  ARRAY['supply_chain'],
  ARRAY['warehousing','automation'],
  NULL, 'COO', 'HelioWarehouse',
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 14
(
  gen_random_uuid(), 'person', 'Ethan Brooks',
  'Founder building governance tooling for AI evaluation and audit trails.',
  'US', 'San Francisco',
  ARRAY['ai','data_engineering'],
  ARRAY['governance','evaluation'],
  NULL, 'Founder', 'AuditTrail AI',
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 15
(
  gen_random_uuid(), 'person', 'Isabel García',
  'Partner at a European venture fund focused on fintech and payments.',
  'GB', 'London',
  ARRAY['fintech'],
  ARRAY['investing','payments','europe'],
  NULL, 'Partner', 'Fintech Forward VC',
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 16
(
  gen_random_uuid(), 'person', 'Jonas Eriksen',
  'CEO working on routing and forecasting systems for EV fleets.',
  'DE', 'Munich',
  ARRAY['climate','automotive'],
  ARRAY['routing','forecasting','energy'],
  NULL, 'CEO', 'VoltRoute',
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 17
(
  gen_random_uuid(), 'person', 'Aino Hämäläinen',
  'Founder building open banking analytics and lending risk tools.',
  'FI', 'Tampere',
  ARRAY['fintech'],
  ARRAY['open_banking','risk','analytics'],
  NULL, 'Founder', 'FinScope',
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 18
(
  gen_random_uuid(), 'person', 'Ravi Patel',
  'Data Engineer focused on pipelines, observability, and performance optimization.',
  'NL', 'Amsterdam',
  ARRAY['data_engineering'],
  ARRAY['pipelines','observability','performance'],
  NULL, 'Data Engineer', 'PipeForge',
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 19
(
  gen_random_uuid(), 'person', 'Greta Holm',
  'Investor Relations lead helping founders run structured fundraising processes.',
  'SE', 'Stockholm',
  ARRAY['fundraising'],
  ARRAY['fundraising','founders'],
  NULL, 'Investor Relations', 'Founders First Capital',
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
),
-- 20
(
  gen_random_uuid(), 'person', 'Samuel Okoye',
  'Partner investing in climate infrastructure and grid optimization across Europe.',
  'DE', 'Hamburg',
  ARRAY['climate'],
  ARRAY['investing','energy','europe'],
  NULL, 'Partner', 'GreenInfra Ventures',
  NULL, ARRAY[]::text[],
  TRUE, now(), now()
);

-- ============================================================
-- EVENTS (20)
-- Notes:
-- - event_type is controlled-ish (workshop/talk/panel/roundtable).
-- - speakers is a text[] of names (messy field; good for search).
-- ============================================================
INSERT INTO entities (
  id, entity_type, name, description, country, location,
  industries, topics, stage, role_title, company_name,
  event_type, speakers, active_2026, created_at, updated_at
) VALUES
-- 1
(
  gen_random_uuid(), 'event', 'Fundraising 101 Workshop',
  'Workshop covering fundraising basics for early-stage teams.',
  'FI', 'Helsinki',
  ARRAY['fundraising'],
  ARRAY['fundraising','early_stage'],
  NULL, NULL, NULL,
  'workshop', ARRAY['Greta Holm','Tommi Lehtinen'],
  TRUE, now(), now()
),
-- 2
(
  gen_random_uuid(), 'event', 'Scaling ML Systems',
  'Talk on scaling ML systems and improving performance in production.',
  'US', 'Los Angeles',
  ARRAY['ai','ml'],
  ARRAY['performance','infrastructure'],
  NULL, NULL, NULL,
  'talk', ARRAY['Markus Weber'],
  TRUE, now(), now()
),
-- 3
(
  gen_random_uuid(), 'event', 'Pre-Seed Pitch Practice',
  'Interactive pitch practice session for pre-seed founders with live feedback.',
  'FI', 'Helsinki',
  ARRAY['fundraising'],
  ARRAY['fundraising','founders','early_stage'],
  NULL, NULL, NULL,
  'workshop', ARRAY['Greta Holm'],
  TRUE, now(), now()
),
-- 4
(
  gen_random_uuid(), 'event', 'Fintech in the Nordics: Payments & Compliance',
  'Panel on Nordic fintech trends in payments infrastructure and compliance automation.',
  'SE', 'Stockholm',
  ARRAY['fintech'],
  ARRAY['payments','compliance','nordics'],
  NULL, NULL, NULL,
  'panel', ARRAY['Anna Korhonen','Marta Nowak','Isabel García'],
  TRUE, now(), now()
),
-- 5
(
  gen_random_uuid(), 'event', 'Climate Supply Chain Roundtable',
  'Roundtable on traceability, logistics, and carbon accounting in supply chains.',
  'DE', 'Berlin',
  ARRAY['climate','supply_chain'],
  ARRAY['traceability','logistics','carbon_accounting'],
  NULL, NULL, NULL,
  'roundtable', ARRAY['Sofia Lindström','Claire Dubois','Lars Nygaard'],
  TRUE, now(), now()
),
-- 6
(
  gen_random_uuid(), 'event', 'Machine Learning Infrastructure for Startups',
  'Talk on practical ML infrastructure choices for early-stage teams.',
  'NL', 'Amsterdam',
  ARRAY['ai','ml'],
  ARRAY['ml_infra','early_stage'],
  NULL, NULL, NULL,
  'talk', ARRAY['Priya Shah','Ethan Brooks'],
  TRUE, now(), now()
),
-- 7
(
  gen_random_uuid(), 'event', 'Data Engineering Optimization Clinic',
  'Hands-on clinic for pipeline performance, observability, and cost optimization.',
  'DE', 'Berlin',
  ARRAY['data_engineering'],
  ARRAY['optimization','pipelines','observability'],
  NULL, NULL, NULL,
  'workshop', ARRAY['Ravi Patel','Markus Weber'],
  TRUE, now(), now()
),
-- 8
(
  gen_random_uuid(), 'event', 'Open Banking & Risk Analytics',
  'Panel exploring open banking data, underwriting, and risk analytics for lenders.',
  'GB', 'London',
  ARRAY['fintech'],
  ARRAY['open_banking','risk','analytics'],
  NULL, NULL, NULL,
  'panel', ARRAY['Aino Hämäläinen','Isabel García'],
  TRUE, now(), now()
),
-- 9
(
  gen_random_uuid(), 'event', 'Founder Dinner: Seed Stage Stories',
  'Private dinner for seed-stage founders to share lessons learned and connect.',
  'FI', 'Helsinki',
  ARRAY['fundraising'],
  ARRAY['founders','community'],
  NULL, NULL, NULL,
  'roundtable', ARRAY['Tommi Lehtinen'],
  TRUE, now(), now()
),
-- 10
(
  gen_random_uuid(), 'event', 'Building with Large Context Window LLMs',
  'Talk on tooling, evaluation, and product design for large context window applications.',
  'US', 'New York',
  ARRAY['ai'],
  ARRAY['llm','context_window','evaluation'],
  NULL, NULL, NULL,
  'talk', ARRAY['Hiro Tanaka'],
  TRUE, now(), now()
),
-- 11
(
  gen_random_uuid(), 'event', 'Partner AMA: Venture Fund Europe',
  'Ask-me-anything with European venture partners on sourcing, diligence, and portfolio support.',
  'DE', 'Hamburg',
  ARRAY['fundraising'],
  ARRAY['investing','europe','venture'],
  NULL, NULL, NULL,
  'panel', ARRAY['Samuel Okoye','Lars Nygaard','Isabel García'],
  TRUE, now(), now()
),
-- 12
(
  gen_random_uuid(), 'event', 'Climate Infrastructure: Grid & Optimization',
  'Talk on grid modernization, demand forecasting, and infrastructure investment opportunities.',
  'NO', 'Oslo',
  ARRAY['climate'],
  ARRAY['energy','optimization','infrastructure'],
  NULL, NULL, NULL,
  'talk', ARRAY['Samuel Okoye'],
  TRUE, now(), now()
),
-- 13
(
  gen_random_uuid(), 'event', 'Warehouse Automation Demo',
  'Live demo of warehousing automation workflows and inventory optimization approaches.',
  'DK', 'Copenhagen',
  ARRAY['supply_chain'],
  ARRAY['warehousing','automation','optimization'],
  NULL, NULL, NULL,
  'talk', ARRAY['Nina Berg'],
  TRUE, now(), now()
),
-- 14
(
  gen_random_uuid(), 'event', 'Investor-Ready Data Room Workshop',
  'Workshop on building an investor-ready data room and running a clean fundraising process.',
  'SE', 'Stockholm',
  ARRAY['fundraising'],
  ARRAY['fundraising','operations','founders'],
  NULL, NULL, NULL,
  'workshop', ARRAY['Greta Holm','Tommi Lehtinen'],
  TRUE, now(), now()
),
-- 15
(
  gen_random_uuid(), 'event', 'KYC & Identity for Fintech Onboarding',
  'Talk on identity verification, KYC automation, and onboarding conversion.',
  'FI', 'Helsinki',
  ARRAY['fintech'],
  ARRAY['kyc','identity','automation'],
  NULL, NULL, NULL,
  'talk', ARRAY['Elina Saarinen'],
  TRUE, now(), now()
),
-- 16
(
  gen_random_uuid(), 'event', 'Retrieval Systems for LLM Apps',
  'Panel on vector retrieval, evaluation, and production readiness for LLM applications.',
  'US', 'Seattle',
  ARRAY['ai','data_engineering'],
  ARRAY['retrieval','llm','evaluation'],
  NULL, NULL, NULL,
  'panel', ARRAY['Hiro Tanaka','Priya Shah','Ethan Brooks'],
  TRUE, now(), now()
),
-- 17
(
  gen_random_uuid(), 'event', 'Circular Logistics & Reverse Supply Chains',
  'Roundtable on reusable packaging, reverse logistics, and circular economy operations.',
  'FI', 'Tampere',
  ARRAY['climate','supply_chain'],
  ARRAY['reverse_logistics','circular_economy','operations'],
  NULL, NULL, NULL,
  'roundtable', ARRAY['Claire Dubois','Oskar Jensen'],
  TRUE, now(), now()
),
-- 18
(
  gen_random_uuid(), 'event', 'Fintech Fundraising Office Hours',
  'Office hours for fintech founders to discuss fundraising strategy and investor fit.',
  'GB', 'London',
  ARRAY['fundraising','fintech'],
  ARRAY['fundraising','founders'],
  NULL, NULL, NULL,
  'workshop', ARRAY['Isabel García','Greta Holm'],
  TRUE, now(), now()
),
-- 19
(
  gen_random_uuid(), 'event', 'Operational Excellence for Seed Teams',
  'Workshop on setting KPIs, building internal processes, and scaling execution.',
  'NL', 'Amsterdam',
  ARRAY['data_engineering'],
  ARRAY['operations','dashboards','optimization'],
  NULL, NULL, NULL,
  'workshop', ARRAY['Ravi Patel'],
  TRUE, now(), now()
),
-- 20
(
  gen_random_uuid(), 'event', 'Climate + Fintech: Carbon Accounting Workflows',
  'Panel discussing carbon accounting, reporting standards, and fintech-enabled sustainability workflows.',
  'NO', 'Oslo',
  ARRAY['climate','fintech'],
  ARRAY['carbon_accounting','reporting','workflows'],
  NULL, NULL, NULL,
  'panel', ARRAY['Marta Nowak','Claire Dubois'],
  TRUE, now(), now()
);

-- ============================================================
-- ENTITY_LINKS (30 connections)
-- Creates relationships between entities for the knowledge graph
-- ============================================================

-- Helper function for cleaner inserts (lookup entity by name)
CREATE OR REPLACE FUNCTION get_entity_id(entity_name text) RETURNS uuid AS $$
  SELECT id FROM entities WHERE name = entity_name LIMIT 1;
$$ LANGUAGE sql;

-- Clean slate
TRUNCATE TABLE entity_links;

-- TEAM RELATIONSHIPS (person works_at/founded startup)
INSERT INTO entity_links (from_entity_id, to_entity_id, type, role_title, context) VALUES
-- Sofia Lindström founded CarbonFlow
((SELECT id FROM entities WHERE name = 'Sofia Lindström'),
 (SELECT id FROM entities WHERE name = 'CarbonFlow'),
 'founded', 'Founder', 'Co-founded in 2024'),
-- Anna Korhonen is CEO at LedgerNest
((SELECT id FROM entities WHERE name = 'Anna Korhonen'),
 (SELECT id FROM entities WHERE name = 'LedgerNest'),
 'works_at', 'CEO', NULL),
-- Elina Saarinen founded SisuKYC
((SELECT id FROM entities WHERE name = 'Elina Saarinen'),
 (SELECT id FROM entities WHERE name = 'SisuKYC'),
 'founded', 'Founder', NULL),
-- Markus Weber works at ContextScale
((SELECT id FROM entities WHERE name = 'Markus Weber'),
 (SELECT id FROM entities WHERE name = 'ContextScale'),
 'works_at', 'ML Engineer', NULL),
-- Marta Nowak is CEO at Reglance
((SELECT id FROM entities WHERE name = 'Marta Nowak'),
 (SELECT id FROM entities WHERE name = 'Reglance'),
 'works_at', 'CEO', NULL),
-- Oskar Jensen works at FrostFleet
((SELECT id FROM entities WHERE name = 'Oskar Jensen'),
 (SELECT id FROM entities WHERE name = 'FrostFleet'),
 'works_at', 'Head of Logistics', NULL),
-- Hiro Tanaka is CTO at VectorDock
((SELECT id FROM entities WHERE name = 'Hiro Tanaka'),
 (SELECT id FROM entities WHERE name = 'VectorDock'),
 'works_at', 'CTO', NULL),
-- Nina Berg is COO at HelioWarehouse
((SELECT id FROM entities WHERE name = 'Nina Berg'),
 (SELECT id FROM entities WHERE name = 'HelioWarehouse'),
 'works_at', 'COO', NULL),
-- Ethan Brooks founded AuditTrail AI
((SELECT id FROM entities WHERE name = 'Ethan Brooks'),
 (SELECT id FROM entities WHERE name = 'AuditTrail AI'),
 'founded', 'Founder', NULL),
-- Jonas Eriksen is CEO at VoltRoute
((SELECT id FROM entities WHERE name = 'Jonas Eriksen'),
 (SELECT id FROM entities WHERE name = 'VoltRoute'),
 'works_at', 'CEO', NULL),
-- Claire Dubois founded ArcticTrace
((SELECT id FROM entities WHERE name = 'Claire Dubois'),
 (SELECT id FROM entities WHERE name = 'ArcticTrace'),
 'founded', 'Founder', NULL),
-- Ravi Patel works at PipeForge
((SELECT id FROM entities WHERE name = 'Ravi Patel'),
 (SELECT id FROM entities WHERE name = 'PipeForge'),
 'works_at', 'Data Engineer', NULL);

-- PARTNER RELATIONSHIPS (person partner_at investor)
INSERT INTO entity_links (from_entity_id, to_entity_id, type, role_title, context) VALUES
-- James Miller is Partner at NorthBridge Ventures
((SELECT id FROM entities WHERE name = 'James Miller'),
 (SELECT id FROM entities WHERE name = 'NorthBridge Ventures'),
 'partner_at', 'Partner', NULL),
-- Lars Nygaard is Partner at Climate Supply Fund Europe
((SELECT id FROM entities WHERE name = 'Lars Nygaard'),
 (SELECT id FROM entities WHERE name = 'Climate Supply Fund Europe'),
 'partner_at', 'Partner', NULL),
-- Priya Shah is Partner at CloudRail Ventures
((SELECT id FROM entities WHERE name = 'Priya Shah'),
 (SELECT id FROM entities WHERE name = 'CloudRail Ventures'),
 'partner_at', 'Partner', NULL),
-- Isabel García is Partner at Fintech Forward VC
((SELECT id FROM entities WHERE name = 'Isabel García'),
 (SELECT id FROM entities WHERE name = 'Fintech Forward VC'),
 'partner_at', 'Partner', NULL),
-- Samuel Okoye is Partner at GreenInfra Ventures
((SELECT id FROM entities WHERE name = 'Samuel Okoye'),
 (SELECT id FROM entities WHERE name = 'GreenInfra Ventures'),
 'partner_at', 'Partner', NULL),
-- Greta Holm works at Founders First Capital
((SELECT id FROM entities WHERE name = 'Greta Holm'),
 (SELECT id FROM entities WHERE name = 'Founders First Capital'),
 'works_at', 'Investor Relations', NULL);

-- INVESTMENT RELATIONSHIPS (investor invests_in startup)
INSERT INTO entity_links (from_entity_id, to_entity_id, type, role_title, context) VALUES
-- Aurora Capital invested in CarbonFlow
((SELECT id FROM entities WHERE name = 'Aurora Capital'),
 (SELECT id FROM entities WHERE name = 'CarbonFlow'),
 'invests_in', 'Lead Investor', 'Seed Round'),
-- Polar VC invested in FrostFleet
((SELECT id FROM entities WHERE name = 'Polar VC'),
 (SELECT id FROM entities WHERE name = 'FrostFleet'),
 'invests_in', 'Lead Investor', 'Seed Round'),
-- NorthBridge Ventures invested in ContextScale
((SELECT id FROM entities WHERE name = 'NorthBridge Ventures'),
 (SELECT id FROM entities WHERE name = 'ContextScale'),
 'invests_in', 'Lead Investor', 'Pre-Seed'),
-- Fintech Forward VC invested in LedgerNest
((SELECT id FROM entities WHERE name = 'Fintech Forward VC'),
 (SELECT id FROM entities WHERE name = 'LedgerNest'),
 'invests_in', 'Participant', 'Seed Round'),
-- CloudRail Ventures invested in VectorDock
((SELECT id FROM entities WHERE name = 'CloudRail Ventures'),
 (SELECT id FROM entities WHERE name = 'VectorDock'),
 'invests_in', 'Lead Investor', 'Pre-Seed'),
-- Climate Supply Fund Europe invested in ArcticTrace
((SELECT id FROM entities WHERE name = 'Climate Supply Fund Europe'),
 (SELECT id FROM entities WHERE name = 'ArcticTrace'),
 'invests_in', 'Lead Investor', 'Series A');

-- SPEAKER RELATIONSHIPS (person/startup speaks_at event)
INSERT INTO entity_links (from_entity_id, to_entity_id, type, role_title, context) VALUES
-- Sofia Lindström speaks at Climate Supply Chain Roundtable
((SELECT id FROM entities WHERE name = 'Sofia Lindström'),
 (SELECT id FROM entities WHERE name = 'Climate Supply Chain Roundtable'),
 'speaks_at', 'Panelist', NULL),
-- Anna Korhonen speaks at Fintech in the Nordics panel
((SELECT id FROM entities WHERE name = 'Anna Korhonen'),
 (SELECT id FROM entities WHERE name = 'Fintech in the Nordics: Payments & Compliance'),
 'speaks_at', 'Panelist', NULL),
-- Hiro Tanaka speaks at Retrieval Systems panel
((SELECT id FROM entities WHERE name = 'Hiro Tanaka'),
 (SELECT id FROM entities WHERE name = 'Retrieval Systems for LLM Apps'),
 'speaks_at', 'Panelist', NULL),
-- Greta Holm speaks at Fundraising 101 Workshop
((SELECT id FROM entities WHERE name = 'Greta Holm'),
 (SELECT id FROM entities WHERE name = 'Fundraising 101 Workshop'),
 'speaks_at', 'Host', NULL),
-- CarbonFlow pitches at Climate Supply Chain Roundtable
((SELECT id FROM entities WHERE name = 'CarbonFlow'),
 (SELECT id FROM entities WHERE name = 'Climate Supply Chain Roundtable'),
 'speaks_at', 'Pitching Startup', NULL);

-- Drop helper function (optional, keeps schema clean)
DROP FUNCTION IF EXISTS get_entity_id(text);
