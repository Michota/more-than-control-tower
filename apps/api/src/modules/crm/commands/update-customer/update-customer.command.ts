import { Command, CommandProps } from "../../../../libs/cqrs/command.js";
import { ContactType } from "../../domain/customer-contact-type.enum.js";

export interface UpdateCustomerAddressProps {
    label?: string;
    note?: string;
    country: string;
    state: string;
    city: string;
    postalCode: string;
    street: string;
}

export interface UpdateCustomerContactProps {
    id?: string;
    type: ContactType;
    title: string;
    description?: string;
    note?: string;
    customLabel?: string;
    value: string;
}

export class UpdateCustomerCommand extends Command<void> {
    readonly customerId: string;
    readonly name?: string;
    readonly description?: string;
    readonly note?: string;
    readonly firstName?: string;
    readonly lastName?: string;
    readonly companyName?: string;
    readonly nip?: string;
    readonly addresses?: UpdateCustomerAddressProps[];
    readonly contacts?: UpdateCustomerContactProps[];

    constructor(props: CommandProps<UpdateCustomerCommand>) {
        super(props);
        this.customerId = props.customerId;
        this.name = props.name;
        this.description = props.description;
        this.note = props.note;
        this.firstName = props.firstName;
        this.lastName = props.lastName;
        this.companyName = props.companyName;
        this.nip = props.nip;
        this.addresses = props.addresses;
        this.contacts = props.contacts;
    }
}
