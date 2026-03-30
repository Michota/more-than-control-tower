import { Command, CommandProps } from "../../../../libs/cqrs/command.js";
import { DimensionUnit } from "../../domain/good-dimensions.value-object.js";
import { WeightUnit } from "../../domain/good-weight.value-object.js";

export class EditGoodCommand extends Command<void> {
    readonly goodId: string;
    readonly name?: string;
    readonly description?: string;
    readonly weightValue?: number;
    readonly weightUnit?: WeightUnit;
    readonly dimensionLength?: number;
    readonly dimensionWidth?: number;
    readonly dimensionHeight?: number;
    readonly dimensionUnit?: DimensionUnit;

    constructor(props: CommandProps<EditGoodCommand>) {
        super(props);
        this.goodId = props.goodId;
        this.name = props.name;
        this.description = props.description;
        this.weightValue = props.weightValue;
        this.weightUnit = props.weightUnit;
        this.dimensionLength = props.dimensionLength;
        this.dimensionWidth = props.dimensionWidth;
        this.dimensionHeight = props.dimensionHeight;
        this.dimensionUnit = props.dimensionUnit;
    }
}
