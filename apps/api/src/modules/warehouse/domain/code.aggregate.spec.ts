import { CodeAggregate } from "./code.aggregate.js";
import { CodeType } from "./code-type.enum.js";
import { uuidRegex } from "../../../shared/utils/uuid-regex.js";
import { randomUUID } from "crypto";
import { generateEntityId } from "../../../libs/ddd/utils/randomize-entity-id.js";

describe("CodeAggregate", () => {
    const validGoodId = randomUUID();

    describe("create()", () => {
        it("creates a code with all properties", () => {
            const code = CodeAggregate.create({
                goodId: validGoodId,
                type: CodeType.EAN_13,
                value: "5901234123457",
            });

            expect(code).toBeInstanceOf(CodeAggregate);
            expect(code.id).toMatch(uuidRegex);
            expect(code.goodId).toEqual(validGoodId);
            expect(code.type).toEqual(CodeType.EAN_13);
            expect(code.value).toEqual("5901234123457");
        });

        it("creates codes with different types", () => {
            const types = [
                CodeType.EAN_13,
                CodeType.EAN_8,
                CodeType.UPC_A,
                CodeType.UPC_E,
                CodeType.QR,
                CodeType.CODE_128,
                CodeType.CODE_39,
                CodeType.ITF_14,
                CodeType.INTERNAL,
            ];

            for (const type of types) {
                const code = CodeAggregate.create({
                    goodId: validGoodId,
                    type,
                    value: `test-${type}`,
                });
                expect(code.type).toEqual(type);
            }
        });

        it("throws when value is empty", () => {
            expect(() =>
                CodeAggregate.create({
                    goodId: validGoodId,
                    type: CodeType.EAN_13,
                    value: "",
                }),
            ).toThrow();
        });

        it("throws when goodId is not a valid UUID", () => {
            expect(() =>
                CodeAggregate.create({
                    goodId: "not-a-uuid",
                    type: CodeType.EAN_13,
                    value: "5901234123457",
                }),
            ).toThrow();
        });

        it("throws when type is not a valid CodeType", () => {
            expect(() =>
                CodeAggregate.create({
                    goodId: validGoodId,
                    type: "INVALID" as CodeType,
                    value: "5901234123457",
                }),
            ).toThrow();
        });
    });

    describe("reconstitute()", () => {
        it("reconstitutes a code from persisted data", () => {
            const id = generateEntityId();
            const code = CodeAggregate.reconstitute({
                id,
                properties: {
                    goodId: validGoodId,
                    type: CodeType.QR,
                    value: "https://example.com/product/123",
                },
            });

            expect(code.id).toEqual(id);
            expect(code.goodId).toEqual(validGoodId);
            expect(code.type).toEqual(CodeType.QR);
            expect(code.value).toEqual("https://example.com/product/123");
        });
    });
});
