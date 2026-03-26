import { Logger } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";
import { Command, CommandRunner, Option } from "nest-commander";
import {
    SearchCustomersQuery,
    SearchCustomersResponse,
} from "../../modules/crm/queries/search-customers/search-customers.query.js";

interface SearchCustomersOptions {
    term: string;
    page?: number;
    limit?: number;
}

@Command({
    name: "search-customers",
    description: "Search customers by name, email, phone, or address",
})
export class SearchCustomersCliCommand extends CommandRunner {
    private readonly logger = new Logger(SearchCustomersCliCommand.name);

    constructor(private readonly queryBus: QueryBus) {
        super();
    }

    async run(_passedParams: string[], options: SearchCustomersOptions): Promise<void> {
        if (!options.term) {
            this.logger.error("--term is required");
            return;
        }

        const page = options.page ?? 1;
        const limit = options.limit ?? 20;

        const result = await this.queryBus.execute<SearchCustomersQuery, SearchCustomersResponse>(
            new SearchCustomersQuery(
                options.term,
                {
                    alsoSearchByDescription: true,
                    alsoSearchByAddress: true,
                    alsoSearchByEmail: true,
                    alsoSearchByPhone: true,
                },
                page,
                limit,
            ),
        );

        this.logger.log(`Customers matching "${options.term}" (page ${result.page}, ${result.count} total):`);

        for (const customer of result.data) {
            this.logger.log(`  ${customer.id}  ${customer.name}  type=${customer.customerType}`);
        }

        if (result.data.length === 0) {
            this.logger.log("  (no customers found)");
        }
    }

    @Option({
        flags: "--term <searchTerm>",
        description: "Search term (name, email, phone, address)",
        required: true,
    })
    parseTerm(val: string): string {
        return val;
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
