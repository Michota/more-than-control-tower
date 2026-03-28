import { RequiredEntityData } from "@mikro-orm/core";
import { Injectable } from "@nestjs/common";
import { Mapper } from "../../../libs/ddd/mapper.interface.js";
import { EntityId } from "../../../libs/ddd/entities/entity-id.js";
import { RouteAggregate } from "../domain/route.aggregate.js";
import { RouteStatus } from "../domain/route-status.enum.js";
import { RouteSchedule, ScheduleType } from "../domain/route-schedule.value-object.js";
import { RouteStop } from "../domain/route-stop.value-object.js";
import { Route } from "./route.entity.js";

@Injectable()
export class RouteMapper implements Mapper<RouteAggregate, RequiredEntityData<Route>> {
    toDomain(record: Route): RouteAggregate {
        let schedule: RouteSchedule | undefined;
        if (record.scheduleType) {
            schedule = new RouteSchedule({
                type: record.scheduleType as ScheduleType,
                daysOfWeek: record.scheduleDaysOfWeek ?? undefined,
                daysOfMonth: record.scheduleDaysOfMonth ?? undefined,
                specificDates: record.scheduleSpecificDates ?? undefined,
            });
        }

        return RouteAggregate.reconstitute({
            id: record.id as EntityId,
            properties: {
                name: record.name,
                status: record.status as RouteStatus,
                vehicleIds: record.vehicleIds ?? [],
                representativeIds: record.representativeIds ?? [],
                stops: (record.stops ?? []).map(
                    (s) =>
                        new RouteStop({
                            customerId: s.customerId,
                            customerName: s.customerName,
                            address: {
                                country: s.addressCountry,
                                postalCode: s.addressPostalCode,
                                state: s.addressState,
                                city: s.addressCity,
                                street: s.addressStreet,
                            },
                            sequence: s.sequence,
                        }),
                ),
                schedule,
            },
        });
    }

    toPersistence(domain: RouteAggregate): RequiredEntityData<Route> {
        return {
            id: domain.id as string,
            name: domain.name,
            status: domain.status,
            vehicleIds: domain.vehicleIds,
            representativeIds: domain.representativeIds,
            stops: domain.stops.map((s) => ({
                customerId: s.customerId,
                customerName: s.customerName,
                addressCountry: s.address.country,
                addressPostalCode: s.address.postalCode,
                addressState: s.address.state,
                addressCity: s.address.city,
                addressStreet: s.address.street,
                sequence: s.sequence,
            })),
            scheduleType: domain.schedule?.type ?? null,
            scheduleDaysOfWeek: domain.schedule?.daysOfWeek ?? null,
            scheduleDaysOfMonth: domain.schedule?.daysOfMonth ?? null,
            scheduleSpecificDates: domain.schedule?.specificDates ?? null,
        };
    }

    toResponse(entity: RouteAggregate) {
        return entity.toJSON();
    }
}
