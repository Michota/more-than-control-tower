import { uuidRegex } from "src/shared/utils/uuid-regex";
import { JourneyStatus } from "./journey-status.enum";
import { JourneyStop } from "./journey-stop.value-object";
import { RouteStop } from "./route-stop.value-object";
import { JourneyAggregate } from "./journey.aggregate";
import {
    JourneyAlreadyCancelledError,
    JourneyAlreadyCompletedError,
    JourneyCannotStartError,
    JourneyNotInProgressError,
    JourneyNotPlannedError,
    JourneyStopAlreadyExistsError,
    JourneyStopNotFoundError,
    OrderAlreadyAssignedToStopError,
    OrderNotAssignedToStopError,
} from "./journey.errors";
import { JourneyCreatedDomainEvent } from "./events/journey-created.domain-event";
import { JourneyStartedDomainEvent } from "./events/journey-started.domain-event";
import { JourneyCompletedDomainEvent } from "./events/journey-completed.domain-event";

const defaultAddress = {
    country: "PL",
    postalCode: "00-001",
    state: "Mazowieckie",
    city: "Warszawa",
    street: "Marszałkowska 1",
};

function makeRouteStop(customerId: string, sequence: number): RouteStop {
    return new RouteStop({ customerId, customerName: `Customer ${customerId}`, address: defaultAddress, sequence });
}

function makeJourneyStop(customerId: string, sequence: number, orderIds: string[] = []): JourneyStop {
    return new JourneyStop({
        customerId,
        customerName: `Customer ${customerId}`,
        address: defaultAddress,
        orderIds,
        sequence,
    });
}

function createJourney(overrides: Partial<Parameters<typeof JourneyAggregate.createFromRoute>[0]> = {}) {
    return JourneyAggregate.createFromRoute({
        routeId: "route-1",
        routeName: "Route North",
        scheduledDate: "2026-04-01",
        vehicleIds: ["v1"],
        representativeIds: ["r1"],
        stops: [makeRouteStop("c1", 0), makeRouteStop("c2", 1)],
        ...overrides,
    });
}

describe("JourneyAggregate", () => {
    describe("createFromRoute()", () => {
        it("creates a journey in PLANNED status with stops from route", () => {
            const journey = createJourney();

            expect(journey).toBeInstanceOf(JourneyAggregate);
            expect(journey.id).toMatch(uuidRegex);
            expect(journey.routeId).toBe("route-1");
            expect(journey.routeName).toBe("Route North");
            expect(journey.status).toBe(JourneyStatus.PLANNED);
            expect(journey.scheduledDate).toBe("2026-04-01");
            expect(journey.vehicleIds).toEqual(["v1"]);
            expect(journey.representativeIds).toEqual(["r1"]);
            expect(journey.stops).toHaveLength(2);
            expect(journey.stops[0].customerId).toBe("c1");
            expect(journey.stops[0].orderIds).toEqual([]);
            expect(journey.stops[1].customerId).toBe("c2");
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

    // ─── Stop management ─────────────────────────────────────

    describe("addStop()", () => {
        it("adds a new stop to a PLANNED journey", () => {
            const journey = createJourney();
            journey.addStop(makeJourneyStop("c3", 2));

            expect(journey.stops).toHaveLength(3);
            expect(journey.stops[2].customerId).toBe("c3");
        });

        it("throws when customer already has a stop", () => {
            const journey = createJourney();
            expect(() => journey.addStop(makeJourneyStop("c1", 2))).toThrow(JourneyStopAlreadyExistsError);
        });

        it("throws when journey is not PLANNED", () => {
            const journey = createJourney();
            journey.start();
            expect(() => journey.addStop(makeJourneyStop("c3", 2))).toThrow(JourneyNotPlannedError);
        });
    });

    describe("removeStop()", () => {
        it("removes a stop from a PLANNED journey", () => {
            const journey = createJourney();
            journey.removeStop("c1");

            expect(journey.stops).toHaveLength(1);
            expect(journey.stops[0].customerId).toBe("c2");
        });

        it("throws when stop not found", () => {
            const journey = createJourney();
            expect(() => journey.removeStop("nonexistent")).toThrow(JourneyStopNotFoundError);
        });

        it("throws when journey is not PLANNED", () => {
            const journey = createJourney();
            journey.start();
            expect(() => journey.removeStop("c1")).toThrow(JourneyNotPlannedError);
        });
    });

    describe("assignOrderToStop()", () => {
        it("assigns an order to a stop", () => {
            const journey = createJourney();
            journey.assignOrderToStop("c1", "order-1");

            expect(journey.stops[0].orderIds).toEqual(["order-1"]);
        });

        it("assigns multiple orders to same stop", () => {
            const journey = createJourney();
            journey.assignOrderToStop("c1", "order-1");
            journey.assignOrderToStop("c1", "order-2");

            expect(journey.stops[0].orderIds).toEqual(["order-1", "order-2"]);
        });

        it("throws when order already assigned", () => {
            const journey = createJourney();
            journey.assignOrderToStop("c1", "order-1");

            expect(() => journey.assignOrderToStop("c1", "order-1")).toThrow(OrderAlreadyAssignedToStopError);
        });

        it("throws when stop not found", () => {
            const journey = createJourney();
            expect(() => journey.assignOrderToStop("nonexistent", "order-1")).toThrow(JourneyStopNotFoundError);
        });

        it("throws when journey is not PLANNED", () => {
            const journey = createJourney();
            journey.start();
            expect(() => journey.assignOrderToStop("c1", "order-1")).toThrow(JourneyNotPlannedError);
        });
    });

    describe("unassignOrderFromStop()", () => {
        it("removes an order from a stop", () => {
            const journey = createJourney();
            journey.assignOrderToStop("c1", "order-1");
            journey.assignOrderToStop("c1", "order-2");
            journey.unassignOrderFromStop("c1", "order-1");

            expect(journey.stops[0].orderIds).toEqual(["order-2"]);
        });

        it("throws when order not assigned", () => {
            const journey = createJourney();
            expect(() => journey.unassignOrderFromStop("c1", "order-1")).toThrow(OrderNotAssignedToStopError);
        });

        it("throws when stop not found", () => {
            const journey = createJourney();
            expect(() => journey.unassignOrderFromStop("nonexistent", "order-1")).toThrow(JourneyStopNotFoundError);
        });
    });

    describe("reorderStops()", () => {
        it("reorders stops by sequence", () => {
            const journey = createJourney();
            journey.reorderStops([
                { customerId: "c1", sequence: 5 },
                { customerId: "c2", sequence: 3 },
            ]);

            expect(journey.stops.find((s) => s.customerId === "c1")?.sequence).toBe(5);
            expect(journey.stops.find((s) => s.customerId === "c2")?.sequence).toBe(3);
        });

        it("throws when stop not found", () => {
            const journey = createJourney();
            expect(() => journey.reorderStops([{ customerId: "nonexistent", sequence: 0 }])).toThrow(
                JourneyStopNotFoundError,
            );
        });

        it("throws when journey is not PLANNED", () => {
            const journey = createJourney();
            journey.start();
            expect(() => journey.reorderStops([{ customerId: "c1", sequence: 0 }])).toThrow(JourneyNotPlannedError);
        });
    });
});
