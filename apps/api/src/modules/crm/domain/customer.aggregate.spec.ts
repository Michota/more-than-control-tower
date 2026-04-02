import { generateEntityId } from "src/libs/ddd/utils/randomize-entity-id.js";
import { uuidRegex } from "src/shared/utils/uuid-regex.js";
import { ZodError } from "zod";
import { validAddress } from "./customer-address.value-object.spec.js";
import { validEmailContact, validPhoneContact, validCustomContact } from "./customer-contact.value-object.spec.js";
import { CustomerType } from "./customer-type.enum.js";
import { CustomerAggregate } from "./customer.aggregate.js";
import { CustomerCreatedDomainEvent } from "./events/customer-created.domain-event.js";

const b2cProps = () => ({
    name: "Jan Kowalski",
    customerType: CustomerType.B2C,
    firstName: "Jan",
    lastName: "Kowalski",
    addresses: [validAddress()],
    contacts: [validEmailContact()],
});

const b2bProps = () => ({
    name: "Acme Corp",
    customerType: CustomerType.B2B,
    companyName: "Acme Corporation",
    nip: "1234567890",
    addresses: [validAddress()],
    contacts: [validEmailContact()],
});

const b2aProps = () => ({
    name: "City Hall",
    customerType: CustomerType.B2A,
    addresses: [validAddress()],
    contacts: [validEmailContact()],
});

describe("CustomerAggregate.create()", () => {
    describe("happy path", () => {
        it("creates a B2C customer with firstName and lastName", () => {
            const customer = CustomerAggregate.create(b2cProps());

            expect(customer.name).toBe("Jan Kowalski");
            expect(customer.customerType).toBe(CustomerType.B2C);
            expect(customer.firstName).toBe("Jan");
            expect(customer.lastName).toBe("Kowalski");
        });

        it("creates a B2B customer with companyName and nip", () => {
            const customer = CustomerAggregate.create(b2bProps());

            expect(customer.customerType).toBe(CustomerType.B2B);
            expect(customer.companyName).toBe("Acme Corporation");
            expect(customer.nip).toBe("1234567890");
        });

        it("creates a B2A customer with just name", () => {
            const customer = CustomerAggregate.create(b2aProps());

            expect(customer.customerType).toBe(CustomerType.B2A);
            expect(customer.firstName).toBeUndefined();
            expect(customer.companyName).toBeUndefined();
        });

        it("assigns a UUID id", () => {
            const customer = CustomerAggregate.create(b2cProps());

            expect(customer.id).toMatch(uuidRegex);
        });

        it("emits a CustomerCreatedDomainEvent", () => {
            const customer = CustomerAggregate.create(b2cProps());

            expect(customer.domainEvents).toHaveLength(1);
            expect(customer.domainEvents[0]).toBeInstanceOf(CustomerCreatedDomainEvent);
            expect((customer.domainEvents[0] as CustomerCreatedDomainEvent).customerName).toBe("Jan Kowalski");
        });

        it("accepts multiple contacts of different types", () => {
            const customer = CustomerAggregate.create({
                ...b2cProps(),
                contacts: [validEmailContact(), validPhoneContact(), validCustomContact()],
            });

            expect(customer.contacts).toHaveLength(3);
        });

        it("stores an optional description and note", () => {
            const customer = CustomerAggregate.create({
                ...b2cProps(),
                description: "VIP customer",
                note: "Prefers morning deliveries",
            });

            expect(customer.description).toBe("VIP customer");
            expect(customer.note).toBe("Prefers morning deliveries");
        });
    });

    describe("validation", () => {
        it("throws when name is empty", () => {
            expect(() => CustomerAggregate.create({ ...b2cProps(), name: "" })).toThrow(ZodError);
        });

        it("throws when contacts array is empty", () => {
            expect(() => CustomerAggregate.create({ ...b2cProps(), contacts: [] })).toThrow(ZodError);
        });

        it("throws when B2C customer is missing firstName", () => {
            expect(() => CustomerAggregate.create({ ...b2cProps(), firstName: undefined })).toThrow(ZodError);
        });

        it("throws when B2C customer is missing lastName", () => {
            expect(() => CustomerAggregate.create({ ...b2cProps(), lastName: undefined })).toThrow(ZodError);
        });

        it("throws when B2B customer is missing companyName", () => {
            expect(() => CustomerAggregate.create({ ...b2bProps(), companyName: undefined })).toThrow(ZodError);
        });

        it("throws when B2B customer is missing nip", () => {
            expect(() => CustomerAggregate.create({ ...b2bProps(), nip: undefined })).toThrow(ZodError);
        });
    });
});

describe("CustomerAggregate.update()", () => {
    it("updates name", () => {
        const customer = CustomerAggregate.create(b2cProps());
        customer.update({ name: "Updated Name" });

        expect(customer.name).toBe("Updated Name");
    });

    it("updates type-specific fields", () => {
        const customer = CustomerAggregate.create(b2bProps());
        customer.update({ companyName: "New Corp Name" });

        expect(customer.companyName).toBe("New Corp Name");
    });

    it("does not allow customerType in update props (compile-time enforced)", () => {
        const customer = CustomerAggregate.create(b2cProps());

        // customerType is excluded from the Partial<Omit<...>> so this is a runtime test
        // that updating other fields does not change the type
        customer.update({ name: "New Name" });
        expect(customer.customerType).toBe(CustomerType.B2C);
    });

    it("validates after update — throws if B2C loses required fields", () => {
        const customer = CustomerAggregate.create(b2cProps());

        expect(() => customer.update({ firstName: undefined })).toThrow(ZodError);
    });

    it("updates addresses", () => {
        const customer = CustomerAggregate.create(b2cProps());
        customer.update({ addresses: [validAddress(), validAddress()] });

        expect(customer.addresses).toHaveLength(2);
    });
});

describe("CustomerAggregate.reconstitute()", () => {
    it("reconstructs a customer with all properties", () => {
        const customer = CustomerAggregate.reconstitute({
            id: generateEntityId("123e4567-e89b-12d3-a456-426614174000"),
            properties: {
                ...b2bProps(),
                description: "Our top distributor",
            },
        });

        expect(customer.id).toBe("123e4567-e89b-12d3-a456-426614174000");
        expect(customer.name).toBe("Acme Corp");
        expect(customer.customerType).toBe(CustomerType.B2B);
        expect(customer.description).toBe("Our top distributor");
    });

    it("reconstructs a customer with non-uuid id", () => {
        const customer = CustomerAggregate.reconstitute({
            id: generateEntityId("123"),
            properties: b2aProps(),
        });

        expect(customer.id).toBe("123");
    });

    it("throws when id is not stringified", () => {
        expect(() =>
            CustomerAggregate.reconstitute({
                // @ts-expect-error - for test only
                id: generateEntityId(123),
                properties: b2aProps(),
            }),
        ).toThrow();
    });
});
