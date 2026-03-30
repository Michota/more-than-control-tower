import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class CreateJourneyCommand extends Command<string> {
    readonly routeId: string;
    readonly scheduledDate: string;

    constructor(props: CommandProps<CreateJourneyCommand>) {
        super(props);
        this.routeId = props.routeId;
        this.scheduledDate = props.scheduledDate;
    }
}
