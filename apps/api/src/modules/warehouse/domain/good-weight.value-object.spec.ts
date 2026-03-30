import { GoodWeight, WeightUnit } from "./good-weight.value-object.js";

describe("GoodWeight", () => {
    it("creates with valid properties", () => {
        const weight = new GoodWeight({ value: 2.5, unit: WeightUnit.KG });

        expect(weight.value).toBe(2.5);
        expect(weight.unit).toBe(WeightUnit.KG);
    });

    it("accepts fractional values", () => {
        const weight = new GoodWeight({ value: 0.1, unit: WeightUnit.KG });

        expect(weight.value).toBe(0.1);
    });

    it("throws on negative value", () => {
        expect(() => new GoodWeight({ value: -1, unit: WeightUnit.KG })).toThrow();
    });

    it("throws on zero value", () => {
        expect(() => new GoodWeight({ value: 0, unit: WeightUnit.KG })).toThrow();
    });

    it("supports all weight units", () => {
        expect(new GoodWeight({ value: 1, unit: WeightUnit.KG }).unit).toBe(WeightUnit.KG);
        expect(new GoodWeight({ value: 1, unit: WeightUnit.G }).unit).toBe(WeightUnit.G);
        expect(new GoodWeight({ value: 1, unit: WeightUnit.LB }).unit).toBe(WeightUnit.LB);
    });
});
