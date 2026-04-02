import { uuidRegex } from "../../../shared/utils/uuid-regex.js";
import { CrewMember } from "./crew-member.value-object.js";
import { CrewMemberRole } from "./crew-member-role.enum.js";
import { RouteSchedule, ScheduleType } from "./route-schedule.value-object.js";
import { RouteStatus } from "./route-status.enum.js";
import { RouteStop } from "./route-stop.value-object.js";
import { RouteAggregate } from "./route.aggregate.js";
import {
    RouteAlreadyActiveError,
    RouteAlreadyArchivedError,
    RouteAlreadyInactiveError,
    RouteArchivedCannotBeModifiedError,
} from "./route.errors.js";
import { RouteCreatedDomainEvent } from "./events/route-created.domain-event.js";
import { RouteArchivedDomainEvent } from "./events/route-archived.domain-event.js";

describe("RouteAggregate", () => {
    describe("create()", () => {
        it("creates a route with a name and default values", () => {
            const route = RouteAggregate.create({ name: "Route North" });

            expect(route).toBeInstanceOf(RouteAggregate);
            expect(route.id).toMatch(uuidRegex);
            expect(route.name).toBe("Route North");
            expect(route.status).toBe(RouteStatus.ACTIVE);
            expect(route.vehicleIds).toEqual([]);
            expect(route.crewMembers).toEqual([]);
            expect(route.stops).toEqual([]);
            expect(route.schedule).toBeUndefined();
        });

        it("throws when name is empty", () => {
            expect(() => RouteAggregate.create({ name: "" })).toThrow();
        });

        it("emits RouteCreatedDomainEvent", () => {
            const route = RouteAggregate.create({ name: "Route South" });

            expect(route.domainEvents).toHaveLength(1);
            expect(route.domainEvents[0]).toBeInstanceOf(RouteCreatedDomainEvent);
        });
    });

    describe("update()", () => {
        it("updates name", () => {
            const route = RouteAggregate.create({ name: "Old Name" });
            route.update({ name: "New Name" });
            expect(route.name).toBe("New Name");
        });

        it("updates vehicle IDs", () => {
            const route = RouteAggregate.create({ name: "Route" });
            route.update({ vehicleIds: ["v1", "v2"] });
            expect(route.vehicleIds).toEqual(["v1", "v2"]);
        });

        it("updates crew members", () => {
            const route = RouteAggregate.create({ name: "Route" });
            const member = new CrewMember({
                employeeId: "r1",
                employeeName: "Jan Kowalski",
                role: CrewMemberRole.DRIVER,
            });
            route.update({ crewMembers: [member] });
            expect(route.crewMembers).toHaveLength(1);
            expect(route.crewMembers[0].employeeId).toBe("r1");
        });

        it("updates stops", () => {
            const route = RouteAggregate.create({ name: "Route" });
            const stops = [
                new RouteStop({
                    customerId: "c1",
                    customerName: "Sklep ABC",
                    address: {
                        country: "PL",
                        postalCode: "00-001",
                        state: "Mazowieckie",
                        city: "Warszawa",
                        street: "Marszałkowska 1",
                    },
                    sequence: 0,
                }),
                new RouteStop({
                    customerId: "c2",
                    customerName: "Sklep XYZ",
                    address: {
                        country: "PL",
                        postalCode: "00-002",
                        state: "Mazowieckie",
                        city: "Warszawa",
                        street: "Nowy Świat 5",
                    },
                    sequence: 1,
                }),
            ];
            route.update({ stops });
            expect(route.stops).toHaveLength(2);
            expect(route.stops[0].customerId).toBe("c1");
            expect(route.stops[1].sequence).toBe(1);
        });

        it("updates schedule", () => {
            const route = RouteAggregate.create({ name: "Route" });
            const schedule = new RouteSchedule({
                type: ScheduleType.DAYS_OF_WEEK,
                daysOfWeek: [1, 3, 5],
            });
            route.update({ schedule });
            expect(route.schedule).toBe(schedule);
            expect(route.schedule?.daysOfWeek).toEqual([1, 3, 5]);
        });

        it("throws when archived", () => {
            const route = RouteAggregate.create({ name: "Route" });
            route.archive();

            expect(() => route.update({ name: "New" })).toThrow(RouteArchivedCannotBeModifiedError);
        });

        it("throws on invalid update", () => {
            const route = RouteAggregate.create({ name: "Route" });
            expect(() => route.update({ name: "" })).toThrow();
        });
    });

    describe("activate()", () => {
        it("activates an inactive route", () => {
            const route = RouteAggregate.create({ name: "Route" });
            route.deactivate();
            route.activate();
            expect(route.status).toBe(RouteStatus.ACTIVE);
        });

        it("throws when already active", () => {
            const route = RouteAggregate.create({ name: "Route" });
            expect(() => route.activate()).toThrow(RouteAlreadyActiveError);
        });

        it("throws when archived", () => {
            const route = RouteAggregate.create({ name: "Route" });
            route.archive();
            expect(() => route.activate()).toThrow(RouteArchivedCannotBeModifiedError);
        });
    });

    describe("deactivate()", () => {
        it("deactivates an active route", () => {
            const route = RouteAggregate.create({ name: "Route" });
            route.deactivate();
            expect(route.status).toBe(RouteStatus.INACTIVE);
        });

        it("throws when already inactive", () => {
            const route = RouteAggregate.create({ name: "Route" });
            route.deactivate();
            expect(() => route.deactivate()).toThrow(RouteAlreadyInactiveError);
        });

        it("throws when archived", () => {
            const route = RouteAggregate.create({ name: "Route" });
            route.archive();
            expect(() => route.deactivate()).toThrow(RouteArchivedCannotBeModifiedError);
        });
    });

    describe("archive()", () => {
        it("archives an active route", () => {
            const route = RouteAggregate.create({ name: "Route" });
            route.clearEvents();
            route.archive();

            expect(route.status).toBe(RouteStatus.ARCHIVED);
            expect(route.domainEvents).toHaveLength(1);
            expect(route.domainEvents[0]).toBeInstanceOf(RouteArchivedDomainEvent);
        });

        it("archives an inactive route", () => {
            const route = RouteAggregate.create({ name: "Route" });
            route.deactivate();
            route.archive();
            expect(route.status).toBe(RouteStatus.ARCHIVED);
        });

        it("throws when already archived", () => {
            const route = RouteAggregate.create({ name: "Route" });
            route.archive();
            expect(() => route.archive()).toThrow(RouteAlreadyArchivedError);
        });
    });
});

