import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export interface CreateWarehouseAddressProps {
    country: string;
    postalCode: string;
    state: string;
    city: string;
    street: string;
}

export class CreateWarehouseCommand extends Command<string> {
    readonly name: string;
    readonly latitude: number;
    readonly longitude: number;
    readonly address: CreateWarehouseAddressProps;

    constructor(props: CommandProps<CreateWarehouseCommand>) {
        super(props);
        this.name = props.name;
        this.latitude = props.latitude;
        this.longitude = props.longitude;
        this.address = props.address;
    }
}
