/**
 * Шаринг списка участников через URL: единственный параметр `users`
 * содержит массив ИМЁН (JSON). Больше ничего не передаётся.
 */

const PARAM_USERS = 'users';

/** Ссылку может прислать кто угодно, поэтому у входных данных есть жёсткие потолки. */
export const MAX_SHARE_NAMES = 200;
export const MAX_NAME_LENGTH = 64;
const MAX_RAW_LENGTH = 32 * 1024;

/** Нормализует имена: обрезает по длине, выкидывает пустые, ограничивает количество. */
function normalizeNames(values: unknown[]): string[] {
  return values
    .map((n) => String(n).trim().slice(0, MAX_NAME_LENGTH))
    .filter(Boolean)
    .slice(0, MAX_SHARE_NAMES);
}

/** Собирает ссылку с именами юзеров. */
export function buildShareUrl(names: string[]): string {
  const params = new URLSearchParams();
  params.set(PARAM_USERS, JSON.stringify(normalizeNames(names)));
  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

/** Достаёт список имён из `search`. null, если параметра нет, он пустой или неправдоподобно большой. */
export function parseShareNames(search: string): string[] | null {
  try {
    const raw = new URLSearchParams(search).get(PARAM_USERS);
    if (!raw || raw.length > MAX_RAW_LENGTH) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const names = normalizeNames(parsed);
    return names.length > 0 ? names : null;
  } catch {
    return null;
  }
}

/** Убирает параметры из URL, чтобы при обновлении не применились старые юзеры. */
export function clearShareParams(): void {
  window.history.replaceState(null, '', window.location.pathname + window.location.hash);
}
