import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class TransferStockCommand extends Command<void> {
    readonly goodId: string;
    readonly fromWarehouseId: string;
    readonly toWarehouseId: string;
    readonly quantity: number;
    readonly locationDescription?: string;
    readonly sectorId?: string;
    readonly note?: string;

    constructor(props: CommandProps<TransferStockCommand>) {
        super(props);
        this.goodId = props.goodId;
        this.fromWarehouseId = props.fromWarehouseId;
        this.toWarehouseId = props.toWarehouseId;
        this.quantity = props.quantity;
        this.locationDescription = props.locationDescription;
        this.sectorId = props.sectorId;
        this.note = props.note;
    }
}
