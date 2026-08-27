/**
 * Шаринг списка участников через URL: единственный параметр `users`
 * содержит массив ИМЁН (JSON). Больше ничего не передаётся.
 */

const PARAM_USERS = 'users';

/** Собирает ссылку с именами юзеров. */
export function buildShareUrl(names: string[]): string {
  const params = new URLSearchParams();
  params.set(PARAM_USERS, JSON.stringify(names));
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

/** Достаёт список имён из `search`. null, если параметра нет или он пустой. */
export function parseShareNames(search: string): string[] | null {
  try {
    const raw = new URLSearchParams(search).get(PARAM_USERS);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const names = parsed.map((n) => String(n).trim()).filter(Boolean);
    return names.length > 0 ? names : null;
  } catch {
    return null;
  }
}

/** Убирает параметры из URL, чтобы при обновлении не применились старые юзеры. */
export function clearShareParams(): void {
  window.history.replaceState(null, '', window.location.pathname + window.location.hash);
}