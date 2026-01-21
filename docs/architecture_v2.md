# Architecture Plan v2 — Bulletproof Chunked Full‑Text Search + Highlighting (4‑hour scope)

This plan is intentionally **small, robust, and reviewer-friendly**. It focuses on **BM25 relevance + highlighting + operational safety** (aliases, bulk ingest, idempotency), and explicitly postpones higher-risk features (ICU plugins, vectors, joins).

---

## 0) Goals, constraints, and “done” definition

### Goals
- Turn the current “directory search” into a **full-text discovery engine** that can match terms inside long descriptions.
- Return **explainable snippets** (highlights) so the UI can show *where* the match happened.
- Keep indexing and search **operationally safe** (zero-downtime reindex, idempotent docs).

### Constraints
- Timebox: **4 hours**
- Data: ~40k entities, potentially 200k+ chunks after splitting
- Multilingual-ish content, but **no plugins** in MVP (avoid ICU dependency)

### Done = ✅
- `/admin/reindex` builds a new index, bulk ingests chunks, and swaps an alias atomically.
- `GET /search?q=...` returns **deduplicated entities** (1 best chunk per entity) and **highlight snippets** when the match is in `content`.
- Reindex can be run twice without duplicates (deterministic ES `_id`).

---

## 1) Data & chunking (0–40 min)

### 1.1 What we index
We index **chunk documents** into Elasticsearch (no parent/child joins). Each chunk doc contains:
- identifiers: `entity_id`, `entity_type`, `chunk_index`
- search text fields: `name`, `title`, `content`
- optional flag: `is_header_chunk` (true only for chunk 0)

> Why duplicate `name/title` in each chunk?  
> It enables a single index/query path. To avoid unpredictable ranking, **keep name/title identical across all chunks for the same entity**.

### 1.2 Chunk ID strategy (idempotency)
Use a deterministic `_id` for ES chunk docs:
- `_id = "${entity_id}_${chunk_index}"`

This guarantees:
- reindex is idempotent (documents update, not duplicate)
- partial retries are safe

### 1.3 Chunking algorithm (choose simplicity first)
A fully “smart” recursive splitter can be time-consuming and bug-prone in a 4-hour sprint.

**MVP splitter (recommended for speed and safety):**
1) `split("\n\n")` into paragraphs  
2) For each paragraph, slice into fixed windows of `MAX_CHARS` with `OVERLAP_CHARS` overlap  
3) Trim and discard empty chunks  
4) Ensure we never produce chunks shorter than e.g. 30 chars unless it’s the only chunk

Parameters:
- `MAX_CHARS = 400`
- `OVERLAP_CHARS = 60` (≈ 15%)
- `is_header_chunk = chunk_index === 0`

> This avoids “off-by-one” sentence parsing mistakes while still preventing boundary loss via overlap.

---

## 2) Elasticsearch index mapping (40–80 min)

### 2.1 “No plugin” analyzer choice
We use only built-in components:
- `standard` tokenizer
- `lowercase`
- `asciifolding`

This is stable in Docker and good enough for MVP.

### 2.2 Operational settings
- `number_of_shards: 1`
- `number_of_replicas: 0`
- `dynamic: "strict"` to catch accidental field drift during ingest

### 2.3 Final JSON mapping (copy/paste ready)

> Note: field-level `boost` in mappings is not supported for `text` in modern Elasticsearch the way people expect.  
> We apply boosting **in the query** (`name^5`, etc.).

```json
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 0,
    "analysis": {
      "analyzer": {
        "slush_content_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "asciifolding"]
        },
        "slush_name_analyzer": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "asciifolding"]
        }
      }
    }
  },
  "mappings": {
    "dynamic": "strict",
    "properties": {
      "entity_id": { "type": "keyword" },
      "entity_type": { "type": "keyword" },
      "chunk_index": { "type": "integer" },
      "is_header_chunk": { "type": "boolean" },

      "name": {
        "type": "text",
        "analyzer": "slush_name_analyzer"
      },
      "title": {
        "type": "text",
        "analyzer": "slush_name_analyzer"
      },
      "content": {
        "type": "text",
        "analyzer": "slush_content_analyzer",
        "term_vector": "with_positions_offsets"
      }
    }
  }
}
```

