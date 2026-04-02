import { generateEntityId } from "../../../libs/ddd/utils/randomize-entity-id.js";
import { uuidRegex } from "../../../shared/utils/uuid-regex.js";
import { ZodError } from "zod";
import { PositionAggregate } from "./position.aggregate.js";

const validProps = () => ({
    key: "freight:driver",
    displayName: "Driver",
    permissionKeys: ["freight:view-routes", "freight:execute-route"],
});

describe("PositionAggregate.create()", () => {
    it("creates a position with generated UUID", () => {
        const position = PositionAggregate.create(validProps());

        expect(position.id).toMatch(uuidRegex);
        expect(position.key).toBe("freight:driver");
        expect(position.displayName).toBe("Driver");
        expect(position.permissionKeys).toHaveLength(2);
    });

    it("creates a position without permissions", () => {
        const position = PositionAggregate.create({
            key: "hr:worker",
            displayName: "HR Worker",
            permissionKeys: [],
        });

        expect(position.permissionKeys).toHaveLength(0);
    });

    describe("key format validation", () => {
        it("accepts valid namespaced keys", () => {
            expect(() => PositionAggregate.create({ ...validProps(), key: "warehouse:worker" })).not.toThrow();
            expect(() => PositionAggregate.create({ ...validProps(), key: "delivery:rsr" })).not.toThrow();
            expect(() => PositionAggregate.create({ ...validProps(), key: "accountancy:accountant" })).not.toThrow();
        });

        it("rejects keys without namespace", () => {
            expect(() => PositionAggregate.create({ ...validProps(), key: "driver" })).toThrow(ZodError);
        });

        it("rejects empty key", () => {
            expect(() => PositionAggregate.create({ ...validProps(), key: "" })).toThrow(ZodError);
        });

        it("rejects keys with uppercase", () => {
            expect(() => PositionAggregate.create({ ...validProps(), key: "Freight:Driver" })).toThrow(ZodError);
        });
    });

    describe("validation", () => {
        it("throws when displayName is empty", () => {
            expect(() => PositionAggregate.create({ ...validProps(), displayName: "" })).toThrow(ZodError);
        });
    });
});

describe("PositionAggregate.update()", () => {
    it("updates displayName", () => {
        const position = PositionAggregate.create(validProps());
        position.update({ displayName: "Senior Driver" });

        expect(position.displayName).toBe("Senior Driver");
    });

    it("updates permissionKeys", () => {
        const position = PositionAggregate.create(validProps());
        position.update({ permissionKeys: ["freight:plan-route"] });

        expect(position.permissionKeys).toEqual(["freight:plan-route"]);
    });

    it("validates after update", () => {
        const position = PositionAggregate.create(validProps());

        expect(() => position.update({ displayName: "" })).toThrow(ZodError);
    });
});

describe("PositionAggregate.hasPermission()", () => {
    it("returns true for assigned permission", () => {
        const position = PositionAggregate.create(validProps());

        expect(position.hasPermission("freight:view-routes")).toBe(true);
    });

    it("returns false for unassigned permission", () => {
        const position = PositionAggregate.create(validProps());

        expect(position.hasPermission("warehouse:create-receipt")).toBe(false);
    });
});

describe("PositionAggregate.reconstitute()", () => {
    it("reconstructs a position with all properties", () => {
        const position = PositionAggregate.reconstitute({
            id: generateEntityId("pos-001"),
            properties: validProps(),
        });

        expect(position.id).toBe("pos-001");
        expect(position.key).toBe("freight:driver");
        expect(position.permissionKeys).toHaveLength(2);
        expect(position.domainEvents).toHaveLength(0);
    });
});
