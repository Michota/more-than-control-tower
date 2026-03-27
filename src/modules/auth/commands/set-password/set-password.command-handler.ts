import { Inject } from "@nestjs/common";
import { CommandBus, CommandHandler, ICommandHandler, QueryBus } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { GetSystemUserQuery, GetSystemUserResponse } from "../../../../shared/queries/get-system-user.query.js";
import { ActivateSystemUserCommand } from "../../../system/commands/activate-system-user/activate-system-user.command.js";
import { AuthCredentialsAggregate } from "../../domain/auth-credentials.aggregate.js";
import { AccountAlreadyActivatedError } from "../../domain/auth.errors.js";
import type { AuthCredentialsRepositoryPort } from "../../database/auth-credentials.repository.port.js";
import { AUTH_CREDENTIALS_REPOSITORY_PORT, PASSWORD_HASHER_PORT } from "../../auth.di-tokens.js";
import type { PasswordHasherPort } from "../../infrastructure/password-hasher.port.js";
import { NotFoundException } from "../../../../libs/exceptions/index.js";
import { SetPasswordCommand } from "./set-password.command.js";

@CommandHandler(SetPasswordCommand)
export class SetPasswordCommandHandler implements ICommandHandler<SetPasswordCommand, void> {
    constructor(
        @Inject(AUTH_CREDENTIALS_REPOSITORY_PORT)
        private readonly credentialsRepo: AuthCredentialsRepositoryPort,

        @Inject(PASSWORD_HASHER_PORT)
        private readonly passwordHasher: PasswordHasherPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly queryBus: QueryBus,
        private readonly commandBus: CommandBus,
    ) {}

    async execute(cmd: SetPasswordCommand): Promise<void> {
        const user = await this.queryBus.execute<GetSystemUserQuery, GetSystemUserResponse | null>(
            new GetSystemUserQuery(cmd.userId),
        );

        if (!user) {
            throw new NotFoundException(`User with id ${cmd.userId} not found`);
        }

        if (user.status !== "UNACTIVATED") {
            throw new AccountAlreadyActivatedError();
        }

        const existing = await this.credentialsRepo.findByUserId(cmd.userId);
        if (existing) {
            throw new AccountAlreadyActivatedError();
        }

        const passwordHash = await this.passwordHasher.hash(cmd.password);
        const credentials = AuthCredentialsAggregate.create({ userId: cmd.userId, passwordHash });

        await this.credentialsRepo.save(credentials);
        await this.commandBus.execute(new ActivateSystemUserCommand({ userId: cmd.userId }));
        await this.uow.commit();
    }
}
