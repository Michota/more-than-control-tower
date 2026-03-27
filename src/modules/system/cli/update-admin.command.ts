import { Inject } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { Command, CommandRunner, Option } from "nest-commander";
import { UpdateSystemUserCommand } from "../commands/update-system-user/update-system-user.command.js";

interface UpdateAdminOptions {
    id: string;
    email?: string;
    name?: string;
}

@Command({
    name: "update-admin",
    description: "Update an administrator account's data (email, name)",
})
export class UpdateAdminCliCommand extends CommandRunner {
    constructor(@Inject(CommandBus) private readonly commandBus: CommandBus) {
        super();
    }

    async run(_passedParams: string[], options: UpdateAdminOptions): Promise<void> {
        if (!options.id) {
            console.error("--id is required");
            return;
        }

        if (!options.email && !options.name) {
            console.error("At least one of --email or --name must be provided");
            return;
        }

        console.log(`Updating administrator ${options.id}...`);

        await this.commandBus.execute(
            new UpdateSystemUserCommand({
                userId: options.id,
                email: options.email,
                name: options.name,
            }),
        );

        console.log(`Administrator ${options.id} updated successfully`);
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
        flags: "--name <name>",
        description: "New name",
    })
    parseName(val: string): string {
        return val;
    }
}
