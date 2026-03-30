import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class EditWorkingHoursCommand extends Command<void> {
    readonly entryId: string;
    readonly actorId: string;
    readonly hours?: number;
    readonly note?: string;
    readonly activityId?: string;

    constructor(props: CommandProps<EditWorkingHoursCommand>) {
        super(props);
        this.entryId = props.entryId;
        this.actorId = props.actorId;
        this.hours = props.hours;
        this.note = props.note;
        this.activityId = props.activityId;
    }
}
