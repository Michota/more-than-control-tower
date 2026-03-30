import { Command, CommandProps } from "../../../../libs/cqrs/command.js";
import { WarehouseType } from "../../domain/warehouse-type.enum.js";

export interface CreateWarehouseAddressProps {
    country: string;
    postalCode: string;
    state: string;
    city: string;
    street: string;
}

export class CreateWarehouseCommand extends Command<string> {
    readonly name: string;
    readonly address: CreateWarehouseAddressProps;
    readonly type?: WarehouseType;

    constructor(props: CommandProps<CreateWarehouseCommand>) {
        super(props);
        this.name = props.name;
        this.address = props.address;
        this.type = props.type;
    }
}
