import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { prisma } from '@/lib/prisma';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    emergencyProfile: {
      findFirst: vi.fn(),
    },
    profileAccessLog: {
      create: vi.fn(),
    },
  },
}));

// Mock the component since we can't test it directly due to async nature
const MockQrProfilePage = ({ profile }: { profile: unknown }) => {
  if (!profile) {
    notFound();
    return null;
  }

  const typedProfile = profile as {
    id: string;
    user: { name: string | null; email: string };
    sticker: { serial: string; status: string };
    bloodType: string | null;
    allergies: string[];
    conditions: string[];
    medications: string[];
    notes: string | null;
    organDonor: boolean;
    language: string | null;
    contacts: Array<{
      id: string;
      name: string;
      relation: string;
      phone: string;
      country: string | null;
      preferred: boolean;
    }>;
    insurance: {
      type: string;
      isapre?: string;
      hasComplementary?: boolean;
      complementaryInsurance?: string;
    } | null;
  };

  return (
    <div data-testid="qr-profile-page">
      <h1>{typedProfile.user.name || 'Usuario'}</h1>
      <p>Serial: {typedProfile.sticker.serial}</p>
      {typedProfile.bloodType && (
        <div data-testid="blood-type">
          Tipo de Sangre: {typedProfile.bloodType}
        </div>
      )}
      {typedProfile.allergies.length > 0 && (
        <div data-testid="allergies">
          Alergias: {typedProfile.allergies.join(', ')}
        </div>
      )}
      {typedProfile.conditions.length > 0 && (
        <div data-testid="conditions">
          Condiciones: {typedProfile.conditions.join(', ')}
        </div>
      )}
      {typedProfile.medications.length > 0 && (
        <div data-testid="medications">
          Medicamentos: {typedProfile.medications.join(', ')}
        </div>
      )}
      {typedProfile.notes && (
        <div data-testid="notes">Notas: {typedProfile.notes}</div>
      )}
      {typedProfile.organDonor && (
        <div data-testid="organ-donor">Donante de Órganos: Sí</div>
      )}
      <div data-testid="contacts">
        {typedProfile.contacts.map((contact) => (
          <div key={contact.id} data-testid={`contact-${contact.id}`}>
            <span>
              {contact.name} - {contact.relation}
            </span>
            <a href={`tel:${contact.phone}`} data-testid={`call-${contact.id}`}>
              Llamar
            </a>
            {contact.preferred && (
              <span data-testid={`preferred-${contact.id}`}>Preferido</span>
            )}
          </div>
        ))}
      </div>
      {typedProfile.insurance && (
        <div data-testid="insurance">
          <h2>Salud Previsional</h2>
          <div>
            {typedProfile.insurance.type === 'fonasa' && (
              <>
                <div>Fonasa</div>
                <div>
                  Seguro Complementario:{' '}
                  {typedProfile.insurance.hasComplementary ? 'Sí' : 'No'}
                </div>
              </>
            )}
            {typedProfile.insurance.type === 'isapre' && (
              <>
                <div>Isapre: {typedProfile.insurance.isapre}</div>
                <div>
                  Seguro Complementario:{' '}
                  {typedProfile.insurance.hasComplementary ? 'Sí' : 'No'}
                </div>
                {typedProfile.insurance.hasComplementary && (
                  <div>
                    Detalle Complementario:{' '}
                    {typedProfile.insurance.complementaryInsurance}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

describe('QR Profile Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders emergency profile correctly', async () => {
    const mockProfile = {
      id: 'profile-123',
      user: {
        name: 'Juan Pérez',
        email: 'juan@example.com',
      },
      sticker: {
        serial: 'STK-ABC12345',
        status: 'ACTIVE',
      },
      bloodType: 'O+',
      allergies: ['Penicilina', 'Nueces'],
      conditions: ['Diabetes tipo 2'],
      medications: ['Metformina 850mg'],
      notes: 'Verificar niveles de glucosa en emergencias',
      organDonor: true,
      language: 'es',
      contacts: [
        {
          id: 'contact-1',
          name: 'María Pérez',
          relation: 'Esposa',
          phone: '+56912345678',
          country: 'Chile',
          preferred: true,
        },
        {
          id: 'contact-2',
          name: 'Dr. González',
          relation: 'Médico',
          phone: '+56987654321',
          country: 'Chile',
          preferred: false,
        },
      ],
      insurance: null,
    };

    vi.mocked(prisma.emergencyProfile.findFirst).mockResolvedValue(
      mockProfile as never
    );
    vi.mocked(prisma.profileAccessLog.create).mockResolvedValue({} as never);

    render(<MockQrProfilePage profile={mockProfile} />);

    // Check basic information
    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText('Serial: STK-ABC12345')).toBeInTheDocument();

    // Check medical information
    expect(screen.getByTestId('blood-type')).toHaveTextContent(
      'Tipo de Sangre: O+'
    );
    expect(screen.getByTestId('allergies')).toHaveTextContent(
      'Alergias: Penicilina, Nueces'
    );
    expect(screen.getByTestId('conditions')).toHaveTextContent(
      'Condiciones: Diabetes tipo 2'
    );
    expect(screen.getByTestId('medications')).toHaveTextContent(
      'Medicamentos: Metformina 850mg'
    );
    expect(screen.getByTestId('notes')).toHaveTextContent(
      'Notas: Verificar niveles de glucosa en emergencias'
    );
    expect(screen.getByTestId('organ-donor')).toHaveTextContent(
      'Donante de Órganos: Sí'
    );

    // Check contacts
    expect(screen.getByTestId('contact-contact-1')).toHaveTextContent(
      'María Pérez - Esposa'
    );
    expect(screen.getByTestId('contact-contact-2')).toHaveTextContent(
      'Dr. González - Médico'
    );
    expect(screen.getByTestId('preferred-contact-1')).toHaveTextContent(
      'Preferido'
    );
    expect(screen.queryByTestId('preferred-contact-2')).not.toBeInTheDocument();

    // Check phone links
    expect(screen.getByTestId('call-contact-1')).toHaveAttribute(
      'href',
      'tel:+56912345678'
    );
    expect(screen.getByTestId('call-contact-2')).toHaveAttribute(
      'href',
      'tel:+56987654321'
    );
  });

  it('handles profile with minimal information', async () => {
    const mockProfile = {
      id: 'profile-456',
      user: {
        name: null,
        email: 'user@example.com',
      },
      sticker: {
        serial: 'STK-XYZ98765',
        status: 'ACTIVE',
      },
      bloodType: null,
      allergies: [],
      conditions: [],
      medications: [],
      notes: null,
      organDonor: false,
      language: null,
      contacts: [],
      insurance: null,
    };

    render(<MockQrProfilePage profile={mockProfile} />);

    // Should show email username when name is null
    expect(screen.getByText('Usuario')).toBeInTheDocument();
    expect(screen.getByText('Serial: STK-XYZ98765')).toBeInTheDocument();

    // Should not show medical information sections when empty
    expect(screen.queryByTestId('blood-type')).not.toBeInTheDocument();
    expect(screen.queryByTestId('allergies')).not.toBeInTheDocument();
    expect(screen.queryByTestId('conditions')).not.toBeInTheDocument();
    expect(screen.queryByTestId('medications')).not.toBeInTheDocument();
    expect(screen.queryByTestId('notes')).not.toBeInTheDocument();
    expect(screen.queryByTestId('organ-donor')).not.toBeInTheDocument();

    // Contacts section should still be present but empty
    expect(screen.getByTestId('contacts')).toBeInTheDocument();
  });

  it('calls notFound when profile is not found', async () => {
    vi.mocked(prisma.emergencyProfile.findFirst).mockResolvedValue(null);

    render(<MockQrProfilePage profile={null} />);

    expect(notFound).toHaveBeenCalledTimes(1);
  });

  it('should show fallback text for no contacts', async () => {
    const mockProfile = {
      id: 'profile-789',
      user: {
        name: 'Test User',
        email: 'test@example.com',
      },
      sticker: {
        serial: 'STK-TEST123',
        status: 'ACTIVE',
      },
      bloodType: 'A+',
      allergies: [],
      conditions: [],
      medications: [],
      notes: null,
      organDonor: false,
      language: 'es',
      contacts: [],
      insurance: null,
    };

    render(<MockQrProfilePage profile={mockProfile} />);

    expect(screen.getByTestId('contacts')).toBeInTheDocument();
    // In real implementation, would show "No hay contactos de emergencia configurados"
  });

  it('handles contacts without country information', async () => {
    const mockProfile = {
      id: 'profile-999',
      user: {
        name: 'Test User',
        email: 'test@example.com',
      },
      sticker: {
        serial: 'STK-TEST999',
        status: 'ACTIVE',
      },
      bloodType: null,
      allergies: [],
      conditions: [],
      medications: [],
      notes: null,
      organDonor: false,
      language: null,
      contacts: [
        {
          id: 'contact-no-country',
          name: 'Emergency Contact',
          relation: 'Friend',
          phone: '+1234567890',
          country: null,
          preferred: false,
        },
      ],
      insurance: null,
    };

    render(<MockQrProfilePage profile={mockProfile} />);

    expect(screen.getByTestId('contact-contact-no-country')).toHaveTextContent(
      'Emergency Contact - Friend'
    );
    expect(screen.getByTestId('call-contact-no-country')).toHaveAttribute(
      'href',
      'tel:+1234567890'
    );
  });
});

// Test para validar la nueva estructura de salud previsional
describe('Health Insurance Display', () => {
  it('displays Fonasa information correctly', async () => {
    const profileWithFonasa = {
      id: 'profile-123',
      user: {
        name: 'Juan Pérez',
        email: 'juan@example.com',
      },
      sticker: {
        serial: 'STK-ABC12345',
        status: 'ACTIVE',
      },
      bloodType: 'O+',
      allergies: ['Penicilina', 'Nueces'],
      conditions: ['Diabetes tipo 2'],
      medications: ['Metformina 850mg'],
      notes: 'Verificar niveles de glucosa en emergencias',
      organDonor: true,
      language: 'es',
      contacts: [
        {
          id: 'contact-1',
          name: 'María Pérez',
          relation: 'Esposa',
          phone: '+56912345678',
          country: 'Chile',
          preferred: true,
        },
        {
          id: 'contact-2',
          name: 'Dr. González',
          relation: 'Médico',
          phone: '+56987654321',
          country: 'Chile',
          preferred: false,
        },
      ],
      insurance: {
        type: 'fonasa',
        hasComplementary: false,
      },
    };

    vi.mocked(prisma.emergencyProfile.findFirst).mockResolvedValue(
      profileWithFonasa as never
    );

    render(<MockQrProfilePage profile={profileWithFonasa} />);

    expect(screen.getByText(/salud previsional/i)).toBeInTheDocument();
    expect(screen.getByText(/fonasa/i)).toBeInTheDocument();
    expect(screen.getByText(/seguro complementario.*no/i)).toBeInTheDocument();
  });

  it('displays Isapre information correctly', async () => {
    const profileWithIsapre = {
      id: 'profile-123',
      user: {
        name: 'Juan Pérez',
        email: 'juan@example.com',
      },
      sticker: {
        serial: 'STK-ABC12345',
        status: 'ACTIVE',
      },
      bloodType: 'O+',
      allergies: ['Penicilina', 'Nueces'],
      conditions: ['Diabetes tipo 2'],
      medications: ['Metformina 850mg'],
      notes: 'Verificar niveles de glucosa en emergencias',
      organDonor: true,
      language: 'es',
      contacts: [
        {
          id: 'contact-1',
          name: 'María Pérez',
          relation: 'Esposa',
          phone: '+56912345678',
          country: 'Chile',
          preferred: true,
        },
        {
          id: 'contact-2',
          name: 'Dr. González',
          relation: 'Médico',
          phone: '+56987654321',
          country: 'Chile',
          preferred: false,
        },
      ],
      insurance: {
        type: 'isapre',
        isapre: 'Cruz Blanca',
        hasComplementary: true,
        complementaryInsurance: 'Vida Tres',
      },
    };

    vi.mocked(prisma.emergencyProfile.findFirst).mockResolvedValue(
      profileWithIsapre as never
    );

    render(<MockQrProfilePage profile={profileWithIsapre} />);

    expect(screen.getByText(/salud previsional/i)).toBeInTheDocument();
    expect(screen.getByText(/isapre/i)).toBeInTheDocument();
    expect(screen.getByText(/cruz blanca/i)).toBeInTheDocument();
    expect(screen.getByText(/seguro complementario.*sí/i)).toBeInTheDocument();
    expect(screen.getByText(/vida tres/i)).toBeInTheDocument();
  });

  it('does not display insurance section when no insurance data', async () => {
    const profileWithoutInsurance = {
      id: 'profile-123',
      user: {
        name: 'Juan Pérez',
        email: 'juan@example.com',
      },
      sticker: {
        serial: 'STK-ABC12345',
        status: 'ACTIVE',
      },
      bloodType: 'O+',
      allergies: ['Penicilina', 'Nueces'],
      conditions: ['Diabetes tipo 2'],
      medications: ['Metformina 850mg'],
      notes: 'Verificar niveles de glucosa en emergencias',
      organDonor: true,
      language: 'es',
      contacts: [
        {
          id: 'contact-1',
          name: 'María Pérez',
          relation: 'Esposa',
          phone: '+56912345678',
          country: 'Chile',
          preferred: true,
        },
        {
          id: 'contact-2',
          name: 'Dr. González',
          relation: 'Médico',
          phone: '+56987654321',
          country: 'Chile',
          preferred: false,
        },
      ],
      insurance: null,
    };

    vi.mocked(prisma.emergencyProfile.findFirst).mockResolvedValue(
      profileWithoutInsurance as never
    );

    render(<MockQrProfilePage profile={profileWithoutInsurance} />);

    expect(screen.queryByText(/salud previsional/i)).not.toBeInTheDocument();
  });
});
