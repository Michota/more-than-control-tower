import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class DeleteGoodsReceiptCommand extends Command<void> {
    readonly receiptId: string;

    constructor(props: CommandProps<DeleteGoodsReceiptCommand>) {
        super(props);
        this.receiptId = props.receiptId;
    }
}
