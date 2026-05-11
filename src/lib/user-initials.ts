/**
 * Two-letter initials for avatars from display name or email.
 */
export function userInitials(
  name?: string | null,
  email?: string | null,
): string {
  const n = (name ?? '').trim();
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      const a = parts[0][0];
      const b = parts[parts.length - 1][0];
      if (a && b) return (a + b).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase() || '?';
  }
  const e = (email ?? '').trim();
  if (e) {
    const local = e.split('@')[0] ?? e;
    return local.slice(0, 2).toUpperCase() || '?';
  }
  return '?';
}
