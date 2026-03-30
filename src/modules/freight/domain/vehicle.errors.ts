import { ConflictDomainException, NotFoundDomainException } from "../../../libs/exceptions/http-domain.exceptions.js";

// ─── Not Found ───────────────────────────────────────────

export class VehicleNotFoundError extends NotFoundDomainException {
    public readonly code = "VEHICLE.NOT_FOUND";

    constructor(id: string) {
        super(`Vehicle with id ${id} not found`);
    }
}

// ─── Conflict ────────────────────────────────────────────

export class VehicleAlreadyInactiveError extends ConflictDomainException {
    public readonly code = "VEHICLE.ALREADY_INACTIVE";

    constructor(id: string) {
        super(`Vehicle ${id} is already inactive`);
    }
}

export class VehicleAlreadyActiveError extends ConflictDomainException {
    public readonly code = "VEHICLE.ALREADY_ACTIVE";

    constructor(id: string) {
        super(`Vehicle ${id} is already active`);
    }
}

export class VehicleVinAlreadyExistsError extends ConflictDomainException {
    public readonly code = "VEHICLE.VIN_ALREADY_EXISTS";

    constructor(vin: string) {
        super(`Vehicle with VIN ${vin} already exists`);
    }
}

export class VehicleLicensePlateAlreadyExistsError extends ConflictDomainException {
    public readonly code = "VEHICLE.LICENSE_PLATE_ALREADY_EXISTS";

    constructor(licensePlate: string) {
        super(`Vehicle with license plate ${licensePlate} already exists`);
    }
}
