import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class AssignPositionCommand extends Command<void> {
    readonly employeeId: string;
    readonly positionKey: string;
    /** Employee ID of the person assigning this position */
    readonly assignedBy: string;

    constructor(props: CommandProps<AssignPositionCommand>) {
        super(props);
        this.employeeId = props.employeeId;
        this.positionKey = props.positionKey;
        this.assignedBy = props.assignedBy;
    }
}
