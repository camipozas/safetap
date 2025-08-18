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
      stickers: 2,
      payments: 1,
    },
    stickers: [
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
    profiles: [
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
      stickers: 0,
      payments: 0,
    },
    stickers: [],
    profiles: [],
  },
];

describe('UsersTable', () => {
  it('renders users correctly', () => {
    render(<UsersTable users={mockUsers} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
  });

  it('displays user roles correctly', () => {
    render(<UsersTable users={mockUsers} />);

    expect(screen.getByText('USER')).toBeInTheDocument();
    expect(screen.getByText('ADMIN')).toBeInTheDocument();
  });

  it('shows sticker counts', () => {
    render(<UsersTable users={mockUsers} />);

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  it('displays countries correctly', () => {
    render(<UsersTable users={mockUsers} />);

    expect(screen.getByText('US')).toBeInTheDocument();
    expect(screen.getByText('GB')).toBeInTheDocument();
  });

  it('displays blood types correctly', () => {
    render(<UsersTable users={mockUsers} />);

    expect(screen.getByText('O+')).toBeInTheDocument();
    expect(screen.getByText('No especificado')).toBeInTheDocument();
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
    expect(screen.getByText(/15 dic 2023/)).toBeInTheDocument();
    expect(screen.getByText(/20 mar 2024/)).toBeInTheDocument();
  });
});
