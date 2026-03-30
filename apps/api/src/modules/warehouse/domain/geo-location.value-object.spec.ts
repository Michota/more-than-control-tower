import { GeoLocation } from "./geo-location.value-object.js";

describe("GeoLocation", () => {
    it("creates with valid coordinates", () => {
        const loc = new GeoLocation({ latitude: 52.2297, longitude: 21.0122 });

        expect(loc.latitude).toBe(52.2297);
        expect(loc.longitude).toBe(21.0122);
    });

    it("accepts boundary latitude values", () => {
        expect(new GeoLocation({ latitude: 90, longitude: 0 }).latitude).toBe(90);
        expect(new GeoLocation({ latitude: -90, longitude: 0 }).latitude).toBe(-90);
    });

    it("accepts boundary longitude values", () => {
        expect(new GeoLocation({ latitude: 0, longitude: 180 }).longitude).toBe(180);
        expect(new GeoLocation({ latitude: 0, longitude: -180 }).longitude).toBe(-180);
    });

    it("throws when latitude exceeds 90", () => {
        expect(() => new GeoLocation({ latitude: 91, longitude: 0 })).toThrow();
    });

    it("throws when latitude is below -90", () => {
        expect(() => new GeoLocation({ latitude: -91, longitude: 0 })).toThrow();
    });

    it("throws when longitude exceeds 180", () => {
        expect(() => new GeoLocation({ latitude: 0, longitude: 181 })).toThrow();
    });

    it("throws when longitude is below -180", () => {
        expect(() => new GeoLocation({ latitude: 0, longitude: -181 })).toThrow();
    });
});
