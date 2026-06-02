export function getLoginUrl(redirect?: string): string {
  if (redirect) {
    return `/login?redirect=${encodeURIComponent(redirect)}`;
  }
  return "/login";
}
