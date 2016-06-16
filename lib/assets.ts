import {Constants} from "../constants";

import * as fs from "fs-extra";
import * as glob from "glob";
import * as path from "path";
import * as stylus from "stylus";

export class Assets {
  /**
   * Copies image assets to output folder
   */
  static processTemplateImages(): void {
    glob.sync("**/*", {cwd: Constants.TEMPLATE_IMAGES_IN_DIR})
      .forEach((file) => {
        fs.copySync(path.join(Constants.TEMPLATE_IMAGES_IN_DIR, file), path.join(Constants.TEMPLATE_IMAGES_OUT_DIR, file));
      });
  }

  /**
   * Copies javascript assets to output folder
   */
  static processTemplateScripts(): void {
    glob.sync("**/*", {cwd: Constants.TEMPLATE_SCRIPTS_IN_DIR})
      .forEach((file) => {
        fs.copySync(path.join(Constants.TEMPLATE_SCRIPTS_IN_DIR, file), path.join(Constants.TEMPLATE_SCRIPTS_OUT_DIR, file));
      });
  }

  /**
   * Compiles stylus files into a single css and writes it to output folder
   */
  static processStylesheets(): void {
    let styleContent = fs.readFileSync(Constants.TEMPLATE_CSS_IN_FILE, "utf-8");
    let css = stylus(styleContent)
      .set("filename", Constants.TEMPLATE_CSS_IN_FILE)
      .render();

    fs.outputFileSync(Constants.TEMPLATE_CSS_OUT_FILE, css);
  }
}
