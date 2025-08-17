import ConfirmationModal from '@/components/ui/confirmation-modal';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('ConfirmationModal', () => {
  it('renders when open', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        title="Test Title"
        message="Test message"
        onConfirm={() => {}}
        onClose={() => {}}
      />
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByText('Confirmar')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <ConfirmationModal
        isOpen={false}
        title="Test Title"
        message="Test message"
        onConfirm={() => {}}
        onClose={() => {}}
      />
    );

    expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', () => {
    const mockOnConfirm = vi.fn();
    render(
      <ConfirmationModal
        isOpen={true}
        title="Test Title"
        message="Test message"
        onConfirm={mockOnConfirm}
        onClose={() => {}}
      />
    );

    fireEvent.click(screen.getByText('Confirmar'));
    expect(mockOnConfirm).toHaveBeenCalledOnce();
  });

  it('calls onClose when cancel button is clicked', () => {
    const mockOnClose = vi.fn();
    render(
      <ConfirmationModal
        isOpen={true}
        title="Test Title"
        message="Test message"
        onConfirm={() => {}}
        onClose={mockOnClose}
      />
    );

    fireEvent.click(screen.getByText('Cancelar'));
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it('calls onClose when overlay is clicked', () => {
    const mockOnClose = vi.fn();
    render(
      <ConfirmationModal
        isOpen={true}
        title="Test Title"
        message="Test message"
        onConfirm={() => {}}
        onClose={mockOnClose}
      />
    );

    const overlay = screen.getByTestId('modal-overlay');
    fireEvent.click(overlay);
    expect(mockOnClose).toHaveBeenCalledOnce();
  });

  it('shows loading state when provided', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        title="Test Title"
        message="Test message"
        onConfirm={() => {}}
        onClose={() => {}}
        isLoading={true}
      />
    );

    const confirmButton = screen.getByText('Confirmar');
    expect(confirmButton).toBeDisabled();
  });

  it('uses custom confirm text when provided', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        title="Test Title"
        message="Test message"
        onConfirm={() => {}}
        onClose={() => {}}
        confirmText="Eliminar"
      />
    );

    expect(screen.getByText('Eliminar')).toBeInTheDocument();
    expect(screen.queryByText('Confirmar')).not.toBeInTheDocument();
  });

  it('uses custom cancel text when provided', () => {
    render(
      <ConfirmationModal
        isOpen={true}
        title="Test Title"
        message="Test message"
        onConfirm={() => {}}
        onClose={() => {}}
        cancelText="Volver"
      />
    );

    expect(screen.getByText('Volver')).toBeInTheDocument();
    expect(screen.queryByText('Cancelar')).not.toBeInTheDocument();
  });
});
