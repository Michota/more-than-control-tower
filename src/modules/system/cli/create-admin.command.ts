import { Inject } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { Command, CommandRunner, Option } from "nest-commander";
import { CreateSystemUserCommand } from "../commands/create-system-user/create-system-user.command.js";
import { SystemUserRole } from "../domain/system-user-role.enum.js";

interface CreateAdminOptions {
    email: string;
    name: string;
}

@Command({
    name: "create-admin",
    description: "Create a new administrator account",
})
export class CreateAdminCliCommand extends CommandRunner {
    constructor(@Inject(CommandBus) private readonly commandBus: CommandBus) {
        super();
    }

    async run(_passedParams: string[], options: CreateAdminOptions): Promise<void> {
        if (!options.email || !options.name) {
            console.error("--email and --name are both required");
            return;
        }

        console.log(`Creating administrator account for ${options.email}...`);

        const userId = await this.commandBus.execute(
            new CreateSystemUserCommand({
                email: options.email,
                name: options.name,
                roles: [SystemUserRole.ADMINISTRATOR],
            }),
        );

        console.log(`Administrator created with ID: ${userId}`);
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
        flags: "--name <name>",
        description: "Administrator name",
        required: true,
    })
    parseName(val: string): string {
        return val;
    }
}
