import { env } from "../env.js";

/*
    NestJS ConfigModule calls this during bootstrap. Importing `env` is enough -
    the Zod parse runs at module load time and throws immediately if env is invalid.
*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function validate(_config: Record<string, unknown>) {
    return env;
}
