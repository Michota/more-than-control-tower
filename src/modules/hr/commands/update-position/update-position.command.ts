import { Command, CommandProps } from "../../../../libs/cqrs/command.js";
import type { QualificationSchemaEntry } from "../../../../shared/positions/position.types.js";

export class UpdatePositionCommand extends Command<void> {
    readonly positionId: string;
    readonly displayName?: string;
    readonly qualificationSchema?: QualificationSchemaEntry[];
    readonly permissionKeys?: string[];

    constructor(props: CommandProps<UpdatePositionCommand>) {
        super(props);
        this.positionId = props.positionId;
        this.displayName = props.displayName;
        this.qualificationSchema = props.qualificationSchema;
        this.permissionKeys = props.permissionKeys;
    }
}
