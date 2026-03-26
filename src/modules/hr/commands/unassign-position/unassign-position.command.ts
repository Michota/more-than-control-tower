import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class UnassignPositionCommand extends Command<void> {
    readonly employeeId: string;
    readonly positionKey: string;

    constructor(props: CommandProps<UnassignPositionCommand>) {
        super(props);
        this.employeeId = props.employeeId;
        this.positionKey = props.positionKey;
    }
}
