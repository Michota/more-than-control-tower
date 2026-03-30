import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class CreateRouteCommand extends Command<string> {
    readonly name: string;

    constructor(props: CommandProps<CreateRouteCommand>) {
        super(props);
        this.name = props.name;
    }
}
