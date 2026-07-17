import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CuisinePreviewDrawer } from '../CuisinePreviewDrawer';
import { EMPTY_CUISINE_FORM } from '../cuisine.schema';

describe('CuisinePreviewDrawer', () => {
  it('shows a missing-link label without creating an empty Maps link', () => {
    render(
      <CuisinePreviewDrawer
        open
        values={{
          ...EMPTY_CUISINE_FORM,
          suggestedPlaces: [{ id: 'legacy-place', name: 'Quán legacy', address: '', googleMapsUrl: '' }],
        }}
        onClose={() => undefined}
      />,
    );

    expect(screen.getByText('Quán legacy')).toBeInTheDocument();
    expect(screen.getByText('Chưa có địa chỉ')).toBeInTheDocument();
    expect(screen.getByText('Chưa có link Google Maps')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Chỉ đường bằng Google Maps/ })).not.toBeInTheDocument();
  });

  it('does not render a link for an unsupported domain', () => {
    render(
      <CuisinePreviewDrawer
        open
        values={{
          ...EMPTY_CUISINE_FORM,
          suggestedPlaces: [{
            id: 'unsafe-place',
            name: 'Quán sai link',
            address: '12 Đường LocalGo',
            googleMapsUrl: 'https://google.com.evil.example/maps/place/Fake',
          }],
        }}
        onClose={() => undefined}
      />,
    );

    expect(screen.getByText('Chưa có link Google Maps')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Chỉ đường bằng Google Maps/ })).not.toBeInTheDocument();
  });
});
