'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { RgpdCheckbox } from '@/components/forms/RgpdCheckbox';
import type { Secteur } from '@/lib/db/secteurs';

interface FormState {
  // Société
  raison_sociale: string;
  siret: string;
  tva_intra: string;
  secteur_activite: string;
  // Adresse
  addr_rue: string;
  addr_cp: string;
  addr_ville: string;
  // Contact
  full_name: string;
  contact_fonction: string;
  email: string;
  phone: string;
  // Auth
  password: string;
  confirm: string;
}

const INITIAL: FormState = {
  raison_sociale: '',
  siret: '',
  tva_intra: '',
  secteur_activite: '',
  addr_rue: '',
  addr_cp: '',
  addr_ville: '',
  full_name: '',
  contact_fonction: '',
  email: '',
  phone: '',
  password: '',
  confirm: '',
};

type Step = 0 | 1 | 2 | 3;

const STEPS: { num: number; title: string; subtitle: string }[] = [
  { num: 1, title: 'Société', subtitle: 'Informations légales' },
  { num: 2, title: 'Adresse', subtitle: 'Lieu de facturation' },
  { num: 3, title: 'Contact', subtitle: 'Référent du compte' },
  { num: 4, title: 'Accès', subtitle: 'Email et mot de passe' },
];

function validate(step: Step, f: FormState): string | null {
  if (step === 0) {
    if (!f.raison_sociale.trim()) return 'La raison sociale est obligatoire.';
  }
  if (step === 1) {
    if (!f.addr_rue.trim()) return "L'adresse (rue) est obligatoire.";
    if (!f.addr_cp.trim()) return 'Le code postal est obligatoire.';
    if (!f.addr_ville.trim()) return 'La ville est obligatoire.';
  }
  if (step === 2) {
    if (!f.full_name.trim()) return 'Le nom et prénom du contact sont obligatoires.';
    if (!f.contact_fonction.trim()) return 'La fonction du contact est obligatoire.';
    if (!f.email.trim()) return "L'email du contact est obligatoire.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) return 'Email invalide.';
    if (!f.phone.trim()) return 'Le téléphone du contact est obligatoire.';
  }
  if (step === 3) {
    if (f.password.length < 8) return 'Mot de passe : 8 caractères minimum.';
    if (f.password !== f.confirm) return 'Les mots de passe ne correspondent pas.';
  }
  return null;
}

function validateRgpd(rgpd: boolean): string | null {
  return rgpd ? null : "Vous devez accepter la politique de confidentialité pour créer un compte.";
}

