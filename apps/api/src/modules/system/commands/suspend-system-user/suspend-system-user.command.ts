import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class SuspendSystemUserCommand extends Command<void> {
    readonly userId: string;

    constructor(props: CommandProps<SuspendSystemUserCommand>) {
        super(props);
        this.userId = props.userId;
    }
}
