import UsersTable from '@/components/ui/users-table';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

const mockUsers = [
  {
    id: 'user-1',
    email: 'john@example.com',
    name: 'John Doe',
    image: null,
    country: 'US',
    role: 'USER' as const,
    createdAt: new Date('2023-12-15T10:00:00.000Z'), // Fixed UTC date
    totalSpent: 0,
    _count: {
      Sticker: 2,
      Payment: 1,
    },
    Sticker: [
      {
        id: 'sticker-1',
        status: 'ACTIVE' as const,
        createdAt: new Date('2024-01-01T10:00:00.000Z'),
      },
      {
        id: 'sticker-2',
        status: 'ORDERED' as const,
        createdAt: new Date('2024-01-02T10:00:00.000Z'),
      },
    ],
    EmergencyProfile: [
      {
        bloodType: 'O+',
        allergies: [],
        conditions: [],
        medications: [],
      },
    ],
  },
  {
    id: 'user-2',
    email: 'jane@example.com',
    name: 'Jane Smith',
    image: null,
    country: 'GB',
    role: 'ADMIN' as const,
    createdAt: new Date('2024-03-20T15:30:00.000Z'), // Fixed UTC date
    totalSpent: 0,
    _count: {
      Sticker: 0,
      Payment: 0,
    },
    Sticker: [],
    EmergencyProfile: [],
  },
];

describe('UsersTable', () => {
  it('renders users correctly', () => {
    render(<UsersTable users={mockUsers} />);

    expect(screen.getAllByText('John Doe')).toHaveLength(2); // Desktop + mobile
    // Use getAllByText since emails appear in both desktop and mobile views
    const johnEmails = screen.getAllByText('john@example.com');
    expect(johnEmails.length).toBeGreaterThanOrEqual(1);

    const janeNames = screen.getAllByText('Jane Smith');
    expect(janeNames.length).toBeGreaterThanOrEqual(1);

    const janeEmails = screen.getAllByText('jane@example.com');
    expect(janeEmails.length).toBeGreaterThanOrEqual(1);
  });

  it('displays user roles correctly', () => {
    render(<UsersTable users={mockUsers} />);

    expect(screen.getAllByText('USER')).toHaveLength(2); // Desktop + mobile
    // Use getAllByText since roles appear in both desktop and mobile views
    const adminRoles = screen.getAllByText('ADMIN');
    expect(adminRoles.length).toBeGreaterThanOrEqual(1);
  });

  it('shows sticker counts', () => {
    render(<UsersTable users={mockUsers} />);

    expect(screen.getAllByText('2')).toHaveLength(2); // Desktop + mobile
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  it('displays countries correctly', () => {
    render(<UsersTable users={mockUsers} />);

    expect(screen.getAllByText('US')).toHaveLength(2); // Desktop + mobile
    // Use getAllByText since countries appear in both desktop and mobile views
    const gbCountries = screen.getAllByText('GB');
    expect(gbCountries.length).toBeGreaterThanOrEqual(1);
  });

  it('displays blood types correctly', () => {
    render(<UsersTable users={mockUsers} />);

    expect(screen.getAllByText('O+')).toHaveLength(2); // Desktop + mobile
    // Use getAllByText since blood types appear in both desktop and mobile views
    const noSpecified = screen.getAllByText('No especificado');
    expect(noSpecified.length).toBeGreaterThanOrEqual(1);
  });

  it('displays action buttons correctly', () => {
    render(<UsersTable users={mockUsers} />);

    // Check that action buttons are present
    const editButtons = screen.getAllByText('Ver Perfil');
    const contactButtons = screen.getAllByText('Contactos');

    expect(editButtons.length).toBe(2);
    expect(contactButtons.length).toBe(2);
  });

  it('displays creation dates correctly', () => {
    render(<UsersTable users={mockUsers} />);

    // Check that dates are displayed using fixed UTC dates
    // User 1: 2023-12-15T10:00:00.000Z should render as "15 dic 2023"
    // User 2: 2024-03-20T15:30:00.000Z should render as "20 mar 2024"
    const dateTexts = screen.getAllByText(/\d{1,2} \w{3} \d{4}/);
    expect(dateTexts.length).toBeGreaterThanOrEqual(2);

    // Check for specific dates that should be consistent across environments
    // Use getAllByText since dates appear in both desktop and mobile views
    const decemberDates = screen.getAllByText(/15 dic 2023/);
    expect(decemberDates.length).toBeGreaterThanOrEqual(1);

    const marchDates = screen.getAllByText(/20 mar 2024/);
    expect(marchDates.length).toBeGreaterThanOrEqual(1);
  });
});
