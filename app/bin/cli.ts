#!/usr/bin/env node
import {Fil} from "../core/index";
import {kernel, TYPES} from "../core/inversify.config";
import {Loader} from "../core/loader";
import {l} from "../lib/logger";
import * as chalk from "chalk";
import * as fs from "fs-extra";
import * as Liftoff from "liftoff";
import * as path from "path";
import * as semver from "semver";
import * as tildify from "tildify";

let cli = new Liftoff({
  configName: "filconfig",
  name: "fil"
});

Loader.loadProject();

let cliPackage = fs.readJSONSync(path.join(__dirname, "..", "..", "..", "package.json"));

cli.launch({}, (env: IEnv) => {
  if (env.modulePath) {
    // Check for semver difference between cli and local installation
    if (semver.neq(cliPackage.version, env.modulePackage.version)) {
      l.info(chalk.red("Warning: fil version mismatch:"));
      l.info(chalk.red(`Global: ${cliPackage.version}`));
      l.info(chalk.red(`Local: ${env.modulePackage.version}`));
      l.warn(chalk.yellow("This might cause potential problems and recommended to follow the same version"));
    }
  } else {
    l.warn(chalk.yellow("Fil will run using global package. It is recommended to have a local installation."));
  }

  if (!env.configPath) {
    l.info(chalk.red("No filconfig.js file found"));
    process.exit(1);
  }

  if (process.cwd() !== env.cwd) {
    process.chdir(env.cwd);
    l.info(
      "Working directory changed to" + chalk.magenta(tildify(env.cwd))
    );
  }

  let fil: Fil = <Fil>kernel.get(TYPES.Fil);
  if (env.modulePath) {
    // tslint:disable-next-line:no-require-imports
    let filModule = require(env.modulePath);
    fil = new filModule.Fil();
  }
  fil.generate();
});

interface IEnv {
  cwd: string; // the current working directory
  configPath?: string; // the full path to your configuration file (if found)
  configBase?: string; // the base directory of your configuration file (if found)
  modulePath?: string; // the full path to the local module your project relies on (if found)
  modulePackage?: { // the contents of the local module's package.json (if found)
    version: string
  };
}
