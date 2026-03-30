import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class LockAvailabilityCommand extends Command<void> {
    readonly employeeId: string;
    readonly dates: string[];

    constructor(props: CommandProps<LockAvailabilityCommand>) {
        super(props);
        this.employeeId = props.employeeId;
        this.dates = props.dates;
    }
}
