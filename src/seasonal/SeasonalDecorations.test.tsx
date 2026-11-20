import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import SeasonalDecorations from './SeasonalDecorations';
import { getSeasonalTheme } from './seasonalModel';

describe('SeasonalDecorations', () => {
  it('на 31 декабря рисует максимальный набор украшений', () => {
    const { container } = render(<SeasonalDecorations theme={getSeasonalTheme(new Date(2026, 11, 31))} />);

    expect(container.querySelectorAll('.seasonal-snowflake')).toHaveLength(64);
    expect(container.querySelector('.seasonal-garland.is-gold')).toBeTruthy();
    expect(container.querySelector('.seasonal-fireworks')).toBeTruthy();
  });

  it('вне сезона ничего не рисует', () => {
    const { container } = render(<SeasonalDecorations theme={getSeasonalTheme(new Date(2026, 10, 30))} />);
    expect(container.firstChild).toBeNull();
  });
});
