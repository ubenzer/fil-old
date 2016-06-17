import * as path from "path";
import {Config} from "./lib/config";

let config = Config.getConfig();

export class Constants {
  static POSTS_DIR = path.join(process.cwd(), config.build.sourcePath, "posts");
  static TEMPLATE_DIR = path.join(process.cwd(), config.build.sourcePath, "template");
  static OUTPUT_DIR = path.join(process.cwd(), config.build.buildPath);

  static TEMPLATE_IMAGES_IN_DIR = path.join(Constants.TEMPLATE_DIR, "img");
  static TEMPLATE_IMAGES_OUT_DIR = path.join(Constants.OUTPUT_DIR, "assets", "img");

  static TEMPLATE_SCRIPTS_IN_DIR = path.join(Constants.TEMPLATE_DIR, "js");
  static TEMPLATE_SCRIPTS_OUT_DIR = path.join(Constants.OUTPUT_DIR, "assets", "js");

  static TEMPLATE_CSS_IN_FILE = path.join(Constants.TEMPLATE_DIR, "index.styl");
  static TEMPLATE_CSS_OUT_FILE = path.join(Constants.OUTPUT_DIR, "assets", "styles.css");
}
