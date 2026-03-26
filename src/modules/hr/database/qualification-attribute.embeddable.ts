import { defineEntity, p } from "@mikro-orm/core";

const QualificationAttributeSchema = defineEntity({
    name: "QualificationAttribute",
    embeddable: true,
    properties: {
        key: p.string(),
        type: p.string(),
        value: p.string(),
    },
});

class QualificationAttribute extends QualificationAttributeSchema.class {}

QualificationAttributeSchema.setClass(QualificationAttribute);

export { QualificationAttribute, QualificationAttributeSchema };
