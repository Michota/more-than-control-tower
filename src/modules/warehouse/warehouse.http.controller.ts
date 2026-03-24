import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseArrayPipe,
    ParseUUIDPipe,
    Patch,
    Post,
    Query,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import type { UUID } from "crypto";
import { AddLineToGoodsReceiptCommand } from "./commands/add-line-to-goods-receipt/add-line-to-goods-receipt.command.js";
import { AddLineToGoodsReceiptRequestDto } from "./commands/add-line-to-goods-receipt/add-line-to-goods-receipt.request.dto.js";
import { ConfirmGoodsReceiptCommand } from "./commands/confirm-goods-receipt/confirm-goods-receipt.command.js";
import { CreateGoodCommand } from "./commands/create-good/create-good.command.js";
import { CreateGoodRequestDto } from "./commands/create-good/create-good.request.dto.js";
import { CreateWarehouseCommand } from "./commands/create-warehouse/create-warehouse.command.js";
import { CreateWarehouseRequestDto } from "./commands/create-warehouse/create-warehouse.request.dto.js";
import { OpenGoodsReceiptCommand } from "./commands/open-goods-receipt/open-goods-receipt.command.js";
import { OpenGoodsReceiptRequestDto } from "./commands/open-goods-receipt/open-goods-receipt.request.dto.js";
import { RemoveStockCommand } from "./commands/remove-stock/remove-stock.command.js";
import { RemoveStockRequestDto } from "./commands/remove-stock/remove-stock.request.dto.js";
import { TransferStockCommand } from "./commands/transfer-stock/transfer-stock.command.js";
import { TransferStockRequestDto } from "./commands/transfer-stock/transfer-stock.request.dto.js";
import { DeleteGoodsCommand } from "./commands/delete-goods/delete-goods.command.js";
import { EditGoodCommand } from "./commands/edit-good/edit-good.command.js";
import { EditGoodRequestDto } from "./commands/edit-good/edit-good.request.dto.js";
import { GetGoodQuery, GoodResponse } from "./queries/get-good/get-good.query.js";
import { ListGoodsQuery, ListGoodsResponse } from "./queries/list-goods/list-goods.query.js";
import { ListGoodsRequestDto } from "./queries/list-goods/list-goods.request.dto.js";
import { ListWarehousesQuery, ListWarehousesResponse } from "./queries/list-warehouses/list-warehouses.query.js";

@Controller("warehouse")
export class WarehouseHttpController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    @Get()
    async listWarehouses(): Promise<ListWarehousesResponse> {
        return this.queryBus.execute(new ListWarehousesQuery());
    }

    @Post()
    async createWarehouse(@Body() body: CreateWarehouseRequestDto): Promise<{ warehouseId: string }> {
        const warehouseId = await this.commandBus.execute(
            new CreateWarehouseCommand({
                name: body.name,
                latitude: body.latitude,
                longitude: body.longitude,
                address: body.address,
            }),
        );
        return { warehouseId };
    }

    @Get("goods")
    async listGoods(@Query() query: ListGoodsRequestDto): Promise<ListGoodsResponse> {
        return this.queryBus.execute(new ListGoodsQuery(query.name, query.page ?? 1, query.limit ?? 20));
    }

    @Get("goods/:id")
    async getGood(@Param("id", ParseUUIDPipe) id: UUID): Promise<GoodResponse> {
        return this.queryBus.execute(new GetGoodQuery(id));
    }

    @Delete("goods")
    async deleteGoods(
        @Query("ids", new ParseArrayPipe({ items: String, separator: "," })) ids: string[],
    ): Promise<void> {
        await this.commandBus.execute(new DeleteGoodsCommand({ goodIds: ids }));
    }

    @Patch("goods/:id")
    async editGood(@Param("id", ParseUUIDPipe) id: UUID, @Body() body: EditGoodRequestDto): Promise<void> {
        await this.commandBus.execute(
            new EditGoodCommand({
                goodId: id,
                name: body.name,
                description: body.description,
                weightValue: body.weightValue,
                weightUnit: body.weightUnit,
                dimensionLength: body.dimensionLength,
                dimensionWidth: body.dimensionWidth,
                dimensionHeight: body.dimensionHeight,
                dimensionUnit: body.dimensionUnit,
            }),
        );
    }

    @Post("goods")
    async createGood(@Body() body: CreateGoodRequestDto): Promise<{ goodId: string }> {
        const goodId = await this.commandBus.execute(
            new CreateGoodCommand({
                name: body.name,
                description: body.description,
                weightValue: body.weightValue,
                weightUnit: body.weightUnit,
                dimensionLength: body.dimensionLength,
                dimensionWidth: body.dimensionWidth,
                dimensionHeight: body.dimensionHeight,
                dimensionUnit: body.dimensionUnit,
                parentId: body.parentId,
            }),
        );
        return { goodId };
    }

    @Post("receipts")
    async openGoodsReceipt(@Body() body: OpenGoodsReceiptRequestDto): Promise<{ receiptId: string }> {
        const receiptId = await this.commandBus.execute(
            new OpenGoodsReceiptCommand({
                targetWarehouseId: body.targetWarehouseId,
                note: body.note,
            }),
        );
        return { receiptId };
    }

    @Post("receipts/:id/lines")
    async addLineToGoodsReceipt(
        @Param("id", ParseUUIDPipe) id: UUID,
        @Body() body: AddLineToGoodsReceiptRequestDto,
    ): Promise<void> {
        await this.commandBus.execute(
            new AddLineToGoodsReceiptCommand({
                receiptId: id,
                goodId: body.goodId,
                quantity: body.quantity,
                locationDescription: body.locationDescription,
                note: body.note,
            }),
        );
    }

    @Post("receipts/:id/confirm")
    async confirmGoodsReceipt(@Param("id", ParseUUIDPipe) id: UUID): Promise<void> {
        await this.commandBus.execute(new ConfirmGoodsReceiptCommand({ receiptId: id }));
    }

    @Post("stock/transfer")
    async transferStock(@Body() body: TransferStockRequestDto): Promise<void> {
        await this.commandBus.execute(
            new TransferStockCommand({
                goodId: body.goodId,
                fromWarehouseId: body.fromWarehouseId,
                toWarehouseId: body.toWarehouseId,
                quantity: body.quantity,
                locationDescription: body.locationDescription,
                note: body.note,
            }),
        );
    }

    @Post("stock/remove")
    async removeStock(@Body() body: RemoveStockRequestDto): Promise<void> {
        await this.commandBus.execute(
            new RemoveStockCommand({
                goodId: body.goodId,
                warehouseId: body.warehouseId,
                quantity: body.quantity,
                reason: body.reason,
                note: body.note,
            }),
        );
    }
}
