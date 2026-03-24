import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class AddLineToGoodsReceiptCommand extends Command<void> {
    readonly receiptId: string;
    readonly goodId: string;
    readonly quantity: number;
    readonly locationDescription?: string;
    readonly note?: string;

    constructor(props: CommandProps<AddLineToGoodsReceiptCommand>) {
        super(props);
        this.receiptId = props.receiptId;
        this.goodId = props.goodId;
        this.quantity = props.quantity;
        this.locationDescription = props.locationDescription;
        this.note = props.note;
    }
}
