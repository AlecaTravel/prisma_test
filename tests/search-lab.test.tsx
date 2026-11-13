// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { ComponentProps, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SearchExperienceLab } from '../features/search-lab/SearchExperienceLab';
import { searchLabRedirect } from '../features/search-lab/access';

vi.mock('next/head', () => ({ default: ({ children }: { children: ReactNode }) => <>{children}</> }));
vi.mock('next/link', () => ({
  default: ({
    href,
    children,
    ...props
  }: ComponentProps<'a'> & { href: string; children: ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));
vi.mock('../components/layout/Layout', () => ({
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe('search experience lab interactions', () => {
  afterEach(cleanup);

  it('lets a tester switch visual style and page composition', () => {
    render(<SearchExperienceLab />);

    fireEvent.click(screen.getByRole('button', { name: 'Noche' }));
    fireEvent.click(screen.getByRole('button', { name: 'Doble' }));

    expect(screen.getByRole('button', { name: 'Noche' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Doble' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows feedback when required dates are missing', () => {
    render(<SearchExperienceLab />);

    fireEvent.click(screen.getByRole('button', { name: /1\. Fechas obligatorias/ }));
    fireEvent.click(screen.getByRole('button', { name: /Buscar estancias/ }));

    expect(screen.getByRole('alert')).toHaveTextContent('elige una fecha de entrada y una de salida');
  });

  it('shows price choices without dates and requests dates before reservation', () => {
    render(<SearchExperienceLab />);

    fireEvent.click(screen.getByRole('button', { name: /2\. Buscar con flexibilidad/ }));

    expect(screen.queryByRole('heading', { name: /Estancias en/ })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Buscar estancias/ }));
    expect(screen.getByText('Menor precio')).toBeInTheDocument();
    expect(screen.getByText('Mayor precio')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Elegir fechas' })[0]);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveTextContent('¿Qué días te gustaría viajar?');
    expect(dialog).toHaveTextContent('Los precios son orientativos');
    fireEvent.change(within(dialog).getByLabelText('Llegada'), {
      target: { value: '2027-06-10' },
    });
    fireEvent.change(within(dialog).getByLabelText('Salida'), {
      target: { value: '2027-06-13' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Ver resumen de reserva' }));

    expect(screen.getByRole('heading', { name: 'Tu reserva de prueba' })).toBeInTheDocument();
    expect(screen.getByText('10 jun — 13 jun')).toBeInTheDocument();
  });

  it('shows a preserve-dates prompt before searching another destination', () => {
    render(<SearchExperienceLab />);

    fireEvent.click(screen.getByRole('button', { name: /3\. Mantener la estancia/ }));
    fireEvent.change(screen.getByLabelText('Destino o alojamiento'), {
      target: { value: 'Cancún' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Buscar estancias/ }));

    expect(screen.getByRole('dialog')).toHaveTextContent('¿Conservamos tus fechas?');
    expect(screen.getByRole('dialog')).toHaveTextContent('3 noches');

    fireEvent.click(screen.getByRole('button', { name: 'Conservar fechas' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Estancias en Cancún' })).toBeInTheDocument();
    expect(screen.getByText(/1 may — 4 may · 3 noches/)).toBeInTheDocument();
  });

  it('records a tester answer and observation', () => {
    render(<SearchExperienceLab />);

    const resultGroup = screen.getByRole('group', {
      name: 'Resultado: Las fechas obligatorias se entienden',
    });
    const testCase = resultGroup.closest('article');
    if (!testCase) throw new Error('Expected the result group to be inside its test case');
    fireEvent.click(within(resultGroup).getByRole('button', { name: 'No' }));
    fireEvent.change(within(testCase).getByLabelText('Observaciones'), {
      target: { value: 'El mensaje no fue claro.' },
    });

    expect(resultGroup).toHaveAttribute('aria-label', 'Resultado: Las fechas obligatorias se entienden');
    expect(screen.getByText(/1 no/)).toBeInTheDocument();
    expect(screen.getByDisplayValue('El mensaje no fue claro.')).toBeInTheDocument();
  });
});

describe('search lab access', () => {
  it('allows local development even without a session', () => {
    expect(searchLabRedirect(undefined, true, '/search-lab')).toBeNull();
  });

  it('allows admin and agent but rejects customer access in production', () => {
    expect(searchLabRedirect('ADMIN', false, '/search-lab')).toBeNull();
    expect(searchLabRedirect('AGENT', false, '/search-lab')).toBeNull();
    expect(searchLabRedirect('CUSTOMER', false, '/search-lab')).toBe('/');
  });

  it('sends signed-out production users to sign in with a return URL', () => {
    expect(searchLabRedirect(undefined, false, '/search-lab?theme=night')).toBe(
      '/login?callbackUrl=%2Fsearch-lab%3Ftheme%3Dnight',
    );
  });
});
