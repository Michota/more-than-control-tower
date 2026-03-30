import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class StartJourneyCommand extends Command<void> {
    readonly journeyId: string;

    constructor(props: CommandProps<StartJourneyCommand>) {
        super(props);
        this.journeyId = props.journeyId;
    }
}
