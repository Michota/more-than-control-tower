import { Inject } from "@nestjs/common";
import { CommandHandler, ICommandHandler, QueryBus } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { GetSystemUserQuery, GetSystemUserResponse } from "../../../../shared/queries/get-system-user.query.js";
import { AuthCredentialsAggregate } from "../../domain/auth-credentials.aggregate.js";
import type { AuthCredentialsRepositoryPort } from "../../database/auth-credentials.repository.port.js";
import { AUTH_CREDENTIALS_REPOSITORY_PORT, PASSWORD_HASHER_PORT } from "../../auth.di-tokens.js";
import type { PasswordHasherPort } from "../../infrastructure/password-hasher.port.js";
import { NotFoundException } from "../../../../libs/exceptions/index.js";
import { ChangePasswordCommand } from "./change-password.command.js";

@CommandHandler(ChangePasswordCommand)
export class ChangePasswordCommandHandler implements ICommandHandler<ChangePasswordCommand, void> {
    constructor(
        @Inject(AUTH_CREDENTIALS_REPOSITORY_PORT)
        private readonly credentialsRepo: AuthCredentialsRepositoryPort,

        @Inject(PASSWORD_HASHER_PORT)
        private readonly passwordHasher: PasswordHasherPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly queryBus: QueryBus,
    ) {}

    async execute(cmd: ChangePasswordCommand): Promise<void> {
        const user = await this.queryBus.execute<GetSystemUserQuery, GetSystemUserResponse | null>(
            new GetSystemUserQuery(cmd.userId),
        );

        if (!user) {
            throw new NotFoundException(`User with id ${cmd.userId} not found`);
        }

        const passwordHash = await this.passwordHasher.hash(cmd.password);

        const existing = await this.credentialsRepo.findByUserId(cmd.userId);
        if (existing) {
            existing.changePassword(passwordHash);
            await this.credentialsRepo.save(existing);
        } else {
            const credentials = AuthCredentialsAggregate.create({ userId: cmd.userId, passwordHash });
            await this.credentialsRepo.save(credentials);
        }

        await this.uow.commit();
    }
}
