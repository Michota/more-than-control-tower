import { Inject, Logger } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { Command, CommandRunner, Option } from "nest-commander";
import { DeleteEmployeeCommand } from "../commands/delete-employee/delete-employee.command.js";

interface DeleteEmployeeOptions {
    id: string;
}

@Command({
    name: "delete-employee",
    description: "Permanently delete an employee record by ID",
})
export class DeleteEmployeeCliCommand extends CommandRunner {
    private readonly logger = new Logger(DeleteEmployeeCliCommand.name);

    constructor(@Inject(CommandBus) private readonly commandBus: CommandBus) {
        super();
    }

    async run(_passedParams: string[], options: DeleteEmployeeOptions): Promise<void> {
        if (!options.id) {
            this.logger.error("--id is required");
            return;
        }

        this.logger.log(`Deleting employee ${options.id}...`);

        await this.commandBus.execute(new DeleteEmployeeCommand({ employeeId: options.id }));

        this.logger.log(`Employee ${options.id} deleted successfully`);
    }

    @Option({
        flags: "--id <employeeId>",
        description: "Employee UUID to delete",
        required: true,
    })
    parseId(val: string): string {
        return val;
    }
}
