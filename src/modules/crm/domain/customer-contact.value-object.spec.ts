import { ZodError } from "zod";
import { ContactType } from "./customer-contact-type.enum";
import { CustomerContact } from "./customer-contact.value-object";

const PHONE_NUMBER = "+48123456789";
const EMAIL = "contact@more-than-control-tower.com";

const validEmailContact = () =>
    new CustomerContact({ type: ContactType.EMAIL, title: "Main email", value: EMAIL.toString() });

const validPhoneContact = () =>
    new CustomerContact({ type: ContactType.PHONE, title: "Main phone", value: PHONE_NUMBER.toString() });

describe("CustomerContact", () => {
    it("throws when email format is invalid", () => {
        expect(() => new CustomerContact({ type: ContactType.EMAIL, title: "Email", value: "not-an-email" })).toThrow(
            ZodError,
        );
    });

    it("accepts a valid email", () => {
        expect(
            () => new CustomerContact({ type: ContactType.EMAIL, title: "Email", value: "user@example.com" }),
        ).not.toThrow();
    });

    it("throws when phone value is empty", () => {
        expect(() => new CustomerContact({ type: ContactType.PHONE, title: "Phone", value: "" })).toThrow();
    });

    test("Is exporting valid email contact", () => {
        const contact = validEmailContact();

        expect(contact.type).toBe(ContactType.EMAIL);
        expect(contact.title).toBe("Main email");
        expect(contact.value).toBe(EMAIL);
    });

    test("Is exporting valid phone contact", () => {
        const contact = validPhoneContact();

        expect(contact.type).toBe(ContactType.PHONE);
        expect(contact.title).toBe("Main phone");
        expect(contact.value).toBe(PHONE_NUMBER);
    });
});

export { validEmailContact, validPhoneContact };
