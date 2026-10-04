export function bookDemoHref(): string {
  const u = process.env.NEXT_PUBLIC_BOOK_DEMO_URL?.trim();
  // Falls back to the real Contact form; set NEXT_PUBLIC_BOOK_DEMO_URL to a
  // scheduling link (e.g. Calendly) to point "Book demo" at it instead.
  return u && u.length > 0 ? u : '/contact';
}

export function bookDemoIsExternal(): boolean {
  const u = process.env.NEXT_PUBLIC_BOOK_DEMO_URL?.trim();
  if (!u) return false;
  return u.startsWith('http://') || u.startsWith('https://') || u.startsWith('mailto:');
}
