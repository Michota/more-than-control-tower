import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class SetPasswordCommand extends Command<void> {
    readonly userId: string;
    readonly password: string;

    constructor(props: CommandProps<SetPasswordCommand>) {
        super(props);
        this.userId = props.userId;
        this.password = props.password;
    }
}
