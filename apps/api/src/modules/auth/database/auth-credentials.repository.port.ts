import { AuthCredentialsAggregate } from "../domain/auth-credentials.aggregate.js";

export interface AuthCredentialsRepositoryPort {
    findByUserId(userId: string): Promise<AuthCredentialsAggregate | null>;
    save(credentials: AuthCredentialsAggregate): Promise<void>;
}
