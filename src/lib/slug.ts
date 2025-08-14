export function generateSlug(length = 7) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  crypto.getRandomValues(new Uint8Array(length)).forEach((n) => {
    s += chars[n % chars.length];
  });
  return s;
}
