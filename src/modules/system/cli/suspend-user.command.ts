import { Inject } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { Command, CommandRunner, Option } from "nest-commander";
import { SuspendSystemUserCommand } from "../commands/suspend-system-user/suspend-system-user.command.js";

interface SuspendUserOptions {
    id: string;
}

@Command({
    name: "suspend-user",
    description: "Suspend a system user (blocks access)",
})
export class SuspendUserCliCommand extends CommandRunner {
    constructor(@Inject(CommandBus) private readonly commandBus: CommandBus) {
        super();
    }

    async run(_passedParams: string[], options: SuspendUserOptions): Promise<void> {
        if (!options.id) {
            console.error("--id is required");
            return;
        }

        console.log(`Suspending user ${options.id}...`);

        await this.commandBus.execute(new SuspendSystemUserCommand({ userId: options.id }));

        console.log(`User ${options.id} suspended successfully`);
    }

    @Option({
        flags: "--id <userId>",
        description: "User UUID to suspend",
        required: true,
    })
    parseId(val: string): string {
        return val;
    }
}
