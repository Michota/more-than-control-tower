import { uuidRegex } from "src/shared/utils/uuid-regex";
import { DriverLicenseCategory } from "./driver-license-category.enum";
import { VehicleAttribute } from "./vehicle-attribute.value-object";
import { VehicleStatus } from "./vehicle-status.enum";
import { VehicleAggregate } from "./vehicle.aggregate";
import { VehicleAlreadyActiveError, VehicleAlreadyInactiveError } from "./vehicle.errors";
import { VehicleCreatedDomainEvent } from "./events/vehicle-created.domain-event";
import { VehicleStatusChangedDomainEvent } from "./events/vehicle-status-changed.domain-event";

describe("VehicleAggregate", () => {
    describe("create()", () => {
        it("creates a vehicle with required fields", () => {
            const vehicle = VehicleAggregate.create({
                name: "Truck A",
                requiredLicenseCategory: DriverLicenseCategory.C,
            });

            expect(vehicle).toBeInstanceOf(VehicleAggregate);
            expect(vehicle.id).toMatch(uuidRegex);
            expect(vehicle.name).toBe("Truck A");
            expect(vehicle.status).toBe(VehicleStatus.ACTIVE);
            expect(vehicle.requiredLicenseCategory).toBe(DriverLicenseCategory.C);
            expect(vehicle.attributes).toEqual([]);
            expect(vehicle.note).toBeUndefined();
            expect(vehicle.warehouseId).toBeUndefined();
        });

        it("creates a vehicle with all optional fields", () => {
            const attributes = [new VehicleAttribute({ name: "has-fridge", value: "true" })];
            const vehicle = VehicleAggregate.create({
                name: "Delivery Van",
                requiredLicenseCategory: DriverLicenseCategory.B,
                attributes,
                note: "Small van for city deliveries",
                warehouseId: "wh-123",
            });

            expect(vehicle.name).toBe("Delivery Van");
            expect(vehicle.requiredLicenseCategory).toBe(DriverLicenseCategory.B);
            expect(vehicle.attributes).toHaveLength(1);
            expect(vehicle.attributes[0].name).toBe("has-fridge");
            expect(vehicle.attributes[0].value).toBe("true");
            expect(vehicle.note).toBe("Small van for city deliveries");
            expect(vehicle.warehouseId).toBe("wh-123");
        });

        it("throws when name is empty", () => {
            expect(() =>
                VehicleAggregate.create({
                    name: "",
                    requiredLicenseCategory: DriverLicenseCategory.C,
                }),
            ).toThrow();
        });

        it("emits VehicleCreatedDomainEvent", () => {
            const vehicle = VehicleAggregate.create({
                name: "Truck B",
                requiredLicenseCategory: DriverLicenseCategory.C_E,
            });

            expect(vehicle.domainEvents).toHaveLength(1);
            expect(vehicle.domainEvents[0]).toBeInstanceOf(VehicleCreatedDomainEvent);
        });
    });

    describe("activate()", () => {
        it("activates an inactive vehicle", () => {
            const vehicle = VehicleAggregate.create({
                name: "Truck",
                requiredLicenseCategory: DriverLicenseCategory.C,
            });
            vehicle.deactivate();
            vehicle.clearEvents();

            vehicle.activate();

            expect(vehicle.status).toBe(VehicleStatus.ACTIVE);
            expect(vehicle.domainEvents).toHaveLength(1);
            expect(vehicle.domainEvents[0]).toBeInstanceOf(VehicleStatusChangedDomainEvent);
        });

        it("throws when already active", () => {
            const vehicle = VehicleAggregate.create({
                name: "Truck",
                requiredLicenseCategory: DriverLicenseCategory.C,
            });

            expect(() => vehicle.activate()).toThrow(VehicleAlreadyActiveError);
        });
    });

    describe("deactivate()", () => {
        it("deactivates an active vehicle", () => {
            const vehicle = VehicleAggregate.create({
                name: "Truck",
                requiredLicenseCategory: DriverLicenseCategory.C,
            });
            vehicle.clearEvents();

            vehicle.deactivate();

            expect(vehicle.status).toBe(VehicleStatus.INACTIVE);
            expect(vehicle.domainEvents).toHaveLength(1);
            expect(vehicle.domainEvents[0]).toBeInstanceOf(VehicleStatusChangedDomainEvent);
        });

        it("throws when already inactive", () => {
            const vehicle = VehicleAggregate.create({
                name: "Truck",
                requiredLicenseCategory: DriverLicenseCategory.C,
            });
            vehicle.deactivate();

            expect(() => vehicle.deactivate()).toThrow(VehicleAlreadyInactiveError);
        });
    });

    describe("update()", () => {
        it("updates name and note", () => {
            const vehicle = VehicleAggregate.create({
                name: "Old Name",
                requiredLicenseCategory: DriverLicenseCategory.B,
            });

            vehicle.update({ name: "New Name", note: "Updated note" });

            expect(vehicle.name).toBe("New Name");
            expect(vehicle.note).toBe("Updated note");
        });

        it("updates attributes", () => {
            const vehicle = VehicleAggregate.create({
                name: "Truck",
                requiredLicenseCategory: DriverLicenseCategory.C,
            });

            vehicle.update({
                attributes: [new VehicleAttribute({ name: "has-fridge", value: "true" })],
            });

            expect(vehicle.attributes).toHaveLength(1);
            expect(vehicle.attributes[0].name).toBe("has-fridge");
        });

        it("updates required license category", () => {
            const vehicle = VehicleAggregate.create({
                name: "Truck",
                requiredLicenseCategory: DriverLicenseCategory.C,
            });

            vehicle.update({ requiredLicenseCategory: DriverLicenseCategory.C_E });

            expect(vehicle.requiredLicenseCategory).toBe(DriverLicenseCategory.C_E);
        });

        it("throws on invalid update", () => {
            const vehicle = VehicleAggregate.create({
                name: "Truck",
                requiredLicenseCategory: DriverLicenseCategory.C,
            });

            expect(() => vehicle.update({ name: "" })).toThrow();
        });
    });
});
