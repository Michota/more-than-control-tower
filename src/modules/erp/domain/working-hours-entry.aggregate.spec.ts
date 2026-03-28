import { randomUUID } from "crypto";
import { describe, expect, it } from "vitest";
import { WorkingHoursEntryAggregate } from "./working-hours-entry.aggregate";
import { WorkingHoursStatus } from "./working-hours-status.enum";
import { WorkingHoursEntryAlreadyLockedError, WorkingHoursEntryLockedError } from "./working-hours-entry.errors";
import { EntityId } from "../../../libs/ddd/entities/entity-id";

describe("WorkingHoursEntryAggregate", () => {
    const employeeId = randomUUID();

    function logEntry(overrides: Partial<{ hours: number; note: string; activityId: string }> = {}) {
        return WorkingHoursEntryAggregate.log({
            employeeId,
            date: "2026-03-28",
            hours: overrides.hours ?? 4,
            note: overrides.note,
            activityId: overrides.activityId,
        });
    }

    describe("log", () => {
        it("creates an OPEN entry with correct properties", () => {
            const entry = logEntry({ hours: 4, note: "Morning shift" });

            expect(entry.properties.employeeId).toBe(employeeId);
            expect(entry.properties.date).toBe("2026-03-28");
            expect(entry.properties.hours).toBe(4);
            expect(entry.properties.note).toBe("Morning shift");
            expect(entry.properties.status).toBe(WorkingHoursStatus.OPEN);
            expect(entry.domainEvents).toHaveLength(1);
        });

        it("creates an entry without note and activityId", () => {
            const entry = logEntry();

            expect(entry.properties.note).toBeUndefined();
            expect(entry.properties.activityId).toBeUndefined();
        });

        it("creates an entry with activityId", () => {
            const activityId = randomUUID();
            const entry = logEntry({ activityId });

            expect(entry.properties.activityId).toBe(activityId);
        });

        it("throws when hours exceed 24", () => {
            expect(() => logEntry({ hours: 25 })).toThrow();
        });

        it("throws when hours are zero", () => {
            expect(() => logEntry({ hours: 0 })).toThrow();
        });

        it("throws when hours are negative", () => {
            expect(() => logEntry({ hours: -1 })).toThrow();
        });
    });

    describe("edit", () => {
        it("updates hours on an OPEN entry", () => {
            const entry = logEntry({ hours: 4 });

            entry.edit({ hours: 6 });

            expect(entry.properties.hours).toBe(6);
            expect(entry.domainEvents).toHaveLength(2);
        });

        it("updates note on an OPEN entry", () => {
            const entry = logEntry();

            entry.edit({ note: "Updated note" });

            expect(entry.properties.note).toBe("Updated note");
        });

        it("updates activityId on an OPEN entry", () => {
            const activityId = randomUUID();
            const entry = logEntry();

            entry.edit({ activityId });

            expect(entry.properties.activityId).toBe(activityId);
        });

        it("throws WorkingHoursEntryLockedError when editing a locked entry", () => {
            const entry = logEntry();
            entry.lock(randomUUID());

            expect(() => entry.edit({ hours: 8 })).toThrow(WorkingHoursEntryLockedError);
        });

        it("validates after edit — rejects invalid hours", () => {
            const entry = logEntry();

            expect(() => entry.edit({ hours: 30 })).toThrow();
        });
    });

    describe("lock", () => {
        it("transitions entry to LOCKED status", () => {
            const managerId = randomUUID();
            const entry = logEntry();

            entry.lock(managerId);

            expect(entry.properties.status).toBe(WorkingHoursStatus.LOCKED);
            expect(entry.properties.lockedBy).toBe(managerId);
            expect(entry.domainEvents).toHaveLength(2);
        });

        it("throws WorkingHoursEntryAlreadyLockedError when locking an already locked entry", () => {
            const entry = logEntry();
            entry.lock(randomUUID());

            expect(() => entry.lock(randomUUID())).toThrow(WorkingHoursEntryAlreadyLockedError);
        });
    });

    describe("reconstitute", () => {
        it("reconstitutes from persistence without domain events", () => {
            const entry = WorkingHoursEntryAggregate.reconstitute({
                id: "test-id" as unknown as EntityId,
                properties: {
                    employeeId,
                    date: "2026-03-28",
                    hours: 4,
                    status: WorkingHoursStatus.OPEN,
                },
            });

            expect(entry.id).toBe("test-id");
            expect(entry.domainEvents).toHaveLength(0);
        });
    });
});
