import { NestJsLoggerAdapter } from "./nestjs-logger.adapter.js";
import type { LoggerPort } from "../../libs/ports/logger.port.js";

describe("NestJsLoggerAdapter", () => {
    let adapter: NestJsLoggerAdapter;

    beforeEach(() => {
        adapter = new NestJsLoggerAdapter();
    });

    it("implements LoggerPort interface", () => {
        const port: LoggerPort = adapter;

        expect(typeof port.log).toBe("function");
        expect(typeof port.error).toBe("function");
        expect(typeof port.warn).toBe("function");
        expect(typeof port.debug).toBe("function");
    });

    it("log() does not throw", () => {
        expect(() => adapter.log("test message")).not.toThrow();
    });

    it("error() does not throw", () => {
        expect(() => adapter.error("error message", "trace")).not.toThrow();
    });

    it("warn() does not throw", () => {
        expect(() => adapter.warn("warning message")).not.toThrow();
    });

    it("debug() does not throw", () => {
        expect(() => adapter.debug("debug message")).not.toThrow();
    });

    it("log() accepts additional meta arguments", () => {
        expect(() => adapter.log("message", { key: "value" }, 42)).not.toThrow();
    });
});
