import { Command, CommandProps } from "../../../../libs/cqrs/command.js";
import { ContactType } from "../../domain/customer-contact-type.enum.js";
import { CustomerType } from "../../domain/customer-type.enum.js";

export interface CreateCustomerAddressProps {
    label?: string;
    note?: string;
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
    note?: string;
    customLabel?: string;
    value: string;
}

export class CreateCustomerCommand extends Command<string> {
    readonly name: string;
    readonly customerType: CustomerType;
    readonly description?: string;
    readonly note?: string;
    readonly firstName?: string;
    readonly lastName?: string;
    readonly companyName?: string;
    readonly nip?: string;
    readonly addresses: CreateCustomerAddressProps[];
    readonly contacts: CreateCustomerContactProps[];

    constructor(props: CommandProps<CreateCustomerCommand>) {
        super(props);
        this.name = props.name;
        this.customerType = props.customerType;
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
