import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class CancelJourneyCommand extends Command<void> {
    readonly journeyId: string;

    constructor(props: CommandProps<CancelJourneyCommand>) {
        super(props);
        this.journeyId = props.journeyId;
    }
}
