/**
 * Save a Blob to the user's machine via a synthetic anchor.
 *
 * Generic on purpose — nothing here is import-specific.
 */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Safari needs the object URL to outlive the click by a tick.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
