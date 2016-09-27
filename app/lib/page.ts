import {provideSingleton, TYPES} from "../core/inversify.config";
import {Collection} from "../models/collection";
import {Config} from "./config";
import {l} from "./logger";
import {Template} from "./template";
import * as fs from "fs-extra";
import {inject} from "inversify";
import * as path from "path";

const HTML_PAGE_NAME = "index.html";

@provideSingleton(TYPES.Page)
export class Page {

  constructor(
    @inject(TYPES.Config) private _config: Config,
    @inject(TYPES.Template) private _template: Template
  ) { }

  renderPages(collections: Array<Collection>): void {
    let files = this.getFileList(this._config.PAGES_DIR);
    files.forEach((filePath) => {
      l.info(`Processing page ${filePath}`);
      let extname = path.extname(filePath);
      let fileWithoutExt = path.basename(filePath, extname);

      let builtTemplate = this._template.renderPage(path.join(this._config.PAGES_DIR, filePath), collections);
      let normalizedPath = path.join(this._config.OUTPUT_DIR, fileWithoutExt, HTML_PAGE_NAME);
      if (fileWithoutExt === "index") {
        normalizedPath = path.join(this._config.OUTPUT_DIR, HTML_PAGE_NAME);
      }

      l.info(normalizedPath);

      fs.outputFileSync(normalizedPath, builtTemplate);
    });
  }

  private getFileList(dir: string): Array<string> {
    let files = fs.readdirSync(dir);
    let fileList: Array<string> = [];
    files.forEach((file) => {
      let filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        fileList = [...fileList, ...this.getFileList(filePath)];
      } else if (path.extname(file) === ".pug") {
        fileList.push(file);
      }
    });
    return fileList;
  }
}
