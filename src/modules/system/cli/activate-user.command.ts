import { Inject, Logger } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { Command, CommandRunner, Option } from "nest-commander";
import { ActivateSystemUserCommand } from "../commands/activate-system-user/activate-system-user.command.js";

interface ActivateUserOptions {
    id: string;
}

@Command({
    name: "activate-user",
    description: "Activate a system user (unactivated or suspended)",
})
export class ActivateUserCliCommand extends CommandRunner {
    private readonly logger = new Logger(ActivateUserCliCommand.name);

    constructor(@Inject(CommandBus) private readonly commandBus: CommandBus) {
        super();
    }

    async run(_passedParams: string[], options: ActivateUserOptions): Promise<void> {
        if (!options.id) {
            this.logger.error("--id is required");
            return;
        }

        this.logger.log(`Activating user ${options.id}...`);

        await this.commandBus.execute(new ActivateSystemUserCommand({ userId: options.id }));

        this.logger.log(`User ${options.id} activated successfully`);
    }

    @Option({
        flags: "--id <userId>",
        description: "User UUID to activate",
        required: true,
    })
    parseId(val: string): string {
        return val;
    }
}
