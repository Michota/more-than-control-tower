import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class DeleteGoodsCommand extends Command<void> {
    readonly goodIds: string[];

    constructor(props: CommandProps<DeleteGoodsCommand>) {
        super(props);
        this.goodIds = props.goodIds;
    }
}
