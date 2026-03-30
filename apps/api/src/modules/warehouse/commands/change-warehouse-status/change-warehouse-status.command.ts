import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class ActivateWarehouseCommand extends Command<void> {
    readonly warehouseId: string;

    constructor(props: CommandProps<ActivateWarehouseCommand>) {
        super(props);
        this.warehouseId = props.warehouseId;
    }
}

export class DeactivateWarehouseCommand extends Command<void> {
    readonly warehouseId: string;

    constructor(props: CommandProps<DeactivateWarehouseCommand>) {
        super(props);
        this.warehouseId = props.warehouseId;
    }
}
