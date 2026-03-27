import { Inject } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { Command, CommandRunner, Option } from "nest-commander";
import { GetSystemUserQuery, GetSystemUserResponse } from "../../../shared/queries/get-system-user.query.js";
import { ActivateSystemUserCommand } from "../../system/commands/activate-system-user/activate-system-user.command.js";
import { AuthCredentialsAggregate } from "../domain/auth-credentials.aggregate.js";
import type { AuthCredentialsRepositoryPort } from "../database/auth-credentials.repository.port.js";
import type { PasswordHasherPort } from "../infrastructure/password-hasher.port.js";
import { AUTH_CREDENTIALS_REPOSITORY_PORT, PASSWORD_HASHER_PORT } from "../auth.di-tokens.js";
import type { UnitOfWorkPort } from "../../../shared/ports/unit-of-work.port.js";
import { UNIT_OF_WORK_PORT } from "../../../shared/ports/tokens.js";

interface ActivateAccountOptions {
    userId: string;
    password: string;
}

@Command({
    name: "activate-account",
    description: "Set password and activate a user account (for first admin bootstrap)",
})
export class ActivateAccountCliCommand extends CommandRunner {
    constructor(
        @Inject(CommandBus) private readonly commandBus: CommandBus,
        @Inject(QueryBus) private readonly queryBus: QueryBus,
        @Inject(AUTH_CREDENTIALS_REPOSITORY_PORT) private readonly credentialsRepo: AuthCredentialsRepositoryPort,
        @Inject(PASSWORD_HASHER_PORT) private readonly passwordHasher: PasswordHasherPort,
        @Inject(UNIT_OF_WORK_PORT) private readonly uow: UnitOfWorkPort,
    ) {
        super();
    }

    async run(_passedParams: string[], options: ActivateAccountOptions): Promise<void> {
        if (!options.userId || !options.password) {
            console.error("--user-id and --password are both required");
            return;
        }

        if (options.password.length < 8) {
            console.error("Password must be at least 8 characters");
            return;
        }

        const user = await this.queryBus.execute<GetSystemUserQuery, GetSystemUserResponse | null>(
            new GetSystemUserQuery(options.userId),
        );

        if (!user) {
            console.error(`User ${options.userId} not found`);
            return;
        }

        if (user.status !== "UNACTIVATED") {
            console.error(`User ${options.userId} is already ${user.status.toLowerCase()}`);
            return;
        }

        const existing = await this.credentialsRepo.findByUserId(options.userId);
        if (existing) {
            console.error(`Credentials already exist for user ${options.userId}`);
            return;
        }

        const passwordHash = await this.passwordHasher.hash(options.password);
        const credentials = AuthCredentialsAggregate.create({ userId: options.userId, passwordHash });

        await this.credentialsRepo.save(credentials);
        await this.commandBus.execute(new ActivateSystemUserCommand({ userId: options.userId }));
        await this.uow.commit();

        console.log(`Account activated for ${user.email}. User can now log in.`);
    }

    @Option({
        flags: "--user-id <userId>",
        description: "UUID of the user to activate",
        required: true,
    })
    parseUserId(val: string): string {
        return val;
    }

    @Option({
        flags: "--password <password>",
        description: "Password to set for the user",
        required: true,
    })
    parsePassword(val: string): string {
        return val;
    }
}
