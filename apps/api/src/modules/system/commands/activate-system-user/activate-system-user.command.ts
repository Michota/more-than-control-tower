import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class ActivateSystemUserCommand extends Command<void> {
    readonly userId: string;

    constructor(props: CommandProps<ActivateSystemUserCommand>) {
        super(props);
        this.userId = props.userId;
    }
}
