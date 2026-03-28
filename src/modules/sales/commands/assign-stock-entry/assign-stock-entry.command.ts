import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class AssignStockEntryCommand extends Command<void> {
    readonly orderId: string;
    readonly productId: string;
    readonly stockEntryId: string;

    constructor(props: CommandProps<AssignStockEntryCommand>) {
        super(props);
        this.orderId = props.orderId;
        this.productId = props.productId;
        this.stockEntryId = props.stockEntryId;
    }
}
