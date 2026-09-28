'use client';

import type { ReactNode } from 'react';
import type { Secteur } from '@/lib/db/secteurs';
import { COMPANY_SECTIONS, type CompanyInput, type CompanySection } from '@/lib/validation/company';

type Theme = 'dark' | 'light';

const LABEL: Record<Theme, string> = {
  dark: 'text-xs uppercase tracking-[0.2em] text-muted',
  light: 'text-xs uppercase tracking-[0.2em] text-dark/60',
};
const INPUT: Record<Theme, string> = {
  dark: 'mt-1 w-full bg-white/5 border border-white/15 rounded px-3 py-2.5 text-white placeholder-muted/40 focus:outline-none focus:border-teal-l transition read-only:opacity-60',
  light: 'mt-1 w-full bg-white border border-dark/15 rounded px-3 py-2 text-dark focus:outline-none focus:border-teal read-only:bg-light read-only:text-dark/60',
};
const HEADINGS: Record<CompanySection, string> = {
  societe: 'Société',
  adresse: 'Adresse de facturation',
  contact: 'Contact principal',
};

/**
 * Champs Société / Adresse / Contact d'un compte entreprise.
 * Partagé par le signup public (thème dark, une section par étape),
 * la création admin et la conversion d'un particulier (thème light).
 */
export function CompanyFormFields({
  value,
  onChange,
  secteurs,
  sections = COMPANY_SECTIONS,
  theme = 'dark',
  headings = false,
  emailReadOnly = false,
}: {
  value: CompanyInput;
  onChange: (next: CompanyInput) => void;
  secteurs: Secteur[];
  sections?: CompanySection[];
  theme?: Theme;
  headings?: boolean;
  emailReadOnly?: boolean;
}) {
  function set<K extends keyof CompanyInput>(k: K, v: string) {
    onChange({ ...value, [k]: v });
  }

  // Appelées comme fonctions (et non <Input />) : des composants déclarés dans le
  // rendu seraient remontés à chaque frappe et l'input perdrait le focus.
  function input(props: {
    label: string; k: keyof CompanyInput; required?: boolean; type?: string;
    autoComplete?: string; placeholder?: string; readOnly?: boolean;
  }) {
    return (
      <label className="block">
        <span className={LABEL[theme]}>
          {props.label}{props.required && <span className="text-orange ml-1">*</span>}
        </span>
        <input
          type={props.type ?? 'text'}
          value={value[props.k]}
          onChange={(e) => set(props.k, e.target.value)}
          required={props.required}
          readOnly={props.readOnly}
          autoComplete={props.autoComplete}
          placeholder={props.placeholder}
          className={INPUT[theme]}
        />
      </label>
    );
  }

  function section(id: CompanySection, children: ReactNode) {
    if (!sections.includes(id)) return null;
    return (
      <div className="space-y-3">
        {headings && <h3 className="font-display text-lg">{HEADINGS[id]}</h3>}
        {children}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {section('societe', (
        <>
          {input({ label: 'Raison sociale', k: 'raison_sociale', required: true, autoComplete: 'organization' })}
          <div className="grid sm:grid-cols-2 gap-3">
            {input({ label: 'SIRET', k: 'siret' })}
            {input({ label: 'TVA intracom.', k: 'tva_intra' })}
          </div>
          <label className="block">
            <span className={LABEL[theme]}>Secteur d&apos;activité</span>
            <select
              value={value.secteur_activite}
              onChange={(e) => set('secteur_activite', e.target.value)}
              className={INPUT[theme]}
            >
              <option value="" className="text-dark">— Non précisé —</option>
              {secteurs.map((s) => (
                <option key={s.code} value={s.code} className="text-dark">{s.label}</option>
              ))}
            </select>
          </label>
        </>
      ))}

      {section('adresse', (
        <>
          {input({ label: 'Rue', k: 'addr_rue', required: true, autoComplete: 'street-address' })}
          <div className="grid grid-cols-3 gap-3">
            {input({ label: 'Code postal', k: 'addr_cp', required: true, autoComplete: 'postal-code' })}
            <div className="col-span-2">
              {input({ label: 'Ville', k: 'addr_ville', required: true, autoComplete: 'address-level2' })}
            </div>
          </div>
        </>
      ))}

      {section('contact', (
        <>
          {input({ label: 'Nom et prénom', k: 'full_name', required: true, autoComplete: 'name' })}
          {input({ label: 'Fonction', k: 'contact_fonction', required: true, autoComplete: 'organization-title', placeholder: 'Ex. Responsable RH' })}
          {input({ label: 'Email', k: 'email', type: 'email', required: true, autoComplete: 'email', readOnly: emailReadOnly })}
          {input({ label: 'Téléphone', k: 'phone', type: 'tel', required: true, autoComplete: 'tel' })}
        </>
      ))}
    </div>
  );
}
