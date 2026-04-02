import { uuidRegex } from "../../../shared/utils/uuid-regex.js";
import { Address } from "../../../shared/value-objects/address.value-object.js";
import { WarehouseStatus } from "./warehouse-status.enum.js";
import { WarehouseType } from "./warehouse-type.enum.js";
import { WarehouseAggregate } from "./warehouse.aggregate.js";
import { WarehouseCreatedDomainEvent } from "./events/warehouse-created.domain-event.js";

function validAddress() {
    return new Address({
        country: "PL",
        postalCode: "00-001",
        state: "Mazowieckie",
        city: "Warszawa",
        street: "Marszałkowska 1",
    });
}

describe("WarehouseAggregate.create()", () => {
    it("creates with default ACTIVE status and REGULAR type", () => {
        const wh = WarehouseAggregate.create({ name: "Main WH", address: validAddress() });

        expect(wh.id).toMatch(uuidRegex);
        expect(wh.name).toBe("Main WH");
        expect(wh.status).toBe(WarehouseStatus.ACTIVE);
        expect(wh.type).toBe(WarehouseType.REGULAR);
    });

    it("creates a MOBILE warehouse when type is specified", () => {
        const wh = WarehouseAggregate.create({
            name: "Vehicle 1",
            address: validAddress(),
            type: WarehouseType.MOBILE,
        });

        expect(wh.type).toBe(WarehouseType.MOBILE);
    });

    it("emits WarehouseCreatedDomainEvent", () => {
        const wh = WarehouseAggregate.create({ name: "Event WH", address: validAddress() });

        expect(wh.domainEvents).toHaveLength(1);
        expect(wh.domainEvents[0]).toBeInstanceOf(WarehouseCreatedDomainEvent);
    });

    it("throws when name is empty", () => {
        expect(() => WarehouseAggregate.create({ name: "", address: validAddress() })).toThrow();
    });
});

describe("WarehouseAggregate status transitions", () => {
    it("deactivates an active warehouse", () => {
        const wh = WarehouseAggregate.create({ name: "WH", address: validAddress() });

        wh.deactivate();

        expect(wh.status).toBe(WarehouseStatus.INACTIVE);
    });

    it("reactivates an inactive warehouse", () => {
        const wh = WarehouseAggregate.create({ name: "WH", address: validAddress() });

        wh.deactivate();
        wh.activate();

        expect(wh.status).toBe(WarehouseStatus.ACTIVE);
    });
});

describe("WarehouseAggregate.update()", () => {
    it("updates name", () => {
        const wh = WarehouseAggregate.create({ name: "Old", address: validAddress() });

        wh.update({ name: "New" });

        expect(wh.name).toBe("New");
    });

    it("updates address", () => {
        const wh = WarehouseAggregate.create({ name: "WH", address: validAddress() });
        const newAddr = new Address({
            country: "DE",
            postalCode: "10115",
            state: "Berlin",
            city: "Berlin",
            street: "Unter den Linden 1",
        });

        wh.update({ address: newAddr });

        expect(wh.address.country).toBe("DE");
        expect(wh.address.city).toBe("Berlin");
    });

    it("rejects update with empty name", () => {
        const wh = WarehouseAggregate.create({ name: "WH", address: validAddress() });

        expect(() => wh.update({ name: "" })).toThrow();
    });
});
