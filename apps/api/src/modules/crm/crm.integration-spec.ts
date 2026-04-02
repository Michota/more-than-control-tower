import { MikroORM } from "@mikro-orm/postgresql";
import { CommandBus, CqrsModule, QueryBus } from "@nestjs/cqrs";
import { Test, TestingModule } from "@nestjs/testing";
import { TestMikroOrmDatabaseModule } from "../../shared/testing/test-mikro-orm-database.module";
import { GetCustomerQuery, GetCustomerResponse } from "../../shared/queries/get-customer.query";
import { CreateCustomerCommand } from "./commands/create-customer/create-customer.command";
import { UpdateCustomerCommand } from "./commands/update-customer/update-customer.command";
import { ContactType } from "./domain/customer-contact-type.enum";
import { CustomerType } from "./domain/customer-type.enum";
import { CustomerNotFoundError } from "./domain/customer.errors";
import {
    GetCustomerDetailQuery,
    GetCustomerDetailResponse,
} from "./queries/get-customer-detail/get-customer-detail.query";
import { SearchCustomersQuery, SearchCustomersResponse } from "./queries/search-customers/search-customers.query";
import { CrmModule } from "./crm.module";

describe("CRM Module — Integration Tests", () => {
    let moduleRef: TestingModule;
    let commandBus: CommandBus;
    let queryBus: QueryBus;
    let orm: MikroORM;

    beforeAll(async () => {
        moduleRef = await Test.createTestingModule({
            imports: [TestMikroOrmDatabaseModule(), CqrsModule.forRoot(), CrmModule],
        }).compile();

        await moduleRef.init();

        commandBus = moduleRef.get(CommandBus);
        queryBus = moduleRef.get(QueryBus);
        orm = moduleRef.get(MikroORM);

        await orm.schema.refresh();
    });

    afterAll(async () => {
        await orm.close(true);
        await moduleRef.close();
    });

    // ─── Helpers ───────────────────────────────────────────────

    function createB2CCustomerCmd(overrides: Partial<CreateCustomerCommand> = {}) {
        return new CreateCustomerCommand({
            name: overrides.name ?? "Jan Kowalski",
            customerType: overrides.customerType ?? CustomerType.B2C,
            firstName: overrides.firstName ?? "Jan",
            lastName: overrides.lastName ?? "Kowalski",
            addresses: overrides.addresses ?? [
                {
                    country: "PL",
                    state: "Mazowsze",
                    city: "Warsaw",
                    postalCode: "00-001",
                    street: "Marszałkowska 1",
                },
            ],
            contacts: overrides.contacts ?? [{ type: ContactType.EMAIL, title: "Main", value: "jan@example.com" }],
        });
    }

    function createB2BCustomerCmd(overrides: Partial<CreateCustomerCommand> = {}) {
        return new CreateCustomerCommand({
            name: overrides.name ?? "Acme Corp",
            customerType: CustomerType.B2B,
            companyName: overrides.companyName ?? "Acme Corporation",
            nip: overrides.nip ?? "1234567890",
            addresses: overrides.addresses ?? [],
            contacts: overrides.contacts ?? [{ type: ContactType.PHONE, title: "Office", value: "+48123456789" }],
        });
    }

    function createB2ACustomerCmd() {
        return new CreateCustomerCommand({
            name: "City Hall",
            customerType: CustomerType.B2A,
            addresses: [],
            contacts: [{ type: ContactType.EMAIL, title: "Reception", value: "info@cityhall.gov" }],
        });
    }

    async function createCustomer(cmd?: CreateCustomerCommand): Promise<string> {
        return commandBus.execute(cmd ?? createB2CCustomerCmd());
    }

    async function getCustomer(id: string): Promise<GetCustomerResponse> {
        return queryBus.execute<GetCustomerQuery, GetCustomerResponse>(new GetCustomerQuery(id));
    }

    async function getCustomerDetail(id: string): Promise<GetCustomerDetailResponse> {
        return queryBus.execute<GetCustomerDetailQuery, GetCustomerDetailResponse>(new GetCustomerDetailQuery(id));
    }

    // ─── Create ───────────────────────────────────────────────

    describe("Create Customer", () => {
        it("creates a B2C customer and retrieves it", async () => {
            const id = await createCustomer();
            const customer = await getCustomer(id);

            expect(customer.name).toBe("Jan Kowalski");
            expect(customer.customerType).toBe(CustomerType.B2C);
            expect(customer.firstName).toBe("Jan");
            expect(customer.lastName).toBe("Kowalski");
            expect(customer.contacts).toHaveLength(1);
            expect(customer.addresses).toHaveLength(1);
        });

        it("creates a B2B customer", async () => {
            const id = await createCustomer(createB2BCustomerCmd());
            const customer = await getCustomer(id);

            expect(customer.customerType).toBe(CustomerType.B2B);
            expect(customer.companyName).toBe("Acme Corporation");
            expect(customer.nip).toBe("1234567890");
        });

        it("creates a B2A customer", async () => {
            const id = await createCustomer(createB2ACustomerCmd());
            const customer = await getCustomer(id);

            expect(customer.customerType).toBe(CustomerType.B2A);
            expect(customer.firstName).toBeUndefined();
            expect(customer.companyName).toBeUndefined();
        });

        it("creates a customer with a CUSTOM contact", async () => {
            const id = await createCustomer(
                createB2CCustomerCmd({
                    contacts: [{ type: ContactType.CUSTOM, title: "Telegram", customLabel: "Handle", value: "@jan" }],
                }),
            );
            const customer = await getCustomer(id);

            expect(customer.contacts[0].type).toBe("custom");
            expect(customer.contacts[0].customLabel).toBe("Handle");
        });

        it("creates a customer with note and description", async () => {
            const id = await createCustomer(
                new CreateCustomerCommand({
                    ...createB2CCustomerCmd(),
                    description: "VIP",
                    note: "Prefers mornings",
                }),
            );
            const customer = await getCustomer(id);

            expect(customer.description).toBe("VIP");
            expect(customer.note).toBe("Prefers mornings");
        });

        it("creates a customer with address note", async () => {
            const id = await createCustomer(
                createB2CCustomerCmd({
                    addresses: [
                        {
                            country: "PL",
                            state: "Mazowsze",
                            city: "Warsaw",
                            postalCode: "00-001",
                            street: "Marszałkowska 1",
                            note: "Back entrance",
                        },
                    ],
                }),
            );
            const customer = await getCustomer(id);

            expect(customer.addresses[0].note).toBe("Back entrance");
        });
    });

    // ─── Update ───────────────────────────────────────────────

    describe("Update Customer", () => {
        it("updates name and description", async () => {
            const id = await createCustomer();

            await commandBus.execute(
                new UpdateCustomerCommand({
                    customerId: id,
                    name: "Updated Name",
                    description: "Updated description",
                }),
            );

            const customer = await getCustomer(id);
            expect(customer.name).toBe("Updated Name");
            expect(customer.description).toBe("Updated description");
        });

        it("throws CustomerNotFoundError for non-existent customer", async () => {
            await expect(
                commandBus.execute(
                    new UpdateCustomerCommand({
                        customerId: "00000000-0000-0000-0000-000000000000",
                        name: "Ghost",
                    }),
                ),
            ).rejects.toThrow(CustomerNotFoundError);
        });

        it("updates contacts with new values", async () => {
            const id = await createCustomer(
                createB2CCustomerCmd({
                    contacts: [{ type: ContactType.EMAIL, title: "Work", value: "old@example.com" }],
                }),
            );

            await commandBus.execute(
                new UpdateCustomerCommand({
                    customerId: id,
                    contacts: [{ type: ContactType.EMAIL, title: "Work", value: "new@example.com" }],
                }),
            );

            const updated = await getCustomer(id);
            expect(updated.contacts[0].value).toBe("new@example.com");
        });
    });

    // ─── Search ───────────────────────────────────────────────

    describe("Search Customers", () => {
        it("finds customers by name and returns customerType", async () => {
            const uniqueName = `SearchTest-${Date.now()}`;
            await createCustomer(createB2BCustomerCmd({ name: uniqueName }));

            const result: SearchCustomersResponse = await queryBus.execute(new SearchCustomersQuery(uniqueName));

            expect(result.data).toHaveLength(1);
            expect(result.data[0].name).toBe(uniqueName);
            expect(result.data[0].customerType).toBe(CustomerType.B2B);
        });
    });

    // ─── Detail Query ─────────────────────────────────────────

    describe("Get Customer Detail", () => {
        it("returns customer detail with undefined related records when no handlers registered", async () => {
            const id = await createCustomer();
            const detail = await getCustomerDetail(id);

            expect(detail.name).toBe("Jan Kowalski");
            // No Accountancy or Sales modules loaded, so related records are undefined
            expect(detail.invoices).toBeUndefined();
            expect(detail.orders).toBeUndefined();
        });

        it("returns null for non-existent customer", async () => {
            const detail = await queryBus.execute<GetCustomerDetailQuery, GetCustomerDetailResponse | null>(
                new GetCustomerDetailQuery("00000000-0000-0000-0000-000000000000"),
            );

            expect(detail).toBeNull();
        });
    });
});
