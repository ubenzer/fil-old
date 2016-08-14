#!/usr/bin/env node
import * as chalk from "chalk";
import * as semver from "semver";
import {kernel, TYPES} from "./inversify.config";

let Liftoff = require("liftoff");
let tildify = require("tildify");

let cli = new Liftoff({
  name: "fil",
  configName: "filconfig"
});

var normalizedPath = require("path").join(__dirname, "lib");

require("fs").readdirSync(normalizedPath).forEach(function(file) {
  require("./lib/" + file);
});

var normalizedPath = require("path").join(__dirname, "models");
require("fs").readdirSync(normalizedPath).forEach(function(file) {
  require("./models/" + file);
});

require("./index");
require("./inversify.config");

// Exit with 0 or 1
let failed = false;
process.once("exit", function(code) {
  if (code === 0 && failed) {
    process.exit(1);
  }
});

let cliPackage = require("../../package");

cli.launch({}, run);

// The actual logic
function run(env: IEnv) {
  if (env.modulePath) {
    // Check for semver difference between cli and local installation
    if (semver.neq(cliPackage.version, env.modulePackage.version)) {
      console.log(chalk.red("Warning: fil version mismatch:"));
      console.log(chalk.red(`Global: ${cliPackage.version}`));
      console.log(chalk.red(`Local: ${env.modulePackage.version}`));
      console.log("This might cause potential problems and recommended to follow the same version");
    }
  } else {
    console.log(chalk.yellow("Fil will run using global package."));
  }

  if (!env.configPath) {
    console.log(chalk.red("No filconfig.js file found"));
    process.exit(1);
  }

  if (process.cwd() !== env.cwd) {
    process.chdir(env.cwd);
    console.log(
      "Working directory changed to",
      chalk.magenta(tildify(env.cwd))
    );
  }

  let fil: any = kernel.get(TYPES.Fil);
  if (env.modulePath) {
    let filModule = require(env.modulePath);
    fil = new filModule.Fil();
  }
  fil.generate();
}

interface IEnv {
  cwd: string; // the current working directory
  configPath?: string; // the full path to your configuration file (if found)
  configBase?: string; // the base directory of your configuration file (if found)
  modulePath?: string; // the full path to the local module your project relies on (if found)
  modulePackage?: any; // the contents of the local module's package.json (if found)
}
