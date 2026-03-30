/**
 * Authorization port — shared output port interface (ADR-015).
 *
 * Modules ask "can this user perform this action?" and receive a boolean.
 * They never inspect roles, check override tables, or contain resolution logic.
 *
 * Initial adapter: static role-to-permission map (RoleBasedAuthorizationAdapter).
 * Future adapter: HR-backed resolution (positions + per-user overrides).
 */
export interface AuthorizationPort {
    canPerform(userId: string, action: string): Promise<boolean>;
}

export const AUTHORIZATION_PORT = Symbol("AuthorizationPort");
