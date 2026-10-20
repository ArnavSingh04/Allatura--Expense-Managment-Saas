/**
 * Client-side upload limits for the import wizard.
 *
 * These mirror the backend's own caps (`MAX_IMPORT_FILE_BYTES`,
 * `MAX_IMPORT_ZIP_BYTES` in `plutus-be/src/imports/imports.types.ts`) and must
 * stay at or below them — the server remains the enforcement point. Checking
 * here is purely so the user gets a clear message instead of a round trip.
 *
 * The real ceiling is usually the Next proxy rather than the backend: it
 * buffers the whole request body in memory, and a serverless deploy typically
 * caps request bodies around 4.5 MB.
 */
export const MAX_SHEET_BYTES = 4 * 1024 * 1024;
export const MAX_ZIP_BYTES = 4 * 1024 * 1024;

export const SHEET_EXTENSIONS = ['.csv', '.xlsx', '.xls'] as const;
export const ZIP_EXTENSIONS = ['.zip'] as const;

/** `accept` for a single-entity import. */
export const ACCEPT_SHEET = SHEET_EXTENSIONS.join(',');
/** `accept` when either a sheet or a pack is allowed. */
export const ACCEPT_ANY = [...SHEET_EXTENSIONS, ...ZIP_EXTENSIONS].join(',');

export function fileExtension(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot).toLowerCase();
}

export function isZipFile(name: string): boolean {
  return fileExtension(name) === '.zip';
}

export function isSheetFile(name: string): boolean {
  return (SHEET_EXTENSIONS as readonly string[]).includes(fileExtension(name));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
