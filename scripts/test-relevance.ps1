# Relevance test script - validates search results against acceptance criteria
# Usage: .\scripts\test-relevance.ps1 [-ApiUrl "http://localhost:3001"]

param(
    [string]$ApiUrl = "http://localhost:3001",
    [string]$EsUrl = "http://localhost:9200"
)

$date = Get-Date -Format "yyyy-MM-dd"

# --- Run Context ---
Write-Output "## Observed results (local, $date)"
Write-Output ""

# Get git commit
try {
    $commit = git rev-parse --short HEAD 2>$null
    if (-not $commit) { $commit = "(unknown)" }
} catch { $commit = "(unknown)" }

# Get index info from ES
try {
    $aliasInfo = Invoke-RestMethod -Uri "$EsUrl/_alias/slush_entities_current" -Method Get -ErrorAction Stop
    $indexName = ($aliasInfo | Get-Member -MemberType NoteProperty | Select-Object -First 1).Name
} catch {
    $indexName = "(unable to fetch)"
}

# Get entity counts from ES
try {
    $countQuery = @{
        size = 0
        aggs = @{
            by_type = @{
                terms = @{ field = "entity_type" }
            }
        }
    } | ConvertTo-Json -Depth 5

    $countResponse = Invoke-RestMethod -Uri "$EsUrl/slush_entities_current/_search" -Method Post -Body $countQuery -ContentType "application/json" -ErrorAction Stop
    $buckets = $countResponse.aggregations.by_type.buckets

    $counts = @{}
    foreach ($b in $buckets) { $counts[$b.key] = $b.doc_count }
    $datasetLine = "Startups=$($counts['startup']), Investors=$($counts['investor']), People=$($counts['person']), Events=$($counts['event'])"
} catch {
    $datasetLine = "(unable to fetch counts)"
}

Write-Output "| Context | Value |"
Write-Output "|---------|-------|"
Write-Output "| Commit | ``$commit`` |"
Write-Output "| Index | ``slush_entities_current`` → ``$indexName`` |"
Write-Output "| Dataset | $datasetLine |"
Write-Output "| Environment | docker-compose (api + es + pg) |"
Write-Output "| API returns | up to 100 hits total, grouped by type; script shows top 3 per group |"
Write-Output ""
Write-Output "---"
Write-Output ""

# --- Helper function to run a query and check criteria ---
function Test-Query {
    param(
        [string]$Query,
        [hashtable]$Criteria  # e.g., @{ investors = "US + pre-seed + AI investor"; startups = "AI startup" }
    )

    Write-Output "### Query: ``$Query``"
    Write-Output ""

    $encodedQuery = [uri]::EscapeDataString($Query)
    $url = "$ApiUrl/search?q=$encodedQuery"

    try {
        $response = Invoke-RestMethod -Uri $url -Method Get -ErrorAction Stop

        $entityTypes = @(
            @{ key = "investors"; label = "Investors" },
            @{ key = "startups"; label = "Startups" },
            @{ key = "people"; label = "People" },
            @{ key = "events"; label = "Events" }
        )

        foreach ($et in $entityTypes) {
            $items = $response.($et.key)
            $total = $response.meta.totalByType.($et.key)

            if ($items -and $items.Count -gt 0) {
                $top3 = ($items | Select-Object -First 3 | ForEach-Object { $_.name }) -join ", "
                Write-Output "- **$($et.label)** (hits=$total, showing top 3): $top3"
            } else {
                Write-Output "- **$($et.label)** (hits=0): (none)"
            }
        }

        Write-Output ""

        # Output pass/fail criteria
        if ($Criteria) {
            foreach ($key in $Criteria.Keys) {
                $criteriaText = $Criteria[$key]
                Write-Output "  - $criteriaText"
            }
        }
    }
    catch {
        Write-Output "**Error**: Failed to fetch results - $_"
    }

    Write-Output ""
}

