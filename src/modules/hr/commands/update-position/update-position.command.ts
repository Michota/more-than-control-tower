import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class UpdatePositionCommand extends Command<void> {
    readonly positionId: string;
    readonly displayName?: string;
    readonly permissionKeys?: string[];

    constructor(props: CommandProps<UpdatePositionCommand>) {
        super(props);
        this.positionId = props.positionId;
        this.displayName = props.displayName;
        this.permissionKeys = props.permissionKeys;
    }
}
