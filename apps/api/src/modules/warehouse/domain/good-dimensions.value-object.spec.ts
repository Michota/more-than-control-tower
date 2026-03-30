import { DimensionUnit, GoodDimensions } from "./good-dimensions.value-object.js";

describe("GoodDimensions", () => {
    it("creates with valid properties", () => {
        const dims = new GoodDimensions({ length: 30, width: 20, height: 10, unit: DimensionUnit.CM });

        expect(dims.length).toBe(30);
        expect(dims.width).toBe(20);
        expect(dims.height).toBe(10);
        expect(dims.unit).toBe(DimensionUnit.CM);
    });

    it("throws on negative dimension", () => {
        expect(() => new GoodDimensions({ length: -1, width: 20, height: 10, unit: DimensionUnit.CM })).toThrow();
    });

    it("throws on zero dimension", () => {
        expect(() => new GoodDimensions({ length: 0, width: 20, height: 10, unit: DimensionUnit.CM })).toThrow();
    });
});

describe("GoodDimensions.convertTo()", () => {
    it("returns same instance when converting to the same unit", () => {
        const dims = new GoodDimensions({ length: 10, width: 20, height: 30, unit: DimensionUnit.CM });
        const result = GoodDimensions.convertTo(DimensionUnit.CM, dims);

        expect(result).toBe(dims);
    });

    it("converts CM to MM", () => {
        const dims = new GoodDimensions({ length: 10, width: 20, height: 30, unit: DimensionUnit.CM });
        const result = GoodDimensions.convertTo(DimensionUnit.MM, dims);

        expect(result.length).toBe(100);
        expect(result.width).toBe(200);
        expect(result.height).toBe(300);
        expect(result.unit).toBe(DimensionUnit.MM);
    });

    it("converts MM to CM", () => {
        const dims = new GoodDimensions({ length: 100, width: 200, height: 300, unit: DimensionUnit.MM });
        const result = GoodDimensions.convertTo(DimensionUnit.CM, dims);

        expect(result.length).toBe(10);
        expect(result.width).toBe(20);
        expect(result.height).toBe(30);
    });

    it("converts CM to M", () => {
        const dims = new GoodDimensions({ length: 100, width: 200, height: 300, unit: DimensionUnit.CM });
        const result = GoodDimensions.convertTo(DimensionUnit.M, dims);

        expect(result.length).toBe(1);
        expect(result.width).toBe(2);
        expect(result.height).toBe(3);
    });

    it("converts M to MM", () => {
        const dims = new GoodDimensions({ length: 1, width: 2, height: 3, unit: DimensionUnit.M });
        const result = GoodDimensions.convertTo(DimensionUnit.MM, dims);

        expect(result.length).toBe(1000);
        expect(result.width).toBe(2000);
        expect(result.height).toBe(3000);
    });
});
