import { Body, Controller, Get, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { type UUID } from "crypto";
import {
    GetCustomerDetailQuery,
    GetCustomerDetailResponse,
} from "./queries/get-customer-detail/get-customer-detail.query.js";
import { CreateCustomerCommand } from "./commands/create-customer/create-customer.command.js";
import { CreateCustomerRequest } from "./commands/create-customer/create-customer.request.dto.js";
import { UpdateCustomerCommand } from "./commands/update-customer/update-customer.command.js";
import { UpdateCustomerRequest } from "./commands/update-customer/update-customer.request.dto.js";
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
                customerType: body.customerType,
                description: body.description,
                note: body.note,
                firstName: body.firstName,
                lastName: body.lastName,
                companyName: body.companyName,
                nip: body.nip,
                addresses: body.addresses,
                contacts: body.contacts,
            }),
        );
        return { customerId };
    }

    @Patch(":id")
    async updateCustomer(@Param("id", ParseUUIDPipe) id: UUID, @Body() body: UpdateCustomerRequest): Promise<void> {
        await this.commandBus.execute(
            new UpdateCustomerCommand({
                customerId: id,
                name: body.name,
                description: body.description,
                note: body.note,
                firstName: body.firstName,
                lastName: body.lastName,
                companyName: body.companyName,
                nip: body.nip,
                addresses: body.addresses,
                contacts: body.contacts,
            }),
        );
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
    async getCustomer(@Param("id", ParseUUIDPipe) id: UUID): Promise<GetCustomerDetailResponse> {
        const customer = await this.queryBus.execute<GetCustomerDetailQuery, GetCustomerDetailResponse | null>(
            new GetCustomerDetailQuery(id),
        );
        if (!customer) {
            throw new NotFoundException(`Customer ${id} not found`);
        }
        return customer;
    }
}
