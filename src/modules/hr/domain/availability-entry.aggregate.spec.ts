import { generateEntityId } from "src/libs/ddd/utils/randomize-entity-id.js";
import { uuidRegex } from "src/shared/utils/uuid-regex.js";
import { ZodError } from "zod";
import { AvailabilityEntryStatus } from "./availability-entry-status.enum.js";
import { AvailabilityEntryAggregate } from "./availability-entry.aggregate.js";
import { AvailabilityAlreadyConfirmedError, NoPendingAvailabilityError } from "./availability-entry.errors.js";
import { AvailabilitySetDomainEvent } from "./events/availability-set.domain-event.js";
import { AvailabilityConfirmedDomainEvent } from "./events/availability-confirmed.domain-event.js";

const validProps = () => ({
    employeeId: "emp-001",
    date: "2026-04-01",
    startTime: "08:00",
    endTime: "16:00",
});

describe("AvailabilityEntryAggregate.create()", () => {
    describe("happy path", () => {
        it("creates a PENDING_APPROVAL entry when set by employee", () => {
            const entry = AvailabilityEntryAggregate.create({ ...validProps(), setByManager: false });

            expect(entry.id).toMatch(uuidRegex);
            expect(entry.employeeId).toBe("emp-001");
            expect(entry.date).toBe("2026-04-01");
            expect(entry.startTime).toBe("08:00");
            expect(entry.endTime).toBe("16:00");
            expect(entry.status).toBe(AvailabilityEntryStatus.PENDING_APPROVAL);
        });

        it("creates a CONFIRMED entry when set by manager", () => {
            const entry = AvailabilityEntryAggregate.create({ ...validProps(), setByManager: true });

            expect(entry.status).toBe(AvailabilityEntryStatus.CONFIRMED);
        });

        it("emits AvailabilitySetDomainEvent", () => {
            const entry = AvailabilityEntryAggregate.create({ ...validProps(), setByManager: false });

            expect(entry.domainEvents).toHaveLength(1);
            expect(entry.domainEvents[0]).toBeInstanceOf(AvailabilitySetDomainEvent);

            const event = entry.domainEvents[0] as AvailabilitySetDomainEvent;
            expect(event.employeeId).toBe("emp-001");
            expect(event.date).toBe("2026-04-01");
            expect(event.status).toBe(AvailabilityEntryStatus.PENDING_APPROVAL);
        });
    });

    describe("validation", () => {
        it("throws when date is invalid", () => {
            expect(() =>
                AvailabilityEntryAggregate.create({ ...validProps(), date: "not-a-date", setByManager: false }),
            ).toThrow(ZodError);
        });

        it("throws when startTime format is wrong", () => {
            expect(() =>
                AvailabilityEntryAggregate.create({ ...validProps(), startTime: "8:00", setByManager: false }),
            ).toThrow(ZodError);
        });

        it("throws when endTime format is wrong", () => {
            expect(() =>
                AvailabilityEntryAggregate.create({ ...validProps(), endTime: "25:00pm", setByManager: false }),
            ).toThrow(ZodError);
        });

        it("throws when startTime is not before endTime", () => {
            expect(() =>
                AvailabilityEntryAggregate.create({
                    ...validProps(),
                    startTime: "16:00",
                    endTime: "08:00",
                    setByManager: false,
                }),
            ).toThrow(ZodError);
        });

        it("throws when employeeId is empty", () => {
            expect(() =>
                AvailabilityEntryAggregate.create({ ...validProps(), employeeId: "", setByManager: false }),
            ).toThrow(ZodError);
        });
    });
});

describe("AvailabilityEntryAggregate.confirm()", () => {
    it("transitions from PENDING_APPROVAL to CONFIRMED", () => {
        const entry = AvailabilityEntryAggregate.create({ ...validProps(), setByManager: false });
        entry.clearEvents();

        entry.confirm();

        expect(entry.status).toBe(AvailabilityEntryStatus.CONFIRMED);
    });

    it("emits AvailabilityConfirmedDomainEvent", () => {
        const entry = AvailabilityEntryAggregate.create({ ...validProps(), setByManager: false });
        entry.clearEvents();

        entry.confirm();

        expect(entry.domainEvents).toHaveLength(1);
        expect(entry.domainEvents[0]).toBeInstanceOf(AvailabilityConfirmedDomainEvent);

        const event = entry.domainEvents[0] as AvailabilityConfirmedDomainEvent;
        expect(event.employeeId).toBe("emp-001");
        expect(event.date).toBe("2026-04-01");
    });

    it("throws when already confirmed", () => {
        const entry = AvailabilityEntryAggregate.create({ ...validProps(), setByManager: true });

        expect(() => entry.confirm()).toThrow(AvailabilityAlreadyConfirmedError);
    });
});

describe("AvailabilityEntryAggregate.requirePendingApproval()", () => {
    it("passes for PENDING_APPROVAL entries", () => {
        const entry = AvailabilityEntryAggregate.create({ ...validProps(), setByManager: false });

        expect(() => entry.requirePendingApproval()).not.toThrow();
    });

    it("throws for CONFIRMED entries", () => {
        const entry = AvailabilityEntryAggregate.create({ ...validProps(), setByManager: true });

        expect(() => entry.requirePendingApproval()).toThrow(NoPendingAvailabilityError);
    });
});

describe("AvailabilityEntryAggregate.isLocked()", () => {
    it("returns true when current time is past the entry start", () => {
        const entry = AvailabilityEntryAggregate.create({
            ...validProps(),
            date: "2026-04-01",
            startTime: "08:00",
            setByManager: false,
        });

        const after = new Date("2026-04-01T08:00:01");
        expect(entry.isLocked(after)).toBe(true);
    });

    it("returns true when current time equals the entry start", () => {
        const entry = AvailabilityEntryAggregate.create({
            ...validProps(),
            date: "2026-04-01",
            startTime: "08:00",
            setByManager: false,
        });

        const exact = new Date("2026-04-01T08:00:00");
        expect(entry.isLocked(exact)).toBe(true);
    });

    it("returns false when current time is before the entry start", () => {
        const entry = AvailabilityEntryAggregate.create({
            ...validProps(),
            date: "2026-04-01",
            startTime: "08:00",
            setByManager: false,
        });

        const before = new Date("2026-04-01T07:59:59");
        expect(entry.isLocked(before)).toBe(false);
    });

    it("returns false for a future date", () => {
        const entry = AvailabilityEntryAggregate.create({
            ...validProps(),
            date: "2099-12-31",
            startTime: "08:00",
            setByManager: false,
        });

        expect(entry.isLocked(new Date())).toBe(false);
    });
});

describe("AvailabilityEntryAggregate.reconstitute()", () => {
    it("reconstructs an entry with all properties", () => {
        const entry = AvailabilityEntryAggregate.reconstitute({
            id: generateEntityId("avail-001"),
            properties: {
                employeeId: "emp-001",
                date: "2026-04-01",
                startTime: "08:00",
                endTime: "16:00",
                status: AvailabilityEntryStatus.CONFIRMED,
            },
        });

        expect(entry.id).toBe("avail-001");
        expect(entry.employeeId).toBe("emp-001");
        expect(entry.status).toBe(AvailabilityEntryStatus.CONFIRMED);
        expect(entry.domainEvents).toHaveLength(0);
    });
});
