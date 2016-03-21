import {Constants} from "../constants";

import fs = require("fs-extra");
import glob = require("glob");
import path = require("path");

export class Assets {
  /**
   * Copies image assets to output folder
   */
  static processTemplateImages(): void {
    glob.sync("**/*", {cwd: Constants.TEMPLATE_IMAGES_IN_DIR})
      .forEach((file) => {
        console.log(file);
        fs.copySync(path.join(Constants.TEMPLATE_IMAGES_IN_DIR, file), path.join(Constants.TEMPLATE_IMAGES_OUT_DIR, file));
      });
  }
}
