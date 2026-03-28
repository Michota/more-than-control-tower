import { defineEntity, p } from "@mikro-orm/core";

const CodeSchema = defineEntity({
    name: "Code",
    tableName: "code",
    properties: {
        id: p.uuid().primary(),
        goodId: p.uuid(),
        type: p.string(),
        value: p.string().unique(),
    },
});

class Code extends CodeSchema.class {}

CodeSchema.setClass(Code);

export { Code, CodeSchema };
