import { Command, CommandProps } from "../../libs/cqrs/command.js";

/**
 * Cancels all PENDING stock transfer requests matching the given requestedBy value.
 * Used when the requester (e.g. a freight journey) no longer needs the transfers.
 */
export class CancelTransferRequestsByRequesterCommand extends Command<void> {
    readonly requestedBy: string;

    constructor(props: CommandProps<CancelTransferRequestsByRequesterCommand>) {
        super(props);
        this.requestedBy = props.requestedBy;
    }
}
