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
    Put,
    Query,
} from "@nestjs/common";
import { CommandBus, QueryBus } from "@nestjs/cqrs";
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { UUID } from "crypto";
import { SetGoodsReceiptLinesCommand } from "./commands/set-goods-receipt-lines/set-goods-receipt-lines.command.js";
import { SetGoodsReceiptLinesRequestDto } from "./commands/set-goods-receipt-lines/set-goods-receipt-lines.request.dto.js";
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
import { DeleteGoodsReceiptCommand } from "./commands/delete-goods-receipt/delete-goods-receipt.command.js";
import { EditGoodCommand } from "./commands/edit-good/edit-good.command.js";
import { EditGoodRequestDto } from "./commands/edit-good/edit-good.request.dto.js";
import { GoodIdResponseDto, GoodResponseDto, PaginatedGoodsResponseDto } from "./dtos/good.response.dto.js";
import {
    GoodsReceiptResponseDto,
    PaginatedGoodsReceiptsResponseDto,
    ReceiptIdResponseDto,
} from "./dtos/goods-receipt.response.dto.js";
import { WarehouseStockItemResponseDto } from "./dtos/stock.response.dto.js";
import { WarehouseIdResponseDto, WarehouseResponseDto } from "./dtos/warehouse.response.dto.js";
import { GetGoodQuery } from "./queries/get-good/get-good.query.js";
import { GetGoodsReceiptQuery } from "./queries/get-goods-receipt/get-goods-receipt.query.js";
import { ListGoodsQuery } from "./queries/list-goods/list-goods.query.js";
import { ListGoodsRequestDto } from "./queries/list-goods/list-goods.request.dto.js";
import { ListGoodsReceiptsQuery } from "./queries/list-goods-receipts/list-goods-receipts.query.js";
import { ListGoodsReceiptsRequestDto } from "./queries/list-goods-receipts/list-goods-receipts.request.dto.js";
import { ListWarehouseStockQuery } from "./queries/list-warehouse-stock/list-warehouse-stock.query.js";
import { ListWarehousesQuery } from "./queries/list-warehouses/list-warehouses.query.js";

@ApiTags("Warehouse")
@Controller("warehouse")
export class WarehouseHttpController {
    constructor(
        private readonly commandBus: CommandBus,
        private readonly queryBus: QueryBus,
    ) {}

    // ─── Warehouses ──────────────────────────────────────────

    @Get()
    @ApiOperation({ summary: "List all warehouses" })
    @ApiResponse({ status: 200, type: [WarehouseResponseDto] })
    async listWarehouses(): Promise<WarehouseResponseDto[]> {
        return this.queryBus.execute(new ListWarehousesQuery());
    }

    @Get(":id/stock")
    @ApiOperation({ summary: "List stock entries for a warehouse" })
    @ApiResponse({ status: 200, type: [WarehouseStockItemResponseDto] })
    async listWarehouseStock(@Param("id", ParseUUIDPipe) id: UUID): Promise<WarehouseStockItemResponseDto[]> {
        return this.queryBus.execute(new ListWarehouseStockQuery(id));
    }

