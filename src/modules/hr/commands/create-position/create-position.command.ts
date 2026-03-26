import { Command, CommandProps } from "../../../../libs/cqrs/command.js";
import type { QualificationSchemaEntry } from "../../../../shared/positions/position.types.js";

export class CreatePositionCommand extends Command<string> {
    readonly key: string;
    readonly displayName: string;
    readonly qualificationSchema: QualificationSchemaEntry[];
    readonly permissionKeys: string[];

    constructor(props: CommandProps<CreatePositionCommand>) {
        super(props);
        this.key = props.key;
        this.displayName = props.displayName;
        this.qualificationSchema = props.qualificationSchema;
        this.permissionKeys = props.permissionKeys;
    }
}
