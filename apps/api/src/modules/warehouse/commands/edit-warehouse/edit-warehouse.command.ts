import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export interface EditWarehouseAddressProps {
    country?: string;
    postalCode?: string;
    state?: string;
    city?: string;
    street?: string;
}

export class EditWarehouseCommand extends Command<void> {
    readonly warehouseId: string;
    readonly name?: string;
    readonly address?: EditWarehouseAddressProps;

    constructor(props: CommandProps<EditWarehouseCommand>) {
        super(props);
        this.warehouseId = props.warehouseId;
        this.name = props.name;
        this.address = props.address;
    }
}
