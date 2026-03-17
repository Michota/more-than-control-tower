import { IdOfEntity } from "@src/libs/ddd/aggregate-root.abstract.js";
import { Command, CommandProps } from "@src/libs/ddd/command.js";
import { OrderAggregate } from "@src/modules/sales/domain/order.aggregate.js";
import { OrderCustomer } from "../../../domain/order-customer.entity.js";
import { OrderLines } from "../../../domain/order-lines.value-object.js";

export class DraftOrderCommand extends Command {
    readonly orderId?: IdOfEntity<OrderAggregate>;
    readonly customer: OrderCustomer;
    readonly orderLines: OrderLines;

    constructor(props: CommandProps<DraftOrderCommand>) {
        super(props);
        this.orderId = props.orderId;
        this.customer = props.customer;
        this.orderLines = props.orderLines;
    }
}