    @Post()
    @ApiOperation({ summary: "Create a new warehouse" })
    @ApiResponse({ status: 201, type: WarehouseIdResponseDto })
    async createWarehouse(@Body() body: CreateWarehouseRequestDto): Promise<WarehouseIdResponseDto> {
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

    // ─── Goods ───────────────────────────────────────────────

    @Get("goods")
    @ApiOperation({ summary: "List goods (paginated, with optional name search)" })
    @ApiResponse({ status: 200, type: PaginatedGoodsResponseDto })
    async listGoods(@Query() query: ListGoodsRequestDto): Promise<PaginatedGoodsResponseDto> {
        return this.queryBus.execute(new ListGoodsQuery(query.name, query.page ?? 1, query.limit ?? 20));
    }

    @Get("goods/:id")
    @ApiOperation({ summary: "Get good details by ID" })
    @ApiResponse({ status: 200, type: GoodResponseDto })
    async getGood(@Param("id", ParseUUIDPipe) id: UUID): Promise<GoodResponseDto> {
        return this.queryBus.execute(new GetGoodQuery(id));
    }

    @Delete("goods")
    @ApiOperation({ summary: "Delete goods by IDs" })
    @ApiQuery({ name: "ids", description: "Comma-separated UUIDs", example: "uuid1,uuid2" })
    @ApiResponse({ status: 200 })
    async deleteGoods(
        @Query("ids", new ParseArrayPipe({ items: String, separator: "," })) ids: string[],
    ): Promise<void> {
        await this.commandBus.execute(new DeleteGoodsCommand({ goodIds: ids }));
    }

    @Patch("goods/:id")
    @ApiOperation({ summary: "Edit good properties (partial update)" })
    @ApiResponse({ status: 200 })
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
    @ApiOperation({ summary: "Create a new good (type catalog entry)" })
    @ApiResponse({ status: 201, type: GoodIdResponseDto })
    async createGood(@Body() body: CreateGoodRequestDto): Promise<GoodIdResponseDto> {
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

    // ─── Goods Receipts ──────────────────────────────────────

    @Get("receipts")
    @ApiOperation({ summary: "List goods receipts (paginated)" })
    @ApiResponse({ status: 200, type: PaginatedGoodsReceiptsResponseDto })
    async listGoodsReceipts(@Query() query: ListGoodsReceiptsRequestDto): Promise<PaginatedGoodsReceiptsResponseDto> {
        return this.queryBus.execute(new ListGoodsReceiptsQuery(query.page ?? 1, query.limit ?? 20));
    }

    @Get("receipts/:id")
    @ApiOperation({ summary: "Get goods receipt details with lines" })
    @ApiResponse({ status: 200, type: GoodsReceiptResponseDto })
    async getGoodsReceipt(@Param("id", ParseUUIDPipe) id: UUID): Promise<GoodsReceiptResponseDto> {
        return this.queryBus.execute(new GetGoodsReceiptQuery(id));
    }

    @Delete("receipts/:id")
    @ApiOperation({ summary: "Delete a goods receipt" })
    @ApiResponse({ status: 200 })
    async deleteGoodsReceipt(@Param("id", ParseUUIDPipe) id: UUID): Promise<void> {
        await this.commandBus.execute(new DeleteGoodsReceiptCommand({ receiptId: id }));
    }

    @Post("receipts")
    @ApiOperation({ summary: "Open a new goods receipt (DRAFT status)" })
    @ApiResponse({ status: 201, type: ReceiptIdResponseDto })
    async openGoodsReceipt(@Body() body: OpenGoodsReceiptRequestDto): Promise<ReceiptIdResponseDto> {
        const receiptId = await this.commandBus.execute(
            new OpenGoodsReceiptCommand({
                targetWarehouseId: body.targetWarehouseId,
                note: body.note,
            }),
        );
        return { receiptId };
    }

    @Put("receipts/:id/lines")
    @ApiOperation({ summary: "Replace all lines on a receipt (only while DRAFT)" })
    @ApiResponse({ status: 200 })
    async setGoodsReceiptLines(
        @Param("id", ParseUUIDPipe) id: UUID,
        @Body() body: SetGoodsReceiptLinesRequestDto,
    ): Promise<void> {
        await this.commandBus.execute(
            new SetGoodsReceiptLinesCommand({
                receiptId: id,
                lines: body.lines,
            }),
        );
    }

    @Post("receipts/:id/confirm")
    @ApiOperation({ summary: "Confirm a receipt (DRAFT → CONFIRMED, creates stock entries)" })
    @ApiResponse({ status: 200 })
    async confirmGoodsReceipt(@Param("id", ParseUUIDPipe) id: UUID): Promise<void> {
        await this.commandBus.execute(new ConfirmGoodsReceiptCommand({ receiptId: id }));
    }

    // ─── Stock Operations ────────────────────────────────────

    @Post("stock/transfer")
    @ApiOperation({ summary: "Transfer stock between warehouses" })
    @ApiResponse({ status: 200 })
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
    @ApiOperation({ summary: "Remove stock from a warehouse (sale, damage, etc.)" })
    @ApiResponse({ status: 200 })
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
