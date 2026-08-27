import { describe, expect, it } from 'vitest';
import { MAX_NAME_LENGTH, MAX_SHARE_NAMES, parseShareNames } from './share';

describe('parseShareNames', () => {
  it('разбирает список имён', () => {
    expect(parseShareNames('?users=["Аня","Боря"]')).toEqual(['Аня', 'Боря']);
  });

  it('возвращает null без параметра', () => {
    expect(parseShareNames('')).toBeNull();
    expect(parseShareNames('?other=1')).toBeNull();
  });

  it('возвращает null на битом JSON и не-массиве', () => {
    expect(parseShareNames('?users=%7B%7D')).toBeNull();
    expect(parseShareNames('?users=не-json')).toBeNull();
  });

  it('чистит пробелы и выкидывает пустые имена', () => {
    expect(parseShareNames('?users=["  Аня  ","","   "]')).toEqual(['Аня']);
  });

  it('обрезает слишком длинные имена', () => {
    const long = 'я'.repeat(MAX_NAME_LENGTH + 50);
    const names = parseShareNames(`?users=${encodeURIComponent(JSON.stringify([long]))}`);
    expect(names?.[0]).toHaveLength(MAX_NAME_LENGTH);
  });

  it('ограничивает количество имён в ссылке', () => {
    const many = Array.from({ length: MAX_SHARE_NAMES + 50 }, (_, i) => `имя${i}`);
    const names = parseShareNames(`?users=${encodeURIComponent(JSON.stringify(many))}`);
    expect(names).toHaveLength(MAX_SHARE_NAMES);
  });

  it('отбрасывает неправдоподобно длинный параметр целиком', () => {
    const huge = JSON.stringify([('я'.repeat(1000))].concat(Array.from({ length: 200 }, () => 'я'.repeat(1000))));
    expect(parseShareNames(`?users=${encodeURIComponent(huge)}`)).toBeNull();
  });
});
