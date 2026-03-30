import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class MoveStockToSectorCommand extends Command<void> {
    readonly goodId: string;
    readonly warehouseId: string;
    readonly sectorId?: string;
    readonly note?: string;

    constructor(props: CommandProps<MoveStockToSectorCommand>) {
        super(props);
        this.goodId = props.goodId;
        this.warehouseId = props.warehouseId;
        this.sectorId = props.sectorId;
        this.note = props.note;
    }
}
