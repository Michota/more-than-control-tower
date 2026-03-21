import { Command, CommandProps } from "../../../../libs/cqrs/command.js";
import { ContactType } from "../../domain/customer-contact-type.enum.js";

export interface CreateCustomerAddressProps {
    label?: string;
    country: string;
    state: string;
    city: string;
    postalCode: string;
    street: string;
}

export interface CreateCustomerContactProps {
    type: ContactType;
    title: string;
    description?: string;
    value: string;
}

export class CreateCustomerCommand extends Command<string> {
    readonly name: string;
    readonly description?: string;
    readonly addresses: CreateCustomerAddressProps[];
    readonly contacts: CreateCustomerContactProps[];

    constructor(props: CommandProps<CreateCustomerCommand>) {
        super(props);
        this.name = props.name;
        this.description = props.description;
        this.addresses = props.addresses;
        this.contacts = props.contacts;
    }
}
