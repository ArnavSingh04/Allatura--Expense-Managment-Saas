import {
  PACK_ENTITY_ORDER,
  type ImportEntityType,
  type ImportPreview,
  type ImportResult,
  type ImportSession,
  type ImportFieldDef,
} from '@/types/imports';

/**
 * One mappable file, whether it came from a single-entity upload or from one
 * member of a zip pack.
 *
 * This normalisation is the spine of the wizard: a single-entity session
 * becomes a one-element array, a pack becomes its members. Every component
 * below step level consumes `MemberView[]` and never asks which mode it is in.
 */
export type MemberView = {
  /**
   * Which pack member this is, or `null` for a single-entity session.
   * Passed back to the API as the `member` field on mapping and row calls.
   */
  member: ImportEntityType | null;
  entityType: string;
  label: string;
  fileName: string;
  headers: string[];
  rowCount: number;
  sampleRows: Record<string, string>[];
  mapping: Record<string, string>;
  fields: ImportFieldDef[];
  unmappedRequired: string[];
  duplicatePolicy: 'skip' | 'update' | 'create';
  preview: ImportPreview | null;
  result: ImportResult | null;
};

/** Stable key for React lists and for the selected-member state. */
export function memberKey(view: MemberView): string {
  return view.member ?? '__single__';
}

/**
 * A pack reports `unmappedRequired` as `entityType.fieldKey` so one flat list
 * can describe every member. Within a member view we want the bare key.
 */
export function stripMemberPrefix(entry: string, member: string): string {
  const prefix = `${member}.`;
  return entry.startsWith(prefix) ? entry.slice(prefix.length) : entry;
}

/**
 * Normalise a session into the member list the UI renders.
 *
 * Pack members are returned in the backend's import order, not archive order,
 * because later files may reference codes defined in earlier ones and showing
 * them in that order is what teaches the user the rule.
 */
export function memberViews(session: ImportSession): MemberView[] {
  if (session.entityType !== 'pack') {
    return [
      {
        member: null,
        entityType: session.entityType,
        label: session.label,
        fileName: session.fileName,
        headers: session.headers,
        rowCount: session.rowCount,
        sampleRows: session.sampleRows,
        mapping: session.mapping,
        fields: session.fields,
        unmappedRequired: session.unmappedRequired,
        duplicatePolicy: session.duplicatePolicy,
        preview: session.preview,
        result: session.result,
      },
    ];
  }

  const order = new Map<string, number>(
    PACK_ENTITY_ORDER.map((entity, index) => [entity, index]),
  );

  return [...session.members]
    .sort(
      (a, b) =>
        (order.get(a.entityType) ?? Number.MAX_SAFE_INTEGER) -
        (order.get(b.entityType) ?? Number.MAX_SAFE_INTEGER),
    )
    .map((m) => ({
      member: m.entityType,
      entityType: m.entityType,
      label: m.label,
      fileName: m.fileName,
      headers: m.headers,
      rowCount: m.rowCount,
      sampleRows: m.sampleRows,
      mapping: m.mapping,
      fields: m.fields,
      // The member's own list is already bare, but a pack's top-level list is
      // prefixed. Normalise defensively so callers never have to care.
      unmappedRequired: m.unmappedRequired.map((entry) =>
        stripMemberPrefix(entry, m.entityType),
      ),
      duplicatePolicy: m.duplicatePolicy,
      preview: m.preview,
      result: m.result,
    }));
}

/** True when every member has all its required fields mapped. */
export function allRequiredMapped(session: ImportSession): boolean {
  return memberViews(session).every((v) => v.unmappedRequired.length === 0);
}

/** The first member still missing a required mapping, for the nudge banner. */
export function firstIncompleteMember(
  session: ImportSession,
): MemberView | null {
  return memberViews(session).find((v) => v.unmappedRequired.length > 0) ?? null;
}

/** True once every member has a preview, so Review can advance to Import. */
export function allPreviewed(session: ImportSession): boolean {
  return memberViews(session).every((v) => v.preview !== null);
}

export type PreviewTotals = {
  detected: number;
  valid: number;
  duplicates: number;
  invalid: number;
  /** Rows that would actually be written: valid, plus duplicates not skipped. */
  importable: number;
};

export function previewTotals(session: ImportSession): PreviewTotals {
  return memberViews(session).reduce<PreviewTotals>(
    (acc, view) => {
      const summary = view.preview?.summary;
      if (!summary) return acc;
      const notSkipped = (view.preview?.rows ?? []).filter(
        (r) => r.status === 'duplicate' && r.action !== 'skip',
      ).length;
      return {
        detected: acc.detected + summary.detected,
        valid: acc.valid + summary.valid,
        duplicates: acc.duplicates + summary.duplicates,
        invalid: acc.invalid + summary.invalid,
        importable: acc.importable + summary.valid + notSkipped,
      };
    },
    { detected: 0, valid: 0, duplicates: 0, invalid: 0, importable: 0 },
  );
}

export type ResultTotals = {
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
};

/**
 * Totals for the result screen.
 *
 * A pack reports a rolled-up `session.result`; a single import reports its own.
 * Falling back to summing members keeps this correct if either side is absent.
 */
export function resultTotals(session: ImportSession): ResultTotals {
  if (session.result) {
    const { imported, updated, skipped, failed } = session.result;
    return { imported, updated, skipped, failed };
  }
  return memberViews(session).reduce<ResultTotals>(
    (acc, view) => ({
      imported: acc.imported + (view.result?.imported ?? 0),
      updated: acc.updated + (view.result?.updated ?? 0),
      skipped: acc.skipped + (view.result?.skipped ?? 0),
      failed: acc.failed + (view.result?.failed ?? 0),
    }),
    { imported: 0, updated: 0, skipped: 0, failed: 0 },
  );
}

/** Every failed row across the session, for the result screen's error list. */
export function allErrorRows(session: ImportSession) {
  if (session.result?.errors?.length) return session.result.errors;
  return memberViews(session).flatMap((view) =>
    (view.result?.errors ?? []).map((e) => ({
      ...e,
      entityType: e.entityType || view.entityType,
    })),
  );
}

/** Columns present in the file that no field maps to — shown as a hint. */
export function unmappedHeaders(view: MemberView): string[] {
  const used = new Set(Object.values(view.mapping).filter(Boolean));
  return view.headers.filter((h) => !used.has(h));
}

/**
 * Which step a session should resume on, so a reload doesn't drop the user
 * back at the file picker.
 */
export function stepForStatus(session: ImportSession): number {
  switch (session.status) {
    case 'uploaded':
    case 'mapped':
      return 1;
    case 'previewed':
      return 2;
    case 'importing':
    case 'completed':
    case 'failed':
      return 3;
    default:
      return 0;
  }
}
