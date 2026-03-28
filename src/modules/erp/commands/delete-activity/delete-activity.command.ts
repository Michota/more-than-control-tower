import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class DeleteActivityCommand extends Command<void> {
    readonly activityId: string;

    constructor(props: CommandProps<DeleteActivityCommand>) {
        super(props);
        this.activityId = props.activityId;
    }
}
