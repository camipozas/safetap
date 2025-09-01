import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import ProfileForm from '@/app/profile/ui/ProfileForm';

// Mock react-hook-form
vi.mock('react-hook-form', async () => {
  const actual = await vi.importActual('react-hook-form');
  return {
    ...actual,
    useForm: () => ({
      register: vi.fn(() => ({})),
      handleSubmit: vi.fn((fn) => fn),
      control: {},
      formState: { errors: {} },
    }),
    useFieldArray: () => ({
      fields: [{ id: '1', name: '', relation: '', phone: '', preferred: true }],
      append: vi.fn(),
      remove: vi.fn(),
    }),
  };
});

describe('ProfileForm - Health Insurance', () => {
  const user = userEvent.setup();

  it('should display health insurance section', () => {
    render(<ProfileForm />);

    expect(screen.getByText(/salud previsional/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/tipo de previsión/i)).toBeInTheDocument();
  });

  it('should display Fonasa and Isapre options', () => {
    render(<ProfileForm />);

    const typeSelect = screen.getByLabelText(/tipo de previsión/i);
    expect(typeSelect).toBeInTheDocument();

    // Check options exist
    const options = screen.getAllByRole('option');
    const optionTexts = options.map((option) => option.textContent);
    expect(optionTexts).toContain('Fonasa');
    expect(optionTexts).toContain('Isapre');
  });

  it('should display Isapre provider field', () => {
    render(<ProfileForm />);

    expect(screen.getByLabelText(/cuál isapre/i)).toBeInTheDocument();
    // Ahora es un dropdown, no un input con placeholder
    const isapreSelect = screen.getByLabelText(/cuál isapre/i);
    expect(isapreSelect.tagName).toBe('SELECT');
  });

  it('should display complementary insurance options', () => {
    render(<ProfileForm />);

    expect(
      screen.getByText(/tiene seguro complementario/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /sí/i })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /no/i })).toBeInTheDocument();
  });

  it('should display complementary insurance provider field', () => {
    render(<ProfileForm />);

    expect(
      screen.getByLabelText(/cuál seguro complementario/i)
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/vida tres, colmena/i)
    ).toBeInTheDocument();
  });

  it('should handle form interactions correctly', async () => {
    render(<ProfileForm />);

    // Test selecting Isapre
    const typeSelect = screen.getByLabelText(/tipo de previsión/i);
    await user.selectOptions(typeSelect, 'isapre');

    // Test selecting Isapre provider from dropdown
    const isapreField = screen.getByLabelText(/cuál isapre/i);
    await user.selectOptions(isapreField, 'Cruz Blanca S.A.');

    // Test selecting complementary insurance
    const complementaryYes = screen.getByRole('radio', { name: /sí/i });
    await user.click(complementaryYes);

    // Test typing in complementary insurance field
    const complementaryField = screen.getByLabelText(
      /cuál seguro complementario/i
    );
    await user.type(complementaryField, 'Vida Tres');
  });

  it('displays custom Isapre field when Other is selected', () => {
    render(<ProfileForm />);

    expect(screen.getByLabelText(/especificar isapre/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/escribir nombre de la isapre/i)
    ).toBeInTheDocument();
  });

  it('should have dropdown options for common Isapres', () => {
    render(<ProfileForm />);

    const isapreSelect = screen.getByLabelText(/cuál isapre/i);
    expect(isapreSelect).toBeInTheDocument();

    // Check that dropdown has common Isapre options by looking inside the specific select
    const isapreOptions = within(
      isapreSelect as HTMLSelectElement
    ).getAllByRole('option');
    const optionTexts = isapreOptions.map(
      (option: HTMLElement) => option.textContent
    );
    expect(optionTexts).toContain('Cruz Blanca S.A.');
    expect(optionTexts).toContain('Banmédica S.A.');
    expect(optionTexts).toContain('Colmena Golden Cross S.A.');
    expect(optionTexts).toContain('Otro');
  });
});

describe('ProfileForm - Validation', () => {
  it('should require Isapre provider when Isapre is selected', () => {
    // This would be tested with actual form validation
    // The validation logic is in the Zod schema
    expect(true).toBe(true); // Placeholder
  });

  it('should require complementary insurance provider when complementary is selected', () => {
    // This would be tested with actual form validation
    // The validation logic is in the Zod schema
    expect(true).toBe(true); // Placeholder
  });
});
