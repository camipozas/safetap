import ConfirmationModal from '@/components/ui/confirmation-modal';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

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
});
