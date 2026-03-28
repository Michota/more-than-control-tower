import { RequiredEntityData } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Mapper } from "../../../libs/ddd/mapper.interface.js";
import { EntityId } from "../../../libs/ddd/entities/entity-id.js";
import { JourneyAggregate } from "../domain/journey.aggregate.js";
import { JourneyStatus } from "../domain/journey-status.enum.js";
import { JourneyStop } from "../domain/journey-stop.value-object.js";
import { CrewMember } from "../domain/crew-member.value-object.js";
import { Journey } from "./journey.entity.js";

@Injectable()
export class JourneyMapper implements Mapper<JourneyAggregate, RequiredEntityData<Journey>> {
    toDomain(record: Journey): JourneyAggregate {
        return JourneyAggregate.reconstitute({
            id: record.id as EntityId,
            properties: {
                routeId: record.routeId,
                routeName: record.routeName,
                status: record.status as JourneyStatus,
                scheduledDate: record.scheduledDate,
                vehicleIds: record.vehicleIds ?? [],
                crewMembers: (record.crewMembers ?? []).map(
                    (m) =>
                        new CrewMember({
                            employeeId: m.employeeId,
                            employeeName: m.employeeName,
                            role: m.role,
                        }),
                ),
                stops: (record.stops ?? []).map(
                    (s) =>
                        new JourneyStop({
                            customerId: s.customerId,
                            customerName: s.customerName,
                            address: {
                                country: s.addressCountry,
                                postalCode: s.addressPostalCode,
                                state: s.addressState,
                                city: s.addressCity,
                                street: s.addressStreet,
                            },
                            orderIds: s.orderIds ?? [],
                            sequence: s.sequence,
                        }),
                ),
                loadingDeadline: record.loadingDeadline ?? undefined,
            },
        });
    }

    toPersistence(domain: JourneyAggregate): RequiredEntityData<Journey> {
        return {
            id: domain.id as string,
            routeId: domain.routeId,
            routeName: domain.routeName,
            status: domain.status,
            scheduledDate: domain.scheduledDate,
            vehicleIds: domain.vehicleIds,
            crewMembers: domain.crewMembers.map((m) => ({
                employeeId: m.employeeId,
                employeeName: m.employeeName,
                role: m.role,
            })),
            stops: domain.stops.map((s) => ({
                customerId: s.customerId,
                customerName: s.customerName,
                addressCountry: s.address.country,
                addressPostalCode: s.address.postalCode,
                addressState: s.address.state,
                addressCity: s.address.city,
                addressStreet: s.address.street,
                orderIds: s.orderIds,
                sequence: s.sequence,
            })),
            loadingDeadline: domain.loadingDeadline ?? null,
        };
    }

    toResponse(entity: JourneyAggregate) {
        return entity.toJSON();
    }
}
