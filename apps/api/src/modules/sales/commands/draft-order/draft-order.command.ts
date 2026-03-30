import { IdOfEntity } from "../../../../libs/ddd/aggregate-root.abstract.js";
import { Command, CommandProps } from "../../../../libs/cqrs/command.js";
import { OrderAggregate } from "../../domain/order.aggregate.js";
import { OrderSource } from "../../domain/order-source.enum.js";

export interface DraftOrderLine {
    itemId: string;
    quantity: number;
    priceId?: string;
}

export class DraftOrderCommand extends Command<string> {
    readonly orderId?: IdOfEntity<OrderAggregate>;
    readonly customerId: string;
    readonly actorId: string;
    readonly source: OrderSource;
    readonly lines: DraftOrderLine[];
    readonly currency: string;
    readonly buyerPriceTypeId?: string;

    constructor(props: CommandProps<DraftOrderCommand>) {
        super(props);
        this.orderId = props.orderId;
        this.customerId = props.customerId;
        this.actorId = props.actorId;
        this.source = props.source;
        this.lines = props.lines;
        this.currency = props.currency;
        this.buyerPriceTypeId = props.buyerPriceTypeId;
    }
}
