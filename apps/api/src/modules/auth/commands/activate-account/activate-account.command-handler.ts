import { Inject } from "@nestjs/common";
import { CommandBus, CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { QueryBus } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { GetSystemUserQuery, GetSystemUserResponse } from "../../../../shared/queries/get-system-user.query.js";
import { ActivateSystemUserCommand } from "../../../system/commands/activate-system-user/activate-system-user.command.js";
import { AuthCredentialsAggregate } from "../../domain/auth-credentials.aggregate.js";
import { AccountAlreadyActivatedError, InvalidActivationTokenError } from "../../domain/auth.errors.js";
import type { AuthCredentialsRepositoryPort } from "../../database/auth-credentials.repository.port.js";
import { AUTH_CREDENTIALS_REPOSITORY_PORT, PASSWORD_HASHER_PORT } from "../../auth.di-tokens.js";
import type { PasswordHasherPort } from "../../infrastructure/password-hasher.port.js";
import { JwtTokenService } from "../../infrastructure/jwt-token.service.js";
import { ActivateAccountCommand, ActivateAccountResult } from "./activate-account.command.js";

@CommandHandler(ActivateAccountCommand)
export class ActivateAccountCommandHandler implements ICommandHandler<ActivateAccountCommand, ActivateAccountResult> {
    constructor(
        @Inject(AUTH_CREDENTIALS_REPOSITORY_PORT)
        private readonly credentialsRepo: AuthCredentialsRepositoryPort,

        @Inject(PASSWORD_HASHER_PORT)
        private readonly passwordHasher: PasswordHasherPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly queryBus: QueryBus,
        private readonly commandBus: CommandBus,
        private readonly jwtTokenService: JwtTokenService,
    ) {}

    async execute(cmd: ActivateAccountCommand): Promise<ActivateAccountResult> {
        let userId: string;
        try {
            const payload = this.jwtTokenService.verifyActivationToken(cmd.activationToken);
            userId = payload.sub;
        } catch {
            throw new InvalidActivationTokenError();
        }

        const systemUser = await this.queryBus.execute<GetSystemUserQuery, GetSystemUserResponse | null>(
            new GetSystemUserQuery(userId),
        );

        if (!systemUser) {
            throw new InvalidActivationTokenError();
        }

        if (systemUser.status !== "unactivated") {
            throw new AccountAlreadyActivatedError();
        }

        const existingCredentials = await this.credentialsRepo.findByUserId(userId);
        if (existingCredentials) {
            throw new AccountAlreadyActivatedError();
        }

        const passwordHash = await this.passwordHasher.hash(cmd.password);
        const credentials = AuthCredentialsAggregate.create({ userId, passwordHash });

        await this.credentialsRepo.save(credentials);
        await this.commandBus.execute(new ActivateSystemUserCommand({ userId }));
        await this.uow.commit();

        return {
            accessToken: this.jwtTokenService.signAccessToken(userId),
            refreshToken: this.jwtTokenService.signRefreshToken(userId),
        };
    }
}
