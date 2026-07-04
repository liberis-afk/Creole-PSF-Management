/**
 * Point d'entrée unique pour la lecture des variables d'environnement.
 *
 * Pourquoi centraliser ici plutôt que d'appeler process.env dans chaque
 * service : un seul endroit à modifier si une variable change de nom, et
 * ConfigService.get('jwt.accessSecret') est typé/autocomplété au lieu d'un
 * process.env.JWT_ACCESS_SECRET dispersé dans tout le code (source classique
 * de fautes de frappe silencieuses).
 */
export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),

  cors: {
    origin: (process.env.CORS_ORIGIN ?? 'http://localhost:3000').split(','),
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',

    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    refreshExpiresInMs: parseDurationToMs(process.env.JWT_REFRESH_EXPIRES_IN ?? '7d'),

    preAuthSecret: process.env.JWT_PRE_AUTH_SECRET,
    preAuthExpiresIn: process.env.JWT_PRE_AUTH_EXPIRES_IN ?? '5m',
  },
});

/**
 * Convertit une durée style JWT ("7d", "15m", "30s") en millisecondes.
 * Utilisé pour calculer expireLe sur SessionConnexion, qui doit être un
 * DateTime réel en base, pas une chaîne "7d".
 */
function parseDurationToMs(duration: string): number {
  const match = /^(\d+)(s|m|h|d)$/.exec(duration);
  if (!match) {
    throw new Error(`Format de durée invalide : "${duration}" (attendu ex. "15m", "7d")`);
  }
  const value = parseInt(match[1], 10);
  const unitToMs: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };
  return value * unitToMs[match[2]];
}
