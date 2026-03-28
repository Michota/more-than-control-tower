import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class ConfirmAvailabilityCommand extends Command<void> {
    readonly employeeId: string;
    readonly dates: string[];

    constructor(props: CommandProps<ConfirmAvailabilityCommand>) {
        super(props);
        this.employeeId = props.employeeId;
        this.dates = props.dates;
    }
}
