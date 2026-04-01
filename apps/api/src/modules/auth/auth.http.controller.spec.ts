import { describe, it, expect, vi } from "vitest";
import type { CommandBus, QueryBus } from "@nestjs/cqrs";
import type { GetEmployeePermissionsResponse } from "../../shared/queries/get-employee-permissions.query.js";
import { AuthHttpController } from "./auth.http.controller.js";

describe("AuthHttpController", () => {
    function createController(overrides: { queryBusResult?: GetEmployeePermissionsResponse | null } = {}) {
        const commandBus = {} as CommandBus;
        const queryBus = {
            execute: vi.fn().mockResolvedValue(overrides.queryBusResult ?? null),
        } as unknown as QueryBus;

        const controller = new AuthHttpController(commandBus, queryBus);
        return { controller, queryBus };
    }

    describe("getPermissions", () => {
        it("returns effective permissions when query handler returns a result", async () => {
            const permissions = ["warehouse:view-goods", "sales:draft-order"];
            const { controller } = createController({
                queryBusResult: {
                    userId: "user-1",
                    effectivePermissions: permissions,
                    positionKeys: ["warehouse-worker"],
                },
            });

            const result = await controller.getPermissions({ userId: "user-1" });

            expect(result).toEqual({ permissions });
        });

        it("returns empty array when query handler returns null", async () => {
            const { controller } = createController({ queryBusResult: null });

            const result = await controller.getPermissions({ userId: "user-1" });

            expect(result).toEqual({ permissions: [] });
        });

        it("dispatches GetEmployeePermissionsQuery with the correct userId", async () => {
            const { controller, queryBus } = createController();
            const executeSpy = vi.spyOn(queryBus, "execute");

            await controller.getPermissions({ userId: "user-42" });

            expect(executeSpy).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ userId: "user-42" }));
        });
    });
});
