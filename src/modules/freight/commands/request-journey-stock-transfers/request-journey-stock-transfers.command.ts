import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export interface JourneyStockTransferItem {
    goodId: string;
    quantity: number;
    fromWarehouseId: string;
    note?: string;
}

export class RequestJourneyStockTransfersCommand extends Command<string[]> {
    readonly journeyId: string;
    readonly items: JourneyStockTransferItem[];

    constructor(props: CommandProps<RequestJourneyStockTransfersCommand>) {
        super(props);
        this.journeyId = props.journeyId;
        this.items = props.items;
    }
}
