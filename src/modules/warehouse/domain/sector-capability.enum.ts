/**
 * Qualitative features of a sector — what special handling or
 * environmental conditions the sector provides. These are not
 * quantitative capacity values (those are dimensions + weightCapacityGrams).
 */
export enum SectorCapability {
    GENERAL = "GENERAL",
    COLD_STORAGE = "COLD_STORAGE",
    HAZARDOUS = "HAZARDOUS",
    FRAGILE = "FRAGILE",
    HEAVY = "HEAVY",
}
