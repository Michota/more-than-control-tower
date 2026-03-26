import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class UpdateEmployeeCommand extends Command<void> {
    readonly employeeId: string;
    readonly firstName?: string;
    readonly lastName?: string;
    readonly email?: string;
    readonly phone?: string;

    constructor(props: CommandProps<UpdateEmployeeCommand>) {
        super(props);
        this.employeeId = props.employeeId;
        this.firstName = props.firstName;
        this.lastName = props.lastName;
        this.email = props.email;
        this.phone = props.phone;
    }
}
