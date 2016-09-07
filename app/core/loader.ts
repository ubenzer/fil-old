import * as path from "path";
import * as requireAll from "require-all";

export class Loader {
  static loadProject(): void {
    requireAll({
      dirname: path.join(__dirname, "..", "lib"),
      filter: /^(?!.*test\.js)([^\.].+)\.js$/,
      recursive: true
    });
    requireAll({
      dirname: path.join(__dirname, "..", "models"),
      filter: /^(?!.*test\.js)([^\.].+)\.js$/,
      recursive: true
    });
    requireAll({
      dirname:  path.join(__dirname, "..", "core"),
      filter: /^(?!.*test\.js)([^\.].+)\.js$/,
      recursive: true
    });
  }
}
