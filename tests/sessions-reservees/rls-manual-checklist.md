# Checklist manuelle — Isolation RLS des sessions réservées

Ce document liste les vérifications à exécuter à la main (ou via Supabase Studio /
psql) pour valider l'isolation RLS des sessions réservées. Il complète le suite
`tests/sessions-reservees/rls.test.ts` qui est skippé tant que le projet ne
dispose pas d'une base Supabase dédiée aux tests.

## Pourquoi un check manuel ?

- Pas de base Supabase locale ou preview dédiée aux tests automatisés.
- Un seul `.env.local` pointant sur l'instance partagée → créer des
  `auth.users` lors de `npm run test` polluerait la prod.
- Les policies RLS sont définies dans la migration
  `supabase/migrations/20260528_sessions_reservees.sql` (et migrations
  associées).

## Pré-requis

- Accès Supabase Studio (ou psql) sur un projet **non-production** (preview /
  staging) avec les mêmes migrations appliquées.
- Capacité à créer 2 utilisateurs de test + 2 établissements + 1 session
  réservée.

## Scénarios

### Setup commun

1. Créer entreprise A (`etablissements`) → `ent_a_id`.
2. Créer entreprise B (`etablissements`) → `ent_b_id`.
3. Créer user A via Auth Studio : `userA@test.local` → `user_a_id`.
   Lier au profil avec `etablissement_id = ent_a_id`, `role = 'stagiaire'`.
4. Créer user B via Auth Studio : `userB@test.local` → `user_b_id`.
   Lier au profil avec `etablissement_id = ent_b_id`, `role = 'stagiaire'`.
5. Créer admin via Auth Studio : `admin@test.local`. Profil `role = 'admin'`.
6. Créer une session `sess_reserved_a` avec
   `reserved_to_etablissement_id = ent_a_id`.
7. Insérer une `session_reserved_details` pour `sess_reserved_a`.
8. Insérer une `session_invitations` (statut `pending`) adressée à
   `ent_a_id` pour `sess_reserved_a`.

### Scénario 1 — User B ne voit pas la session réservée de A

Connecté comme `userB` :
```sql
select id from sessions where id = '<sess_reserved_a>';
```
**Attendu : 0 row.**

### Scénario 2 — User B ne voit pas session_reserved_details de A

Connecté comme `userB` :
```sql
select * from session_reserved_details where session_id = '<sess_reserved_a>';
```
**Attendu : 0 row.**

### Scénario 3 — User B ne peut pas uploader un document

Connecté comme `userB` :
```sql
insert into session_document_uploads (session_id, document_type, storage_path, uploaded_by)
values ('<sess_reserved_a>', 'convention', 'fake/path.pdf', auth.uid());
```
**Attendu : erreur `new row violates row-level security policy` (code 42501).**

### Scénario 4 — User A voit sa propre session

Connecté comme `userA` :
```sql
select id from sessions where id = '<sess_reserved_a>';
select * from session_reserved_details where session_id = '<sess_reserved_a>';
```
**Attendu : 1 row pour chaque requête.**

### Scénario 5 — Admin voit toutes les sessions

Connecté comme `admin` :
```sql
select count(*) from sessions where reserved_to_etablissement_id is not null;
```
**Attendu : >= 1, inclut `sess_reserved_a`.**

### Scénario 6 — Anonyme ne voit rien

Sans JWT (client anon, non connecté) :
```sql
select id from sessions where id = '<sess_reserved_a>';
```
**Attendu : 0 row.**

### Scénario 7 — User B ne peut pas accepter une invitation pour A

Connecté comme `userB` :
```sql
update session_invitations set status = 'accepted' where session_id = '<sess_reserved_a>';
```
**Attendu : 0 row affectée OU erreur RLS.**

```sql
select * from session_invitations where session_id = '<sess_reserved_a>';
```
**Attendu : 0 row.**

## Cleanup

```sql
delete from session_invitations where session_id = '<sess_reserved_a>';
delete from session_document_uploads where session_id = '<sess_reserved_a>';
delete from session_reserved_details where session_id = '<sess_reserved_a>';
delete from sessions where id = '<sess_reserved_a>';
delete from profiles where id in ('<user_a_id>', '<user_b_id>');
-- Puis supprimer les auth.users via Supabase Studio
delete from etablissements where id in ('<ent_a_id>', '<ent_b_id>');
```

## Quand passer à l'automatisé

- Mettre en place `supabase start` local ou un projet preview Supabase
  dédié, avec migrations appliquées via `supabase db push`.
- Exposer `SUPABASE_TEST_URL` / `SUPABASE_TEST_ANON_KEY` /
  `SUPABASE_TEST_SERVICE_ROLE_KEY` au runner.
- Retirer le `.skip` dans `rls.test.ts` et implémenter chaque cas selon le
  squelette commenté dans ce fichier.
