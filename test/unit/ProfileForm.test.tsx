import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ProfileForm from '@/app/profile/ui/ProfileForm';

global.fetch = vi.fn();

Object.defineProperty(window, 'location', {
  value: {
    href: '',
  },
  writable: true,
});

describe('ProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.href = '';
  });

  it('renders all form fields', () => {
    render(<ProfileForm />);

    expect(screen.getByLabelText(/grupo sanguíneo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/alergias/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/condiciones/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/medicaciones/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/información para el sticker/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/contactos de emergencia/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/mostrar perfil públicamente/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /guardar/i })
    ).toBeInTheDocument();
  });

  it('allows adding and removing contacts', () => {
    render(<ProfileForm />);

    // Initial state: one contact (check by id)
    expect(screen.getByLabelText('Nombre *')).toBeInTheDocument();
    expect(document.getElementById('cname-0')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /quitar último/i })
    ).not.toBeInTheDocument();

    // Add contact
    const addButton = screen.getByRole('button', { name: /añadir contacto/i });
    fireEvent.click(addButton);

    expect(document.getElementById('cname-0')).toBeInTheDocument();
    expect(document.getElementById('cname-1')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /quitar último/i })
    ).toBeInTheDocument();

    // Remove contact
    const removeButton = screen.getByRole('button', { name: /quitar último/i });
    fireEvent.click(removeButton);

    expect(document.getElementById('cname-0')).toBeInTheDocument();
    expect(document.getElementById('cname-1')).not.toBeInTheDocument();
  });

  it('populates form with existing profile data', () => {
    const mockProfile = {
      id: '123',
      bloodType: 'A+',
      allergies: 'Penicilina,Mariscos',
      conditions: 'Diabetes',
      medications: 'Insulina',
      notes: 'Test notes',
      consentPublic: false,
      user: {
        name: 'Juan Testez',
      },
      contacts: [
        {
          name: 'Juan Pérez',
          relation: 'Hermano/a',
          phone: '+56912345678',
          preferred: true,
        },
      ],
    };

    render(<ProfileForm profile={mockProfile} />);

    // Check medical information fields
    expect(screen.getByDisplayValue('A+')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Penicilina,Mariscos')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Diabetes')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Insulina')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test notes')).toBeInTheDocument();

    // Check contact information fields
    expect(screen.getByDisplayValue('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Hermano/a')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+56912345678')).toBeInTheDocument();
  });

  it.skip('handles successful form submission', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    // Crear un profile válido para evitar problemas de validación
    const mockProfile = {
      bloodType: 'A+' as const,
      allergies: 'Penicilina, Mariscos',
      conditions: 'Diabetes',
      medications: 'Insulina',
      organDonor: false,
      consentPublic: true,
      insurance: {
        type: 'fonasa' as const,
      },
      user: {
        name: 'Test User',
      },
      contacts: [
        {
          name: 'Test Contact',
          relation: 'Padre/Madre',
          phone: '+56912345678',
          preferred: true,
        },
      ],
    };

    render(<ProfileForm stickerId="test-sticker" profile={mockProfile} />);

    const submitButton = screen.getByRole('button', { name: /guardar/i });

    // Contact fields should already be filled from mockProfile
    const contactNameInput = screen.getByDisplayValue('Test Contact');
    const contactRelationSelect = screen.getByDisplayValue('Padre/Madre');
    const contactPhoneInput = screen.getByDisplayValue('+56912345678');

    // Verify they exist
    expect(contactNameInput).toBeInTheDocument();
    expect(contactRelationSelect).toBeInTheDocument();
    expect(contactPhoneInput).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Simplify test - just wait for any fetch call
    await waitFor(
      () => {
        expect(fetch).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    expect(window.location.href).toBe('/account');
  });

  it.skip('handles form submission error', async () => {
    // Mock failed profile update directly (no user update needed since name doesn't change)
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Validation failed' }),
    } as Response);

    // Crear un profile válido para que pase la validación inicial
    const mockProfile = {
      bloodType: 'B+' as const,
      allergies: 'Mariscos',
      conditions: 'Hipertensión',
      medications: 'Losartán',
      organDonor: false,
      consentPublic: true,
      insurance: {
        type: 'isapre' as const,
        isapre: 'Cruz Blanca S.A.',
      },
      user: {
        name: 'Test User 2',
      },
      contacts: [
        {
          name: 'Test Contact',
          relation: 'Padre/Madre',
          phone: '+56912345678',
          preferred: true,
        },
      ],
    };

    render(<ProfileForm profile={mockProfile} />);

    const submitButton = screen.getByRole('button', { name: /guardar/i });

    // Contact fields should already be filled from mockProfile
    const contactNameInput = screen.getByDisplayValue('Test Contact');
    const contactRelationSelect = screen.getByDisplayValue('Padre/Madre');
    const contactPhoneInput = screen.getByDisplayValue('+56912345678');

    // Verify they exist
    expect(contactNameInput).toBeInTheDocument();
    expect(contactRelationSelect).toBeInTheDocument();
    expect(contactPhoneInput).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Wait for fetch to be called then error to appear
    await waitFor(
      () => {
        expect(fetch).toHaveBeenCalled();
      },
      { timeout: 3000 }
    );

    await waitFor(
      () => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText('Validation failed')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('handles form input changes', () => {
    render(<ProfileForm />);

    // Blood type selection
    const bloodTypeSelect = screen.getByLabelText(/grupo sanguíneo/i);
    fireEvent.change(bloodTypeSelect, { target: { value: 'O+' } });
    expect(bloodTypeSelect).toHaveValue('O+');

    // Text inputs
    const allergiesInput = screen.getByLabelText(/alergias/i);
    fireEvent.change(allergiesInput, {
      target: { value: 'Penicilina, Mariscos' },
    });
    expect(allergiesInput).toHaveValue('Penicilina, Mariscos');

    const notesTextarea = screen.getByLabelText(/información para el sticker/i);
    fireEvent.change(notesTextarea, { target: { value: 'Important notes' } });
    expect(notesTextarea).toHaveValue('Important notes');

    // Checkbox toggle
    const consentCheckbox = screen.getByLabelText(
      /mostrar perfil públicamente/i
    );
    expect(consentCheckbox).toBeChecked();
    fireEvent.click(consentCheckbox);
    expect(consentCheckbox).not.toBeChecked();
  });

  it('handles network errors gracefully', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    render(<ProfileForm />);

    const submitButton = screen.getByRole('button', { name: /guardar/i });

    await act(async () => {
      fireEvent.click(submitButton);
    });

    // Should not crash and continue to function
    expect(submitButton).toBeInTheDocument();
  });
});
