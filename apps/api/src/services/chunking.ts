/* Chunking service - splits long text into fixed-size chunks for BM25 optimization
Paragraph-first splitting preserves semantic boundaries where possible
Overlapping windows prevent term loss at chunk boundaries
Deterministic algorithm ensures idempotent indexing */

const MAX_CHARS = 400;
const OVERLAP_CHARS = 60;
const MIN_CHUNK_LENGTH = 30;

/* TextChunk - A single chunk of text from an entity description
Guarantees:
- index: deterministic, zero-based, monotonic, gapless (0, 1, 2, ...)
- content: trimmed, non-empty string (min MIN_CHUNK_LENGTH chars unless only chunk)
- isHeader: true only for chunk at index 0, false for all others */
export interface TextChunk {
  index: number;
  content: string;
  isHeader: boolean;
}

/* splitToChunks - Splits text into overlapping chunks for ES indexing
Deterministic chunking invariants:
- Same input text always yields identical chunks (pure function)
- index is monotonic and gapless: [0, 1, 2, ...]
- chunks[0].isHeader === true, all others false
- Overlap is applied only forward (end of chunk N overlaps start of chunk N+1)
- Empty input returns empty array
Algorithm:
1. Split by double newlines (paragraphs) first - preserves semantic boundaries
2. Accumulate paragraphs until buffer exceeds maxChars
3. Slice long buffers into fixed windows with overlapChars overlap
4. Trim whitespace and discard tiny chunks (< MIN_CHUNK_LENGTH) unless only chunk
5. Re-index to ensure gapless sequence after filtering
@param text - Raw text to chunk (description field)
@param maxChars - Maximum characters per chunk (default 400)
@param overlapChars - Overlap between chunks (default 60, ~15%)
@returns Array of TextChunk with deterministic index, content, and isHeader */
export function splitToChunks(
  text: string,
  maxChars: number = MAX_CHARS,
  overlapChars: number = OVERLAP_CHARS
): TextChunk[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunks: TextChunk[] = [];

  // Split by paragraphs first (double newlines)
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

  // Process each paragraph into fixed-size windows
  let currentText = '';

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    // If adding this paragraph would exceed max, flush current and start new
    if (currentText.length > 0 && currentText.length + trimmedParagraph.length + 2 > maxChars) {
      // Flush current buffer as chunks
      flushTextToChunks(currentText, chunks, maxChars, overlapChars);
      currentText = '';
    }
    // Add paragraph to buffer
    if (currentText.length > 0) {
      currentText += '\n\n' + trimmedParagraph;
    } else {
      currentText = trimmedParagraph;
    }
    // If buffer exceeds max, flush it
    if (currentText.length >= maxChars) {
      flushTextToChunks(currentText, chunks, maxChars, overlapChars);
      currentText = '';
    }
  }
  // Flush remaining text
  if (currentText.trim().length > 0) {
    flushTextToChunks(currentText, chunks, maxChars, overlapChars);
  }
  // Filter out tiny chunks (unless it's the only chunk)
  const filteredChunks = chunks.filter((chunk, idx) => {
    if (chunks.length === 1) return true;
    return chunk.content.length >= MIN_CHUNK_LENGTH;
  });
  // Re-index and mark header
  return filteredChunks.map((chunk, idx) => ({
    index: idx,
    content: chunk.content,
    isHeader: idx === 0,
  }));
}

/* flushTextToChunks - Helper to slice text buffer into overlapping windows
Handles text longer than maxChars by creating overlapping chunks */

function flushTextToChunks(
  text: string,
  chunks: TextChunk[],
  maxChars: number,
  overlapChars: number
): void {
  const trimmed = text.trim();
  if (trimmed.length === 0) return;

  if (trimmed.length <= maxChars) {
    // Fits in one chunk
    chunks.push({
      index: chunks.length,
      content: trimmed,
      isHeader: chunks.length === 0,
    });
    return;
  }

  // Slice into overlapping windows
  let start = 0;
  while (start < trimmed.length) {
    const end = Math.min(start + maxChars, trimmed.length);
    const chunkContent = trimmed.slice(start, end).trim();

    if (chunkContent.length > 0) {
      chunks.push({
        index: chunks.length,
        content: chunkContent,
        isHeader: chunks.length === 0,
      });
    }

    if (end >= trimmed.length) break;
    start = end - overlapChars;

    if (start < 0) {
      start = end;
    }
  }
}

/* buildTitle - Produces a short, human-readable summary line for display
Purpose:
- Displayed as subtitle in search result cards
- Used as fallback snippet when no content highlight exists
- Provides context beyond just the entity name
Why title exists separately from name:
- name is the entity identifier (e.g., "John Doe", "Acme Corp")
- title provides context (e.g., "CEO at Acme Corp", "Series A fintech")
Derivation by entity type:
- Person: "<role_title> at <company_name>" or role/company alone
- Event: "<event_type>" (e.g., "Workshop", "Keynote")
- Startup/Investor: first line of description (≤200 chars) or name
Examples:
- Person: "CEO at Acme Corp", "Software Engineer"
- Event: "Workshop", "Panel Discussion"
- Startup: "AI-powered logistics platform" (from description) */

export function buildTitle(entity: {
  name: string;
  entity_type: string;
  role_title?: string | null;
  company_name?: string | null;
  event_type?: string | null;
  description?: string | null;
}): string {
  if (entity.entity_type === 'person') {
    if (entity.role_title && entity.company_name) {
      return `${entity.role_title} at ${entity.company_name}`;
    }
    if (entity.role_title) return entity.role_title;
    if (entity.company_name) return entity.company_name;
  }

  if (entity.entity_type === 'event' && entity.event_type) {
    return entity.event_type;
  }

  if (entity.description) {
    const firstLine = entity.description.split('\n')[0].trim();
    if (firstLine.length > 0 && firstLine.length <= 200) {
      return firstLine;
    }
  }

  return entity.name;
}
