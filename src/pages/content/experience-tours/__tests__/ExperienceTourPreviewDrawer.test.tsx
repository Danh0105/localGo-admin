import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ExperienceTourPreviewDrawer } from '../ExperienceTourPreviewDrawer';
import { EMPTY_EXPERIENCE_TOUR_FORM } from '../experience-tour.schema';

describe('ExperienceTourPreviewDrawer', () => {
  it('does not render an empty telephone link for legacy data', () => {
    render(<ExperienceTourPreviewDrawer open values={{ ...EMPTY_EXPERIENCE_TOUR_FORM, contactPhone: '' }} onClose={() => undefined} />);

    expect(screen.getByText('Chưa có số liên hệ')).toBeInTheDocument();
    expect(document.querySelector('a[href^="tel:"]')).not.toBeInTheDocument();
  });
});
