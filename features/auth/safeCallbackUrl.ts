export function safeCallbackUrl(
  value: string | string[] | undefined,
): string {
  if (
    typeof value !== 'string' ||
    !value.startsWith('/') ||
    value.startsWith('//') ||
    value.includes('\\')
  ) {
    return '/';
  }
  return value;
}
