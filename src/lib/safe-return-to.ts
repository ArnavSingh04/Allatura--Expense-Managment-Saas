/** Accept local absolute paths. Callers must supply a trusted local fallback. */
export function safeReturnTo(value: string | null | undefined, fallback = '/dashboard'): string {
  // Reject backslashes and control characters before URL parsing can reinterpret them.
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020\u007f]/.test(value)) return fallback;
  try {
    // Use a fixed origin to detect host changes without depending on the current
    // page. Return the original path so its query and fragment remain intact.
    const origin = 'https://return-path.invalid';
    return new URL(value, origin).origin === origin ? value : fallback;
  } catch {
    return fallback;
  }
}
