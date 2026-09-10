export function matchesLocaleStartPath(pathname: string): boolean {
  return /^\/(ko|en)\/?$/.test(pathname);
}
