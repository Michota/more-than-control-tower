import { Command, CommandProps } from "../../../../libs/cqrs/command.js";
import { SystemUserRole } from "../../domain/system-user-role.enum.js";

export class AssignRolesCommand extends Command<void> {
    readonly userId: string;
    readonly roles: SystemUserRole[];
    readonly actorId: string;

    constructor(props: CommandProps<AssignRolesCommand>) {
        super(props);
        this.userId = props.userId;
        this.roles = props.roles;
        this.actorId = props.actorId;
    }
}
