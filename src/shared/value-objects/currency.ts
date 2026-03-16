export class Currency {
    constructor(readonly code: string) {
        if (!Intl.supportedValuesOf("currency").includes(code)) {
            throw new Error(`Invalid ISO 4217 currency code: ${code}`);
        }
    }
}
