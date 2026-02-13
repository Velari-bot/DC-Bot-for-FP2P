/**
 * Data Normalizer
 * Deduplicates and merges records
 */

import { FortniteRecord } from './types';

export function deduplicateRecords(
  existing: FortniteRecord[],
  newRecords: FortniteRecord[]
): { merged: FortniteRecord[]; newCount: number } {
  const existingIds = new Set(existing.map(r => r.id));
  const trulyNew: FortniteRecord[] = [];

  for (const record of newRecords) {
    if (!existingIds.has(record.id)) {
      trulyNew.push(record);
      existingIds.add(record.id);
    }
  }

  // Merge: newest first
  const merged = [...trulyNew, ...existing];

  console.log(`  🔄 Deduplication: ${newRecords.length} fetched, ${trulyNew.length} new, ${merged.length} total`);

  return { merged, newCount: trulyNew.length };
}

export function pruneRecords(records: FortniteRecord[], maxRecords: number): FortniteRecord[] {
  if (records.length <= maxRecords) {
    return records;
  }

  // Sort by created_at descending (newest first)
  const sorted = [...records].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const pruned = sorted.slice(0, maxRecords);
  
  console.log(`  ✂️  Pruned ${records.length - pruned.length} old records (kept ${pruned.length})`);

  return pruned;
}

export function validateRecord(record: FortniteRecord): boolean {
  return !!(
    record.id &&
    record.source &&
    record.content &&
    record.created_at
  );
}

export function normalizeRecords(records: FortniteRecord[]): FortniteRecord[] {
  return records
    .filter(validateRecord)
    .map(record => ({
      ...record,
      // Ensure content is string
      content: String(record.content || '').trim(),
      // Ensure tags is array
      tags: Array.isArray(record.tags) ? record.tags : [],
      // Normalize created_at
      created_at: normalizeDate(record.created_at),
    }));
}

function normalizeDate(date: string | Date): string {
  try {
    return new Date(date).toISOString();
  } catch {
    return new Date().toISOString();
  }
}

