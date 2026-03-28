import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class ActivateVehicleCommand extends Command<void> {
    readonly vehicleId: string;

    constructor(props: CommandProps<ActivateVehicleCommand>) {
        super(props);
        this.vehicleId = props.vehicleId;
    }
}

export class DeactivateVehicleCommand extends Command<void> {
    readonly vehicleId: string;

    constructor(props: CommandProps<DeactivateVehicleCommand>) {
        super(props);
        this.vehicleId = props.vehicleId;
    }
}
