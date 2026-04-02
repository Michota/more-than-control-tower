import { ZodError } from "zod";
import { ContactHistoryEntry } from "./contact-history-entry.value-object.js";

describe("ContactHistoryEntry", () => {
    it("creates a valid history entry", () => {
        const changedAt = new Date("2026-03-25T10:00:00Z");
        const entry = new ContactHistoryEntry({ previousValue: "old@example.com", changedAt });

        expect(entry.previousValue).toBe("old@example.com");
        expect(entry.changedAt).toEqual(changedAt);
    });

    it("throws when previousValue is not a string", () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect(() => new ContactHistoryEntry({ previousValue: 123 as any, changedAt: new Date() })).toThrow(ZodError);
    });

    it("throws when changedAt is not a date", () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        expect(() => new ContactHistoryEntry({ previousValue: "value", changedAt: "not-a-date" as any })).toThrow(
            ZodError,
        );
    });
});
