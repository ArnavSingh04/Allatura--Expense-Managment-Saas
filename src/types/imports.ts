/**
 * Types for the generic import pipeline (`/v1/imports/*`).
 *
 * These mirror the backend's `publicSession()` response shape. The backend is
 * the authority: every mutating endpoint returns a whole session, so the client
 * never assembles one itself.
 */

/** Entity types the backend has an import strategy for. */
export const IMPORT_ENTITY_TYPES = [
  'projects',
  'suppliers',
  'subcontractors',
  'contracts',
  'variations',
  'payment-claims',
] as const;
export type ImportEntityType = (typeof IMPORT_ENTITY_TYPES)[number];

/** What the user picks on step 1 — a single entity, or a zip holding several. */
export type ImportTarget = ImportEntityType | 'pack';

/**
 * The order the backend imports pack members in. Later files may reference
 * codes and names defined in earlier ones, so this order is load-bearing and
 * the UI renders members in it rather than in archive order.
 */
export const PACK_ENTITY_ORDER = [
  'suppliers',
  'subcontractors',
  'projects',
  'contracts',
  'variations',
  'payment-claims',
] as const;

export type ImportSessionStatus =
  | 'uploaded'
  | 'mapped'
  | 'previewed'
  | 'importing'
  | 'completed'
  | 'failed';

export type DuplicatePolicy = 'skip' | 'update' | 'create';

export type ImportRowStatus = 'valid' | 'duplicate' | 'invalid';

export type ImportFieldType =
  | 'string'
  | 'email'
  | 'date'
  | 'number'
  | 'money'
  | 'boolean'
  | 'enum';

export type ImportFieldDef = {
  key: string;
  label: string;
  required: boolean;
  type: ImportFieldType;
  aliases: string[];
  enumValues?: string[];
  hint?: string;
};

export type ImportTypeDef = {
  entityType: ImportTarget;
  label: string;
  fields: ImportFieldDef[];
};

export type ImportPreviewRow = {
  row: number;
  label: string;
  status: ImportRowStatus;
  issues: string[];
  /** Id of the matched record, or `file:<row>` for an intra-file duplicate. */
  existingId: string | null;
  action: DuplicatePolicy;
};

export type ImportPreviewSummary = {
  detected: number;
  valid: number;
  duplicates: number;
  invalid: number;
};

export type ImportPreview = {
  summary: ImportPreviewSummary;
  rows: ImportPreviewRow[];
};

export type ImportErrorRow = {
  entityType?: string;
  row: number;
  label: string;
  message: string;
};

export type ImportResult = {
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: ImportErrorRow[];
};

/** One entity CSV inside a zip pack. */
export type ImportPackMember = {
  entityType: ImportEntityType;
  label: string;
  fileName: string;
  headers: string[];
  rowCount: number;
  sampleRows: Record<string, string>[];
  mapping: Record<string, string>;
  fields: ImportFieldDef[];
  unmappedRequired: string[];
  duplicatePolicy: DuplicatePolicy;
  preview: ImportPreview | null;
  result: ImportResult | null;
};

export type ImportSession = {
  id: string;
  entityType: ImportTarget;
  label: string;
  status: ImportSessionStatus;
  fileName: string;
  headers: string[];
  rowCount: number;
  sampleRows: Record<string, string>[];
  /** fieldKey -> original column heading. */
  mapping: Record<string, string>;
  fields: ImportFieldDef[];
  /** For a pack these are prefixed `entityType.fieldKey`. */
  unmappedRequired: string[];
  duplicatePolicy: DuplicatePolicy;
  /** Empty for a single-entity import. */
  members: ImportPackMember[];
  preview: ImportPreview | null;
  result: ImportResult | null;
  progress: { processed: number; total: number };
  /** Spreadsheets inside a zip that did not match a known entity type. */
  skippedFiles?: string[];
};

export function isPackSession(session: ImportSession): boolean {
  return session.entityType === 'pack';
}
