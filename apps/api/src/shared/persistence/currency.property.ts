import { p } from "@mikro-orm/core";

export const currency = p.string().length(3);
