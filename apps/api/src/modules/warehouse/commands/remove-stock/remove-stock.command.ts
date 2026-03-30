import { Command, CommandProps } from "../../../../libs/cqrs/command.js";
import { StockRemovalReason } from "../../domain/stock-removal-reason.enum.js";

export class RemoveStockCommand extends Command<void> {
    readonly goodId: string;
    readonly warehouseId: string;
    readonly quantity: number;
    readonly reason: StockRemovalReason;
    readonly note?: string;

    constructor(props: CommandProps<RemoveStockCommand>) {
        super(props);
        this.goodId = props.goodId;
        this.warehouseId = props.warehouseId;
        this.quantity = props.quantity;
        this.reason = props.reason;
        this.note = props.note;
    }
}
