import {Content} from "../models/content";
import * as fs from "fs-extra";
import {Config, IConfigFile} from "./config";
import * as path from "path";
import moment = require("moment/moment");
import {provide, TYPES} from "../inversify.config";
import {inject} from "inversify";

let sm = require("sitemap");

@provide(TYPES.Sitemap)
export class Sitemap {
  private config: IConfigFile;

  constructor(
    @inject(TYPES.Config) private Config: Config
  ) {
    this.config = Config.getConfig();
  }

  generateSitemap(contents: Array<Content>) {
    let urls = contents.map((content) => {
      let twoWeeksAgo = moment().subtract(15, "days");
      let isContentOld = content.editDate.isBefore(twoWeeksAgo);
      let imagesOfContent = content.fileAssets.map((contentAsset) => {
        return contentAsset.isImage ? { url: this.config.general.baseUrl + contentAsset.getUrl() } : null;
      }).filter((maybeContentAsset) => maybeContentAsset !== null);
      return {
        url: this.config.general.baseUrl + content.getUrl(),
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
    let outFilePath = path.join(this.Config.OUTPUT_DIR, "sitemap.xml");

    fs.writeFileSync(outFilePath, sitemap.toString());
  }
}
