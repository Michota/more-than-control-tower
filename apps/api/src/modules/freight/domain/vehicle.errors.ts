import { ConflictDomainException, NotFoundDomainException } from "../../../libs/exceptions/http-domain.exceptions.js";

// ─── Not Found ───────────────────────────────────────────

export class VehicleNotFoundError extends NotFoundDomainException {
    static readonly message = "error_vehicle_not_found";
    public readonly code = "VEHICLE.NOT_FOUND";

    constructor(id: string) {
        super(VehicleNotFoundError.message, undefined, { id });
    }
}

// ─── Conflict ────────────────────────────────────────────

export class VehicleAlreadyInactiveError extends ConflictDomainException {
    static readonly message = "error_vehicle_already_inactive";
    public readonly code = "VEHICLE.ALREADY_INACTIVE";

    constructor(id: string) {
        super(VehicleAlreadyInactiveError.message, undefined, { id });
    }
}

export class VehicleAlreadyActiveError extends ConflictDomainException {
    static readonly message = "error_vehicle_already_active";
    public readonly code = "VEHICLE.ALREADY_ACTIVE";

    constructor(id: string) {
        super(VehicleAlreadyActiveError.message, undefined, { id });
    }
}

export class VehicleVinAlreadyExistsError extends ConflictDomainException {
    static readonly message = "error_vehicle_vin_already_exists";
    public readonly code = "VEHICLE.VIN_ALREADY_EXISTS";

    constructor(vin: string) {
        super(VehicleVinAlreadyExistsError.message, undefined, { vin });
    }
}

export class VehicleLicensePlateAlreadyExistsError extends ConflictDomainException {
    static readonly message = "error_vehicle_license_plate_already_exists";
    public readonly code = "VEHICLE.LICENSE_PLATE_ALREADY_EXISTS";

    constructor(licensePlate: string) {
        super(VehicleLicensePlateAlreadyExistsError.message, undefined, { licensePlate });
    }
}
