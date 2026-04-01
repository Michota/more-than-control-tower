import { DriverLicenseCategory } from "./driver-license-category.enum.js";
import { FreightPermission } from "../../../libs/permissions/index.js";

const LICENSE_TO_PERMISSION: Record<DriverLicenseCategory, FreightPermission> = {
    [DriverLicenseCategory.B]: FreightPermission.DRIVER_LICENSE_B,
    [DriverLicenseCategory.C]: FreightPermission.DRIVER_LICENSE_C,
    [DriverLicenseCategory.C_E]: FreightPermission.DRIVER_LICENSE_C_E,
};

export function licenseToPermissionKey(category: DriverLicenseCategory): string {
    return LICENSE_TO_PERMISSION[category];
}
