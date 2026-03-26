import { Inject, Logger } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { Command, CommandRunner, Option } from "nest-commander";
import { UpdateSystemUserCommand } from "../commands/update-system-user/update-system-user.command.js";

interface UpdateAdminOptions {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
}

@Command({
    name: "update-admin",
    description: "Update an administrator account's data (email, name)",
})
export class UpdateAdminCliCommand extends CommandRunner {
    private readonly logger = new Logger(UpdateAdminCliCommand.name);

    constructor(@Inject(CommandBus) private readonly commandBus: CommandBus) {
        super();
    }

    async run(_passedParams: string[], options: UpdateAdminOptions): Promise<void> {
        if (!options.id) {
            this.logger.error("--id is required");
            return;
        }

        if (!options.email && !options.firstName && !options.lastName) {
            this.logger.error("At least one of --email, --first-name, or --last-name must be provided");
            return;
        }

        this.logger.log(`Updating administrator ${options.id}...`);

        await this.commandBus.execute(
            new UpdateSystemUserCommand({
                userId: options.id,
                email: options.email,
                firstName: options.firstName,
                lastName: options.lastName,
            }),
        );

        this.logger.log(`Administrator ${options.id} updated successfully`);
    }

    @Option({
        flags: "--id <userId>",
        description: "Administrator UUID",
        required: true,
    })
    parseId(val: string): string {
        return val;
    }

    @Option({
        flags: "--email <email>",
        description: "New email address",
    })
    parseEmail(val: string): string {
        return val;
    }

    @Option({
        flags: "--first-name <firstName>",
        description: "New first name",
    })
    parseFirstName(val: string): string {
        return val;
    }

    @Option({
        flags: "--last-name <lastName>",
        description: "New last name",
    })
    parseLastName(val: string): string {
        return val;
    }
}
