import { Command, CommandProps } from "../../../../libs/cqrs/command.js";
import { DriverLicenseCategory } from "../../domain/driver-license-category.enum.js";

export interface CreateVehicleAttributeProps {
    name: string;
    value: string;
}

export class CreateVehicleCommand extends Command<string> {
    readonly name: string;
    readonly requiredLicenseCategory: DriverLicenseCategory;
    readonly attributes?: CreateVehicleAttributeProps[];
    readonly vin?: string;
    readonly licensePlate?: string;
    readonly note?: string;
    readonly warehouseId?: string;

    constructor(props: CommandProps<CreateVehicleCommand>) {
        super(props);
        this.name = props.name;
        this.requiredLicenseCategory = props.requiredLicenseCategory;
        this.attributes = props.attributes;
        this.vin = props.vin;
        this.licensePlate = props.licensePlate;
        this.note = props.note;
        this.warehouseId = props.warehouseId;
    }
}
