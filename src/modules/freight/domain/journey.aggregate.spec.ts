import { uuidRegex } from "src/shared/utils/uuid-regex";
import { JourneyStatus } from "./journey-status.enum";
import { JourneyAggregate } from "./journey.aggregate";
import {
    JourneyAlreadyCancelledError,
    JourneyAlreadyCompletedError,
    JourneyCannotStartError,
    JourneyNotInProgressError,
} from "./journey.errors";
import { JourneyCreatedDomainEvent } from "./events/journey-created.domain-event";
import { JourneyStartedDomainEvent } from "./events/journey-started.domain-event";
import { JourneyCompletedDomainEvent } from "./events/journey-completed.domain-event";

function createJourney(overrides: Partial<Parameters<typeof JourneyAggregate.createFromRoute>[0]> = {}) {
    return JourneyAggregate.createFromRoute({
        routeId: "route-1",
        routeName: "Route North",
        scheduledDate: "2026-04-01",
        vehicleIds: ["v1"],
        representativeIds: ["r1"],
        visitPointIds: ["vp1", "vp2"],
        ...overrides,
    });
}

describe("JourneyAggregate", () => {
    describe("createFromRoute()", () => {
        it("creates a journey in PLANNED status", () => {
            const journey = createJourney();

            expect(journey).toBeInstanceOf(JourneyAggregate);
            expect(journey.id).toMatch(uuidRegex);
            expect(journey.routeId).toBe("route-1");
            expect(journey.routeName).toBe("Route North");
            expect(journey.status).toBe(JourneyStatus.PLANNED);
            expect(journey.scheduledDate).toBe("2026-04-01");
            expect(journey.vehicleIds).toEqual(["v1"]);
            expect(journey.representativeIds).toEqual(["r1"]);
            expect(journey.visitPointIds).toEqual(["vp1", "vp2"]);
        });

        it("emits JourneyCreatedDomainEvent", () => {
            const journey = createJourney();

            expect(journey.domainEvents).toHaveLength(1);
            expect(journey.domainEvents[0]).toBeInstanceOf(JourneyCreatedDomainEvent);
        });

        it("throws with empty routeId", () => {
            expect(() => createJourney({ routeId: "" })).toThrow();
        });

        it("throws with invalid date", () => {
            expect(() => createJourney({ scheduledDate: "not-a-date" })).toThrow();
        });
    });

    describe("start()", () => {
        it("transitions from PLANNED to IN_PROGRESS", () => {
            const journey = createJourney();
            journey.clearEvents();

            journey.start();

            expect(journey.status).toBe(JourneyStatus.IN_PROGRESS);
            expect(journey.domainEvents).toHaveLength(1);
            expect(journey.domainEvents[0]).toBeInstanceOf(JourneyStartedDomainEvent);
        });

        it("throws when already in progress", () => {
            const journey = createJourney();
            journey.start();

            expect(() => journey.start()).toThrow(JourneyCannotStartError);
        });

        it("throws when completed", () => {
            const journey = createJourney();
            journey.start();
            journey.complete();

            expect(() => journey.start()).toThrow(JourneyAlreadyCompletedError);
        });

        it("throws when cancelled", () => {
            const journey = createJourney();
            journey.cancel();

            expect(() => journey.start()).toThrow(JourneyAlreadyCancelledError);
        });
    });

    describe("complete()", () => {
        it("transitions from IN_PROGRESS to COMPLETED", () => {
            const journey = createJourney();
            journey.start();
            journey.clearEvents();

            journey.complete();

            expect(journey.status).toBe(JourneyStatus.COMPLETED);
            expect(journey.domainEvents).toHaveLength(1);
            expect(journey.domainEvents[0]).toBeInstanceOf(JourneyCompletedDomainEvent);
        });

        it("throws when not in progress (PLANNED)", () => {
            const journey = createJourney();
            expect(() => journey.complete()).toThrow(JourneyNotInProgressError);
        });

        it("throws when already completed", () => {
            const journey = createJourney();
            journey.start();
            journey.complete();

            expect(() => journey.complete()).toThrow(JourneyAlreadyCompletedError);
        });
    });

    describe("cancel()", () => {
        it("cancels a PLANNED journey", () => {
            const journey = createJourney();
            journey.cancel();
            expect(journey.status).toBe(JourneyStatus.CANCELLED);
        });

        it("cancels an IN_PROGRESS journey", () => {
            const journey = createJourney();
            journey.start();
            journey.cancel();
            expect(journey.status).toBe(JourneyStatus.CANCELLED);
        });

        it("throws when already completed", () => {
            const journey = createJourney();
            journey.start();
            journey.complete();

            expect(() => journey.cancel()).toThrow(JourneyAlreadyCompletedError);
        });

        it("throws when already cancelled", () => {
            const journey = createJourney();
            journey.cancel();

            expect(() => journey.cancel()).toThrow(JourneyAlreadyCancelledError);
        });
    });
});