export function SignupEntrepriseForm({ secteurs }: { secteurs: Secteur[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [step, setStep] = useState<Step>(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [rgpd, setRgpd] = useState(false);

  function set<K extends keyof FormState>(k: K, v: string) {
    setForm((s) => ({ ...s, [k]: v }));
  }

  function next() {
    const err = validate(step, form);
    if (err) { setError(err); return; }
    setError(null);
    setStep((s) => Math.min(3, s + 1) as Step);
  }
  function prev() {
    setError(null);
    setStep((s) => Math.max(0, s - 1) as Step);
  }

  async function submit() {
    const err = validate(3, form) ?? validateRgpd(rgpd);
    if (err) { setError(err); return; }
    setError(null);
    setMessage(null);
    setLoading(true);
    const billing_address = {
      rue: form.addr_rue.trim(),
      code_postal: form.addr_cp.trim(),
      ville: form.addr_ville.trim(),
      pays: 'France',
    };
    const { error: signErr } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/callback?redirect=/stagiaire`,
        data: {
          role: 'stagiaire',
          account_type: 'entreprise',
          full_name: form.full_name.trim(),
          phone: form.phone.trim(),
          raison_sociale: form.raison_sociale.trim(),
          siret: form.siret.trim(),
          tva_intra: form.tva_intra.trim(),
          contact_fonction: form.contact_fonction.trim(),
          secteur_activite: form.secteur_activite,
          billing_address: JSON.stringify(billing_address),
        },
      },
    });
    setLoading(false);
    if (signErr) { setError(signErr.message); return; }
    setMessage('Compte entreprise créé. Vérifiez votre boîte mail et cliquez sur le lien de confirmation.');
    setTimeout(() => router.push('/login?message=Confirmez%20votre%20email%20pour%20vous%20connecter'), 4000);
  }

  return (
    <div className="mt-8">
      <Stepper currentStep={step} />

      <div className="mt-8 space-y-5">
        {error && <Alert tone="error">{error}</Alert>}
        {message && <Alert tone="ok">{message}</Alert>}

        {step === 0 && (
          <StepContent title="Société" description="Renseignez les informations légales de votre entreprise.">
            <Field
              label="Raison sociale"
              required
              value={form.raison_sociale}
              onChange={(v) => set('raison_sociale', v)}
              autoComplete="organization"
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="SIRET" value={form.siret} onChange={(v) => set('siret', v)} />
              <Field label="TVA intracom." value={form.tva_intra} onChange={(v) => set('tva_intra', v)} />
            </div>
            <SelectField
              label="Secteur d'activité"
              value={form.secteur_activite}
              onChange={(v) => set('secteur_activite', v)}
              options={[{ value: '', label: '— Non précisé —' }, ...secteurs.map((s) => ({ value: s.code, label: s.label }))]}
            />
          </StepContent>
        )}

        {step === 1 && (
          <StepContent title="Adresse de facturation" description="Tous les champs sont obligatoires.">
            <Field
              label="Rue"
              required
              value={form.addr_rue}
              onChange={(v) => set('addr_rue', v)}
              autoComplete="street-address"
            />
            <div className="grid grid-cols-3 gap-3">
              <Field
                label="Code postal"
                required
                value={form.addr_cp}
                onChange={(v) => set('addr_cp', v)}
                autoComplete="postal-code"
              />
              <div className="col-span-2">
                <Field
                  label="Ville"
                  required
                  value={form.addr_ville}
                  onChange={(v) => set('addr_ville', v)}
                  autoComplete="address-level2"
                />
              </div>
            </div>
          </StepContent>
        )}

        {step === 2 && (
          <StepContent title="Contact principal" description="Personne référente du compte. Tous les champs sont obligatoires.">
            <Field
              label="Nom et prénom"
              required
              value={form.full_name}
              onChange={(v) => set('full_name', v)}
              autoComplete="name"
            />
            <Field
              label="Fonction"
              required
              value={form.contact_fonction}
              onChange={(v) => set('contact_fonction', v)}
              autoComplete="organization-title"
              placeholder="Ex. Responsable RH"
            />
            <Field
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(v) => set('email', v)}
              autoComplete="email"
            />
            <Field
              label="Téléphone"
              type="tel"
              required
              value={form.phone}
              onChange={(v) => set('phone', v)}
              autoComplete="tel"
            />
          </StepContent>
        )}

        {step === 3 && (
          <StepContent title="Sécurité du compte" description="Définissez votre mot de passe pour vous connecter.">
            <Field
              label="Mot de passe (8 caractères minimum)"
              type="password"
              required
              value={form.password}
              onChange={(v) => set('password', v)}
              autoComplete="new-password"
            />
            <Field
              label="Confirmer le mot de passe"
              type="password"
              required
              value={form.confirm}
              onChange={(v) => set('confirm', v)}
              autoComplete="new-password"
            />
            <div className="pt-2">
              <RgpdCheckbox checked={rgpd} onChange={setRgpd} variant="dark" />
            </div>
          </StepContent>
        )}

        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            type="button"
            onClick={prev}
            disabled={step === 0 || loading}
            className="text-sm text-muted hover:text-white disabled:opacity-30 transition"
          >
            ← Précédent
          </button>

          {step < 3 ? (
            <button
              type="button"
              onClick={next}
              className="bg-teal hover:bg-teal-l text-white font-medium px-6 py-3 rounded transition"
            >
              Suivant →
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={loading}
              className="bg-teal hover:bg-teal-l text-white font-medium px-6 py-3 rounded transition disabled:opacity-50"
            >
              {loading ? 'Création…' : 'Créer le compte entreprise'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Stepper({ currentStep }: { currentStep: Step }) {
  return (
    <nav aria-label="Progression" className="flex items-center gap-2">
      {STEPS.map((s, i) => {
        const isDone = i < currentStep;
        const isActive = i === currentStep;
        return (
          <div key={s.num} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border transition ${
                  isActive
                    ? 'bg-teal-l border-teal-l text-dark'
                    : isDone
                      ? 'bg-teal-l/20 border-teal-l/50 text-teal-l'
                      : 'bg-white/5 border-white/20 text-muted'
                }`}
              >
                {isDone ? '✓' : s.num}
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px ${isDone ? 'bg-teal-l/50' : 'bg-white/15'}`} />
              )}
            </div>
            <span className={`text-[10px] uppercase tracking-[0.15em] text-center hidden sm:block ${
              isActive ? 'text-teal-l' : 'text-muted/60'
            }`}>
              {s.title}
            </span>
          </div>
        );
      })}
    </nav>
  );
}

function StepContent({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl">{title}</h2>
        {description && <p className="mt-1 text-xs text-muted">{description}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label, type = 'text', value, onChange, required, autoComplete, placeholder,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; required?: boolean; autoComplete?: string; placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.2em] text-muted">
        {label}{required && <span className="text-orange ml-1">*</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className="mt-1 w-full bg-white/5 border border-white/15 rounded px-3 py-2.5 text-white placeholder-muted/40 focus:outline-none focus:border-teal-l transition"
      />
    </label>
  );
}

function SelectField({
  label, value, onChange, options,
}: {
  label: string; value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-[0.2em] text-muted">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-white/5 border border-white/15 rounded px-3 py-2.5 text-white focus:outline-none focus:border-teal-l transition"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="text-dark">{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function Alert({ tone, children }: { tone: 'error' | 'ok'; children: React.ReactNode }) {
  const cls = tone === 'error'
    ? 'text-orange bg-orange/10 border-orange/30'
    : 'text-teal-l bg-teal-l/10 border-teal-l/30';
  return <div className={`text-sm border rounded p-3 ${cls}`}>{children}</div>;
}
