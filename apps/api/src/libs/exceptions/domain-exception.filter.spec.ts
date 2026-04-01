import { HttpStatus } from "@nestjs/common";
import type { ArgumentsHost } from "@nestjs/common";
import { DomainExceptionFilter } from "./domain-exception.filter.js";
import {
    NotFoundDomainException,
    ConflictDomainException,
    BadRequestDomainException,
} from "./http-domain.exceptions.js";
import { Exception } from "./exception.abstract.js";
import { ZodError } from "zod";
import z from "zod";

class TestNotFoundError extends NotFoundDomainException {
    readonly code = "GOOD.NOT_FOUND";
    constructor() {
        super("Good with id abc not found");
    }
}

class TestConflictError extends ConflictDomainException {
    readonly code = "STOCK_ENTRY.INSUFFICIENT";
    constructor() {
        super("Insufficient stock");
    }
}

class TestBadRequestError extends BadRequestDomainException {
    readonly code = "ORDER.ARGUMENT_INVALID";
    constructor() {
        super("Invalid argument");
    }
}

class TestBareException extends Exception {
    readonly code = "SOME.UNKNOWN_CODE";
    constructor() {
        super("Something went wrong");
    }
}

function mockHost() {
    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const response = { status, json };
    const host = {
        switchToHttp: () => ({
            getResponse: () => response,
            getRequest: () => ({}),
        }),
    } as unknown as ArgumentsHost;
    return { host, status, json };
}

describe("DomainExceptionFilter", () => {
    const filter = new DomainExceptionFilter();

    it("maps NotFoundDomainException to 404", () => {
        const { host, status, json } = mockHost();

        filter.catch(new TestNotFoundError(), host);

        expect(status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
        expect(json).toHaveBeenCalledWith({
            statusCode: HttpStatus.NOT_FOUND,
            code: "GOOD.NOT_FOUND",
            message: "Good with id abc not found",
        });
    });

    it("maps ConflictDomainException to 409", () => {
        const { host, status, json } = mockHost();

        filter.catch(new TestConflictError(), host);

        expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
        expect(json).toHaveBeenCalledWith({
            statusCode: HttpStatus.CONFLICT,
            code: "STOCK_ENTRY.INSUFFICIENT",
            message: "Insufficient stock",
        });
    });

    it("maps BadRequestDomainException to 400", () => {
        const { host, status, json } = mockHost();

        filter.catch(new TestBadRequestError(), host);

        expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
        expect(json).toHaveBeenCalledWith({
            statusCode: HttpStatus.BAD_REQUEST,
            code: "ORDER.ARGUMENT_INVALID",
            message: "Invalid argument",
        });
    });

    it("falls back to 500 for exceptions without httpStatusCode", () => {
        const { host, status, json } = mockHost();

        filter.catch(new TestBareException(), host);

        expect(status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
        expect(json).toHaveBeenCalledWith({
            statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
            code: "SOME.UNKNOWN_CODE",
            message: "Something went wrong",
        });
    });

    it("maps ZodError to 400 with structured errors", () => {
        const { host, status, json } = mockHost();
        const schema = z.object({ name: z.string().min(1) });

        let zodError: ZodError;
        try {
            schema.parse({ name: "" });
        } catch (e) {
            zodError = e as ZodError;
        }

        filter.catch(zodError!, host);

        expect(status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
        expect(json.mock.calls[0][0]).toMatchObject({
            statusCode: HttpStatus.BAD_REQUEST,
            code: "VALIDATION_ERROR",
            message: "error_validation_failed",
        });
        const body = json.mock.calls[0][0] as { errors: { path: string; message: string }[] };
        expect(body.errors).toBeInstanceOf(Array);
        expect(body.errors[0]).toHaveProperty("path");
        expect(body.errors[0]).toHaveProperty("message");
    });

    it("always returns code, message, and statusCode in the response body", () => {
        const { host, json } = mockHost();

        filter.catch(new TestNotFoundError(), host);

        expect(json.mock.calls[0][0]).toHaveProperty("statusCode");
        expect(json.mock.calls[0][0]).toHaveProperty("code");
        expect(json.mock.calls[0][0]).toHaveProperty("message");
    });
});
