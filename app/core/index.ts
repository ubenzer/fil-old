import {Config} from "../lib/config";
import {l} from "../lib/logger";
import {Page} from "../lib/page";
import {Sitemap} from "../lib/sitemap";
import {CollectionStatic} from "../models/collection.static";
import {Content} from "../models/content";
import {ContentStatic} from "../models/content.static";
import {ContentLookup} from "../models/contentLookup";
import {provideSingleton, TYPES} from "./inversify.config";
import * as ChildProcess from "child_process";
import {inject, interfaces} from "inversify";

@provideSingleton(TYPES.Fil)
export class Fil {
  constructor(
    @inject(TYPES.CollectionStatic) private _collectionStatic: CollectionStatic,
    @inject(TYPES.Config) private _config: Config,
    @inject(TYPES.ContentStatic) private _contentStatic: ContentStatic,
    @inject(TYPES.Page) private _page: Page,
    @inject(TYPES.Sitemap) private _sitemap: Sitemap,
    @inject(TYPES.ContentLookupConstructor) private _contentLookup: interfaces.Newable<ContentLookup>
  ) {}

  generate(): void {
    let startDate = new Date();

    // init config
    let config = this._config.get();

    // init collections
    let collections = config.collections.definition.map(
      collectionDefinition => this._collectionStatic.fromCollectionConfig(collectionDefinition, config.collections.config)
    );

    // init contents
    let contents: Array<Content> = this._contentStatic.fromPostsFolder();

    // prepare contents
    contents.forEach(content => {
      content.registerOnCollections(collections);
    });

    // prepare collections
    collections.forEach(
      collection => {
        collection.sortCategories();
        collection.calculatePagination();
      }
    );

    // write contents
    let contentLookup = new this._contentLookup(contents);
    contents.forEach((content) => {
      content.calculateHtmlContent(contentLookup);
      content.renderToFile(collections);
      content.processContentAssets();
    });

    // prepare collections
    collections.forEach(
      collection => {
        collection.renderToFile(collections);
      }
    );

    this._page.renderPages(collections);

    // generate sitemap
    this._sitemap.generateSitemap(contents);

    // call frontend script
    l.info("Running frontend build script defined in config.");
    let out = ChildProcess.execSync(config.build.siteBuildScript);
    l.info(out.toString());

    let endDate = new Date();
    l.info(`Execution time: ${(+endDate) - (+startDate)}ms`);
  }
}
