import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class LinkEmployeeToUserCommand extends Command<void> {
    readonly employeeId: string;
    readonly userId: string;

    constructor(props: CommandProps<LinkEmployeeToUserCommand>) {
        super(props);
        this.employeeId = props.employeeId;
        this.userId = props.userId;
    }
}
