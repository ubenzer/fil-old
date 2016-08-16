import {provide, TYPES} from "../inversify.config";
import {Content} from "../models/content";
import {Config} from "./config";
import * as fs from "fs-extra";
import {inject} from "inversify";
import * as moment from "moment/moment";
import * as path from "path";
import * as sitemap from "sitemap";

@provide(TYPES.Sitemap)
export class Sitemap {
  constructor(
    @inject(TYPES.Config) private _config: Config
  ) {}

  generateSitemap(contents: Array<Content>): void {
    let urls = contents.map((content) => {
      let twoWeeksAgo = moment().subtract(15, "days");
      let isContentOld = content.editDate.isBefore(twoWeeksAgo);
      let imagesOfContent = content.fileAssets.map((contentAsset) => {
        return contentAsset.isImage ? { url: this._config.get().general.baseUrl + contentAsset.getUrl() } : null;
      }).filter((maybeContentAsset) => maybeContentAsset !== null);
      return {
        changefreq: isContentOld ? "monthly" : "weekly",
        img: imagesOfContent,
        lastmodISO: content.editDate.toISOString(),
        priority: isContentOld ? 0.6 : 0.8,
        url: this._config.get().general.baseUrl + content.getUrl()
      };
    });

    let sitemapSkeleton = {
      urls: urls
    };
    let sm = sitemap.createSitemap(sitemapSkeleton);
    let outFilePath = path.join(this._config.OUTPUT_DIR, "sitemap.xml");

    fs.writeFileSync(outFilePath, sm.toString());
  }
}
