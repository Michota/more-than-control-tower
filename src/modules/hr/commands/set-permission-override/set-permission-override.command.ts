import { Command, CommandProps } from "../../../../libs/cqrs/command.js";
import { PermissionOverrideState } from "../../domain/permission-override-state.enum.js";

export class SetPermissionOverrideCommand extends Command<void> {
    readonly employeeId: string;
    readonly permissionKey: string;
    /** null means "remove the override" (revert to position default) */
    readonly state: PermissionOverrideState | null;

    constructor(props: CommandProps<SetPermissionOverrideCommand>) {
        super(props);
        this.employeeId = props.employeeId;
        this.permissionKey = props.permissionKey;
        this.state = props.state;
    }
}
