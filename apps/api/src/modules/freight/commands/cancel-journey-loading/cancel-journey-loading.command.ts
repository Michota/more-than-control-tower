import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class CancelJourneyLoadingCommand extends Command<void> {
    readonly journeyId: string;

    constructor(props: CommandProps<CancelJourneyLoadingCommand>) {
        super(props);
        this.journeyId = props.journeyId;
    }
}
