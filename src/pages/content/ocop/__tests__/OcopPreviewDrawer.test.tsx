import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OcopPreviewDrawer } from '../OcopPreviewDrawer';
import { EMPTY_OCOP_FORM } from '../ocop.schema';

describe('OcopPreviewDrawer', () => {
  it('does not render an empty telephone link for legacy data', () => {
    render(<OcopPreviewDrawer open values={{ ...EMPTY_OCOP_FORM, contactPhone: '' }} onClose={() => undefined} />);

    expect(screen.getByText('Chưa có số liên hệ')).toBeInTheDocument();
    expect(document.querySelector('a[href^="tel:"]')).not.toBeInTheDocument();
  });
});
