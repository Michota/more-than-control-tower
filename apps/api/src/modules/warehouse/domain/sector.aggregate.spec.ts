import { randomUUID } from "crypto";
import { uuidRegex } from "../../../shared/utils/uuid-regex.js";
import { DimensionUnit } from "./good-dimensions.value-object.js";
import { SectorCapability } from "./sector-capability.enum.js";
import { SectorDimensions } from "./sector-dimensions.value-object.js";
import { SectorStatus } from "./sector-status.enum.js";
import { SectorAggregate } from "./sector.aggregate.js";
import { SectorCreatedDomainEvent } from "./events/sector-created.domain-event.js";

const warehouseId = randomUUID();

function validDimensions() {
    return new SectorDimensions({ length: 10, width: 5, height: 3, unit: DimensionUnit.M });
}

describe("SectorAggregate.create()", () => {
    it("creates with ACTIVE status", () => {
        const sector = SectorAggregate.create({
            name: "Sector A",
            warehouseId,
            dimensions: validDimensions(),
            capabilities: [SectorCapability.GENERAL],
            weightCapacityGrams: 500_000,
        });

        expect(sector.id).toMatch(uuidRegex);
        expect(sector.name).toBe("Sector A");
        expect(sector.warehouseId).toBe(warehouseId);
        expect(sector.status).toBe(SectorStatus.ACTIVE);
        expect(sector.capabilities).toEqual([SectorCapability.GENERAL]);
        expect(sector.weightCapacityGrams).toBe(500_000);
    });

    it("emits SectorCreatedDomainEvent", () => {
        const sector = SectorAggregate.create({
            name: "Sector B",
            warehouseId,
            dimensions: validDimensions(),
            capabilities: [],
            weightCapacityGrams: 100_000,
        });

        expect(sector.domainEvents).toHaveLength(1);
        expect(sector.domainEvents[0]).toBeInstanceOf(SectorCreatedDomainEvent);
    });

    it("accepts multiple capabilities", () => {
        const sector = SectorAggregate.create({
            name: "Cold & Fragile",
            warehouseId,
            dimensions: validDimensions(),
            capabilities: [SectorCapability.COLD_STORAGE, SectorCapability.FRAGILE],
            weightCapacityGrams: 200_000,
        });

        expect(sector.capabilities).toHaveLength(2);
        expect(sector.capabilities).toContain(SectorCapability.COLD_STORAGE);
        expect(sector.capabilities).toContain(SectorCapability.FRAGILE);
    });

    it("throws when name is empty", () => {
        expect(() =>
            SectorAggregate.create({
                name: "",
                warehouseId,
                dimensions: validDimensions(),
                capabilities: [],
                weightCapacityGrams: 100_000,
            }),
        ).toThrow();
    });
});

describe("SectorAggregate status transitions", () => {
    it("deactivates a sector", () => {
        const sector = SectorAggregate.create({
            name: "S",
            warehouseId,
            dimensions: validDimensions(),
            capabilities: [],
            weightCapacityGrams: 100_000,
        });

        sector.deactivate();

        expect(sector.status).toBe(SectorStatus.INACTIVE);
    });

    it("reactivates a sector", () => {
        const sector = SectorAggregate.create({
            name: "S",
            warehouseId,
            dimensions: validDimensions(),
            capabilities: [],
            weightCapacityGrams: 100_000,
        });

        sector.deactivate();
        sector.activate();

        expect(sector.status).toBe(SectorStatus.ACTIVE);
    });
});

describe("SectorAggregate.update()", () => {
    it("updates name and description", () => {
        const sector = SectorAggregate.create({
            name: "Old",
            warehouseId,
            dimensions: validDimensions(),
            capabilities: [],
            weightCapacityGrams: 100_000,
        });

        sector.update({ name: "New", description: "Updated desc" });

        expect(sector.name).toBe("New");
        expect(sector.description).toBe("Updated desc");
    });

    it("updates capabilities", () => {
        const sector = SectorAggregate.create({
            name: "S",
            warehouseId,
            dimensions: validDimensions(),
            capabilities: [SectorCapability.GENERAL],
            weightCapacityGrams: 100_000,
        });

        sector.update({ capabilities: [SectorCapability.HAZARDOUS, SectorCapability.HEAVY] });

        expect(sector.capabilities).toEqual([SectorCapability.HAZARDOUS, SectorCapability.HEAVY]);
    });

    it("rejects empty name", () => {
        const sector = SectorAggregate.create({
            name: "S",
            warehouseId,
            dimensions: validDimensions(),
            capabilities: [],
            weightCapacityGrams: 100_000,
        });

        expect(() => sector.update({ name: "" })).toThrow();
    });
});
