import * as chalk from "chalk";
import * as fs from "fs-extra";
import {inject} from "inversify";
import * as path from "path";
import * as Rx from "rxjs/Rx";
import * as sharp from "sharp";
import * as tildify from "tildify";
import {provideSingleton, TYPES} from "../core/inversify.config";
import {Config} from "./config";
import {l} from "./logger";

@provideSingleton(TYPES.ImageResizer)
export class ImageResizer {
  IMAGE_EXTENSIONS: Array<string> = [".jpg", ".png"];

  constructor(
    @inject(TYPES.Config) private _config: Config
  ) {}

  resize(srcFile: string, outFile: string): Rx.Observable<IConversionResult> {
    let observables: Array<Rx.Observable<IConversionResult>> = [];

    this._config.get().media.imageWidths.forEach((width) => {
      this._config.get().media.imageExtensions.forEach((ext) => {
        observables.push(
          this._resize(srcFile, outFile, width, ext)
        );
      });
      observables.push(
        // keep original format
        this._resize(srcFile, outFile, width)
      );
    });
    return Rx.Observable.merge(...observables);
  }

  getResizedUrl(rawUrl: string, width: number, ext?: string): string {
    let fileExtension = path.extname(rawUrl);
    let fileName = path.basename(rawUrl, fileExtension);
    let outFileName = `${fileName}-${width}${ext ? "." + ext : fileExtension}`;
    return path.join(rawUrl, "..", outFileName);
  }

  private _resize(srcFile: string, outFile: string, width: number, ext?: string): Rx.Observable<IConversionResult> {
    let subject = new Rx.Subject<IConversionResult>();
    let result: IConversionResult = {
      outFile: outFile,
      result: null,
      srcFile: srcFile
    };

    let fileExtension = path.extname(outFile);
    let fileName = path.basename(outFile, fileExtension);
    let outFileName = `${fileName}-${width}${ext ? "." + ext : fileExtension}`;
    let outFullPath = path.join(outFile, "..", outFileName);

    try {
      // If we already have a file with the same name in
      // the same output folder, we don't re-resize it as
      // a performance win.
      l.info(`${chalk.green("(cache)")} Resize: ${tildify(outFullPath)}`);
      fs.accessSync(outFullPath, fs.F_OK);
      result.result = ConversionResult.CACHE;
      subject.next(result);
      subject.complete();
    } catch (e) {
      sharp(srcFile)
        .resize(width, null)
        .quality(80)
        .toFile(outFullPath, (err) => {
          if (err) {
            l.error(`${chalk.red("(cache)")} Resize: ${tildify(outFullPath)}`);
            l.error(err);
            result.result = ConversionResult.ERROR;
            result.error = err;
            subject.error(err);
            return;
          }
          l.info(`(success) Resize: ${tildify(outFullPath)}`);
          result.result = ConversionResult.SUCCESS;
          subject.next(result);
          subject.complete();
        });
    }
    return subject.asObservable();
  }
}
enum ConversionResult { SUCCESS, ERROR, CACHE }
interface IConversionResult {
  srcFile: string;
  outFile: string;
  result: ConversionResult;
  error?: Error;
}
