import { Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { type UUID } from "crypto";
import { GetCustomerQuery, GetCustomerResponse } from "../../shared/queries/get-customer.query.js";
import { CreateCustomerCommand } from "./commands/create-customer/create-customer.command.js";
import { CreateCustomerRequest } from "./commands/create-customer/create-customer.request.dto.js";
import { SearchCustomersQuery, SearchCustomersResponse } from "./queries/search-customers/search-customers.query.js";
import { SearchCustomersRequestDto } from "./queries/search-customers/search-customers.request.dto.js";

@Controller("customer")
export class CrmHttpController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @Post()
    async createCustomer(@Body() body: CreateCustomerRequest): Promise<{ customerId: string }> {
        const customerId = await this.commandBus.execute(
            new CreateCustomerCommand({
                name: body.name,
                description: body.description,
                addresses: body.addresses,
                contacts: body.contacts,
            }),
        );
        return { customerId };
    }

    @Get("search")
    async searchCustomers(@Query() dto: SearchCustomersRequestDto): Promise<SearchCustomersResponse> {
        return this.queryBus.execute(
            new SearchCustomersQuery(
                dto.query,
                {
                    alsoSearchByDescription: dto.alsoSearchByDescription,
                    alsoSearchByAddress: dto.alsoSearchByAddress,
                    alsoSearchByEmail: dto.alsoSearchByEmail,
                    alsoSearchByPhone: dto.alsoSearchByPhone,
                },
                dto.page,
                dto.limit,
            ),
        );
    }

    @Get(":id")
    async getCustomer(@Param("id", ParseUUIDPipe) id: UUID): Promise<GetCustomerResponse> {
        const customer = await this.queryBus.execute<GetCustomerQuery, GetCustomerResponse | null>(
            new GetCustomerQuery(id),
        );
        if (!customer) throw new NotFoundException(`Customer ${id} not found`);
        return customer;
    }
}
