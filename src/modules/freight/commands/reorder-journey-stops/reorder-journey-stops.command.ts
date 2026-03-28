import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export interface StopSequenceProps {
    customerId: string;
    sequence: number;
}

export class ReorderJourneyStopsCommand extends Command<void> {
    readonly journeyId: string;
    readonly stopSequences: StopSequenceProps[];

    constructor(props: CommandProps<ReorderJourneyStopsCommand>) {
        super(props);
        this.journeyId = props.journeyId;
        this.stopSequences = props.stopSequences;
    }
}
