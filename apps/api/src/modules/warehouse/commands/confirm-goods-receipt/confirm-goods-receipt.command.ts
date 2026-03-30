import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class ConfirmGoodsReceiptCommand extends Command<void> {
    readonly receiptId: string;

    constructor(props: CommandProps<ConfirmGoodsReceiptCommand>) {
        super(props);
        this.receiptId = props.receiptId;
    }
}
