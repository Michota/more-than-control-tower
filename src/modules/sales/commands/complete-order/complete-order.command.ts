import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class CompleteOrderCommand extends Command<void> {
    readonly orderId: string;

    constructor(props: CommandProps<CompleteOrderCommand>) {
        super(props);
        this.orderId = props.orderId;
    }
}
