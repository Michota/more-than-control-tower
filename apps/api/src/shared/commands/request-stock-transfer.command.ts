import { Command, CommandProps } from "../../libs/cqrs/command.js";

export class RequestStockTransferCommand extends Command<string> {
    readonly goodId: string;
    readonly quantity: number;
    readonly fromWarehouseId: string;
    readonly toWarehouseId: string;
    readonly note?: string;
    readonly requestedBy?: string;

    constructor(props: CommandProps<RequestStockTransferCommand>) {
        super(props);
        this.goodId = props.goodId;
        this.quantity = props.quantity;
        this.fromWarehouseId = props.fromWarehouseId;
        this.toWarehouseId = props.toWarehouseId;
        this.note = props.note;
        this.requestedBy = props.requestedBy;
    }
}
