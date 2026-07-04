import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marque une route comme accessible sans token d'accès (login, refresh,
 * select-farm, logout). Lu par JwtAuthGuard. Sans ce mécanisme, JwtAuthGuard
 * étant global (APP_GUARD), même /auth/login exigerait un token — ce qui
 * serait absurde puisque login est justement le moyen d'en obtenir un.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
