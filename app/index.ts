import * as ChildProcess from "child_process";
import {inject, injectable} from "inversify";
import {Config} from "./lib/config";
import {Content} from "./models/content";
import {ContentLookup} from "./models/contentLookup";
import {Sitemap} from "./lib/sitemap";
import {Page} from "./lib/page";
import {ContentStatic} from "./models/content.static";
import {CollectionStatic} from "./models/collection.static";
import {provide, TYPES} from "./inversify.config";

@provide(TYPES.Fil)
export class Fil {
  constructor(
    @inject(TYPES.CollectionStatic) private CollectionStatic: CollectionStatic,
    @inject(TYPES.Config) private Config: Config,
    @inject(TYPES.ContentStatic) private ContentStatic: ContentStatic,
    @inject(TYPES.Page) private Page: Page,
    @inject(TYPES.Sitemap) private Sitemap: Sitemap
  ) {}

  generate(): void {
    let startDate = new Date();

    // init config
    let config = this.Config.getConfig();

    // init collections
    let collections = config.collections.definition.map(
      collectionDefinition => this.CollectionStatic.fromCollectionConfig(collectionDefinition, config.collections.config)
    );

    // init contents
    let contents: Array<Content> = this.ContentStatic.fromPostsFolder();

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
    let contentLookup = new ContentLookup(contents);
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

    this.Page.renderPages(collections);

    // generate sitemap
    this.Sitemap.generateSitemap(contents);

    // call frontend script
    console.log("Running frontend build script defined in config.");
    let out = ChildProcess.execSync(config.build.siteBuildScript);
    console.log(out.toString());

    let endDate = new Date();
    console.info(`Execution time: ${(+endDate) - (+startDate)}ms`);
  }
}
