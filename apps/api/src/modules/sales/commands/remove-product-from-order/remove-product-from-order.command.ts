import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class RemoveProductFromOrderCommand extends Command<void> {
    readonly orderId: string;
    readonly itemId: string;
    readonly priceId?: string;
    readonly buyerPriceTypeId?: string;

    constructor(props: CommandProps<RemoveProductFromOrderCommand>) {
        super(props);
        this.orderId = props.orderId;
        this.itemId = props.itemId;
        this.priceId = props.priceId;
        this.buyerPriceTypeId = props.buyerPriceTypeId;
    }
}
