import { randomUUID } from "crypto";
import { DimensionUnit, GoodDimensions } from "./good-dimensions.value-object";
import { GoodWeight, WeightUnit } from "./good-weight.value-object";
import { GoodAggregate } from "./good.aggregate";
import { WarehouseLocation } from "./warehouse-location.value-object";
import { uuidRegex } from "src/shared/utils/uuid-regex";

describe("GoodAggrgate.create()", () => {
    it("Is creating successfully", () => {
        const good = GoodAggregate.receive({
            name: "Glass bottle",
            weight: new GoodWeight({ unit: WeightUnit.KG, value: 0.1 }),
            dimensions: new GoodDimensions({ height: 15, width: 6, length: 4, unit: DimensionUnit.CM }),
            locationInWarehouse: new WarehouseLocation({ description: "Duża hala, sektor B, kolumna 3, rząd 2." }),
            warehouseId: randomUUID() as string,
            description: "Empty glass bottle.",
        });

        expect(good).toBeInstanceOf(GoodAggregate);
        expect(good.id).toMatch(uuidRegex);
        expect(good.properties.name).toEqual("Glass bottle");
        expect(good.properties.weight).toBeInstanceOf(GoodWeight);
        expect(good.properties.weight.value).toEqual(0.1);
        expect(good.properties.weight.unit).toEqual(WeightUnit.KG);
        expect(good.locationInWarehouse).toBeInstanceOf(WarehouseLocation);
        expect(good.locationInWarehouse?.description).toEqual("Duża hala, sektor B, kolumna 3, rząd 2.");
        expect(typeof good.properties.warehouseId).toEqual("string");
        expect(good.properties.description).toEqual("Empty glass bottle.");
    });
});
