import * as fs from "fs-extra";
import * as path from "path";
import {Constants} from "../constants";
import {Template} from "./template";
import {Collection} from "../models/collection";

const HTML_PAGE_NAME = "index.html";

export class Page {
  static renderPages(collections: Array<Collection>): void {
    let files = Page.getFileList(Constants.PAGES_DIR);
    files.forEach((filePath) => {
      console.log(`Processing page ${filePath}`);
      let extname = path.extname(filePath);
      let fileWithoutExt = path.basename(filePath, extname);

      let builtTemplate = Template.renderPage(path.join(Constants.PAGES_DIR, filePath), collections);
      let normalizedPath = path.join(Constants.OUTPUT_DIR, fileWithoutExt, HTML_PAGE_NAME);

      console.log(normalizedPath)

      fs.outputFileSync(normalizedPath, builtTemplate);
    });
  }

  private static getFileList(dir: string) {
    let files = fs.readdirSync(dir);
    let fileList: Array<string> = [];
    files.forEach((file) => {
      let filePath = path.join(dir, file);
      if (fs.statSync(filePath).isDirectory()) {
        fileList = [...fileList, ...Page.getFileList(filePath)];
      } else {
        fileList.push(file);
      }
    });
    return fileList;
  }
}
