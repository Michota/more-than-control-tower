export enum OrderSource {
    /** Sales Representative — back-office worker creating order on behalf of customer */
    SR = "SR",
    /** Route Sales Representative — field worker creating order during customer visit */
    RSR = "RSR",
    /** Customer self-service — order placed through app or website */
    SELF_SERVICE = "SELF_SERVICE",
}
