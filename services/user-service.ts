/**
 * Re-exporta el servicio de usuario para los módulos que lo importan desde `services/user-service`.
 * La implementación real vive en `lib/db/services/user-service.ts`.
 */
export { UserService } from "../lib/db/services/user-service"
