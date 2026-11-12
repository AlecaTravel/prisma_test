// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { ComponentProps, ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import Header from '../components/layout/Header';
import { useMe } from '../features/auth/useMe';

const routeEvents = { on: vi.fn(), off: vi.fn() };

vi.mock('next/image', () => ({
  default: ({ fill: _fill, ...props }: ComponentProps<'img'> & { fill?: boolean }) => (
    <img {...props} />
  ),
}));

vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: ComponentProps<'a'> & { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/',
    events: routeEvents,
  }),
}));

vi.mock('next-auth/react', () => ({
  signOut: vi.fn(),
}));

vi.mock('../features/auth/useMe', () => ({
  useMe: vi.fn(),
}));

const mockedUseMe = vi.mocked(useMe);

beforeEach(() => {
  mockedUseMe.mockReturnValue({
    user: null,
    status: 'unauthenticated',
    loading: false,
    error: undefined,
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('responsive header navigation', () => {
  it('opens the compact menu and closes it after selecting a destination', () => {
    render(<Header />);

    const menuButton = screen.getByRole('button', { name: 'Abrir menú' });
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(menuButton);
    expect(screen.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );

    const mobileNavigation = within(
      screen.getByRole('navigation', { name: 'Navegación móvil' }),
    );
    fireEvent.click(mobileNavigation.getByRole('link', { name: 'Paquetes' }));

    expect(screen.getByRole('button', { name: 'Abrir menú' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('closes the menu with Escape and returns focus to its toggle', () => {
    render(<Header />);
    const menuButton = screen.getByRole('button', { name: 'Abrir menú' });

    fireEvent.click(menuButton);
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(menuButton).toHaveFocus();
    expect(menuButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows only role-appropriate account actions in the compact menu', () => {
    mockedUseMe.mockReturnValue({
      user: {
        id: 'admin-1',
        name: 'Admin Aleca',
        email: 'admin@example.com',
        role: 'ADMIN',
        image: null,
      },
      status: 'authenticated',
      loading: false,
      error: undefined,
    });

    render(<Header />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));

    const mobileNavigation = within(
      screen.getByRole('navigation', { name: 'Navegación móvil' }),
    );
    expect(mobileNavigation.getByRole('link', { name: 'Mis reservas' })).toBeInTheDocument();
    expect(mobileNavigation.getByRole('link', { name: 'Administración' })).toBeInTheDocument();
    expect(mobileNavigation.getByRole('link', { name: '+ Nuevo hotel' })).toBeInTheDocument();
    expect(mobileNavigation.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
  });
});
