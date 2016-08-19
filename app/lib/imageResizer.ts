import {provideSingleton, TYPES} from "../core/inversify.config";
import {Config} from "./config";
import {l} from "./logger";
import * as fs from "fs-extra";
import {inject} from "inversify";
import * as path from "path";
import * as sharp from "sharp";

@provideSingleton(TYPES.ImageResizer)
export class ImageResizer {
  IMAGE_EXTENSIONS: Array<string> = [".jpg", ".png"];

  constructor(
    @inject(TYPES.Config) private _config: Config
  ) {}

  resize(srcFile: string, outFile: string): void {
    // TODO return promise and give necessary love to async at some point
    this._config.get().media.imageWidths.forEach((width) => {
      this._config.get().media.imageExtensions.forEach((ext) => {
        this._resize(srcFile, outFile, width, ext);
      });
      this._resize(srcFile, outFile, width); // keep original format
    });
  }

  getResizedUrl(rawUrl: string, width: number, ext?: string): string {
    let fileExtension = path.extname(rawUrl);
    let fileName = path.basename(rawUrl, fileExtension);
    let outFileName = `${fileName}-${width}${ext ? "." + ext : fileExtension}`;
    return path.join(rawUrl, "..", outFileName);
  }

  private _resize(srcFile: string, outFile: string, width: number, ext?: string): void {
    let fileExtension = path.extname(outFile);
    let fileName = path.basename(outFile, fileExtension);
    let outFileName = `${fileName}-${width}${ext ? "." + ext : fileExtension}`;
    let outFullPath = path.join(outFile, "..", outFileName);

    try {
      // If we already have a file with the same name in
      // the same output folder, we don't re-resize it as
      // a performance win.
      fs.accessSync(outFullPath, fs.F_OK);
    } catch (e) {
      sharp(srcFile)
        .resize(width, null)
        .quality(80)
        .toFile(outFullPath, (err) => {
          if (err) {
            l.error(`Couldn't resize file to ${outFullPath}`);
            l.error(err);
          }
        });
    }
  }
}
