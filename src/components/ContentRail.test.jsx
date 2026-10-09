import '@testing-library/jest-dom/vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ContentRail from './ContentRail';

const items = Array.from({ length: 20 }, (_, i) => ({ id: i, title: `Show ${i}`, name: `Show ${i}`, year: 2020 }));

afterEach(cleanup);

function setup({ scrollWidth = 2000, clientWidth = 500 } = {}) {
  const view = render(
    <MemoryRouter>
      <ContentRail title="Trending" items={items} />
    </MemoryRouter>,
  );
  const track = view.container.querySelector('.rail-track');
  Object.defineProperty(track, 'scrollWidth', { configurable: true, value: scrollWidth });
  Object.defineProperty(track, 'clientWidth', { configurable: true, writable: true, value: clientWidth });
  const scrollBy = vi.fn();
  track.scrollBy = scrollBy;
  const scrollTo = (x) =>
    act(() => {
      track.scrollLeft = x;
      fireEvent.scroll(track);
    });
  return { track, scrollBy, scrollTo };
}

const left = () => screen.getByLabelText('Scroll left');
const right = () => screen.getByLabelText('Scroll right');

describe('ContentRail arrows', () => {
  it('renders both arrows and disables only the left one at the start', () => {
    const { scrollTo } = setup();
    scrollTo(0);

    expect(left()).toHaveAttribute('aria-disabled', 'true');
    expect(right()).toHaveAttribute('aria-disabled', 'false');
  });

  it('enables both arrows in the middle of the list', () => {
    const { scrollTo } = setup();
    scrollTo(600);

    expect(left()).toHaveAttribute('aria-disabled', 'false');
    expect(right()).toHaveAttribute('aria-disabled', 'false');
  });

  it('disables only the right arrow at the end of the list', () => {
    const { scrollTo } = setup();
    scrollTo(1500);

    expect(right()).toHaveAttribute('aria-disabled', 'true');
    expect(left()).toHaveAttribute('aria-disabled', 'false');
  });

  it('keeps both arrows disabled when the content fits without scrolling', () => {
    const { scrollTo } = setup({ scrollWidth: 400, clientWidth: 500 });
    scrollTo(0);

    expect(left()).toHaveAttribute('aria-disabled', 'true');
    expect(right()).toHaveAttribute('aria-disabled', 'true');
  });

  it('does not scroll when a disabled arrow is clicked', () => {
    const { scrollBy, scrollTo } = setup();
    scrollTo(0);

    fireEvent.click(left());

    expect(scrollBy).not.toHaveBeenCalled();
  });

  it('scrolls in the right direction when an enabled arrow is clicked', () => {
    const { scrollBy, scrollTo } = setup();
    scrollTo(600);

    fireEvent.click(right());
    fireEvent.click(left());

    expect(scrollBy).toHaveBeenNthCalledWith(1, expect.objectContaining({ left: 375 }));
    expect(scrollBy).toHaveBeenNthCalledWith(2, expect.objectContaining({ left: -375 }));
  });

  it('re-enables an arrow after the window is resized', () => {
    const { track, scrollTo } = setup();
    scrollTo(1500);
    expect(right()).toHaveAttribute('aria-disabled', 'true');

    track.clientWidth = 100;
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    expect(right()).toHaveAttribute('aria-disabled', 'false');
  });

  it('keeps keyboard focus on an arrow when it becomes disabled', () => {
    const { scrollTo } = setup();
    scrollTo(600);
    right().focus();

    scrollTo(1500);

    expect(right()).toHaveAttribute('aria-disabled', 'true');
    expect(right()).toHaveFocus();
  });
});