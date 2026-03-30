import { defineEntity, p } from "@mikro-orm/core";

const ActivitySchema = defineEntity({
    name: "Activity",
    tableName: "activity",
    properties: {
        id: p.uuid().primary(),
        name: p.string(),
        description: p.string().nullable(),
    },
});

class Activity extends ActivitySchema.class {}

ActivitySchema.setClass(Activity);

export { Activity, ActivitySchema };
