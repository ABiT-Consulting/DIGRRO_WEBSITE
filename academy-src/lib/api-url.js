export function resolveApiUrl(path) {
  const value = String(path || '');
  if (!value) return window.location.href;
  if (/^(?:[a-z]+:)?\/\//i.test(value) || value.startsWith('/')) return value;

  const current = new URL(window.location.href);
  const lastSegment = current.pathname.split('/').pop() || '';
  if (!current.pathname.endsWith('/') && !lastSegment.includes('.')) {
    current.pathname += '/';
  }
  current.search = '';
  current.hash = '';

  return new URL(value, current).href;
}
