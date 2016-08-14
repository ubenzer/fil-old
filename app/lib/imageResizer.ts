import * as path from "path";
import {inject} from "inversify";
import {provide, TYPES} from "../inversify.config";
import {Config, IConfigFile} from "./config";
let sharp = require("sharp");
let fs = require("fs");

@provide(TYPES.ImageResizer)
export class ImageResizer {
  private config: IConfigFile;

  constructor(
    @inject(TYPES.Config) Config: Config
  ) {
    this.config = Config.getConfig();
  }

  IMAGE_EXTENSIONS = [".jpg", ".png"];
  resize(srcFile: string, outFile: string): void {
    // TODO return promise and give necessary love to async at some point
    this.config.media.imageWidths.forEach((width) => {
      this.config.media.imageExtensions.forEach((ext) => {
        this._resize(srcFile, outFile, width, ext);
      });
      this._resize(srcFile, outFile, width); // keep original format
    });
  }
  private _resize(srcFile: string, outFile: string, width: number, ext?: string) {
    let fileExtension = path.extname(outFile);
    let fileName = path.basename(outFile, fileExtension);
    let outFileName = `${fileName}-${width}${ext ? '.' + ext : fileExtension}`;
    let outFullPath = path.join(outFile, "..", outFileName);

    try {
      // If we already have a file with the same name in
      // the same output folder, we don't re-resize it as
      // a performance win.
      fs.accessSync(outFullPath, fs.F_OK);
    } catch (e) {
      sharp(srcFile)
        .resize(width, null)
        //.quality(80)
        .toFile(outFullPath, function(err) {
          if (err) {
            console.log(`Couldn't resize file to ${outFullPath}`);
            console.log(err);
          }
        });
    }

  }

  getResizedUrl(rawUrl: string, width: number, ext?: string): string {
    let fileExtension = path.extname(rawUrl);
    let fileName = path.basename(rawUrl, fileExtension);
    let outFileName = `${fileName}-${width}${ext ? '.' + ext : fileExtension}`;
    return path.join(rawUrl, "..", outFileName);
  }
}
