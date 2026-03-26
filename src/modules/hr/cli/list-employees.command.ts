import { Inject, Logger } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";
import { Command, CommandRunner, Option } from "nest-commander";
import { ListEmployeesQuery } from "../queries/list-employees/list-employees.query.js";
import type { ListEmployeesResponse } from "../queries/list-employees/list-employees.query-handler.js";

interface ListEmployeesOptions {
    page?: number;
    limit?: number;
}

@Command({
    name: "list-employees",
    description: "List employees (paginated)",
})
export class ListEmployeesCliCommand extends CommandRunner {
    private readonly logger = new Logger(ListEmployeesCliCommand.name);

    constructor(@Inject(QueryBus) private readonly queryBus: QueryBus) {
        super();
    }

    async run(_passedParams: string[], options: ListEmployeesOptions): Promise<void> {
        const page = options.page ?? 1;
        const limit = options.limit ?? 20;

        const result = await this.queryBus.execute<ListEmployeesQuery, ListEmployeesResponse>(
            new ListEmployeesQuery(page, limit),
        );

        this.logger.log(`Employees (page ${result.page}, ${result.count} total):`);

        for (const emp of result.data) {
            const positions = emp.positionAssignments.map((p) => p.positionKey).join(", ") || "none";
            this.logger.log(
                `  ${emp.id}  ${emp.firstName} ${emp.lastName}  status=${emp.status}  positions=[${positions}]`,
            );
        }

        if (result.data.length === 0) {
            this.logger.log("  (no employees found)");
        }
    }

    @Option({ flags: "--page <page>", description: "Page number (default: 1)" })
    parsePage(val: string): number {
        return parseInt(val, 10);
    }

    @Option({ flags: "--limit <limit>", description: "Items per page (default: 20)" })
    parseLimit(val: string): number {
        return parseInt(val, 10);
    }
}
