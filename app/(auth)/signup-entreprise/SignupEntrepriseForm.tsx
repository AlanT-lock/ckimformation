'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { RgpdCheckbox } from '@/components/forms/RgpdCheckbox';
import type { Secteur } from '@/lib/db/secteurs';
import { claimInvitationFromTokenAction } from '@/app/actions/claim-session-invitation';
import { CompanyFormFields } from '@/components/forms/CompanyFormFields';
import {
  EMPTY_COMPANY_INPUT,
  toCompanyAuthMetadata,
  validateCompanySection,
  type CompanyInput,
  type CompanySection,
} from '@/lib/validation/company';

export interface SignupEntreprisePrefill {
  email?: string;
  raison_sociale?: string;
  siret?: string;
  contact_nom?: string;
  contact_fonction?: string;
  contact_phone?: string;
}

interface FormState extends CompanyInput {
  password: string;
  confirm: string;
}

const INITIAL: FormState = { ...EMPTY_COMPANY_INPUT, password: '', confirm: '' };

type Step = 0 | 1 | 2 | 3;

const STEPS: { num: number; title: string; subtitle: string }[] = [
  { num: 1, title: 'Société', subtitle: 'Informations légales' },
  { num: 2, title: 'Adresse', subtitle: 'Lieu de facturation' },
  { num: 3, title: 'Contact', subtitle: 'Référent du compte' },
  { num: 4, title: 'Accès', subtitle: 'Email et mot de passe' },
];

const SECTION_BY_STEP: Record<0 | 1 | 2, CompanySection> = { 0: 'societe', 1: 'adresse', 2: 'contact' };

function validate(step: Step, f: FormState): string | null {
  if (step !== 3) return validateCompanySection(SECTION_BY_STEP[step], f);
  if (f.password.length < 8) return 'Mot de passe : 8 caractères minimum.';
  if (f.password !== f.confirm) return 'Les mots de passe ne correspondent pas.';
  return null;
}

function validateRgpd(rgpd: boolean): string | null {
  return rgpd ? null : "Vous devez accepter la politique de confidentialité pour créer un compte.";
}

export function SignupEntrepriseForm({
  secteurs,
  invitationToken,
  invitationSessionId,
  prefill,
}: {
  secteurs: Secteur[];
  invitationToken?: string;
  invitationSessionId?: string;
  prefill?: SignupEntreprisePrefill;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [form, setForm] = useState<FormState>({
    ...INITIAL,
    email: prefill?.email ?? '',
    raison_sociale: prefill?.raison_sociale ?? '',
    siret: prefill?.siret ?? '',
    full_name: prefill?.contact_nom ?? '',
    contact_fonction: prefill?.contact_fonction ?? '',
    phone: prefill?.contact_phone ?? '',
  });
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
    const err = validate(0, form) ?? validate(1, form) ?? validate(2, form) ?? validate(3, form) ?? validateRgpd(rgpd);
    if (err) { setError(err); return; }
    setError(null);
    setMessage(null);
    setLoading(true);
    const postConfirmPath = invitationToken && invitationSessionId
      ? `/stagiaire/session-dediee/${invitationSessionId}?invitation_token=${encodeURIComponent(invitationToken)}`
      : '/stagiaire';
    const { error: signErr } = await supabase.auth.signUp({
      email: form.email.trim(),
      password: form.password,
      options: {
        emailRedirectTo: `${window.location.origin}/callback?redirect=${encodeURIComponent(postConfirmPath)}`,
        data: toCompanyAuthMetadata(form),
      },
    });
    setLoading(false);
    if (signErr) { setError(signErr.message); return; }

    // If a session is already established (e.g. email confirmation désactivée),
    // on tente de réclamer l'invitation immédiatement.
    if (invitationToken) {
      const { data: sessData } = await supabase.auth.getSession();
      if (sessData.session) {
        const res = await claimInvitationFromTokenAction(invitationToken);
        if (res.ok) {
          router.push(`/stagiaire/session-dediee/${res.sessionId}`);
          return;
        }
      }
    }

    setMessage(
      invitationToken
        ? 'Compte entreprise créé. Vérifiez votre boîte mail et cliquez sur le lien de confirmation — vous serez ensuite redirigé vers votre session dédiée.'
        : 'Compte entreprise créé. Vérifiez votre boîte mail et cliquez sur le lien de confirmation.'
    );
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
            <CompanyFormFields value={form} onChange={(next) => setForm((s) => ({ ...s, ...next }))} secteurs={secteurs} sections={['societe']} />
          </StepContent>
        )}

        {step === 1 && (
          <StepContent title="Adresse de facturation" description="Tous les champs sont obligatoires.">
            <CompanyFormFields value={form} onChange={(next) => setForm((s) => ({ ...s, ...next }))} secteurs={secteurs} sections={['adresse']} />
          </StepContent>
        )}

        {step === 2 && (
          <StepContent title="Contact principal" description="Personne référente du compte. Tous les champs sont obligatoires.">
            <CompanyFormFields value={form} onChange={(next) => setForm((s) => ({ ...s, ...next }))} secteurs={secteurs} sections={['contact']} />
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

function Alert({ tone, children }: { tone: 'error' | 'ok'; children: React.ReactNode }) {
  const cls = tone === 'error'
    ? 'text-orange bg-orange/10 border-orange/30'
    : 'text-teal-l bg-teal-l/10 border-teal-l/30';
  return <div className={`text-sm border rounded p-3 ${cls}`}>{children}</div>;
}
