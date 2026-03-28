import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class CompleteJourneyCommand extends Command<void> {
    readonly journeyId: string;

    constructor(props: CommandProps<CompleteJourneyCommand>) {
        super(props);
        this.journeyId = props.journeyId;
    }
}
