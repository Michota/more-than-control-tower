import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler, QueryBus } from "@nestjs/cqrs";
import {
    GetSystemUserByEmailQuery,
    GetSystemUserByEmailResponse,
} from "../../../../shared/queries/get-system-user-by-email.query.js";
import { AccountNotActivatedError, AccountSuspendedError, InvalidCredentialsError } from "../../domain/auth.errors.js";
import type { AuthCredentialsRepositoryPort } from "../../database/auth-credentials.repository.port.js";
import { AUTH_CREDENTIALS_REPOSITORY_PORT, PASSWORD_HASHER_PORT } from "../../auth.di-tokens.js";
import type { PasswordHasherPort } from "../../infrastructure/password-hasher.port.js";
import { JwtTokenService } from "../../infrastructure/jwt-token.service.js";
import { LoginCommand, LoginResult } from "./login.command.js";

@CommandHandler(LoginCommand)
export class LoginCommandHandler implements ICommandHandler<LoginCommand, LoginResult> {
    constructor(
        @Inject(AUTH_CREDENTIALS_REPOSITORY_PORT)
        private readonly credentialsRepo: AuthCredentialsRepositoryPort,

        @Inject(PASSWORD_HASHER_PORT)
        private readonly passwordHasher: PasswordHasherPort,

        private readonly queryBus: QueryBus,
        private readonly jwtTokenService: JwtTokenService,
    ) {}

    async execute(cmd: LoginCommand): Promise<LoginResult> {
        const systemUser = await this.queryBus.execute<GetSystemUserByEmailQuery, GetSystemUserByEmailResponse>(
            new GetSystemUserByEmailQuery(cmd.email),
        );
        if (!systemUser) {
            throw new InvalidCredentialsError();
        }

        if (systemUser.status === "suspended") {
            throw new AccountSuspendedError();
        }

        if (systemUser.status === "unactivated") {
            throw new AccountNotActivatedError();
        }

        const credentials = await this.credentialsRepo.findByUserId(systemUser.id);
        if (!credentials) {
            throw new InvalidCredentialsError();
        }

        const passwordValid = await this.passwordHasher.verify(cmd.password, credentials.passwordHash);
        if (!passwordValid) {
            throw new InvalidCredentialsError();
        }

        return {
            accessToken: this.jwtTokenService.signAccessToken(systemUser.id),
            refreshToken: this.jwtTokenService.signRefreshToken(systemUser.id),
        };
    }
}
