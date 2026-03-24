import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class TransferGoodCommand extends Command<void> {
    readonly goodId: string;
    readonly toWarehouseId: string;
    readonly locationDescription: string;
    readonly note?: string;

    constructor(props: CommandProps<TransferGoodCommand>) {
        super(props);
        this.goodId = props.goodId;
        this.toWarehouseId = props.toWarehouseId;
        this.locationDescription = props.locationDescription;
        this.note = props.note;
    }
}
