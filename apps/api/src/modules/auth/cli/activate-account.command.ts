import { Inject } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { Command, CommandRunner, Option } from "nest-commander";
import z from "zod";
import { passwordSchema } from "@mtct/shared-types";
import { SetPasswordCommand } from "../commands/set-password/set-password.command.js";

const cliOptionsSchema = z.object({
    userId: z.uuid("Invalid user ID format"),
    password: passwordSchema,
});

@Command({
    name: "activate-account",
    description: "Set password and activate a user account (for first admin bootstrap)",
})
export class ActivateAccountCliCommand extends CommandRunner {
    constructor(@Inject(CommandBus) private readonly commandBus: CommandBus) {
        super();
    }

    async run(_passedParams: string[], options: { userId: string; password: string }): Promise<void> {
        const result = cliOptionsSchema.safeParse(options);
        if (!result.success) {
            console.error(z.prettifyError(result.error));
            return;
        }

        await this.commandBus.execute(
            new SetPasswordCommand({ userId: result.data.userId, password: result.data.password }),
        );

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
