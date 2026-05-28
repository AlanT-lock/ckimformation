import { describe, it } from 'vitest';

/**
 * Tests d'isolation RLS pour les sessions réservées.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * STATUT : SKIPPÉ
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * Pourquoi ce suite est skippé :
 *  - Le projet ne dispose pas d'une base Supabase dédiée aux tests : un seul
 *    `.env.local` pointant sur l'instance partagée / production-like.
 *  - Des vrais tests RLS exigent de créer des `auth.users` réels via
 *    `auth.admin.createUser` puis de générer un JWT (ou utiliser
 *    `signInWithPassword`) pour instancier un client scopé à cet utilisateur.
 *  - Créer ces utilisateurs lors d'un `npm run test` polluerait la base
 *    partagée (auth.users + profiles + déclencheurs côté Auth).
 *  - Pas de clé anon dédiée test, pas de seed/reset automatique.
 *
 * Quand activer ce suite :
 *  - Quand le projet aura une base Supabase locale (supabase start) OU un
 *    projet "preview" séparé avec reset automatique.
 *  - Ajouter alors `SUPABASE_TEST_URL`, `SUPABASE_TEST_ANON_KEY`,
 *    `SUPABASE_TEST_SERVICE_ROLE_KEY` au CI et basculer ce fichier en
 *    `describe(...)` réel.
 *
 * Scénarios à couvrir (voir aussi rls-manual-checklist.md) :
 *  1. Un user d'entreprise B ne voit PAS une session réservée à l'entreprise A
 *     - SELECT sur `sessions` WHERE id = <session réservée A> → 0 rows.
 *  2. Un user d'entreprise B ne voit PAS le détail de réservation de l'entreprise A
 *     - SELECT sur `session_reserved_details` WHERE session_id = <id> → 0 rows.
 *  3. Un user d'entreprise B ne peut PAS uploader un document sur la session
 *     réservée à l'entreprise A
 *     - INSERT dans `session_document_uploads` → erreur RLS (code 42501).
 *  4. Un user d'entreprise A voit bien sa propre session réservée et ses détails.
 *  5. Un admin (role = 'admin') voit toutes les sessions réservées.
 *  6. Un user anonyme (sans JWT) ne voit aucune session réservée.
 *  7. Un user d'entreprise B ne peut PAS accepter/refuser une invitation
 *     adressée à l'entreprise A (`session_invitations`).
 *
 * Squelette d'implémentation (à activer plus tard) :
 *
 *   const admin = createClient(url, serviceKey);
 *   // Seed
 *   const { data: entA } = await admin.from('etablissements').insert({...}).select().single();
 *   const { data: entB } = await admin.from('etablissements').insert({...}).select().single();
 *   const { data: userB } = await admin.auth.admin.createUser({
 *     email: `test-b-${Date.now()}@example.test`,
 *     password: 'test-password-123',
 *     email_confirm: true,
 *   });
 *   await admin.from('profiles').insert({ id: userB.user.id, etablissement_id: entB.id, role: 'stagiaire' });
 *   const { data: session } = await admin.from('sessions').insert({ ..., reserved_to_etablissement_id: entA.id }).select().single();
 *
 *   // Client scopé user B
 *   const userClient = createClient(url, anonKey);
 *   await userClient.auth.signInWithPassword({ email: userB.user.email!, password: 'test-password-123' });
 *
 *   const { data: rows } = await userClient.from('sessions').select('id').eq('id', session.id);
 *   expect(rows).toHaveLength(0);
 *
 *   // Cleanup afterAll : suppression de toutes les rows seedées + admin.auth.admin.deleteUser(userB.user.id)
 *
 * En attendant, la vérification RLS se fait :
 *  - manuellement via tests/sessions-reservees/rls-manual-checklist.md
 *  - via les policies SQL revues dans la migration 20260528_sessions_reservees.sql
 *  - via les tests unitaires des server actions qui appliquent les filtres applicatifs.
 */

describe.skip('RLS isolation — sessions réservées (skipped: shared DB)', () => {
  it('user d\'entreprise B ne voit pas une session réservée à l\'entreprise A', () => {
    // Voir rls-manual-checklist.md scénario 1
  });

  it('user d\'entreprise B ne voit pas session_reserved_details de l\'entreprise A', () => {
    // Voir rls-manual-checklist.md scénario 2
  });

  it('user d\'entreprise B ne peut pas INSERT dans session_document_uploads', () => {
    // Voir rls-manual-checklist.md scénario 3
  });

  it('user d\'entreprise A voit bien sa propre session réservée', () => {
    // Voir rls-manual-checklist.md scénario 4
  });

  it('admin voit toutes les sessions réservées', () => {
    // Voir rls-manual-checklist.md scénario 5
  });

  it('user anonyme ne voit aucune session réservée', () => {
    // Voir rls-manual-checklist.md scénario 6
  });

  it('user d\'entreprise B ne peut pas accepter une invitation pour l\'entreprise A', () => {
    // Voir rls-manual-checklist.md scénario 7
  });
});
