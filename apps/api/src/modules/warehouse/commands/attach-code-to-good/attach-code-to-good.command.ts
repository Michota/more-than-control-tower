import { Command, CommandProps } from "../../../../libs/cqrs/command.js";
import { CodeType } from "../../domain/code-type.enum.js";

export class AttachCodeToGoodCommand extends Command<string> {
    readonly goodId: string;
    readonly type: CodeType;
    readonly value: string;

    constructor(props: CommandProps<AttachCodeToGoodCommand>) {
        super(props);
        this.goodId = props.goodId;
        this.type = props.type;
        this.value = props.value;
    }
}
