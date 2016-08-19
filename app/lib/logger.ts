import * as chalk from "chalk";
import * as fs from "fs-extra";
import * as sourceMap from "source-map";
import * as tracer from "tracer";

interface ISourceMap {
  version: string;
  sources: Array<string>;
  names: Array<string>;
  sourcesContent?: string[];
  mappings: string;
}
interface IMappedPosition {
  column: number;
  line: number;
  name?: string;
  source: string;
}

class SourceMapManager {
  private static sourceMapCache: Map<String, ISourceMap> = new Map();
  static getOriginalLineFor(pathToJsFile: string, line: number, col: number): IMappedPosition {
    let sourceMapFile = pathToJsFile + ".map";
    let sourceMapAsJson = SourceMapManager.sourceMapCache.get(sourceMapFile);
    if (!sourceMapAsJson) {
      try {
        sourceMapAsJson = fs.readJsonSync(sourceMapFile);
        SourceMapManager.sourceMapCache.set(sourceMapFile, sourceMapAsJson);
      } catch (e) {
        return null;
      }
    }

    let smc = new sourceMap.SourceMapConsumer(sourceMapAsJson);
    return smc.originalPositionFor({
      column: +col,
      line: +line
    });
  }
}

let l = tracer.console(
  {
    dateformat: "HH:MM:ss",
    format : [
      "{{timestamp}} {{icon}} {{message}} (in {{method}}@{{file}}:{{line}})",
      {
        error : "{{timestamp}} {{icon}} {{message}} (in {{method}}@{{file}}:{{line}})\nCall Stack:\n{{stack}}"
      }
    ],
    preprocess: (data) => {
      if (data.title === "info") {
        data.icon = chalk.blue("ℹ");
      } else if (data.title === "warn") {
        data.icon = chalk.yellow("⚠");
      } else {
        data.icon = chalk.red("✖");
      }
      let originalLoc = SourceMapManager.getOriginalLineFor(data.path, data.line, data.pos);
      if (originalLoc) {
        data.line = originalLoc.line || data.line;
        data.method = originalLoc.name || data.method;

        if (originalLoc.source) {
          let paths = originalLoc.source.split("/");
          let filteredPaths = paths.filter((path) => {
            return path !== "..";
          });
          data.file = filteredPaths.join("/");
        }
      }
    }
  }
);
export {l};
