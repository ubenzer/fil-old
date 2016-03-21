import path = require("path");

export class Constants {
  static POSTS_DIR = path.join(process.cwd(), "posts");
  static OUTPUT_DIR = path.join(process.cwd(), "out");
  static TEMPLATE_DIR = path.join(process.cwd(), "template");

  static TEMPLATE_IMAGES_IN_DIR = path.join(Constants.TEMPLATE_DIR, "images");
  static TEMPLATE_IMAGES_OUT_DIR = path.join(Constants.OUTPUT_DIR, "assets", "images");
}
