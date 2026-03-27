import { Inject } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { Command, CommandRunner, Option } from "nest-commander";
import { SetPasswordCommand } from "../commands/set-password/set-password.command.js";

interface ActivateAccountOptions {
    userId: string;
    password: string;
}

@Command({
    name: "activate-account",
    description: "Set password and activate a user account (for first admin bootstrap)",
})
export class ActivateAccountCliCommand extends CommandRunner {
    constructor(@Inject(CommandBus) private readonly commandBus: CommandBus) {
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

        await this.commandBus.execute(new SetPasswordCommand({ userId: options.userId, password: options.password }));

        console.log("Account activated. User can now log in.");
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
