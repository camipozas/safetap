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
    createdAt: new Date('2024-01-01'),
    totalSpent: 0,
    _count: {
      stickers: 2,
      payments: 1,
    },
    stickers: [
      {
        id: 'sticker-1',
        status: 'ACTIVE' as const,
        createdAt: new Date('2024-01-01'),
      },
      {
        id: 'sticker-2',
        status: 'ORDERED' as const,
        createdAt: new Date('2024-01-02'),
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
    createdAt: new Date('2024-01-02'),
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

    // Check that dates are displayed (they might be formatted differently in test environment)
    expect(screen.getByText(/31 dic 2023/)).toBeInTheDocument();
    expect(screen.getByText(/1 ene 2024/)).toBeInTheDocument();
  });
});
