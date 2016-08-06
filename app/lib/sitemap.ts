import {Content} from "../models/content";
import * as fs from "fs-extra";
import {Config} from "./config";
import {Constants} from "../constants";
import * as path from "path";
import moment = require("moment/moment");

let sm = require("sitemap");
let config = Config.getConfig();

export class Sitemap {
  static generateSitemap(contents: Array<Content>) {
    let urls = contents.map((content) => {
      let twoWeeksAgo = moment().subtract(15, "days");
      let isContentOld = content.editDate.isBefore(twoWeeksAgo);
      let imagesOfContent = content.fileAssets.map((contentAsset) => {
        return contentAsset.isImage ? { url: config.general.baseUrl + contentAsset.getUrl() } : null;
      }).filter((maybeContentAsset) => maybeContentAsset !== null);
      return {
        url: config.general.baseUrl + content.getUrl(),
        img: imagesOfContent,
        changefreq: isContentOld ? "monthly" : "weekly",
        lastmodISO: content.editDate.toISOString(),
        priority: isContentOld ? 0.6 : 0.8
      }
    });

    let sitemapSkeleton = {
      urls: urls
    };
    let sitemap = sm.createSitemap(sitemapSkeleton);
    let outFilePath = path.join(Constants.OUTPUT_DIR, "sitemap.xml");

    fs.writeFileSync(outFilePath, sitemap.toString());
  }
}
