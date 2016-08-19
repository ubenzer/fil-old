import * as path from "path";
import * as requireAll from "require-all";

export class Loader {
  static loadProject(): void {
    requireAll({
      dirname: path.join(__dirname, "..", "lib"),
      recursive: true
    });
    requireAll({
      dirname: path.join(__dirname, "..", "models"),
      recursive: true
    });
    requireAll({
      dirname:  path.join(__dirname, "..", "core"),
      recursive: true
    });
  }
}
