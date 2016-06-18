import * as path from "path";
import {Content} from "./content";
import {ImageResizer} from "../lib/imageResizer";

let slug = require("slug");

export class ContentAsset {
  assetId: string; // file path (without leading /) relative to the content it belongs
  inputFile: string; // file path (without leading /) relative to the content it belongs
  owner: Content; // owner of this asset
  isImage: boolean = false;

  constructor(fileName: string, owner: Content) {
    this.assetId = fileName;
    this.inputFile = fileName;
    this.owner = owner;

    let extension = path.extname(fileName).toLowerCase();

    if (ImageResizer.IMAGE_EXTENSIONS.indexOf(extension) > -1) {
      this.isImage = true;
    }
  }

  /**
   * Returns output file relative to OUTPUT_DIR for the final
   * place for the compiled content/content asset pair.
   *
   * Use the path returned by this function to save compiled
   * content asset.
   */
  getOutputFile(): string {
    // slugify all path parts and reassamble them
    let paths = this.inputFile.split(path.sep);
    let file = paths.pop();

    let sluggedPaths = paths.map(p => slug(p, slug.defaults.modes["rfc3986"]));
    let extension = path.extname(file);
    let fileNameWithoutExtension = path.basename(file, extension);
    let sluggedFile = slug(fileNameWithoutExtension, slug.defaults.modes["rfc3986"]);
    sluggedPaths.push(`${sluggedFile}${extension}`);
    sluggedPaths.unshift(this.owner.outputFolder);
    return path.join.apply(this, sluggedPaths);
  }

  /**
   * Returns permalink URL for this ContentAsset. This can be used to reference
   * it in compiled output.
   * @returns {string}
   */
  getUrl(): string {
    return this.getOutputFile().replace(new RegExp(path.sep, "g"), "/");
  }
}
