import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import MobileNav from '@/components/MobileNav';

describe('MobileNav', () => {
  it('renders mobile menu button', () => {
    render(<MobileNav />);

    const menuButton = screen.getByTestId('mobile-menu-button');
    expect(menuButton).toBeInTheDocument();
    expect(menuButton).toHaveAttribute('aria-label', 'Toggle menu');
  });

  it('opens and closes menu when button is clicked', () => {
    render(<MobileNav />);

    const menuButton = screen.getByTestId('mobile-menu-button');

    // Menu should be closed initially
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();

    // Click to open menu
    fireEvent.click(menuButton);
    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-overlay')).toBeInTheDocument();

    // Click again to close menu
    fireEvent.click(menuButton);
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
  });

  it('closes menu when overlay is clicked', () => {
    render(<MobileNav />);

    const menuButton = screen.getByTestId('mobile-menu-button');

    // Open menu
    fireEvent.click(menuButton);
    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();

    // Click overlay to close
    const overlay = screen.getByTestId('mobile-overlay');
    fireEvent.click(overlay);
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
  });

  it('closes menu when navigation link is clicked', () => {
    render(<MobileNav />);

    const menuButton = screen.getByTestId('mobile-menu-button');

    // Open menu
    fireEvent.click(menuButton);
    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();

    // Click on a navigation link
    const guideLink = screen.getByText('Guía de uso');
    fireEvent.click(guideLink);
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
  });

  it('contains all navigation links', () => {
    render(<MobileNav />);

    const menuButton = screen.getByTestId('mobile-menu-button');
    fireEvent.click(menuButton);

    expect(screen.getByText('Guía de uso')).toBeInTheDocument();
    expect(screen.getByText('Comprar')).toBeInTheDocument();
    expect(screen.getByText('Iniciar sesión')).toBeInTheDocument();
  });

  it('has correct link attributes', () => {
    render(<MobileNav />);

    const menuButton = screen.getByTestId('mobile-menu-button');
    fireEvent.click(menuButton);

    const guideLink = screen.getByText('Guía de uso');
    expect(guideLink.closest('a')).toHaveAttribute('href', '/guide');

    const buyLink = screen.getByText('Comprar');
    expect(buyLink.closest('a')).toHaveAttribute('href', '/buy');

    const loginLink = screen.getByText('Iniciar sesión');
    expect(loginLink.closest('a')).toHaveAttribute('href', '/login');
  });

  it('closes menu on escape key press', () => {
    render(<MobileNav />);

    const menuButton = screen.getByTestId('mobile-menu-button');

    // Open menu
    fireEvent.click(menuButton);
    expect(screen.getByTestId('mobile-menu')).toBeInTheDocument();

    // Press escape key on overlay
    const overlay = screen.getByTestId('mobile-overlay');
    fireEvent.keyDown(overlay, { key: 'Escape' });
    expect(screen.queryByTestId('mobile-menu')).not.toBeInTheDocument();
  });
});
