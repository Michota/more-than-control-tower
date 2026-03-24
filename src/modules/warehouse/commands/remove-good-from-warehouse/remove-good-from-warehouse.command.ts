import { Command, CommandProps } from "../../../../libs/cqrs/command.js";
import { GoodRemovalReason } from "../../domain/good-removal-reason.enum.js";

export class RemoveGoodFromWarehouseCommand extends Command<void> {
    readonly goodId: string;
    readonly reason: GoodRemovalReason;
    readonly note?: string;

    constructor(props: CommandProps<RemoveGoodFromWarehouseCommand>) {
        super(props);
        this.goodId = props.goodId;
        this.reason = props.reason;
        this.note = props.note;
    }
}
