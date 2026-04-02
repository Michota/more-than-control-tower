import { ZodError } from "zod";
import { ContactHistoryEntry } from "./contact-history-entry.value-object.js";
import { ContactType } from "./customer-contact-type.enum.js";
import { CustomerContact } from "./customer-contact.value-object.js";

const PHONE_NUMBER = "+48123456789";
const EMAIL = "contact@more-than-control-tower.com";

const validEmailContact = () =>
    new CustomerContact({ type: ContactType.EMAIL, title: "Main email", value: EMAIL.toString(), history: [] });

const validPhoneContact = () =>
    new CustomerContact({ type: ContactType.PHONE, title: "Main phone", value: PHONE_NUMBER.toString(), history: [] });

const validCustomContact = () =>
    new CustomerContact({
        type: ContactType.CUSTOM,
        title: "Telegram",
        customLabel: "Telegram handle",
        value: "@acme_corp",
        history: [],
    });

describe("CustomerContact", () => {
    it("throws when email format is invalid", () => {
        expect(
            () => new CustomerContact({ type: ContactType.EMAIL, title: "Email", value: "not-an-email", history: [] }),
        ).toThrow(ZodError);
    });

    it("accepts a valid email", () => {
        expect(
            () =>
                new CustomerContact({
                    type: ContactType.EMAIL,
                    title: "Email",
                    value: "user@example.com",
                    history: [],
                }),
        ).not.toThrow();
    });

    it("throws when phone value is empty", () => {
        expect(
            () => new CustomerContact({ type: ContactType.PHONE, title: "Phone", value: "", history: [] }),
        ).toThrow();
    });

    it("accepts a CUSTOM contact with customLabel", () => {
        const contact = validCustomContact();

        expect(contact.type).toBe(ContactType.CUSTOM);
        expect(contact.customLabel).toBe("Telegram handle");
        expect(contact.value).toBe("@acme_corp");
    });

    it("throws when CUSTOM contact is missing customLabel", () => {
        expect(
            () =>
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                new CustomerContact({
                    type: ContactType.CUSTOM,
                    title: "Messenger",
                    value: "@someone",
                    history: [],
                } as any),
        ).toThrow(ZodError);
    });

    it("accepts an optional note", () => {
        const contact = new CustomerContact({
            type: ContactType.EMAIL,
            title: "Work",
            value: "work@example.com",
            note: "Preferred contact method",
            history: [],
        });

        expect(contact.note).toBe("Preferred contact method");
    });

    it("stores history entries", () => {
        const entry = new ContactHistoryEntry({ previousValue: "old@example.com", changedAt: new Date("2026-01-01") });
        const contact = new CustomerContact({
            type: ContactType.EMAIL,
            title: "Work",
            value: "new@example.com",
            history: [entry],
        });

        expect(contact.history).toHaveLength(1);
        expect(contact.history[0].previousValue).toBe("old@example.com");
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

export { validEmailContact, validPhoneContact, validCustomContact };
