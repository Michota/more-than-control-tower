import { Inject } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { Command, CommandRunner, Option } from "nest-commander";
import {
    GenerateActivationTokenCommand as GenerateActivationTokenAppCommand,
    GenerateActivationTokenResult,
} from "../commands/generate-activation-token/generate-activation-token.command.js";

interface GenerateActivationTokenOptions {
    userId: string;
}

@Command({
    name: "generate-activation-token",
    description: "Generate an activation token for an unactivated user",
})
export class GenerateActivationTokenCliCommand extends CommandRunner {
    constructor(@Inject(CommandBus) private readonly commandBus: CommandBus) {
        super();
    }

    async run(_passedParams: string[], options: GenerateActivationTokenOptions): Promise<void> {
        if (!options.userId) {
            console.error("--user-id is required");
            return;
        }

        const result = await this.commandBus.execute<GenerateActivationTokenAppCommand, GenerateActivationTokenResult>(
            new GenerateActivationTokenAppCommand({ userId: options.userId }),
        );

        console.log(`Activation token (valid 48h):\n${result.activationToken}`);
    }

    @Option({
        flags: "--user-id <userId>",
        description: "UUID of the user to generate activation token for",
        required: true,
    })
    parseUserId(val: string): string {
        return val;
    }
}
