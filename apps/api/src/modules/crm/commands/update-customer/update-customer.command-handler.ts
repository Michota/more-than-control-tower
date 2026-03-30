import { Inject } from "@nestjs/common";
import { CommandHandler, EventBus, ICommandHandler } from "@nestjs/cqrs";
import { UNIT_OF_WORK_PORT } from "../../../../shared/ports/tokens.js";
import type { UnitOfWorkPort } from "../../../../shared/ports/unit-of-work.port.js";
import { ContactHistoryEntry } from "../../domain/contact-history-entry.value-object.js";
import { CustomerAddress } from "../../domain/customer-address.value-object.js";
import { CustomerContact, CustomerContactProperties } from "../../domain/customer-contact.value-object.js";
import { ContactType } from "../../domain/customer-contact-type.enum.js";
import { CustomerProperties } from "../../domain/customer.aggregate.js";
import { CustomerNotFoundError } from "../../domain/customer.errors.js";
import type { CustomerRepositoryPort, PersistedContactSnapshot } from "../../database/customer.repository.port.js";
import { CUSTOMER_REPOSITORY_PORT } from "../../crm.di-tokens.js";
import { UpdateCustomerCommand, UpdateCustomerContactProps } from "./update-customer.command.js";

@CommandHandler(UpdateCustomerCommand)
export class UpdateCustomerCommandHandler implements ICommandHandler<UpdateCustomerCommand> {
    constructor(
        @Inject(CUSTOMER_REPOSITORY_PORT)
        private readonly customerRepo: CustomerRepositoryPort,

        @Inject(UNIT_OF_WORK_PORT)
        private readonly uow: UnitOfWorkPort,

        private readonly eventBus: EventBus,
    ) {}

    async execute(cmd: UpdateCustomerCommand): Promise<void> {
        const customer = await this.customerRepo.findOneById(cmd.customerId);
        if (!customer) {
            throw new CustomerNotFoundError(cmd.customerId);
        }

        const updateProps: Partial<Omit<CustomerProperties, "customerType">> = {};

        if (cmd.name !== undefined) {
            updateProps.name = cmd.name;
        }
        if (cmd.description !== undefined) {
            updateProps.description = cmd.description;
        }
        if (cmd.note !== undefined) {
            updateProps.note = cmd.note;
        }
        if (cmd.firstName !== undefined) {
            updateProps.firstName = cmd.firstName;
        }
        if (cmd.lastName !== undefined) {
            updateProps.lastName = cmd.lastName;
        }
        if (cmd.companyName !== undefined) {
            updateProps.companyName = cmd.companyName;
        }
        if (cmd.nip !== undefined) {
            updateProps.nip = cmd.nip;
        }

        if (cmd.addresses !== undefined) {
            updateProps.addresses = cmd.addresses.map(
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
        }

        if (cmd.contacts !== undefined) {
            const snapshots = await this.customerRepo.findContactSnapshots(cmd.customerId);
            updateProps.contacts = this.buildContactsWithHistory(snapshots, cmd.contacts);
        }

        customer.update(updateProps);

        await this.customerRepo.save(customer);
        await this.uow.commit();

        for (const event of customer.domainEvents) {
            await this.eventBus.publish(event);
        }
        customer.clearEvents();
    }

    private buildContactsWithHistory(
        snapshots: PersistedContactSnapshot[],
        newContactProps: UpdateCustomerContactProps[],
    ): CustomerContact[] {
        const snapshotById = new Map(snapshots.map((s) => [s.id, s]));

        return newContactProps.map((props) => {
            let history: ContactHistoryEntry[] = [];

            if (props.id) {
                const snapshot = snapshotById.get(props.id);
                if (snapshot && snapshot.value !== props.value) {
                    history = [
                        new ContactHistoryEntry({
                            previousValue: snapshot.value,
                            changedAt: new Date(),
                        }),
                        ...snapshot.history,
                    ];
                } else if (snapshot) {
                    history = snapshot.history;
                }
            }

            const base = {
                type: props.type,
                title: props.title,
                description: props.description,
                note: props.note,
                value: props.value,
                history,
            };

            if (props.type === ContactType.CUSTOM) {
                return new CustomerContact({
                    ...base,
                    type: ContactType.CUSTOM,
                    customLabel: props.customLabel!,
                });
            }

            return new CustomerContact(base as CustomerContactProperties);
        });
    }
}
