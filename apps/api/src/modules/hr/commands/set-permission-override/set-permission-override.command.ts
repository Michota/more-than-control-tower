import { Command, CommandProps } from "../../../../libs/cqrs/command.js";
import { PermissionOverrideState } from "../../domain/permission-override-state.enum.js";

export interface PermissionOverrideEntry {
    permissionKey: string;
    /** null means "remove the override" (revert to position default) */
    state: PermissionOverrideState | null;
}

export class SetPermissionOverrideCommand extends Command<void> {
    readonly employeeId: string;
    readonly overrides: PermissionOverrideEntry[];

    constructor(props: CommandProps<SetPermissionOverrideCommand>) {
        super(props);
        this.employeeId = props.employeeId;
        this.overrides = props.overrides;
    }
}
