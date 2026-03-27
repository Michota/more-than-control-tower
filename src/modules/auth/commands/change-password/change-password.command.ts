import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class ChangePasswordCommand extends Command<void> {
    readonly userId: string;
    readonly password: string;

    constructor(props: CommandProps<ChangePasswordCommand>) {
        super(props);
        this.userId = props.userId;
        this.password = props.password;
    }
}
