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
    readonly latitude?: number;
    readonly longitude?: number;
    readonly address?: EditWarehouseAddressProps;

    constructor(props: CommandProps<EditWarehouseCommand>) {
        super(props);
        this.warehouseId = props.warehouseId;
        this.name = props.name;
        this.latitude = props.latitude;
        this.longitude = props.longitude;
        this.address = props.address;
    }
}
