#!/usr/bin/env node
import {Collection} from "./models/collection";
import {Config} from "./lib/config";
import {Content} from "./models/content";
import {ContentLookup} from "./models/contentLookup";
import * as ChildProcess from "child_process";
import {Sitemap} from "./lib/sitemap";
import {Page} from "./lib/page";

let startDate = new Date();

// init config
let config = Config.getConfig();

// init collections
let collections = config.collections.definition.map(
  collectionDefinition => Collection.fromCollectionConfig(collectionDefinition, config.collections.config)
);

// init contents
let contents: Array<Content> = Content.fromPostsFolder();

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

Page.renderPages(collections);

// generate sitemap
Sitemap.generateSitemap(contents);

// call frontend script
console.log("Running frontend build script defined in config.");
let out = ChildProcess.execSync(config.build.siteBuildScript);
console.log(out.toString());

let endDate = new Date();
console.info(`Execution time: ${(+endDate) - (+startDate)}ms`);
