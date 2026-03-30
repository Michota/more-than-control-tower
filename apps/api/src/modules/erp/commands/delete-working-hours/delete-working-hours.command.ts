import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class DeleteWorkingHoursCommand extends Command<void> {
    readonly entryId: string;
    readonly actorId: string;

    constructor(props: CommandProps<DeleteWorkingHoursCommand>) {
        super(props);
        this.entryId = props.entryId;
        this.actorId = props.actorId;
    }
}
