import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class LockWorkingHoursCommand extends Command<void> {
    readonly employeeId: string;
    readonly dateFrom: string;
    readonly dateTo: string;
    readonly actorId: string;

    constructor(props: CommandProps<LockWorkingHoursCommand>) {
        super(props);
        this.employeeId = props.employeeId;
        this.dateFrom = props.dateFrom;
        this.dateTo = props.dateTo;
        this.actorId = props.actorId;
    }
}
