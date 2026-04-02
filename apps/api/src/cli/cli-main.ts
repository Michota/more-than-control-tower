const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
    if (typeof args[0] === "string" && args[0].includes("driver specific imports")) {
        return;
    }
    originalWarn(...args);
};

import { CommandFactory } from "nest-commander";
import { CliModule } from "./cli.module.js";

async function bootstrap() {
    await CommandFactory.run(CliModule, {
        cliName: "mtct",
        logger: ["error"],
        errorHandler: (err) => {
            console.error("CLI Error:", err.message);
            process.exit(1);
        },
    });
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
