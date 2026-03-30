import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class RequestJourneyLoadingCommand extends Command<void> {
    readonly journeyId: string;
    readonly loadingDeadline: string;
    readonly fromWarehouseId: string;

    constructor(props: CommandProps<RequestJourneyLoadingCommand>) {
        super(props);
        this.journeyId = props.journeyId;
        this.loadingDeadline = props.loadingDeadline;
        this.fromWarehouseId = props.fromWarehouseId;
    }
}
