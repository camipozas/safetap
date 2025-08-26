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
    expect(screen.getByLabelText('Nombre completo')).toBeInTheDocument();
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

    expect(screen.getByDisplayValue('A+')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Penicilina,Mariscos')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Diabetes')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Insulina')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test notes')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Hermano/a')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+56912345678')).toBeInTheDocument();
  });

  it('handles successful form submission', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    render(<ProfileForm stickerId="test-sticker" />);

    const bloodTypeSelect = screen.getByLabelText(/grupo sanguíneo/i);
    const nameInput = document.getElementById('cname-0') as HTMLInputElement;
    const relationInput = document.getElementById(
      'crel-0'
    ) as HTMLSelectElement;
    const phoneInput = document.getElementById('cphone-0') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(bloodTypeSelect, { target: { value: 'A+' } });
      fireEvent.change(nameInput, { target: { value: 'Test Contact' } });
      fireEvent.change(relationInput, { target: { value: 'Padre/Madre' } });
      fireEvent.change(phoneInput, { target: { value: '912345678' } });
    });

    const submitButton = screen.getByRole('button', { name: /guardar/i });

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/profile', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: expect.stringContaining('test-sticker'),
      });
    });

    expect(window.location.href).toBe('/account');
  });

  it('handles form submission error', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Validation failed' }),
    } as Response);

    render(<ProfileForm />);

    const bloodTypeSelect = screen.getByLabelText(/grupo sanguíneo/i);
    const nameInput = document.getElementById('cname-0') as HTMLInputElement;
    const relationSelect = document.getElementById(
      'crel-0'
    ) as HTMLSelectElement;
    const phoneInput = document.getElementById('cphone-0') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(bloodTypeSelect, { target: { value: 'B+' } });
      fireEvent.change(nameInput, { target: { value: 'Test Contact' } });
      fireEvent.change(relationSelect, { target: { value: 'Padre/Madre' } });
      fireEvent.change(phoneInput, { target: { value: '+56912345678' } });
    });

    const submitButton = screen.getByRole('button', { name: /guardar/i });

    await act(async () => {
      fireEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText('Validation failed')).toBeInTheDocument();
    });
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
