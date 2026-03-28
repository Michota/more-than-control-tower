import { Query } from "@nestjs/cqrs";

export interface VehicleAvailabilityItem {
    vehicleId: string;
    available: boolean;
    conflictingJourneyId?: string;
}

export interface RepresentativeAvailabilityItem {
    representativeId: string;
    available: boolean;
    conflictingJourneyId?: string;
}

export interface CheckJourneyAvailabilityResponse {
    date: string;
    vehicles: VehicleAvailabilityItem[];
    representatives: RepresentativeAvailabilityItem[];
}

export class CheckJourneyAvailabilityQuery extends Query<CheckJourneyAvailabilityResponse> {
    constructor(
        public readonly date: string,
        public readonly vehicleIds: string[],
        public readonly representativeIds: string[],
        public readonly excludeJourneyId?: string,
    ) {
        super();
    }
}
