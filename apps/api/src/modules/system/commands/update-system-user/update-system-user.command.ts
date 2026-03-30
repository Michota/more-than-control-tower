import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class UpdateSystemUserCommand extends Command<void> {
    readonly userId: string;
    readonly email?: string;
    readonly name?: string;

    constructor(props: CommandProps<UpdateSystemUserCommand>) {
        super(props);
        this.userId = props.userId;
        this.email = props.email;
        this.name = props.name;
    }
}
