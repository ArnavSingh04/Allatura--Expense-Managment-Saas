/** Accept local absolute paths; reject URL parser normalisation into another host. */
export function safeReturnTo(value: string | null | undefined, fallback = '/dashboard'): string {
  // Reject backslashes and control characters before URL parsing can reinterpret them.
  if (!value || !value.startsWith('/') || value.startsWith('//') || /[\\\u0000-\u0020\u007f]/.test(value)) return fallback;
  try {
    const origin = 'https://return-path.invalid';
    return new URL(value, origin).origin === origin ? value : fallback;
  } catch {
    return fallback;
  }
}
