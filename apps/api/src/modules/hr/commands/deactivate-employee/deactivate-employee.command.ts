import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class DeactivateEmployeeCommand extends Command<void> {
    readonly employeeId: string;

    constructor(props: CommandProps<DeactivateEmployeeCommand>) {
        super(props);
        this.employeeId = props.employeeId;
    }
}
