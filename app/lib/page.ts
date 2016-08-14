import * as fs from "fs-extra";
import * as path from "path";

import {provide, TYPES} from "../inversify.config";
import {Template} from "./template";
import {Collection} from "../models/collection";
import {Config} from "./config";
import {inject} from "inversify";

const HTML_PAGE_NAME = "index.html";

@provide(TYPES.Page)
export class Page {

  constructor(
    @inject(TYPES.Config) private Config: Config,
    @inject(TYPES.Template) private Template: Template
  ) { }

  renderPages(collections: Array<Collection>): void {
    let files = this.getFileList(this.Config.PAGES_DIR);
    files.forEach((filePath) => {
      console.log(`Processing page ${filePath}`);
      let extname = path.extname(filePath);
      let fileWithoutExt = path.basename(filePath, extname);

      let builtTemplate = this.Template.renderPage(path.join(this.Config.PAGES_DIR, filePath), collections);
      let normalizedPath = path.join(this.Config.OUTPUT_DIR, fileWithoutExt, HTML_PAGE_NAME);

      console.log(normalizedPath);

      fs.outputFileSync(normalizedPath, builtTemplate);
    });
  }

  private getFileList(dir: string) {
    let files = fs.readdirSync(dir);
    let fileList: Array<string> = [];
    files.forEach((file) => {
      let filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        fileList = [...fileList, ...this.getFileList(filePath)];
      } else {
        fileList.push(file);
      }
    });
    return fileList;
  }
}