**Why this works**
- `term_vector: with_positions_offsets` enables fast/high-quality highlighting on longer text fields.
- `entity_id` as `keyword` is required for `collapse` to deduplicate per entity.
- Built-in analyzers avoid plugin failures (ICU) under time pressure.

---

## 3) Safe reindex pipeline (80–140 min)

### 3.1 High-level flow
1) Acquire Postgres advisory lock
2) Create new physical index `slush_chunks_v2_<timestamp>` with mapping above
3) Read entities from Postgres in batches
4) Produce chunk docs (+ deterministic `_id`)
5) Bulk ingest using `_bulk` / `helpers.bulk`
6) Atomically swap alias `slush_chunks_current` to the new index
7) If bulk fails mid-way: delete the incomplete new index
8) Release advisory lock

### 3.2 Advisory lock
- `SELECT pg_advisory_lock(42);`
- `SELECT pg_advisory_unlock(42);`

### 3.3 Bulk ingest mechanics (memory-safe)
Expected scale: ~200k+ chunk docs.

Recommendations:
- DB fetch: 100–200 entities per batch
- Bulk: 500–1000 chunk docs per request
- Insert an `await` between bulks (optionally tiny sleep) to avoid heap pressure on a small ES JVM
- Log progress: `Indexed <chunks_done>/<chunks_total_estimate>`

If Elasticsearch struggles with 512MB:
- increase to 1GB quickly; time is worth more than memory.

---

## 4) Search API: ranking + dedup + highlighting (140–200 min)

### 4.1 Deduplication via collapse
Chunks create multiple hits per entity. The UI must not show duplicates.

Use:
```json
"collapse": { "field": "entity_id" }
```

### 4.2 Ranking (BM25) with query-time boosts
We boost name/title higher than content, and optionally boost header chunks.

**Core query:**
- `multi_match` over `name`, `title`, `content`
- query-time boosts: `name^5`, `title^3`, `content^1`

**Optional (nice signal):** boost `is_header_chunk:true` in a `should` clause:
- Helps the “summary chunk” win if several chunks match equally.

### 4.3 Highlighting
Return snippets from `content`:

```json
"highlight": {
  "pre_tags": ["<mark>"],
  "post_tags": ["</mark>"],
  "fields": {
    "content": {
      "fragment_size": 150,
      "number_of_fragments": 1
    }
  }
}
```

### 4.4 Response contract (what FE consumes)
For each result hit:
- `entity_id`
- `entity_type`
- `chunk_index`
- `highlight.content[0]` (optional)
- fallback text fields (one-liner/title) for when highlight is absent

---

## 5) Frontend integration + safety (200–240 min)

### 5.1 UI logic
- Group results by `entity_type`
- For each card:
  - show `name`
  - show snippet:
    - if `highlight.content[0]` exists → render it
    - else show `one_liner` or short description

### 5.2 XSS safety for highlight
Only render the highlight snippet via `dangerouslySetInnerHTML`.
Do not render any other untrusted HTML.

Because `<mark>` is generated by ES, it’s relatively safe, but still treat it as untrusted and scope it tightly.

---

## 6) Concrete implementation checklist (exact work)

### Backend (Node/Express, TypeScript)
1) `splitToChunks(text, MAX_CHARS=400, OVERLAP=60)` (paragraph split + slicing)
2) ES index initializer: `createChunksIndex(indexName, mappingJson)`
3) `/admin/reindex`
   - `pg_advisory_lock(42)`
   - create `slush_chunks_v2_<timestamp>`
   - bulk ingest chunk docs with deterministic `_id`
   - alias swap to `slush_chunks_current`
   - delete old index (optional) + unlock
4) `GET /search?q=...`
   - query alias `slush_chunks_current`
   - `collapse` by `entity_id`
   - boosts + highlight
   - group by `entity_type`

