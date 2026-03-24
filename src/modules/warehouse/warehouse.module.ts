import { EntityManager } from "@mikro-orm/core";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { Module } from "@nestjs/common";
import { MikroOrmUnitOfWork } from "../../shared/infrastructure/mikro-orm-unit-of-work.js";
import { UNIT_OF_WORK_PORT } from "../../shared/ports/tokens.js";
import { ReceiveGoodCommandHandler } from "./commands/receive-good/receive-good.command-handler.js";
import { RemoveGoodFromWarehouseCommandHandler } from "./commands/remove-good-from-warehouse/remove-good-from-warehouse.command-handler.js";
import { TransferGoodCommandHandler } from "./commands/transfer-good/transfer-good.command-handler.js";
import { Good } from "./database/good.entity.js";
import { GoodMapper } from "./database/good.mapper.js";
import { GoodRepository } from "./database/good.repository.js";
import { GOOD_REPOSITORY_PORT } from "./warehouse.di-tokens.js";
import { WarehouseHttpController } from "./warehouse.http.controller.js";

@Module({
    imports: [MikroOrmModule.forFeature([Good])],
    controllers: [WarehouseHttpController],
    providers: [
        GoodMapper,
        ReceiveGoodCommandHandler,
        TransferGoodCommandHandler,
        RemoveGoodFromWarehouseCommandHandler,
        {
            provide: GOOD_REPOSITORY_PORT,
            useFactory: (em: EntityManager) => new GoodRepository(em),
            inject: [EntityManager],
        },
        {
            provide: UNIT_OF_WORK_PORT,
            useFactory: (em: EntityManager) => new MikroOrmUnitOfWork(em),
            inject: [EntityManager],
        },
    ],
})
export class WarehouseModule {}
