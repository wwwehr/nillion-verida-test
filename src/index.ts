#!/usr/bin/env node --experimental-wasm-modules

import chalk from "chalk";
import { config } from "dotenv";
import { promises as fsPromises } from "fs";
import { v4 as uuidv4 } from "uuid";
import yargs, { Argv } from "yargs";
import { hideBin } from "yargs/helpers";

config();

const ROOT_URL: string =
  "https://nil-db.sandbox.app-cluster.sandbox.nilogy.xyz/api/v1";
const SCHEMA_MAP: { [key: string]: string } = {
  "member-traits": "212a26b2-8361-4a72-a913-0deb6adc5c2d",
  "community-traits": "e2f3b94d-3d62-4a4f-bc5d-6f29b6a3b08a",
};

yargs(hideBin(process.argv))
  .scriptName("nillion-verida-test")
  .usage("$0 <command> [options]")
  .command(
    "post",
    "POST a json file of type schema to nilDB",
    (yargs: Argv) => {
      return yargs
        .option("schema", {
          describe: "the named schema",
          type: "string",
          choices: ["member-traits", "community-traits"],
          demandOption: true,
        })
        .option("path", {
          describe: "path to data payload",
          type: "string",
          demandOption: true,
        });
    },
    (argv: { schema: string; path: string }) => {
      (async () => {
        console.log(chalk.yellow(`schema: ${argv.schema}`));
        console.log(chalk.yellow(`file path: ${argv.path}`));
        // console.log(chalk.grey(`token: ${process.env.NILDB_BEARER_TOKEN}`));

        const stats = await fsPromises.stat(argv.path);
        if (!(stats.isFile())) {
          throw new Error("path is not a file.");
        }
        if (stats.size === 0) {
          throw new Error("path is empty file.");
        }

        const fileContent = await fsPromises.readFile(argv.path, "utf-8");
        const fileData = JSON.parse(fileContent);

        fileData["_id"] = uuidv4();

        const payload = {
          schema: SCHEMA_MAP[argv.schema],
          data: [fileData],
        };

        const response = await fetch(`${ROOT_URL}/data/create`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.NILDB_BEARER_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          console.log(
            chalk.green(`[${response.status}] ${response.statusText}`),
          );
        } else {
          console.log(chalk.red(`[${response.status}] ${response.statusText}`));
          throw new Error(`Error uploading file: ${response.statusText}`);
        }
      })();
    },
  )
  .fail((msg, err, yargs) => {
    if (err) {
      console.error("An unexpected error occurred:", err.message);
    } else {
      console.error("Invalid usage:", msg);
      console.error("\nHelp:");
      console.error(yargs.help());
    }
    process.exit(1); // Exit with a non-zero code
  })
  .help()
  .alias("help", "h")
  .parse();
