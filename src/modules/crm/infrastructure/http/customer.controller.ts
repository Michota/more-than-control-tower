import { Body, Controller, Get, NotFoundException, Param, Post, Query } from "@nestjs/common";
import { QueryBus } from "@nestjs/cqrs";
import {
    SearchCustomersQuery,
    SearchCustomersResponse,
} from "../../application/queries/search-customers/search-customers.query.js";
import { SearchCustomersRequestDto } from "./dto/search-customers.request.dto.js";
import { CustomerService } from "../../application/services/customer.service.js";
import { CreateCustomerRequest } from "./dto/create-customer.request.dto.js";

@Controller("customer")
export class CustomerController {
    constructor(
        private readonly customerService: CustomerService,
        private readonly queryBus: QueryBus,
    ) {}

    @Post()
    async createCustomer(@Body() body: CreateCustomerRequest): Promise<{ customerId: string }> {
        const customerId = await this.customerService.createCustomer({
            name: body.name,
            description: body.description,
            addresses: body.addresses,
            contacts: body.contacts,
        });

        return { customerId };
    }

    @Get("search")
    async searchCustomers(@Query() dto: SearchCustomersRequestDto): Promise<SearchCustomersResponse> {
        return this.queryBus.execute(
            new SearchCustomersQuery(dto.query, {
                alsoSearchByDescription: dto.alsoSearchByDescription,
                alsoSearchByAddress: dto.alsoSearchByAddress,
                alsoSearchByEmail: dto.alsoSearchByEmail,
                alsoSearchByPhone: dto.alsoSearchByPhone,
            }),
        );
    }

    @Get(":id")
    async getCustomer(@Param("id") id: string) {
        const customer = await this.customerService.getCustomer(id);
        if (!customer) throw new NotFoundException(`Customer ${id} not found`);
        return customer;
    }
}
