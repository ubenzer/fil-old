import {Config} from "./config";
import * as path from "path";
import * as fs from "fs";

let sharp = require("sharp");
let config = Config.getConfig();

export class ImageResizer {
  static IMAGE_EXTENSIONS = [".jpg", ".png"];
  static resize(srcFile: string, outFile: string): void {
    // TODO return promise and give necessary love to async at some point
    config.media.imageWidths.forEach((width) => {
      config.media.imageExtensions.forEach((ext) => {
        ImageResizer._resize(srcFile, outFile, width, ext);
      });
      ImageResizer._resize(srcFile, outFile, width); // keep original format
    });
  }
  private static _resize(srcFile: string, outFile: string, width: number, ext?: string) {
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

  static getResizedUrl(rawUrl: string, width: number, ext?: string): string {
    let fileExtension = path.extname(rawUrl);
    let fileName = path.basename(rawUrl, fileExtension);
    let outFileName = `${fileName}-${width}${ext ? '.' + ext : fileExtension}`;
    return path.join(rawUrl, "..", outFileName);
  }
}
