import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class ChangeProductQuantityCommand extends Command<void> {
    readonly orderId: string;
    readonly itemId: string;
    readonly quantity: number;
    readonly priceId?: string;
    readonly buyerPriceTypeId?: string;

    constructor(props: CommandProps<ChangeProductQuantityCommand>) {
        super(props);
        this.orderId = props.orderId;
        this.itemId = props.itemId;
        this.quantity = props.quantity;
        this.priceId = props.priceId;
        this.buyerPriceTypeId = props.buyerPriceTypeId;
    }
}
