import { Command, CommandProps } from "../../../../libs/cqrs/command.js";
import { SystemUserRole } from "../../domain/system-user-role.enum.js";

export class CreateSystemUserCommand extends Command<string> {
    readonly email: string;
    readonly name: string;
    readonly roles: SystemUserRole[];

    constructor(props: CommandProps<CreateSystemUserCommand>) {
        super(props);
        this.email = props.email;
        this.name = props.name;
        this.roles = props.roles;
    }
}
