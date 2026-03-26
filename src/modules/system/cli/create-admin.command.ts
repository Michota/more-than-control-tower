import { Inject, Logger } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { Command, CommandRunner, Option } from "nest-commander";
import { CreateSystemUserCommand } from "../commands/create-system-user/create-system-user.command.js";
import { SystemUserRole } from "../domain/system-user-role.enum.js";

interface CreateAdminOptions {
    email: string;
    firstName: string;
    lastName: string;
}

@Command({
    name: "create-admin",
    description: "Create a new administrator account",
})
export class CreateAdminCliCommand extends CommandRunner {
    private readonly logger = new Logger(CreateAdminCliCommand.name);

    constructor(@Inject(CommandBus) private readonly commandBus: CommandBus) {
        super();
    }

    async run(_passedParams: string[], options: CreateAdminOptions): Promise<void> {
        if (!options.email || !options.firstName || !options.lastName) {
            this.logger.error("--email, --first-name, and --last-name are all required");
            return;
        }

        this.logger.log(`Creating administrator account for ${options.email}...`);

        const userId = await this.commandBus.execute(
            new CreateSystemUserCommand({
                email: options.email,
                firstName: options.firstName,
                lastName: options.lastName,
                roles: [SystemUserRole.ADMINISTRATOR],
            }),
        );

        this.logger.log(`Administrator created with ID: ${userId}`);
    }

    @Option({
        flags: "--email <email>",
        description: "Administrator email (login)",
        required: true,
    })
    parseEmail(val: string): string {
        return val;
    }

    @Option({
        flags: "--first-name <firstName>",
        description: "Administrator first name",
        required: true,
    })
    parseFirstName(val: string): string {
        return val;
    }

    @Option({
        flags: "--last-name <lastName>",
        description: "Administrator last name",
        required: true,
    })
    parseLastName(val: string): string {
        return val;
    }
}
