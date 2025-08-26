import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ActivateStickerButton from '@/components/ActivateStickerButton';

// Mock fetch
global.fetch = vi.fn();

describe('ActivateStickerButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
    Object.defineProperty(window, 'location', {
      value: { reload: vi.fn() },
      writable: true,
    });
  });

  it('shows payment pending message when payment is not valid', () => {
    render(
      <ActivateStickerButton
        stickerId="test-id"
        hasValidPayment={false}
        status="ORDERED"
      />
    );

    expect(
      screen.getByText('💳 Pago pendiente de verificación')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Una vez que se verifique tu pago, podrás activar el sticker cuando lo recibas.'
      )
    ).toBeInTheDocument();
  });

  it('shows waiting for shipment message when status is not SHIPPED', () => {
    render(
      <ActivateStickerButton
        stickerId="test-id"
        hasValidPayment={true}
        status="PAID"
      />
    );

    expect(screen.getByText('📦 Esperando envío')).toBeInTheDocument();
    expect(
      screen.getByText('Podrás activar tu sticker una vez que sea enviado.')
    ).toBeInTheDocument();
  });

  it('shows activate button when payment is valid and status is SHIPPED', () => {
    render(
      <ActivateStickerButton
        stickerId="test-id"
        hasValidPayment={true}
        status="SHIPPED"
      />
    );

    expect(
      screen.getByRole('button', { name: /activar sticker/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        '⚠️ Solo activa cuando hayas recibido físicamente tu sticker'
      )
    ).toBeInTheDocument();
  });

  it('activates sticker when button is clicked and confirmed', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response);

    render(
      <ActivateStickerButton
        stickerId="test-id"
        hasValidPayment={true}
        status="SHIPPED"
      />
    );

    const button = screen.getByRole('button', { name: /activar sticker/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/stickers/test-id/activate', {
        method: 'POST',
      });
    });

    expect(window.location.reload).toHaveBeenCalled();
  });

  it('shows error message when activation fails', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Test error message' }),
    } as Response);

    render(
      <ActivateStickerButton
        stickerId="test-id"
        hasValidPayment={true}
        status="SHIPPED"
      />
    );

    const button = screen.getByRole('button', { name: /activar sticker/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Test error message')).toBeInTheDocument();
    });
  });

  it('does not activate when user cancels confirmation', () => {
    vi.spyOn(window, 'confirm').mockImplementation(() => false);
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;

    render(
      <ActivateStickerButton
        stickerId="test-id"
        hasValidPayment={true}
        status="SHIPPED"
      />
    );

    const button = screen.getByRole('button', { name: /activar sticker/i });
    fireEvent.click(button);

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('shows loading state during activation', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve({ success: true }),
              } as Response),
            100
          )
        )
    );

    render(
      <ActivateStickerButton
        stickerId="test-id"
        hasValidPayment={true}
        status="SHIPPED"
      />
    );

    const button = screen.getByRole('button', { name: /activar sticker/i });
    fireEvent.click(button);

    expect(screen.getByText('Activando...')).toBeInTheDocument();
    expect(button).toBeDisabled();

    await waitFor(() => {
      expect(window.location.reload).toHaveBeenCalled();
    });
  });

  it('handles network errors gracefully', async () => {
    const mockFetch = global.fetch as ReturnType<typeof vi.fn>;
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(
      <ActivateStickerButton
        stickerId="test-id"
        hasValidPayment={true}
        status="SHIPPED"
      />
    );

    const button = screen.getByRole('button', { name: /activar sticker/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(
        screen.getByText('Error de conexión. Intenta nuevamente.')
      ).toBeInTheDocument();
    });
  });
});