### Elasticsearch
- Alias used by search code: **`slush_chunks_current`**
- Physical index naming: `slush_chunks_v2_<timestamp>`

---

## 7) Explicitly postponed (Iteration 2/3)
- synonyms pipeline
- vector search / HNSW
- ICU analyzers
- parent-child joins

Ship BM25 + highlight first; then iterate.

---

## 8) Quick acceptance tests
- Reindex twice → chunk count stable, no duplicates (same `_id`)
- Query matches in long text → highlight appears
- Same entity never appears twice (collapse works)
- Search stays live during reindex (alias swap)

---

## 9) Example chunk doc (indexed)
```json
{
  "_id": "startup_123_0",
  "entity_id": "startup_123",
  "entity_type": "startup",
  "chunk_index": 0,
  "is_header_chunk": true,
  "name": "RunX",
  "title": "RunX generates a personalized and safe route for running",
  "content": "RunX generates a personalized and safe route for running..."
}
```

Этот обновленный план версии 2 является **эталонным для 4-часового спринта**. Он устраняет риски, связанные с внешними плагинами, и фокусируется на надежности промышленного уровня.

### Оценка и комментарий к финальному плану

**Главное преимущество:** Выбор стратегии **"Index chunks as separate documents"** (индексация чанков как отдельных документов) вместо сложных Join-связей. Это позволяет использовать мощный алгоритм **BM25** на коротких, семантически плотных фрагментах текста, что значительно повышает релевантность по сравнению с поиском по огромным неразбитым описаниям.

#### Ключевые архитектурные решения:

* **Идемпотентность через детерминированные ID:** Использование схемы `_id = "${entity_id}_${chunk_index}"` гарантирует, что при повторном запуске `/admin/reindex` данные будут обновляться, а не дублироваться, даже если процесс был прерван и запущен заново.
* **Производительность Highlighting:** Настройка `term_vector: "with_positions_offsets"` — это «золотой стандарт». Она перекладывает нагрузку по расчету позиций слов с момента поиска на момент индексации, что критично для быстрого ответа API.
* **Операционная безопасность:** Использование **Postgres Advisory Lock (42)** и **Atomic Alias Swap** превращает ваш MVP в систему, готовую к эксплуатации (production-ready). Поиск никогда не увидит «частичных» данных во время переиндексации.

---

### Детальный обзор реализации (Action Plan)

| Этап | Задача | Технический нюанс |
| --- | --- | --- |
| **1. Чанкование** | `split("\n\n")` + `slice` | Не забудьте про **overlap (60 симв.)**. Это гарантирует, что если фраза "Raspberry Pi" будет разрезана, она попадет целиком либо в конец первого, либо в начало второго чанка. |
| **2. Маппинг** | Создание индекса через JSON | Убедитесь, что `entity_id` имеет тип `keyword`. Без этого функция `collapse` (дедупликация) выдаст ошибку. |
| **3. Реиндекс** | `helpers.bulk` | При масштабе 200k+ чанков делайте паузы между батчами. Если ElasticSearch запущен с 512MB RAM, это предотвратит падение JVM. |
| **4. Поиск** | `collapse` + `boost` | Используйте `name^5`. Имя сущности всегда должно иметь приоритет над текстом в описании. |
| **5. Frontend** | `dangerouslySetInnerHTML` | Отображайте `highlight.content[0]` только если он есть. Если совпадение было в заголовке, подсветки в контенте не будет — предусмотрите fallback на `one_liner`. |

### Обход сложностей и советы:

1. **Ограничение памяти:** Если контейнер Elasticsearch падает, первым делом проверьте `ES_JAVA_OPTS`. Для 200k чанков лучше сразу выделить **1GB heap**.
2. **Отладка:** Используйте команду `GET /slush_chunks_current/_search` в Kibana или через `curl`, чтобы увидеть "сырые" баллы (`_score`) и понять, почему один чанк выше другого.
3. **Deduplication:** Помните, что `collapse` возвращает только **лучший** чанк для каждой сущности. Это идеально для чистого UI без повторов.
