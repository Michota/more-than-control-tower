import { Query } from "@nestjs/cqrs";

export interface VehicleAvailabilityItem {
    vehicleId: string;
    available: boolean;
    conflictingJourneyId?: string;
}

export interface CrewAvailabilityItem {
    employeeId: string;
    available: boolean;
    conflictingJourneyId?: string;
    hrAvailable?: boolean;
    hrReason?: string;
}

export interface CheckJourneyAvailabilityResponse {
    date: string;
    vehicles: VehicleAvailabilityItem[];
    crew: CrewAvailabilityItem[];
}

export class CheckJourneyAvailabilityQuery extends Query<CheckJourneyAvailabilityResponse> {
    constructor(
        public readonly date: string,
        public readonly vehicleIds: string[],
        public readonly employeeIds: string[],
        public readonly excludeJourneyId?: string,
    ) {
        super();
    }
}
