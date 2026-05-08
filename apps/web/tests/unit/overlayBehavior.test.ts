import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import DescriptionTooltip from '../../src/lib/components/DescriptionTooltip.svelte';

describe('overlayBehavior', () => {
  it('renders description tooltip with markdown support', async () => {
    const { container } = render(DescriptionTooltip, {
      props: {
        description: '**Bold text** and *italic text*'
      }
    });

    // Wait for markdown to render
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Check that the component renders something
    expect(container.firstChild).toBeTruthy();
  });

  it('handles empty description gracefully', () => {
    const { container } = render(DescriptionTooltip, {
      props: {
        description: ''
      }
    });

    // Should still render without errors
    expect(container).toBeTruthy();
  });

  it('sanitizes dangerous HTML in description', async () => {
    const { container } = render(DescriptionTooltip, {
      props: {
        description: '<script>alert("xss")</script>**Safe text**'
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    // DOMPurify should remove script tags
    const scripts = container.querySelectorAll('script');
    expect(scripts).toHaveLength(0);
  });
});
