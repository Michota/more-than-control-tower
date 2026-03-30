import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class RemoveJourneyStopCommand extends Command<void> {
    readonly journeyId: string;
    readonly customerId: string;

    constructor(props: CommandProps<RemoveJourneyStopCommand>) {
        super(props);
        this.journeyId = props.journeyId;
        this.customerId = props.customerId;
    }
}
