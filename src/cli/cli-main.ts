import "tsconfig-paths/register";
import { CommandFactory } from "nest-commander";
import { CliModule } from "./cli.module.js";

async function bootstrap() {
    await CommandFactory.run(CliModule, {
        cliName: "mtct",
        errorHandler: (err) => {
            console.error("CLI Error:", err.message);
            process.exit(1);
        },
    });
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