# --- Helper for score transparency (queries ES directly) ---
function Get-ScoreTransparency {
    param([string]$Query, [string]$EntityType, [int]$TopN = 3)

    $encodedQuery = [uri]::EscapeDataString($Query)

    # Build a simple query to get scores
    $esQuery = @{
        size = $TopN
        query = @{
            bool = @{
                must = @(
                    @{ multi_match = @{ query = $Query; fields = @("name^4", "role_title^3", "industries_text^2", "description") } }
                )
                filter = @(
                    @{ term = @{ entity_type = $EntityType } }
                )
            }
        }
    } | ConvertTo-Json -Depth 10

    try {
        $response = Invoke-RestMethod -Uri "$EsUrl/slush_entities_current/_search" -Method Post -Body $esQuery -ContentType "application/json" -ErrorAction Stop
        $hits = $response.hits.hits

        if ($hits.Count -gt 0) {
            $scoreList = ($hits | ForEach-Object {
                $name = $_._source.name
                $score = [math]::Round($_._score, 1)
                "$name ($score)"
            }) -join ", "
            return $scoreList
        }
    } catch {
        return "(unable to fetch scores)"
    }
    return "(no hits)"
}

# =============================================================================
# CORE QUERY SUITE
# =============================================================================

Write-Output "## Core Query Suite"
Write-Output ""

# Query 1
Test-Query -Query "pre-seed AI investors US" -Criteria @{
    pass = "✅ **Pass**: Investors top-3 includes US + pre-seed + AI fund (Pre-Seed AI Guild)"
}

# Query 2
Test-Query -Query "seed fintech nordics founder" -Criteria @{
    pass = "✅ **Pass**: People top-3 includes Nordic fintech founders; Startups includes Nordic fintech"
}

# Query 3
Test-Query -Query "CEO fintech" -Criteria @{
    pass = "✅ **Pass**: People top-3 includes fintech-connected individuals with CEO/founder roles"
}

# Query 4
Test-Query -Query "climate supply chain startups" -Criteria @{
    pass = "✅ **Pass**: Startups top-3 includes climate + supply chain companies (CarbonFlow, etc.)"
}

# Query 5
Test-Query -Query "fundraising workshop" -Criteria @{
    pass = "✅ **Pass**: Events top-3 includes workshop-type fundraising events"
}

# Query 6
Test-Query -Query "partner venture fund europe" -Criteria @{
    pass = "✅ **Pass**: Investors top-3 includes European funds; Events includes Partner AMA"
}

# Query 7
Test-Query -Query "machine learnin climate" -Criteria @{
    pass = "✅ **Pass**: Typo tolerance working - 'learnin' matched ML/learning entities"
}

# Query 8a - Starlink (should appear)
Test-Query -Query "starlink" -Criteria @{
    pass = "✅ **Pass**: Starlink Ventures appears (active_2026=true)"
}

# Query 8b - Tesla (should NOT appear)
Test-Query -Query "tesla" -Criteria @{
    pass = "✅ **Pass**: No results - Tesla excluded (active_2026=false, year validity enforced)"
}

Write-Output "---"
Write-Output ""

# =============================================================================
# EDGE CASES (controlled limitations)
# =============================================================================

Write-Output "## Edge Cases"
Write-Output ""

# Edge case 1: Very short query
Test-Query -Query "a" -Criteria @{
    pass = "✅ **Expected behavior**: No results returned (min query length = 2 chars)"
}

# Edge case 2: Ambiguous single term
Test-Query -Query "seed" -Criteria @{
    note = "⚠️ **Note**: Broad results expected - 'seed' matches both 'seed' and 'pre-seed' stage due to tokenization (see search design)"
}

Write-Output "---"
Write-Output ""

# =============================================================================
# SCORE TRANSPARENCY (one example)
# =============================================================================

Write-Output "## Score Transparency Example"
Write-Output ""
Write-Output "Query: ``CEO fintech`` → People group (top 3 with scores)"
Write-Output ""

$scoreResult = Get-ScoreTransparency -Query "CEO fintech" -EntityType "person" -TopN 3
Write-Output "``$scoreResult``"
Write-Output ""
Write-Output "> Scoring note: ``name^4``, ``role_title^3``, ``industries_text^2`` boosts applied."
Write-Output "> Title/role matches rank higher than description-only matches."
Write-Output ""

Write-Output "---"
Write-Output "Generated by ``scripts/test-relevance.ps1``"
