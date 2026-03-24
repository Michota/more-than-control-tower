import { Body, Controller, Param, ParseUUIDPipe, Post, Put } from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import type { UUID } from "crypto";
import { ReceiveGoodCommand } from "./commands/receive-good/receive-good.command.js";
import { ReceiveGoodRequestDto } from "./commands/receive-good/receive-good.request.dto.js";
import { RemoveGoodFromWarehouseCommand } from "./commands/remove-good-from-warehouse/remove-good-from-warehouse.command.js";
import { RemoveGoodFromWarehouseRequestDto } from "./commands/remove-good-from-warehouse/remove-good-from-warehouse.request.dto.js";
import { TransferGoodCommand } from "./commands/transfer-good/transfer-good.command.js";
import { TransferGoodRequestDto } from "./commands/transfer-good/transfer-good.request.dto.js";

@Controller("warehouse/goods")
export class WarehouseHttpController {
    constructor(private readonly commandBus: CommandBus) {}

    @Post()
    async receiveGood(@Body() body: ReceiveGoodRequestDto): Promise<{ goodId: string }> {
        const goodId = await this.commandBus.execute(
            new ReceiveGoodCommand({
                name: body.name,
                description: body.description,
                weightValue: body.weightValue,
                weightUnit: body.weightUnit,
                dimensionLength: body.dimensionLength,
                dimensionWidth: body.dimensionWidth,
                dimensionHeight: body.dimensionHeight,
                dimensionUnit: body.dimensionUnit,
                warehouseId: body.warehouseId,
                locationDescription: body.locationDescription,
                note: body.note,
            }),
        );
        return { goodId };
    }

    @Put(":id/transfer")
    async transferGood(@Param("id", ParseUUIDPipe) id: UUID, @Body() body: TransferGoodRequestDto): Promise<void> {
        await this.commandBus.execute(
            new TransferGoodCommand({
                goodId: id,
                toWarehouseId: body.toWarehouseId,
                locationDescription: body.locationDescription,
                note: body.note,
            }),
        );
    }

    @Put(":id/remove")
    async removeFromWarehouse(
        @Param("id", ParseUUIDPipe) id: UUID,
        @Body() body: RemoveGoodFromWarehouseRequestDto,
    ): Promise<void> {
        await this.commandBus.execute(
            new RemoveGoodFromWarehouseCommand({
                goodId: id,
                reason: body.reason,
                note: body.note,
            }),
        );
    }
}
