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
import { RequirePermission } from "../../shared/auth/decorators/require-permission.decorator.js";
import { WarehousePermission } from "../../libs/permissions/index.js";
import type { UUID } from "crypto";
import { SetGoodsReceiptLinesCommand } from "./commands/set-goods-receipt-lines/set-goods-receipt-lines.command.js";
import { SetGoodsReceiptLinesRequestDto } from "./commands/set-goods-receipt-lines/set-goods-receipt-lines.request.dto.js";
import { ConfirmGoodsReceiptCommand } from "./commands/confirm-goods-receipt/confirm-goods-receipt.command.js";
import { CreateGoodCommand } from "./commands/create-good/create-good.command.js";
import { CreateGoodRequestDto } from "./commands/create-good/create-good.request.dto.js";
import { CreateWarehouseCommand } from "./commands/create-warehouse/create-warehouse.command.js";
import { CreateWarehouseRequestDto } from "./commands/create-warehouse/create-warehouse.request.dto.js";
import { EditWarehouseCommand } from "./commands/edit-warehouse/edit-warehouse.command.js";
import { EditWarehouseRequestDto } from "./commands/edit-warehouse/edit-warehouse.request.dto.js";
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
import { WarehouseIdResponseDto, WarehouseResponseDto } from "./dtos/warehouse.response.dto.js";
import { GetGoodQuery } from "./queries/get-good/get-good.query.js";
import { GetGoodsReceiptQuery } from "./queries/get-goods-receipt/get-goods-receipt.query.js";
import { ListGoodsQuery } from "./queries/list-goods/list-goods.query.js";
import { ListGoodsRequestDto } from "./queries/list-goods/list-goods.request.dto.js";
import { ListGoodsReceiptsQuery } from "./queries/list-goods-receipts/list-goods-receipts.query.js";
import { ListGoodsReceiptsRequestDto } from "./queries/list-goods-receipts/list-goods-receipts.request.dto.js";
import { ListWarehouseStockQuery } from "./queries/list-warehouse-stock/list-warehouse-stock.query.js";
import { ListWarehousesQuery } from "./queries/list-warehouses/list-warehouses.query.js";
import { CreateSectorCommand } from "./commands/create-sector/create-sector.command.js";
import { CreateSectorRequestDto } from "./commands/create-sector/create-sector.request.dto.js";
import { EditSectorCommand } from "./commands/edit-sector/edit-sector.command.js";
import { EditSectorRequestDto } from "./commands/edit-sector/edit-sector.request.dto.js";
import { MoveStockToSectorCommand } from "./commands/move-stock-to-sector/move-stock-to-sector.command.js";
import { MoveStockToSectorRequestDto } from "./commands/move-stock-to-sector/move-stock-to-sector.request.dto.js";
import { ListSectorsQuery } from "./queries/list-sectors/list-sectors.query.js";
import { GetSectorQuery } from "./queries/get-sector/get-sector.query.js";
import { GetSectorLoadQuery } from "./queries/get-sector-load/get-sector-load.query.js";
import {
    ActivateWarehouseCommand,
    DeactivateWarehouseCommand,
} from "./commands/change-warehouse-status/change-warehouse-status.command.js";
import {
    ActivateSectorCommand,
    DeactivateSectorCommand,
} from "./commands/change-sector-status/change-sector-status.command.js";
import { AttachCodeToGoodCommand } from "./commands/attach-code-to-good/attach-code-to-good.command.js";
import { AttachCodeToGoodRequestDto } from "./commands/attach-code-to-good/attach-code-to-good.request.dto.js";
import { DetachCodeFromGoodCommand } from "./commands/detach-code-from-good/detach-code-from-good.command.js";
import { FindGoodByCodeQuery } from "./queries/find-good-by-code/find-good-by-code.query.js";
import { ListCodesForGoodQuery } from "./queries/list-codes-for-good/list-codes-for-good.query.js";
import { CodeIdResponseDto, CodeResponseDto, FindGoodByCodeResponseDto } from "./dtos/code.response.dto.js";
import { ScanCodeQuery, type ScanCodeResponse } from "../../shared/queries/scan-code.query.js";
import { FulfillStockTransferRequestCommand } from "./commands/fulfill-stock-transfer-request/fulfill-stock-transfer-request.command.js";
import { CancelStockTransferRequestCommand } from "./commands/cancel-stock-transfer-request/cancel-stock-transfer-request.command.js";
import { RejectStockTransferRequestCommand } from "./commands/reject-stock-transfer-request/reject-stock-transfer-request.command.js";
import { RejectStockTransferRequestDto } from "./commands/reject-stock-transfer-request/reject-stock-transfer-request.request.dto.js";
import { ListStockTransferRequestsQuery } from "./queries/list-stock-transfer-requests/list-stock-transfer-requests.query.js";
import { ListStockTransferRequestsRequestDto } from "./queries/list-stock-transfer-requests/list-stock-transfer-requests.request.dto.js";
import { GetStockTransferRequestQuery } from "./queries/get-stock-transfer-request/get-stock-transfer-request.query.js";
import {
    PaginatedStockTransferRequestsResponseDto,
    StockTransferRequestResponseDto,
} from "./dtos/stock-transfer-request.response.dto.js";

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
    @ApiOperation({ summary: "List stock entries for a warehouse (with filtering, sorting, history toggle)" })
    @ApiResponse({ status: 200 })
    async listWarehouseStock(
        @Param("id", ParseUUIDPipe) id: UUID,
        @Query("includeHistory") includeHistory?: string,
        @Query("sectorId") sectorId?: string,
        @Query("goodName") goodName?: string,
        @Query("goodDescription") goodDescription?: string,
        @Query("sortBy") sortBy?: "name" | "receivedAt",
        @Query("sortDirection") sortDirection?: "asc" | "desc",
        @Query("attributeName") attributeName?: string,
        @Query("attributeValue") attributeValue?: string,
        @Query("attributeDateBefore") attributeDateBefore?: string,
    ) {
        return this.queryBus.execute(
            new ListWarehouseStockQuery({
                warehouseId: id,
                includeHistory: includeHistory === "true",
                sectorId,
                goodName,
                goodDescription,
                sortBy,
                sortDirection,
                attributeName,
                attributeValue,
                attributeDateBefore,
            }),
        );
    }

    @Post()
    @ApiOperation({ summary: "Create a new warehouse" })
    @ApiResponse({ status: 201, type: WarehouseIdResponseDto })
    async createWarehouse(@Body() body: CreateWarehouseRequestDto): Promise<WarehouseIdResponseDto> {
        const warehouseId = await this.commandBus.execute(
            new CreateWarehouseCommand({
                name: body.name,
                address: body.address,
                type: body.type,
            }),
        );
        return { warehouseId };
    }

    @Patch(":id")
    @ApiOperation({ summary: "Edit warehouse properties (partial update)" })
    @ApiResponse({ status: 200 })
    async editWarehouse(@Param("id", ParseUUIDPipe) id: UUID, @Body() body: EditWarehouseRequestDto): Promise<void> {
        await this.commandBus.execute(
            new EditWarehouseCommand({
                warehouseId: id,
                name: body.name,
                address: body.address,
            }),
        );
    }

    @Post(":id/activate")
    @ApiOperation({ summary: "Activate a warehouse" })
    @ApiResponse({ status: 200 })
    async activateWarehouse(@Param("id", ParseUUIDPipe) id: UUID): Promise<void> {
        await this.commandBus.execute(new ActivateWarehouseCommand({ warehouseId: id }));
    }

    @Post(":id/deactivate")
    @ApiOperation({ summary: "Deactivate a warehouse (only if it has no stock)" })
    @ApiResponse({ status: 200 })
    async deactivateWarehouse(@Param("id", ParseUUIDPipe) id: UUID): Promise<void> {
        await this.commandBus.execute(new DeactivateWarehouseCommand({ warehouseId: id }));
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

    @RequirePermission(WarehousePermission.CREATE_GOOD)
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

    // ─── Codes ───────────────────────────────────────────────

    @RequirePermission(WarehousePermission.VIEW_CODES)
    @Get("codes/lookup")
    @ApiOperation({ summary: "Find a good by scanning a code value" })
    @ApiQuery({ name: "value", description: "Code value to look up", example: "5901234123457" })
    @ApiResponse({ status: 200, type: FindGoodByCodeResponseDto })
    async findGoodByCode(@Query("value") value: string): Promise<FindGoodByCodeResponseDto> {
        return this.queryBus.execute(new FindGoodByCodeQuery(value));
    }

    @RequirePermission(WarehousePermission.VIEW_CODES)
    @Get("codes/scan")
    @ApiOperation({ summary: "Scan a code and resolve to a stock entry in a specific warehouse" })
    @ApiQuery({ name: "value", description: "Code value to scan", example: "5901234123457" })
    @ApiQuery({ name: "warehouseId", description: "Warehouse to look up stock in" })
    @ApiResponse({ status: 200 })
    async scanCode(
        @Query("value") value: string,
        @Query("warehouseId", ParseUUIDPipe) warehouseId: string,
    ): Promise<ScanCodeResponse> {
        return this.queryBus.execute<ScanCodeQuery, ScanCodeResponse>(new ScanCodeQuery(value, warehouseId));
    }

    @RequirePermission(WarehousePermission.VIEW_CODES)
    @Get("goods/:goodId/codes")
    @ApiOperation({ summary: "List all codes attached to a good" })
    @ApiResponse({ status: 200, type: [CodeResponseDto] })
    async listCodesForGood(@Param("goodId", ParseUUIDPipe) goodId: UUID): Promise<CodeResponseDto[]> {
        return this.queryBus.execute(new ListCodesForGoodQuery(goodId));
    }

    @RequirePermission(WarehousePermission.ATTACH_CODE)
    @Post("goods/:goodId/codes")
    @ApiOperation({ summary: "Attach a code (barcode, QR, etc.) to a good" })
    @ApiResponse({ status: 201, type: CodeIdResponseDto })
    async attachCodeToGood(
        @Param("goodId", ParseUUIDPipe) goodId: UUID,
        @Body() body: AttachCodeToGoodRequestDto,
    ): Promise<CodeIdResponseDto> {
        const codeId = await this.commandBus.execute(
            new AttachCodeToGoodCommand({
                goodId,
                type: body.type,
                value: body.value,
            }),
        );
        return { codeId };
    }

    @RequirePermission(WarehousePermission.DETACH_CODE)
    @Delete("goods/:goodId/codes/:codeId")
    @ApiOperation({ summary: "Detach a code from a good" })
    @ApiResponse({ status: 200 })
    async detachCodeFromGood(@Param("codeId", ParseUUIDPipe) codeId: UUID): Promise<void> {
        await this.commandBus.execute(new DetachCodeFromGoodCommand({ codeId }));
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

    // ─── Sectors ───────────────────────────────────────────────

    @Get(":warehouseId/sectors")
    @ApiOperation({ summary: "List sectors for a warehouse" })
    @ApiResponse({ status: 200 })
    async listSectors(@Param("warehouseId", ParseUUIDPipe) warehouseId: UUID) {
        return this.queryBus.execute(new ListSectorsQuery(warehouseId));
    }

    @Get("sectors/:id")
    @ApiOperation({ summary: "Get sector details" })
    @ApiResponse({ status: 200 })
    async getSector(@Param("id", ParseUUIDPipe) id: UUID) {
        return this.queryBus.execute(new GetSectorQuery(id));
    }

    @Get("sectors/:id/load")
    @ApiOperation({ summary: "Get sector load — current weight in grams and percentage of capacity" })
    @ApiResponse({ status: 200 })
    async getSectorLoad(@Param("id", ParseUUIDPipe) id: UUID) {
        return this.queryBus.execute(new GetSectorLoadQuery(id));
    }

    @Post(":warehouseId/sectors")
    @ApiOperation({ summary: "Create a sector in a warehouse" })
    @ApiResponse({ status: 201 })
    async createSector(
        @Param("warehouseId", ParseUUIDPipe) warehouseId: UUID,
        @Body() body: CreateSectorRequestDto,
    ): Promise<{ sectorId: string }> {
        const sectorId = await this.commandBus.execute(
            new CreateSectorCommand({
                warehouseId,
                name: body.name,
                description: body.description,
                dimensionLength: body.dimensionLength,
                dimensionWidth: body.dimensionWidth,
                dimensionHeight: body.dimensionHeight,
                dimensionUnit: body.dimensionUnit,
                capabilities: body.capabilities,
                weightCapacityGrams: body.weightCapacityGrams,
            }),
        );
        return { sectorId };
    }

    @Patch("sectors/:id")
    @ApiOperation({ summary: "Edit sector properties (partial update)" })
    @ApiResponse({ status: 200 })
    async editSector(@Param("id", ParseUUIDPipe) id: UUID, @Body() body: EditSectorRequestDto): Promise<void> {
        await this.commandBus.execute(
            new EditSectorCommand({
                sectorId: id,
                name: body.name,
                description: body.description,
                dimensionLength: body.dimensionLength,
                dimensionWidth: body.dimensionWidth,
                dimensionHeight: body.dimensionHeight,
                dimensionUnit: body.dimensionUnit,
                capabilities: body.capabilities,
            }),
        );
    }

    @Post("sectors/:id/activate")
    @ApiOperation({ summary: "Activate a sector" })
    @ApiResponse({ status: 200 })
    async activateSector(@Param("id", ParseUUIDPipe) id: UUID): Promise<void> {
        await this.commandBus.execute(new ActivateSectorCommand({ sectorId: id }));
    }

    @Post("sectors/:id/deactivate")
    @ApiOperation({ summary: "Deactivate a sector" })
    @ApiResponse({ status: 200 })
    async deactivateSector(@Param("id", ParseUUIDPipe) id: UUID): Promise<void> {
        await this.commandBus.execute(new DeactivateSectorCommand({ sectorId: id }));
    }

    // ─── Transfer Requests ────────────────────────────────────

    @RequirePermission(WarehousePermission.VIEW_TRANSFER_REQUESTS)
    @Get("transfer-requests")
    @ApiOperation({ summary: "List stock transfer requests (filterable by status, warehouse)" })
    @ApiResponse({ status: 200, type: PaginatedStockTransferRequestsResponseDto })
    async listTransferRequests(
        @Query() query: ListStockTransferRequestsRequestDto,
    ): Promise<PaginatedStockTransferRequestsResponseDto> {
        return this.queryBus.execute(
            new ListStockTransferRequestsQuery(
                query.status,
                query.fromWarehouseId,
                query.toWarehouseId,
                query.page ?? 1,
                query.limit ?? 20,
            ),
        );
    }

    @RequirePermission(WarehousePermission.VIEW_TRANSFER_REQUESTS)
    @Get("transfer-requests/:id")
    @ApiOperation({ summary: "Get stock transfer request details" })
    @ApiResponse({ status: 200, type: StockTransferRequestResponseDto })
    async getTransferRequest(@Param("id", ParseUUIDPipe) id: UUID): Promise<StockTransferRequestResponseDto> {
        return this.queryBus.execute(new GetStockTransferRequestQuery(id));
    }

    @RequirePermission(WarehousePermission.FULFILL_TRANSFER_REQUEST)
    @Post("transfer-requests/:id/fulfill")
    @ApiOperation({ summary: "Fulfill a pending transfer request (triggers actual stock transfer)" })
    @ApiResponse({ status: 200 })
    async fulfillTransferRequest(@Param("id", ParseUUIDPipe) id: UUID): Promise<void> {
        await this.commandBus.execute(new FulfillStockTransferRequestCommand({ requestId: id }));
    }

    @RequirePermission(WarehousePermission.CANCEL_TRANSFER_REQUEST)
    @Post("transfer-requests/:id/cancel")
    @ApiOperation({ summary: "Cancel a pending transfer request" })
    @ApiResponse({ status: 200 })
    async cancelTransferRequest(@Param("id", ParseUUIDPipe) id: UUID): Promise<void> {
        await this.commandBus.execute(new CancelStockTransferRequestCommand({ requestId: id }));
    }

    @RequirePermission(WarehousePermission.REJECT_TRANSFER_REQUEST)
    @Post("transfer-requests/:id/reject")
    @ApiOperation({ summary: "Reject a pending transfer request with a reason" })
    @ApiResponse({ status: 200 })
    async rejectTransferRequest(
        @Param("id", ParseUUIDPipe) id: UUID,
        @Body() body: RejectStockTransferRequestDto,
    ): Promise<void> {
        await this.commandBus.execute(new RejectStockTransferRequestCommand({ requestId: id, reason: body.reason }));
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
                sectorId: body.sectorId,
                note: body.note,
            }),
        );
    }

    @Post("stock/move-sector")
    @ApiOperation({ summary: "Move stock to a different sector within the same warehouse" })
    @ApiResponse({ status: 200 })
    async moveStockToSector(@Body() body: MoveStockToSectorRequestDto): Promise<void> {
        await this.commandBus.execute(
            new MoveStockToSectorCommand({
                goodId: body.goodId,
                warehouseId: body.warehouseId,
                sectorId: body.sectorId,
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
