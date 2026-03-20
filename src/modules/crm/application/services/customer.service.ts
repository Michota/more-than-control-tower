import { Injectable } from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { GetCustomerQuery, GetCustomerResponse } from "../../../../shared/queries/get-customer.query.js";
import { CreateCustomerCommand } from "../commands/create-customer/create-customer.command.js";
import { CreateCustomerDto } from "../dtos/create-customer.dto.js";

@Injectable()
export class CustomerService {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    async createCustomer(dto: CreateCustomerDto): Promise<string> {
        return this.commandBus.execute(
            new CreateCustomerCommand({
                name: dto.name,
                description: dto.description,
                addresses: dto.addresses,
                contacts: dto.contacts,
            }),
        );
    }

    async getCustomer(customerId: string): Promise<GetCustomerResponse | null> {
        return this.queryBus.execute(new GetCustomerQuery(customerId));
    }
}
