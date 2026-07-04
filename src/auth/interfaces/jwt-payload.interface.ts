/**
 * Payload du token d'accès : scopé à UNE ferme (voir AuthService.login pour
 * la logique de sélection quand l'utilisateur en a plusieurs). C'est ce
 * fermeId + roleId que PermissionsGuard utilise pour vérifier les droits.
 */
export interface AccessTokenPayload {
  sub: string; // utilisateurId
  fermeId: string;
  roleId: string;
  type: 'access';
}

/**
 * Payload du token de rafraîchissement. `sid` référence l'id de la ligne
 * SessionConnexion correspondante — c'est ce qui permet la révocation
 * (voir AuthService.refresh / logout).
 */
export interface RefreshTokenPayload {
  sub: string; // utilisateurId
  fermeId: string;
  sid: string; // sessionId (= SessionConnexion.id)
  type: 'refresh';
}

/**
 * Payload du token intermédiaire émis quand un utilisateur a plusieurs
 * fermes et doit en choisir une avant de recevoir de vrais tokens.
 * Volontairement minimal : pas de fermeId, pas de roleId, courte durée de
 * vie (5 min) — ce token ne donne accès à rien d'autre qu'à l'endpoint
 * POST /auth/select-farm.
 */
export interface PreAuthTokenPayload {
  sub: string; // utilisateurId
  type: 'pre_auth';
}
