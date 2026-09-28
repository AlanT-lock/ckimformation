import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CompanyFormFields } from '@/components/forms/CompanyFormFields';
import { EMPTY_COMPANY_INPUT } from '@/lib/validation/company';

const secteurs = [{ code: 'btp', label: 'BTP', ordre: 1, actif: true }];

describe('CompanyFormFields', () => {
  it('affiche toutes les sections par défaut', () => {
    render(<CompanyFormFields value={EMPTY_COMPANY_INPUT} onChange={() => {}} secteurs={secteurs} />);
    expect(screen.getByLabelText(/Raison sociale/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Code postal/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Fonction/)).toBeInTheDocument();
  });

  it('n’affiche que les sections demandées', () => {
    render(<CompanyFormFields value={EMPTY_COMPANY_INPUT} onChange={() => {}} secteurs={secteurs} sections={['adresse']} />);
    expect(screen.queryByLabelText(/Raison sociale/)).toBeNull();
    expect(screen.getByLabelText(/Ville/)).toBeInTheDocument();
  });

  it('remonte la valeur complète au changement', () => {
    const onChange = vi.fn();
    render(<CompanyFormFields value={EMPTY_COMPANY_INPUT} onChange={onChange} secteurs={secteurs} />);
    fireEvent.change(screen.getByLabelText(/Raison sociale/), { target: { value: 'ACME' } });
    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_COMPANY_INPUT, raison_sociale: 'ACME' });
  });

  it('email en lecture seule si demandé', () => {
    render(<CompanyFormFields value={EMPTY_COMPANY_INPUT} onChange={() => {}} secteurs={secteurs} emailReadOnly />);
    expect(screen.getByLabelText(/Email/)).toHaveAttribute('readonly');
  });
});
