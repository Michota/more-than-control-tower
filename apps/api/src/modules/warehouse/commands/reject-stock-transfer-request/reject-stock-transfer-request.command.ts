import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class RejectStockTransferRequestCommand extends Command<void> {
    readonly requestId: string;
    readonly reason: string;

    constructor(props: CommandProps<RejectStockTransferRequestCommand>) {
        super(props);
        this.requestId = props.requestId;
        this.reason = props.reason;
    }
}
