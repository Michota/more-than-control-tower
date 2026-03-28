import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class LogWorkingHoursCommand extends Command<string> {
    readonly employeeId: string;
    readonly date: string;
    readonly hours: number;
    readonly note?: string;
    readonly activityId?: string;

    constructor(props: CommandProps<LogWorkingHoursCommand>) {
        super(props);
        this.employeeId = props.employeeId;
        this.date = props.date;
        this.hours = props.hours;
        this.note = props.note;
        this.activityId = props.activityId;
    }
}
