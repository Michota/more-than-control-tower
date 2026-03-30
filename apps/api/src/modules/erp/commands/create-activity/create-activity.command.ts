import { Command, CommandProps } from "../../../../libs/cqrs/command.js";

export class CreateActivityCommand extends Command<string> {
    readonly name: string;
    readonly description?: string;

    constructor(props: CommandProps<CreateActivityCommand>) {
        super(props);
        this.name = props.name;
        this.description = props.description;
    }
}
