import { describe, it, expect } from 'vitest';
import { evaluateQuestion, computeScore, type ScoringQuestion } from '@/lib/scoring';

const qUnique: ScoringQuestion = { id: 'q1', type_reponse: 'qcm_unique', bonne_reponse: 'A', options: ['A', 'B'] };
const qMulti: ScoringQuestion = { id: 'q2', type_reponse: 'qcm_multiple', bonne_reponse: ['A', 'B'], options: ['A', 'B', 'C'] };
const qText: ScoringQuestion = { id: 'q3', type_reponse: 'texte_libre', bonne_reponse: null, options: [] };

describe('evaluateQuestion', () => {
  it('qcm_unique correct', () => {
    expect(evaluateQuestion(qUnique, { question_id: 'q1', valeur: null, valeur_json: { value: 'A' } })).toBe('correct');
  });
  it('qcm_unique incorrect', () => {
    expect(evaluateQuestion(qUnique, { question_id: 'q1', valeur: null, valeur_json: { value: 'B' } })).toBe('incorrect');
  });
  it('réponse absente → incorrect', () => {
    expect(evaluateQuestion(qUnique, undefined)).toBe('incorrect');
  });
  it('qcm_multiple exact → correct', () => {
    expect(evaluateQuestion(qMulti, { question_id: 'q2', valeur: null, valeur_json: { values: ['A', 'B'] } })).toBe('correct');
  });
  it('qcm_multiple partiel → incorrect', () => {
    expect(evaluateQuestion(qMulti, { question_id: 'q2', valeur: null, valeur_json: { values: ['A'] } })).toBe('incorrect');
  });
  it('question non QCM → null', () => {
    expect(evaluateQuestion(qText, { question_id: 'q3', valeur: 'blabla', valeur_json: null })).toBeNull();
  });
});

describe('computeScore (comportement préservé)', () => {
  it('compte les évaluables et les bonnes réponses', () => {
    const r = computeScore(
      [qUnique, qMulti, qText],
      [
        { question_id: 'q1', valeur: null, valeur_json: { value: 'A' } },
        { question_id: 'q2', valeur: null, valeur_json: { values: ['A'] } },
      ],
    );
    expect(r.totalEvaluable).toBe(2);
    expect(r.correct).toBe(1);
    expect(r.scorePct).toBe(50);
  });
  it('aucun évaluable → scorePct null', () => {
    expect(computeScore([qText], []).scorePct).toBeNull();
  });
});
