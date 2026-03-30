import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class MarkReadyForDepartureCommand extends Command<void> {
    readonly journeyId: string;

    constructor(props: CommandProps<MarkReadyForDepartureCommand>) {
        super(props);
        this.journeyId = props.journeyId;
    }
}
