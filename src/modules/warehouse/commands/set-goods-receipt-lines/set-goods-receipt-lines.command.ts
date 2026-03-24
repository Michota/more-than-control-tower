import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export interface GoodsReceiptLineInput {
    goodId: string;
    quantity: number;
    sectorId?: string;
    note?: string;
}

export class SetGoodsReceiptLinesCommand extends Command<void> {
    readonly receiptId: string;
    readonly lines: GoodsReceiptLineInput[];

    constructor(props: CommandProps<SetGoodsReceiptLinesCommand>) {
        super(props);
        this.receiptId = props.receiptId;
        this.lines = props.lines;
    }
}
