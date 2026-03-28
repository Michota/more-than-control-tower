import { Command, CommandProps } from "../../../../libs/cqrs/command.js";
import { DriverLicenseCategory } from "../../domain/driver-license-category.enum.js";
import { CreateVehicleAttributeProps } from "../create-vehicle/create-vehicle.command.js";

export class EditVehicleCommand extends Command<void> {
    readonly vehicleId: string;
    readonly name?: string;
    readonly requiredLicenseCategory?: DriverLicenseCategory;
    readonly attributes?: CreateVehicleAttributeProps[];
    readonly vin?: string;
    readonly licensePlate?: string;
    readonly note?: string;
    readonly warehouseId?: string;

    constructor(props: CommandProps<EditVehicleCommand>) {
        super(props);
        this.vehicleId = props.vehicleId;
        this.name = props.name;
        this.requiredLicenseCategory = props.requiredLicenseCategory;
        this.attributes = props.attributes;
        this.vin = props.vin;
        this.licensePlate = props.licensePlate;
        this.note = props.note;
        this.warehouseId = props.warehouseId;
    }
}
