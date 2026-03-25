import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { IdOfEntity } from "../../../../libs/ddd/aggregate-root.abstract.js";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { CustomerAddress } from "../../domain/customer-address.value-object.js";
import { CustomerContact, CustomerContactProperties } from "../../domain/customer-contact.value-object.js";
import { ContactType } from "../../domain/customer-contact-type.enum.js";
import { CustomerAggregate } from "../../domain/customer.aggregate.js";
import type { CustomerRepositoryPort } from "../../database/customer.repository.port.js";
import { CUSTOMER_REPOSITORY_PORT } from "../../crm.di-tokens.js";
import { CreateCustomerCommand } from "./create-customer.command.js";

@CommandHandler(CreateCustomerCommand)
export class CreateCustomerCommandHandler implements ICommandHandler<CreateCustomerCommand> {
    constructor(
        @Inject(CUSTOMER_REPOSITORY_PORT)
        private readonly customerRepo: CustomerRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: CreateCustomerCommand): Promise<IdOfEntity<CustomerAggregate>> {
        const addresses = cmd.addresses.map(
            (a) =>
                new CustomerAddress({
                    label: a.label,
                    note: a.note,
                    country: a.country,
                    state: a.state,
                    city: a.city,
                    postalCode: a.postalCode,
                    street: a.street,
                }),
        );

        const contacts = cmd.contacts.map((c) => {
            const base = {
                type: c.type,
                title: c.title,
                description: c.description,
                note: c.note,
                value: c.value,
                history: [],
            };

            if (c.type === ContactType.CUSTOM) {
                return new CustomerContact({
                    ...base,
                    type: ContactType.CUSTOM,
                    customLabel: c.customLabel!,
                });
            }

            return new CustomerContact(base as CustomerContactProperties);
        });

        const customer = CustomerAggregate.create({
            name: cmd.name,
            customerType: cmd.customerType,
            description: cmd.description,
            note: cmd.note,
            firstName: cmd.firstName,
            lastName: cmd.lastName,
            companyName: cmd.companyName,
            nip: cmd.nip,
            addresses,
            contacts,
        });

        await this.customerRepo.save(customer);
        await this.uow.commit();

        for (const event of customer.domainEvents) {
            await this.eventBus.publish(event);
        }

        customer.clearEvents();

        return customer.id;
    }
}
