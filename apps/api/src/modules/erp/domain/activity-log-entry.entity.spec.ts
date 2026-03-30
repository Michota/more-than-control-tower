import { randomUUID } from "crypto";
import { describe, expect, it } from "vitest";
import { ActivityLogEntryEntity } from "./activity-log-entry.entity";

describe("ActivityLogEntryEntity", () => {
    it("creates an activity log entry with all properties", () => {
        const now = new Date();
        const entry = ActivityLogEntryEntity.create({
            employeeId: randomUUID(),
            action: "visit-completed",
            details: "Completed visit at Customer X",
            occurredAt: now,
        });

        expect(entry.properties.action).toBe("visit-completed");
        expect(entry.properties.details).toBe("Completed visit at Customer X");
        expect(entry.properties.occurredAt).toBe(now);
    });

    it("creates an entry without details", () => {
        const entry = ActivityLogEntryEntity.create({
            employeeId: randomUUID(),
            action: "shift-started",
            occurredAt: new Date(),
        });

        expect(entry.properties.details).toBeUndefined();
    });

    it("throws when action is empty", () => {
        expect(() =>
            ActivityLogEntryEntity.create({
                employeeId: randomUUID(),
                action: "",
                occurredAt: new Date(),
            }),
        ).toThrow();
    });
});
