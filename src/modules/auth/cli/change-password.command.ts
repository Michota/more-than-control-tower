import { Inject } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { Command, CommandRunner, Option } from "nest-commander";
import { ChangePasswordCommand } from "../commands/change-password/change-password.command.js";

interface ChangePasswordOptions {
    userId: string;
    password: string;
}

@Command({
    name: "change-password",
    description: "Set or change a user's password (works for any user status)",
})
export class ChangePasswordCliCommand extends CommandRunner {
    constructor(@Inject(CommandBus) private readonly commandBus: CommandBus) {
        super();
    }

    async run(_passedParams: string[], options: ChangePasswordOptions): Promise<void> {
        if (!options.userId || !options.password) {
            console.error("--user-id and --password are both required");
            return;
        }

        if (options.password.length < 8) {
            console.error("Password must be at least 8 characters");
            return;
        }

        await this.commandBus.execute(
            new ChangePasswordCommand({ userId: options.userId, password: options.password }),
        );

        console.log("Password updated.");
    }

    @Option({
        flags: "--user-id <userId>",
        description: "UUID of the user",
        required: true,
    })
    parseUserId(val: string): string {
        return val;
    }

    @Option({
        flags: "--password <password>",
        description: "New password",
        required: true,
    })
    parsePassword(val: string): string {
        return val;
    }
}
