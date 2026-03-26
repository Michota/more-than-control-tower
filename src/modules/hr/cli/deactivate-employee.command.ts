import { Inject, Logger } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { Command, CommandRunner, Option } from "nest-commander";
import { DeactivateEmployeeCommand } from "../commands/deactivate-employee/deactivate-employee.command.js";

interface DeactivateEmployeeOptions {
    id: string;
}

@Command({
    name: "deactivate-employee",
    description: "Deactivate an employee (offboarding)",
})
export class DeactivateEmployeeCliCommand extends CommandRunner {
    private readonly logger = new Logger(DeactivateEmployeeCliCommand.name);

    constructor(@Inject(CommandBus) private readonly commandBus: CommandBus) {
        super();
    }

    async run(_passedParams: string[], options: DeactivateEmployeeOptions): Promise<void> {
        if (!options.id) {
            this.logger.error("--id is required");
            return;
        }

        this.logger.log(`Deactivating employee ${options.id}...`);

        await this.commandBus.execute(new DeactivateEmployeeCommand({ employeeId: options.id }));

        this.logger.log(`Employee ${options.id} deactivated successfully`);
    }

    @Option({
        flags: "--id <employeeId>",
        description: "Employee UUID to deactivate",
        required: true,
    })
    parseId(val: string): string {
        return val;
    }
}
