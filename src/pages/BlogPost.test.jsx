import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import BlogPost from './BlogPost';

afterEach(cleanup);

beforeEach(() => {
  document.title = '';
  document.querySelectorAll('meta[name="robots"]').forEach((meta) => meta.remove());
});

function renderBlogPost(path) {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/blog/:slug" element={<BlogPost />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  );
}

describe('BlogPost for an unknown slug', () => {
  it('renders the not-found empty state with a link back to the blog', () => {
    renderBlogPost('/blog/this-post-does-not-exist');

    expect(screen.getByRole('heading', { name: 'Post not found' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Back to Blog' })).toHaveAttribute('href', '/blog');
  });

  it('sets a "Post not found" title and marks the page noindex', async () => {
    renderBlogPost('/blog/this-post-does-not-exist');

    await waitFor(() => {
      expect(document.title).toBe('Post not found | Kinshow');
    });
    expect(document.querySelector('meta[name="robots"]')).toHaveAttribute(
      'content',
      'noindex, nofollow',
    );
  });
});
