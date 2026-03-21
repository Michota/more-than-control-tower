import { EntityManager } from "@mikro-orm/core";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { MikroOrmUnitOfWork } from "../../shared/infrastructure/mikro-orm-unit-of-work.js";
import { UNIT_OF_WORK_PORT } from "../../shared/ports/tokens.js";
import { CreateCustomerCommandHandler } from "./commands/create-customer/create-customer.command-handler.js";
import { GetCustomerQueryHandler } from "./queries/get-customer/get-customer.query-handler.js";
import { SearchCustomersQueryHandler } from "./queries/search-customers/search-customers.query-handler.js";
import { CrmHttpController } from "./crm.http.controller.js";
import { CustomerAddress } from "./database/customer-address.entity.js";
import { CustomerContact } from "./database/customer-contact.entity.js";
import { Customer } from "./database/customer.entity.js";
import { CustomerRepository } from "./database/customer.repository.js";
import { CUSTOMER_REPOSITORY_PORT } from "./crm.di-tokens.js";

@Module({
    imports: [MikroOrmModule.forFeature([Customer, CustomerAddress, CustomerContact])],
    controllers: [CrmHttpController],
    providers: [
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
