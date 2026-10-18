export function parseNames(input: string): string[] {
  const seen = new Set<string>();
  return input
    .split(/[\n,]+/)
    .map((value) => value.trim().replace(/\s+/g, ' '))
    .filter((value) => value.length > 0)
    .filter((value) => {
      const key = value.toLocaleLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}
