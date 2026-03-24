import { Command, CommandProps } from "../../../../libs/cqrs/command.js";
import { DimensionUnit } from "../../domain/good-dimensions.value-object.js";
import { SectorCapability } from "../../domain/sector-capability.enum.js";

export class EditSectorCommand extends Command<void> {
    readonly sectorId: string;
    readonly name?: string;
    readonly description?: string;
    readonly dimensionLength?: number;
    readonly dimensionWidth?: number;
    readonly dimensionHeight?: number;
    readonly dimensionUnit?: DimensionUnit;
    readonly capabilities?: SectorCapability[];

    constructor(props: CommandProps<EditSectorCommand>) {
        super(props);
        this.sectorId = props.sectorId;
        this.name = props.name;
        this.description = props.description;
        this.dimensionLength = props.dimensionLength;
        this.dimensionWidth = props.dimensionWidth;
        this.dimensionHeight = props.dimensionHeight;
        this.dimensionUnit = props.dimensionUnit;
        this.capabilities = props.capabilities;
    }
}
