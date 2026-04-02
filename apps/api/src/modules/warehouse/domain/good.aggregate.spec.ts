import { DimensionUnit, GoodDimensions } from "./good-dimensions.value-object";
import { GoodWeight, WeightUnit } from "./good-weight.value-object";
import { GoodAggregate } from "./good.aggregate";
import { uuidRegex } from "src/shared/utils/uuid-regex";
import { GoodCreatedDomainEvent } from "./events/good-created.domain-event";

describe("GoodAggregate.create()", () => {
    it("creates a good without a parent successfully", () => {
        const good = GoodAggregate.create({
            name: "Glass bottle",
            weight: new GoodWeight({ unit: WeightUnit.KG, value: 0.1 }),
            dimensions: new GoodDimensions({ height: 15, width: 6, length: 4, unit: DimensionUnit.CM }),
            description: "Empty glass bottle.",
        });

        expect(good).toBeInstanceOf(GoodAggregate);
        expect(good.id).toMatch(uuidRegex);
        expect(good.name).toEqual("Glass bottle");
        expect(good.weight).toBeInstanceOf(GoodWeight);
        expect(good.weight.value).toEqual(0.1);
        expect(good.weight.unit).toEqual(WeightUnit.KG);
        expect(good.description).toEqual("Empty glass bottle.");
        expect(good.parentId).toBeUndefined();
    });

    it("throws Error when name is empty", () => {
        expect(() =>
            GoodAggregate.create({
                name: "",
                weight: new GoodWeight({ unit: WeightUnit.KG, value: 0.1 }),
                dimensions: new GoodDimensions({ height: 15, width: 6, length: 4, unit: DimensionUnit.CM }),
            }),
        ).toThrow();
    });

    it("emits GoodCreatedDomainEvent", () => {
        const good = GoodAggregate.create({
            name: "Wooden crate",
            weight: new GoodWeight({ unit: WeightUnit.KG, value: 5 }),
            dimensions: new GoodDimensions({ height: 40, width: 60, length: 80, unit: DimensionUnit.CM }),
        });

        expect(good.domainEvents).toHaveLength(1);
        expect(good.domainEvents[0]).toBeInstanceOf(GoodCreatedDomainEvent);
    });

    it("supports optional parentId for composite goods", () => {
        const parent = GoodAggregate.create({
            name: "Crate of bottles",
            weight: new GoodWeight({ unit: WeightUnit.KG, value: 12 }),
            dimensions: new GoodDimensions({ height: 40, width: 60, length: 80, unit: DimensionUnit.CM }),
        });

        const child = GoodAggregate.create({
            name: "Glass bottle",
            weight: new GoodWeight({ unit: WeightUnit.KG, value: 0.1 }),
            dimensions: new GoodDimensions({ height: 15, width: 6, length: 4, unit: DimensionUnit.CM }),
            parentId: String(parent.id),
        });

        expect(child.parentId).toEqual(parent.id);
    });
});