describe("RouteSchedule", () => {
    it("matches days of week", () => {
        const schedule = new RouteSchedule({
            type: ScheduleType.DAYS_OF_WEEK,
            daysOfWeek: [1, 3, 5],
        });

        const monday = new Date("2026-03-30"); // Monday
        const tuesday = new Date("2026-03-31"); // Tuesday

        expect(schedule.matchesDate(monday)).toBe(true);
        expect(schedule.matchesDate(tuesday)).toBe(false);
    });

    it("matches days of month", () => {
        const schedule = new RouteSchedule({
            type: ScheduleType.DAYS_OF_MONTH,
            daysOfMonth: [1, 15],
        });

        const first = new Date("2026-04-01");
        const second = new Date("2026-04-02");

        expect(schedule.matchesDate(first)).toBe(true);
        expect(schedule.matchesDate(second)).toBe(false);
    });

    it("matches specific dates", () => {
        const schedule = new RouteSchedule({
            type: ScheduleType.SPECIFIC_DATES,
            specificDates: ["2026-04-01", "2026-04-15"],
        });

        const match = new Date("2026-04-01T00:00:00.000Z");
        const noMatch = new Date("2026-04-02T00:00:00.000Z");

        expect(schedule.matchesDate(match)).toBe(true);
        expect(schedule.matchesDate(noMatch)).toBe(false);
    });
});
