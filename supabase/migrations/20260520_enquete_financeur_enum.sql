-- =============================================================================
--  Enquête financeur — étape 1 : étendre l'enum
-- =============================================================================
--  Postgres impose que `ALTER TYPE ... ADD VALUE` soit dans une migration
--  séparée si la nouvelle valeur est utilisée plus loin (la valeur n'est
--  pas visible dans la même transaction). On isole donc l'ADD VALUE ici.
-- =============================================================================

alter type enquete_kind add value if not exists 'financeur';
