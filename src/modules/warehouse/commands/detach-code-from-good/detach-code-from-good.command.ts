import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class DetachCodeFromGoodCommand extends Command<void> {
    readonly codeId: string;

    constructor(props: CommandProps<DetachCodeFromGoodCommand>) {
        super(props);
        this.codeId = props.codeId;
    }
}
