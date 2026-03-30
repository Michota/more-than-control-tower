import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class RejectAvailabilityCommand extends Command<void> {
    readonly employeeId: string;
    readonly dates: string[];

    constructor(props: CommandProps<RejectAvailabilityCommand>) {
        super(props);
        this.employeeId = props.employeeId;
        this.dates = props.dates;
    }
}
