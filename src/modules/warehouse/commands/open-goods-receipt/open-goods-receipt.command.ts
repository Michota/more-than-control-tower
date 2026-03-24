import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class OpenGoodsReceiptCommand extends Command<string> {
    readonly targetWarehouseId: string;
    readonly note?: string;

    constructor(props: CommandProps<OpenGoodsReceiptCommand>) {
        super(props);
        this.targetWarehouseId = props.targetWarehouseId;
        this.note = props.note;
    }
}
