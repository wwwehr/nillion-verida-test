#!/usr/bin/env node

import chalk from "chalk";
import { promises as fsPromises } from "fs";
import { v4 as uuidv4 } from "uuid";
import yargs, { Argv } from "yargs";
import { hideBin } from "yargs/helpers";

import { nilql } from "@nillion/nilql";

type ApiResponse = {
  ts?: string;
  errors?: string[];
  data?: {
    created?: any[];
    errors?: any[];
  };
};

import config from "./config.js";

yargs(hideBin(process.argv))
  .scriptName("nillion-verida-test")
  .usage("$0 <command> [options]")
  .command(
    "post",
    "POST a json file of to nilDB",
    (yargs: Argv) => {
      return yargs
        .option("path", {
          describe: "path to data payload",
          type: "string",
          demandOption: true,
        });
    },
    (argv: { path: string }) => {
      (async () => {
        console.log(chalk.yellow(`file path: ${argv.path}`));

        const stats = await fsPromises.stat(argv.path);
        if (!(stats.isFile())) {
          throw new Error("path is not a file.");
        }
        if (stats.size === 0) {
          throw new Error("path is empty file.");
        }

        const fileContent = await fsPromises.readFile(argv.path, "utf-8");
        const fileData = JSON.parse(fileContent);

        const cluster = { nodes: [{}, {}, {}] };
        const secretKey = await nilql.SecretKey.generate(cluster, {
          store: true,
        }); // key can be discarded since we will never decrypt

        console.log(
          chalk.grey(JSON.stringify(fileData, null, 4)),
        );

        for (const key in fileData.traits) {
          fileData.traits[key].value = {
            $allot: await nilql.encrypt(secretKey, fileData.traits[key].value),
          };
        }

        fileData["_id"] = uuidv4();

        const slices = nilql.allot({
          schema: config.schema,
          data: [fileData],
        });

        for (const [idx, node] of config.hosts.entries()) {
          const payload = {
            schema: config.schema,
            data: [slices[idx]],
          };
          console.log(
            chalk.grey(JSON.stringify(
              {
                target: `https://${node.url}/api/v1/data/create`,
                payload,
              },
              null,
              4,
            )),
          );
          const response = await fetch(
            `https://${node.url}/api/v1/data/create`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${node.bearer}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(payload),
            },
          );

          if (response.ok) {
            const res = await response.json() as ApiResponse;
            console.log(
              chalk.grey(JSON.stringify(res, null, 4)),
            );
            if (res.errors?.length ?? 0) {
              console.log(
                chalk.red(`[ERR] ${JSON.stringify(res.errors, null, 4)}`),
              );
              throw new Error(
                `Error uploading file: ${JSON.stringify(res.errors, null, 4)}`,
              );
            }

            console.log(
              chalk.green(
                `[${response.status}] ${response.statusText} ${res.data?.created}`,
              ),
            );
          } else {
            console.log(
              chalk.red(`[${response.status}] ${response.statusText}`),
            );
            throw new Error(`Error uploading file: ${response.statusText}`);
          }
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
