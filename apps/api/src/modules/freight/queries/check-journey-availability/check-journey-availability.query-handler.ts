import { Inject } from "@nestjs/common";
import { IQueryHandler, QueryBus, QueryHandler } from "@nestjs/cqrs";
import {
    CheckEmployeeAvailabilityQuery,
    CheckEmployeeAvailabilityResponse,
} from "../../../../shared/queries/check-employee-availability.query.js";
import type { JourneyRepositoryPort } from "../../database/journey.repository.port.js";
import { JOURNEY_REPOSITORY_PORT } from "../../freight.di-tokens.js";
import {
    CheckJourneyAvailabilityQuery,
    CheckJourneyAvailabilityResponse,
    CrewAvailabilityItem,
    VehicleAvailabilityItem,
} from "./check-journey-availability.query.js";

@QueryHandler(CheckJourneyAvailabilityQuery)
export class CheckJourneyAvailabilityQueryHandler implements IQueryHandler<
    CheckJourneyAvailabilityQuery,
    CheckJourneyAvailabilityResponse
> {
    constructor(
        @Inject(JOURNEY_REPOSITORY_PORT)
        private readonly journeyRepo: JourneyRepositoryPort,

        private readonly queryBus: QueryBus,
    ) {}

    async execute(query: CheckJourneyAvailabilityQuery): Promise<CheckJourneyAvailabilityResponse> {
        const activeJourneys = await this.journeyRepo.findActiveByDate(query.date);
        const otherJourneys = query.excludeJourneyId
            ? activeJourneys.filter((j) => j.id !== query.excludeJourneyId)
            : activeJourneys;

        const vehicles: VehicleAvailabilityItem[] = query.vehicleIds.map((vehicleId) => {
            const conflict = otherJourneys.find((j) => j.vehicleIds.includes(vehicleId));
            return {
                vehicleId,
                available: !conflict,
                conflictingJourneyId: conflict ? (conflict.id as string) : undefined,
            };
        });

        const crew: CrewAvailabilityItem[] = await Promise.all(
            query.employeeIds.map(async (employeeId) => {
                const conflict = otherJourneys.find((j) => j.crewMembers.map((m) => m.employeeId).includes(employeeId));

                let hrAvailable: boolean | undefined;
                let hrReason: string | undefined;
                try {
                    const hrResult = await this.queryBus.execute<
                        CheckEmployeeAvailabilityQuery,
                        CheckEmployeeAvailabilityResponse
                    >(new CheckEmployeeAvailabilityQuery(employeeId, query.date));
                    hrAvailable = hrResult.available;
                    hrReason = hrResult.reason;
                } catch {
                    // HR module may not have a handler registered — treat as unknown
                }

                return {
                    employeeId,
                    available: !conflict,
                    conflictingJourneyId: conflict ? (conflict.id as string) : undefined,
                    hrAvailable,
                    hrReason,
                };
            }),
        );

        return {
            date: query.date,
            vehicles,
            crew,
        };
    }
}
