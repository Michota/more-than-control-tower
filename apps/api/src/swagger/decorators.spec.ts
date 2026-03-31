import "reflect-metadata";
import { DECORATORS } from "@nestjs/swagger/dist/constants.js";
import { ApiEnum, ApiBrandedProperty } from "./decorators.js";

function getPropertyMetadata(target: object, propertyKey: string) {
    return Reflect.getMetadata(DECORATORS.API_MODEL_PROPERTIES, target, propertyKey) as Record<string, unknown>;
}

describe("ApiEnum", () => {
    enum StringStatus {
        Active = "active",
        Inactive = "inactive",
    }

    enum NumericPriority {
        Low = 0,
        Medium = 1,
        High = 2,
    }

    it("sets enum and auto-generated description for string enums", () => {
        class Dto {
            @ApiEnum(StringStatus)
            status!: StringStatus;
        }

        const meta = getPropertyMetadata(Dto.prototype, "status");

        expect(meta.enum).toEqual(["active", "inactive"]);
        expect(meta.description).toBe("Active: active, Inactive: inactive");
    });

    it("appends user-provided description after enum values", () => {
        class Dto {
            @ApiEnum(StringStatus, { description: "Current status of the entity" })
            status!: StringStatus;
        }

        const meta = getPropertyMetadata(Dto.prototype, "status");

        expect(meta.description).toBe("Active: active, Inactive: inactive. Current status of the entity");
    });

    it("filters out reverse-mapped numeric enum keys", () => {
        class Dto {
            @ApiEnum(NumericPriority)
            priority!: NumericPriority;
        }

        const meta = getPropertyMetadata(Dto.prototype, "priority");

        expect(meta.description).toBe("Low: 0, Medium: 1, High: 2");
    });

    it("passes through additional ApiPropertyOptions", () => {
        class Dto {
            @ApiEnum(StringStatus, { required: false, example: "active" })
            status!: StringStatus;
        }

        const meta = getPropertyMetadata(Dto.prototype, "status");

        expect(meta.required).toBe(false);
        expect(meta.example).toBe("active");
    });
});

describe("ApiBrandedProperty", () => {
    it("resolves design:type from metadata and sets it on ApiProperty", () => {
        class Dto {
            @ApiBrandedProperty()
            name!: string;
        }

        const meta = getPropertyMetadata(Dto.prototype, "name");

        expect(meta.type).toBe(String);
    });

    it("passes through additional options", () => {
        class Dto {
            @ApiBrandedProperty({ description: "Unique identifier", example: "abc-123" })
            id!: string;
        }

        const meta = getPropertyMetadata(Dto.prototype, "id");

        expect(meta.description).toBe("Unique identifier");
        expect(meta.example).toBe("abc-123");
    });

    it("falls back to Object when no design:type metadata exists", () => {
        class Dto {
            name!: string;
        }

        ApiBrandedProperty()(Dto.prototype, "name");

        const meta = getPropertyMetadata(Dto.prototype, "name");

        expect(meta.type).toBe(Object);
    });
});
