import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class CreatePositionCommand extends Command<string> {
    readonly key: string;
    readonly displayName: string;
    readonly permissionKeys: string[];

    constructor(props: CommandProps<CreatePositionCommand>) {
        super(props);
        this.key = props.key;
        this.displayName = props.displayName;
        this.permissionKeys = props.permissionKeys;
    }
}
