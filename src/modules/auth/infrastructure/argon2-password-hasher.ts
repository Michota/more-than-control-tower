import { Injectable } from "@nestjs/common";
import * as argon2 from "argon2";
import type { PasswordHasherPort } from "./password-hasher.port.js";

@Injectable()
export class Argon2PasswordHasher implements PasswordHasherPort {
    async hash(password: string): Promise<string> {
        return argon2.hash(password);
    }

    async verify(password: string, hash: string): Promise<boolean> {
        return argon2.verify(hash, password);
    }
}
