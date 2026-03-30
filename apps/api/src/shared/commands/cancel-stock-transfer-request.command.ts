import { Command, CommandProps } from "../../libs/cqrs/command.js";

export class CancelStockTransferRequestCommand extends Command<void> {
    readonly requestId: string;

    constructor(props: CommandProps<CancelStockTransferRequestCommand>) {
        super(props);
        this.requestId = props.requestId;
    }
}
