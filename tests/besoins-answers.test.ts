import { describe, expect, it } from 'vitest';
import { besoinsSummary, buildBesoinsSnapshot, type BesoinQuestion } from '@/lib/besoins/answers';

const q = (over: Partial<BesoinQuestion>): BesoinQuestion => ({
  id: 'q',
  ordre: 1,
  libelle: 'Question',
  type_reponse: 'texte_libre',
  options: [],
  echelle_max: null,
  required: true,
  follow_up_options: [],
  ...over,
});

const questions: BesoinQuestion[] = [
  q({ id: 'contexte', ordre: 1, libelle: 'Contexte', type_reponse: 'qcm_multiple', options: ['Recyclage', 'Prise de poste'] }),
  q({ id: 'adapt', ordre: 2, libelle: 'Adaptation ?', type_reponse: 'qcm_unique', options: ['Oui', 'Non'], follow_up_options: ['Oui'] }),
  q({ id: 'niveau', ordre: 3, libelle: 'Niveau', type_reponse: 'echelle', echelle_max: 5 }),
  q({ id: 'contraintes', ordre: 4, libelle: 'Contraintes', required: false }),
];

describe('buildBesoinsSnapshot', () => {
  it('construit l\'instantané et le résumé', () => {
    const res = buildBesoinsSnapshot(questions, [
      { question_id: 'contexte', valeur_json: { values: ['Recyclage'] } },
      { question_id: 'adapt', valeur_json: { value: 'Oui', followup: 'Malentendant' } },
      { question_id: 'niveau', valeur: '3' },
    ]);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.answers.map((a) => a.reponse)).toEqual(['Recyclage', 'Oui', '3 / 5', '']);
    expect(res.answers[1].precision).toBe('Malentendant');
    expect(besoinsSummary(res.answers)).toBe(
      '1. Contexte\nRecyclage\n\n2. Adaptation ?\nOui (Malentendant)\n\n3. Niveau\n3 / 5\n\n4. Contraintes\n—'
    );
  });

  it('refuse une question obligatoire vide', () => {
    const res = buildBesoinsSnapshot(questions, [{ question_id: 'adapt', valeur_json: { value: 'Non' } }]);
    expect(res).toEqual({ ok: false, error: 'La question 1 est obligatoire.' });
  });

  it('exige la précision quand elle est demandée', () => {
    const res = buildBesoinsSnapshot(questions, [
      { question_id: 'contexte', valeur_json: { values: ['Recyclage'] } },
      { question_id: 'adapt', valeur_json: { value: 'Oui' } },
      { question_id: 'niveau', valeur: '2' },
    ]);
    expect(res).toEqual({ ok: false, error: 'Question 2 : merci de préciser votre réponse.' });
  });

  it('refuse une option inexistante ou une note hors échelle', () => {
    expect(buildBesoinsSnapshot(questions, [
      { question_id: 'contexte', valeur_json: { values: ['Inventé'] } },
    ]).ok).toBe(false);
    expect(buildBesoinsSnapshot(questions, [
      { question_id: 'contexte', valeur_json: { values: ['Recyclage'] } },
      { question_id: 'adapt', valeur_json: { value: 'Non' } },
      { question_id: 'niveau', valeur: '9' },
    ]).ok).toBe(false);
  });

  it('aucune question → instantané vide', () => {
    expect(buildBesoinsSnapshot([], [])).toEqual({ ok: true, answers: [] });
  });
});
