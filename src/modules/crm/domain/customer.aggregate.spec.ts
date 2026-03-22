import { ZodError } from "zod";
import { validAddress } from "./customer-address.value-object.spec.js";
import { validEmailContact, validPhoneContact } from "./customer-contact.value-object.spec.js";
import { CustomerAggregate } from "./customer.aggregate.js";
import { CustomerCreatedDomainEvent } from "./events/customer-created.domain-event.js";
import { generateEntityId } from "src/libs/ddd/utils/randomize-entity-id.js";
import { uuidRegex } from "src/shared/utils/uuid-regex.js";

describe("CustomerAggregate.create()", () => {
    describe("happy path", () => {
        it("creates a customer with the provided properties", () => {
            const customer = CustomerAggregate.create({
                name: "Acme Corp",
                addresses: [validAddress()],
                contacts: [validEmailContact()],
            });

            expect(customer.name).toBe("Acme Corp");
            expect(customer.addresses).toHaveLength(1);
            expect(customer.contacts).toHaveLength(1);
        });

        it("assigns a UUID id", () => {
            const customer = CustomerAggregate.create({
                name: "Acme Corp",
                addresses: [],
                contacts: [validEmailContact()],
            });

            expect(customer.id).toMatch(uuidRegex);
        });

        it("emits a CustomerCreatedDomainEvent", () => {
            const customer = CustomerAggregate.create({
                name: "Acme Corp",
                addresses: [],
                contacts: [validEmailContact()],
            });

            expect(customer.domainEvents).toHaveLength(1);
            expect(customer.domainEvents[0]).toBeInstanceOf(CustomerCreatedDomainEvent);
            expect((customer.domainEvents[0] as CustomerCreatedDomainEvent).customerName).toBe("Acme Corp");
        });

        it("accepts multiple contacts of different types", () => {
            const customer = CustomerAggregate.create({
                name: "Acme Corp",
                addresses: [],
                contacts: [validEmailContact(), validPhoneContact()],
            });

            expect(customer.contacts).toHaveLength(2);
        });

        it("stores an optional description", () => {
            const customer = CustomerAggregate.create({
                name: "Acme Corp",
                description: "Our top distributor",
                addresses: [],
                contacts: [validEmailContact()],
            });

            expect(customer.description).toBe("Our top distributor");
        });
    });

    describe("validation", () => {
        it("throws when name is empty", () => {
            expect(() =>
                CustomerAggregate.create({
                    name: "",
                    addresses: [],
                    contacts: [validEmailContact()],
                }),
            ).toThrow(ZodError);
        });

        it("throws when contacts array is empty", () => {
            expect(() =>
                CustomerAggregate.create({
                    name: "Acme Corp",
                    addresses: [],
                    contacts: [],
                }),
            ).toThrow(ZodError);
        });
    });

    describe("CustomerAggregate.reconstitute()", () => {
        it("reconstructs a customer with all properties", () => {
            const customer = CustomerAggregate.reconstitute({
                id: generateEntityId("123e4567-e89b-12d3-a456-426614174000"),
                properties: {
                    name: "Acme Corp",
                    description: "Our top distributor",
                    addresses: [validAddress(), validAddress(), validAddress()],
                    contacts: [validEmailContact(), validPhoneContact()],
                },
            });

            expect(customer.id).toBe("123e4567-e89b-12d3-a456-426614174000");
            expect(customer.name).toBe("Acme Corp");
            expect(customer.description).toBe("Our top distributor");
            expect(customer.addresses).toHaveLength(3);
            expect(customer.contacts).toHaveLength(2);
        });
    });
});
