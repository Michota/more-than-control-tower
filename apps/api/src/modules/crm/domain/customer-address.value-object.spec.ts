import { CustomerAddress } from "./customer-address.value-object.js";

const validAddress = () =>
    new CustomerAddress({
        country: "PL",
        state: "Mazowsze",
        city: "Warsaw",
        postalCode: "00-001",
        street: "Marszałkowska 1",
    });

describe("CustomerAddress", () => {
    it("creates a valid CustomerAddress", () => {
        const address = validAddress();

        expect(address.country).toBe("PL");
        expect(address.state).toBe("Mazowsze");
        expect(address.city).toBe("Warsaw");
        expect(address.postalCode).toBe("00-001");
        expect(address.street).toBe("Marszałkowska 1");
    });

    it("accepts an optional label", () => {
        const address = new CustomerAddress({
            ...validAddress().unpack(),
            label: "Headquarters",
        });

        expect(address.label).toBe("Headquarters");
    });

    it("accepts an optional note", () => {
        const address = new CustomerAddress({
            ...validAddress().unpack(),
            note: "Use back entrance",
        });

        expect(address.note).toBe("Use back entrance");
    });
});

export { validAddress };
