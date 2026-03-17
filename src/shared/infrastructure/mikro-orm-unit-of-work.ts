import { Injectable } from "@nestjs/common";
import { EntityManager } from "@mikro-orm/core";
import { UnitOfWorkPort } from "../ports/unit-of-work.port.js";

@Injectable()
export class MikroOrmUnitOfWork implements UnitOfWorkPort {
    constructor(private readonly em: EntityManager) {}

    async commit(): Promise<void> {
        await this.em.flush();
    }
}
