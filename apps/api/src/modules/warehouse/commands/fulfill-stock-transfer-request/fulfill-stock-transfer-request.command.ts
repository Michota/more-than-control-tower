import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class FulfillStockTransferRequestCommand extends Command<void> {
    readonly requestId: string;

    constructor(props: CommandProps<FulfillStockTransferRequestCommand>) {
        super(props);
        this.requestId = props.requestId;
    }
}
