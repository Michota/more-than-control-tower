import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class DeleteEmployeeCommand extends Command<void> {
    readonly employeeId: string;

    constructor(props: CommandProps<DeleteEmployeeCommand>) {
        super(props);
        this.employeeId = props.employeeId;
    }
}
