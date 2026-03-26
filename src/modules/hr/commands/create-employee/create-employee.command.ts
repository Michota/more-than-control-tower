import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class CreateEmployeeCommand extends Command<string> {
    readonly firstName: string;
    readonly lastName: string;
    readonly email?: string;
    readonly phone?: string;
    readonly userId?: string;
    readonly skipUniquenessCheck?: boolean;

    constructor(props: CommandProps<CreateEmployeeCommand>) {
        super(props);
        this.firstName = props.firstName;
        this.lastName = props.lastName;
        this.email = props.email;
        this.phone = props.phone;
        this.userId = props.userId;
        this.skipUniquenessCheck = props.skipUniquenessCheck;
    }
}
