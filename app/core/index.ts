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
import * as chokidar from "chokidar";
import {inject, interfaces} from "inversify";
import * as minimist from "minimist";
import * as Rx from "rxjs/Rx";

@provideSingleton(TYPES.Fil)
export class Fil {
  private busy: boolean = false;
  private hasPendingBuild: boolean = false;
  private buildFinishedSubject: Rx.Subject<void> = new Rx.Subject<void>();
  private buildFinishedObserveable: Rx.Observable<void> = this.buildFinishedSubject.asObservable();

  constructor(
    @inject(TYPES.CollectionStatic) private _collectionStatic: CollectionStatic,
    @inject(TYPES.Config) private _config: Config,
    @inject(TYPES.ContentStatic) private _contentStatic: ContentStatic,
    @inject(TYPES.Page) private _page: Page,
    @inject(TYPES.Sitemap) private _sitemap: Sitemap,
    @inject(TYPES.ContentLookupConstructor) private _contentLookup: interfaces.Newable<ContentLookup>
  ) {}

  start(): void {
    let argv = minimist<IParams>(process.argv.slice(2), {
      alias: {w: "watch"},
      boolean: "watch"
    });
    if (argv.watch) {
      l.info("Auto build on file change is enabled!");
      let fileChangeObservable = this.createFileWatcher();
      fileChangeObservable.subscribe(() => {
        if (this.busy) {
          this.hasPendingBuild = true;
        } else {
          this.safeGenerate();
        }
      });
      this.buildFinishedObserveable.subscribe(() => {
        if (!this.hasPendingBuild) { return; }
        this.hasPendingBuild = false;
        this.generate();
      });
      this.safeGenerate();
    } else {
      this.generate();
    }
  }

  private createFileWatcher(): Rx.Observable<void> {
    let subject = new Rx.Subject<void>();
    let watcher = chokidar.watch(
      [
        this._config.get().build.contentPath,
        this._config.get().build.pagePath,
        this._config.get().build.templatePath
      ],
      {
        atomic: true,
        awaitWriteFinish: {
          pollInterval: 100,
          stabilityThreshold: 2000
        },
        cwd: process.cwd(),
        followSymlinks: true,
        ignoreInitial: true,
        ignorePermissionErrors: false,
        ignored: ["**/.*"],
        persistent: true
      }
    );
    watcher.on("all", () => {
      subject.next();
    });
    return subject.asObservable()
      .debounce((x) => { return Rx.Observable.timer(700); });
  }
  private safeGenerate(): void {
    try {
      this.generate();
    } catch (e) {
      l.error("Generation failed. Check errors above.");
    }
  }
  private generate(): void {
    this.busy = true;
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
    this.busy = false;
    this.buildFinishedSubject.next();
  }
}

interface IParams {
  watch: boolean;
}
