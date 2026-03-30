import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class PlaceOrderCommand extends Command<void> {
    readonly orderId: string;

    constructor(props: CommandProps<PlaceOrderCommand>) {
        super(props);
        this.orderId = props.orderId;
    }
}
