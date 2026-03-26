import { Command, CommandProps } from "../../../../libs/cqrs/command.js";
import { SystemUserRole } from "../../domain/system-user-role.enum.js";

export class CreateSystemUserCommand extends Command<string> {
    readonly email: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly roles: SystemUserRole[];

    constructor(props: CommandProps<CreateSystemUserCommand>) {
        super(props);
        this.email = props.email;
        this.firstName = props.firstName;
        this.lastName = props.lastName;
        this.roles = props.roles;
    }
}
