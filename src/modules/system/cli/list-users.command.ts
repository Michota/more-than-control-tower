import { Inject, Logger } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";
import { Command, CommandRunner, Option } from "nest-commander";
import { ListSystemUsersQuery } from "../queries/list-system-users/list-system-users.query.js";
import type { ListSystemUsersResponse } from "../queries/list-system-users/list-system-users.query.js";

interface ListUsersOptions {
    page?: number;
    limit?: number;
}

@Command({
    name: "list-users",
    description: "List system users (paginated)",
})
export class ListUsersCliCommand extends CommandRunner {
    private readonly logger = new Logger(ListUsersCliCommand.name);

    constructor(@Inject(QueryBus) private readonly queryBus: QueryBus) {
        super();
    }

    async run(_passedParams: string[], options: ListUsersOptions): Promise<void> {
        const page = options.page ?? 1;
        const limit = options.limit ?? 20;

        const result = await this.queryBus.execute<ListSystemUsersQuery, ListSystemUsersResponse>(
            new ListSystemUsersQuery(undefined, page, limit),
        );

        this.logger.log(`Users (page ${result.page}, ${result.count} total):`);

        for (const user of result.data) {
            this.logger.log(
                `  ${user.id}  ${user.email}  ${user.firstName} ${user.lastName}  roles=[${user.roles.join(",")}]  status=${user.status}`,
            );
        }

        if (result.data.length === 0) {
            this.logger.log("  (no users found)");
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
