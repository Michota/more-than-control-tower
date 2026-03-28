import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class AssignGoodCommand extends Command<void> {
    readonly orderId: string;
    readonly productId: string;
    readonly goodId: string;

    constructor(props: CommandProps<AssignGoodCommand>) {
        super(props);
        this.orderId = props.orderId;
        this.productId = props.productId;
        this.goodId = props.goodId;
    }
}
