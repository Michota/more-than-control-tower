import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class CancelOrderCommand extends Command<void> {
    readonly orderId: string;

    constructor(props: CommandProps<CancelOrderCommand>) {
        super(props);
        this.orderId = props.orderId;
    }
}
