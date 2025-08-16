import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Input } from '../../src/components/forms/Input';

describe('Input Component', () => {
  it('renders with label and input', () => {
    render(<Input label="Test Label" name="test" />);
    expect(screen.getByLabelText('Test Label')).toBeInTheDocument();
  });

  it('sets the correct input type', () => {
    render(<Input label="Email" name="email" type="email" />);
    const input = screen.getByLabelText('Email');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('defaults to text type when no type is provided', () => {
    render(<Input label="Text" name="text" />);
    const input = screen.getByLabelText('Text');
    expect(input).toHaveAttribute('type', 'text');
  });

  it('displays the provided value', () => {
    render(<Input label="Test" name="test" value="initial value" />);
    const input = screen.getByLabelText('Test');
    expect(input).toHaveValue('initial value');
  });

  it('displays placeholder text', () => {
    render(<Input label="Test" name="test" placeholder="Enter text here" />);
    const input = screen.getByLabelText('Test');
    expect(input).toHaveAttribute('placeholder', 'Enter text here');
  });

  it('calls onChange when input value changes', () => {
    const mockOnChange = vi.fn();
    render(<Input label="Test" name="test" onChange={mockOnChange} />);

    const input = screen.getByLabelText('Test');
    fireEvent.change(input, { target: { value: 'new value' } });

    expect(mockOnChange).toHaveBeenCalledWith('new value');
  });

  it('displays error message when provided', () => {
    render(<Input label="Test" name="test" error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('sets aria-invalid when error is present', () => {
    render(<Input label="Test" name="test" error="This field is required" />);
    const input = screen.getByLabelText('Test');
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('sets aria-describedby when error is present', () => {
    render(<Input label="Test" name="test" error="This field is required" />);
    const input = screen.getByLabelText('Test');
    const errorElement = screen.getByText('This field is required');

    expect(input).toHaveAttribute('aria-describedby', errorElement.id);
  });

  it('does not set aria-invalid when no error', () => {
    render(<Input label="Test" name="test" />);
    const input = screen.getByLabelText('Test');
    expect(input).toHaveAttribute('aria-invalid', 'false');
  });

  it('handles numeric values', () => {
    const mockOnChange = vi.fn();
    render(
      <Input
        label="Number"
        name="number"
        type="number"
        value={42}
        onChange={mockOnChange}
      />
    );

    const input = screen.getByLabelText('Number');
    expect(input).toHaveValue(42);

    fireEvent.change(input, { target: { value: '100' } });
    expect(mockOnChange).toHaveBeenCalledWith('100');
  });

  it('associates label with input using htmlFor and id', () => {
    render(<Input label="Associated Label" name="test" />);
    const label = screen.getByText('Associated Label');
    const input = screen.getByLabelText('Associated Label');

    expect(label).toHaveAttribute('for', input.id);
  });
});
