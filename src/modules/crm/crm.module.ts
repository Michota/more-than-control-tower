import { EntityManager } from "@mikro-orm/core";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { MikroOrmUnitOfWork } from "../../shared/infrastructure/mikro-orm-unit-of-work.js";
import { UNIT_OF_WORK_PORT } from "../../shared/ports/tokens.js";
import { CreateCustomerCommandHandler } from "./application/commands/create-customer/create-customer.command-handler.js";
import { CUSTOMER_REPOSITORY_PORT } from "./application/ports/tokens.js";
import { GetCustomerQueryHandler } from "./application/queries/get-customer/get-customer.query-handler.js";
import { SearchCustomersQueryHandler } from "./application/queries/search-customers/search-customers.query-handler.js";
import { CustomerService } from "./application/services/customer.service.js";
import { CustomerAddress } from "./infrastructure/persistence/customer-address.entity.js";
import { CustomerContact } from "./infrastructure/persistence/customer-contact.entity.js";
import { Customer } from "./infrastructure/persistence/customer.entity.js";
import { CustomerRepository } from "./infrastructure/persistence/customer.repository.js";
import { CustomerController } from "./infrastructure/http/customer.controller.js";

@Module({
    imports: [MikroOrmModule.forFeature([Customer, CustomerAddress, CustomerContact])],
    controllers: [CustomerController],
    providers: [
        CustomerService,
        CreateCustomerCommandHandler,
        GetCustomerQueryHandler,
        SearchCustomersQueryHandler,
        {
            provide: CUSTOMER_REPOSITORY_PORT,
            useFactory: (em: EntityManager) => new CustomerRepository(em),
            inject: [EntityManager],
        },
        {
            provide: UNIT_OF_WORK_PORT,
            useFactory: (em: EntityManager) => new MikroOrmUnitOfWork(em),
            inject: [EntityManager],
        },
    ],
})
export class CrmModule {}
