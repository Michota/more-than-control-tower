export const AvailabilityEntryStatus = {
    PENDING_APPROVAL: "pending_approval",
    CONFIRMED: "confirmed",
} as const;

export type AvailabilityEntryStatus = (typeof AvailabilityEntryStatus)[keyof typeof AvailabilityEntryStatus];
