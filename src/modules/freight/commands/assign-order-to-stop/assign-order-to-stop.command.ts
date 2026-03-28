import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class AssignOrderToStopCommand extends Command<void> {
    readonly journeyId: string;
    readonly customerId: string;
    readonly orderId: string;

    constructor(props: CommandProps<AssignOrderToStopCommand>) {
        super(props);
        this.journeyId = props.journeyId;
        this.customerId = props.customerId;
        this.orderId = props.orderId;
    }
}
