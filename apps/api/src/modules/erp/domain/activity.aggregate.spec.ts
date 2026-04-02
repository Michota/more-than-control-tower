import { describe, expect, it } from "vitest";
import { EntityId } from "../../../libs/ddd/entities/entity-id.js";
import { ActivityAggregate } from "./activity.aggregate.js";

describe("ActivityAggregate", () => {
    it("creates an activity with name and description", () => {
        const activity = ActivityAggregate.create({
            name: "Loading truck",
            description: "Loading goods onto the delivery truck",
        });

        expect(activity.properties.name).toBe("Loading truck");
        expect(activity.properties.description).toBe("Loading goods onto the delivery truck");
        expect(activity.domainEvents).toHaveLength(1);
    });

    it("creates an activity without description", () => {
        const activity = ActivityAggregate.create({ name: "Warehouse work" });

        expect(activity.properties.name).toBe("Warehouse work");
        expect(activity.properties.description).toBeUndefined();
    });

    it("throws when name is empty", () => {
        expect(() => ActivityAggregate.create({ name: "" })).toThrow();
    });

    it("reconstitutes from persistence", () => {
        const activity = ActivityAggregate.reconstitute({
            id: "some-id" as unknown as EntityId,
            properties: { name: "Test", description: "Desc" },
        });

        expect(activity.id).toBe("some-id");
        expect(activity.properties.name).toBe("Test");
        expect(activity.domainEvents).toHaveLength(0);
    });
});
