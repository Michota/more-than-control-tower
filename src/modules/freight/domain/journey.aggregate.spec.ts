import { uuidRegex } from "src/shared/utils/uuid-regex";
import { CrewMember } from "./crew-member.value-object";
import { CrewMemberRole } from "./crew-member-role.enum";
import { JourneyStatus } from "./journey-status.enum";
import { JourneyStop } from "./journey-stop.value-object";
import { RouteStop } from "./route-stop.value-object";
import { JourneyAggregate } from "./journey.aggregate";
import {
    JourneyAlreadyCancelledError,
    JourneyAlreadyCompletedError,
    JourneyCannotStartError,
    JourneyMissingDriverError,
    JourneyMissingRsrError,
    JourneyNotAwaitingLoadingError,
    JourneyNotInProgressError,
    JourneyNotModifiableError,
    JourneyNotPlannedError,
    JourneyStopAlreadyExistsError,
    JourneyStopNotFoundError,
    OrderAlreadyAssignedToStopError,
    OrderNotAssignedToStopError,
} from "./journey.errors";
import { JourneyCreatedDomainEvent } from "./events/journey-created.domain-event";
import { JourneyStartedDomainEvent } from "./events/journey-started.domain-event";
import { JourneyCompletedDomainEvent } from "./events/journey-completed.domain-event";
import { JourneyLoadingRequestedDomainEvent } from "./events/journey-loading-requested.domain-event";

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
        crewMembers: [
            new CrewMember({ employeeId: "d1", employeeName: "Adam Nowak", role: CrewMemberRole.DRIVER }),
            new CrewMember({ employeeId: "r1", employeeName: "Jan Kowalski", role: CrewMemberRole.RSR }),
        ],
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
            expect(journey.crewMembers).toHaveLength(2);
            expect(journey.crewMembers[0].role).toBe(CrewMemberRole.DRIVER);
            expect(journey.crewMembers[1].role).toBe(CrewMemberRole.RSR);
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

    describe("requestLoading()", () => {
        it("transitions from PLANNED to AWAITING_LOADING with deadline", () => {
            const journey = createJourney();
            journey.clearEvents();
            journey.requestLoading("2026-04-01T08:00:00.000Z");

            expect(journey.status).toBe(JourneyStatus.AWAITING_LOADING);
            expect(journey.loadingDeadline).toBe("2026-04-01T08:00:00.000Z");
            expect(journey.domainEvents).toHaveLength(1);
            expect(journey.domainEvents[0]).toBeInstanceOf(JourneyLoadingRequestedDomainEvent);
        });

        it("throws when not PLANNED", () => {
            const journey = createJourney();
            journey.requestLoading("2026-04-01T08:00:00.000Z");
            expect(() => journey.requestLoading("2026-04-01T09:00:00.000Z")).toThrow(JourneyNotPlannedError);
        });
    });

    describe("cancelLoading()", () => {
        it("transitions from AWAITING_LOADING back to PLANNED", () => {
            const journey = createJourney();
            journey.requestLoading("2026-04-01T08:00:00.000Z");
            journey.cancelLoading();

            expect(journey.status).toBe(JourneyStatus.PLANNED);
            expect(journey.loadingDeadline).toBeUndefined();
        });

        it("throws when not AWAITING_LOADING", () => {
            const journey = createJourney();
            expect(() => journey.cancelLoading()).toThrow(JourneyNotAwaitingLoadingError);
        });
    });

    describe("start()", () => {
        it("transitions from AWAITING_LOADING to IN_PROGRESS", () => {
            const journey = createJourney();
            journey.requestLoading("2026-04-01T08:00:00.000Z");
            journey.clearEvents();
            journey.start();

            expect(journey.status).toBe(JourneyStatus.IN_PROGRESS);
            expect(journey.domainEvents).toHaveLength(1);
            expect(journey.domainEvents[0]).toBeInstanceOf(JourneyStartedDomainEvent);
        });

        it("throws when PLANNED (must request loading first)", () => {
            const journey = createJourney();
            expect(() => journey.start()).toThrow(JourneyCannotStartError);
        });

        it("throws when already in progress", () => {
            const journey = createJourney();
            journey.requestLoading("2026-04-01T08:00:00.000Z");
            journey.start();
            expect(() => journey.start()).toThrow(JourneyCannotStartError);
        });

        it("throws when completed", () => {
            const journey = createJourney();
            journey.requestLoading("2026-04-01T08:00:00.000Z");
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
            journey.requestLoading("2026-04-01T08:00:00.000Z");
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
            journey.requestLoading("2026-04-01T08:00:00.000Z");
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

        it("cancels an AWAITING_LOADING journey", () => {
            const journey = createJourney();
            journey.requestLoading("2026-04-01T08:00:00.000Z");
            journey.cancel();
            expect(journey.status).toBe(JourneyStatus.CANCELLED);
        });

        it("cancels an IN_PROGRESS journey", () => {
            const journey = createJourney();
            journey.requestLoading("2026-04-01T08:00:00.000Z");
            journey.start();
            journey.cancel();
            expect(journey.status).toBe(JourneyStatus.CANCELLED);
        });

        it("throws when already completed", () => {
            const journey = createJourney();
            journey.requestLoading("2026-04-01T08:00:00.000Z");
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

    // ─── Crew validation ─────────────────────────────────────

    describe("crew validation on start()", () => {
        it("throws when no DRIVER in crew", () => {
            const journey = createJourney({
                crewMembers: [
                    new CrewMember({ employeeId: "r1", employeeName: "Jan Kowalski", role: CrewMemberRole.RSR }),
                ],
            });
            journey.requestLoading("2026-04-01T08:00:00.000Z");
            expect(() => journey.start()).toThrow(JourneyMissingDriverError);
        });

        it("throws when no RSR in crew", () => {
            const journey = createJourney({
                crewMembers: [
                    new CrewMember({ employeeId: "d1", employeeName: "Adam Nowak", role: CrewMemberRole.DRIVER }),
                ],
            });
            journey.requestLoading("2026-04-01T08:00:00.000Z");
            expect(() => journey.start()).toThrow(JourneyMissingRsrError);
        });

        it("allows start when same person is both DRIVER and RSR", () => {
            const journey = createJourney({
                crewMembers: [
                    new CrewMember({ employeeId: "e1", employeeName: "Jan Nowak", role: CrewMemberRole.DRIVER }),
                    new CrewMember({ employeeId: "e1", employeeName: "Jan Nowak", role: CrewMemberRole.RSR }),
                ],
            });
            journey.requestLoading("2026-04-01T08:00:00.000Z");
            journey.start();
            expect(journey.status).toBe(JourneyStatus.IN_PROGRESS);
        });
    });

    // ─── Crew management ────────────────────────────────────

    describe("setCrewMembers()", () => {
        it("sets crew members on a PLANNED journey", () => {
            const journey = createJourney();
            journey.setCrewMembers([
                new CrewMember({ employeeId: "e2", employeeName: "Piotr Zieliński", role: CrewMemberRole.DRIVER }),
            ]);
            expect(journey.crewMembers).toHaveLength(1);
            expect(journey.crewMembers[0].employeeId).toBe("e2");
        });

        it("sets crew members during AWAITING_LOADING", () => {
            const journey = createJourney();
            journey.requestLoading("2026-04-01T08:00:00.000Z");
            journey.setCrewMembers([
                new CrewMember({ employeeId: "e3", employeeName: "Marek Wiśniewski", role: CrewMemberRole.RSR }),
            ]);
            expect(journey.crewMembers).toHaveLength(1);
        });

        it("throws when journey is IN_PROGRESS", () => {
            const journey = createJourney();
            journey.requestLoading("2026-04-01T08:00:00.000Z");
            journey.start();
            expect(() =>
                journey.setCrewMembers([
                    new CrewMember({ employeeId: "e2", employeeName: "Piotr Zieliński", role: CrewMemberRole.DRIVER }),
                ]),
            ).toThrow(JourneyNotModifiableError);
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

        it("allows adding stops during AWAITING_LOADING", () => {
            const journey = createJourney();
            journey.requestLoading("2026-04-01T08:00:00.000Z");
            journey.addStop(makeJourneyStop("c3", 2));
            expect(journey.stops).toHaveLength(3);
        });

        it("throws when journey is IN_PROGRESS", () => {
            const journey = createJourney();
            journey.requestLoading("2026-04-01T08:00:00.000Z");
            journey.start();
            expect(() => journey.addStop(makeJourneyStop("c3", 2))).toThrow(JourneyNotModifiableError);
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

        it("throws when journey is IN_PROGRESS", () => {
            const journey = createJourney();
            journey.requestLoading("2026-04-01T08:00:00.000Z");
            journey.start();
            expect(() => journey.removeStop("c1")).toThrow(JourneyNotModifiableError);
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

        it("throws when journey is IN_PROGRESS", () => {
            const journey = createJourney();
            journey.requestLoading("2026-04-01T08:00:00.000Z");
            journey.start();
            expect(() => journey.assignOrderToStop("c1", "order-1")).toThrow(JourneyNotModifiableError);
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

        it("throws when journey is IN_PROGRESS", () => {
            const journey = createJourney();
            journey.requestLoading("2026-04-01T08:00:00.000Z");
            journey.start();
            expect(() => journey.reorderStops([{ customerId: "c1", sequence: 0 }])).toThrow(JourneyNotModifiableError);
        });
    });
});
