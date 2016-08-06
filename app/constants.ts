import * as path from "path";
import {Config} from "./lib/config";

let config = Config.getConfig();

export class Constants {
  static CONTENTS_DIR = path.join(process.cwd(), config.build.contentPath);
  static TEMPLATE_DIR = path.join(process.cwd(), config.build.skeletonPath, "template");
  static PAGES_DIR = path.join(process.cwd(), config.build.skeletonPath, "pages");
  static OUTPUT_DIR = path.join(process.cwd(), config.build.buildPath);
}
