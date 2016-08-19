import {provideSingleton, TYPES} from "../core/inversify.config";
import {Category} from "../models/category";
import {Content} from "../models/content";
import * as path from "path";

@provideSingleton(TYPES.Config)
export class Config implements IConfig {
  CONTENTS_DIR: string = null;
  TEMPLATE_DIR: string = null;
  PAGES_DIR: string = null;
  OUTPUT_DIR: string = null;

  private configCache: IConfigFile = null;

  constructor() {
    // tslint:disable-next-line:no-require-imports
    this.configCache = <IConfigFile>require(path.join(process.cwd(), process.env.CONFIG || "filconfig.js"));
    this.CONTENTS_DIR = path.join(process.cwd(), this.get().build.contentPath);
    this.TEMPLATE_DIR = path.join(process.cwd(), this.get().build.skeletonPath, "template");
    this.PAGES_DIR = path.join(process.cwd(), this.get().build.skeletonPath, "pages");
    this.OUTPUT_DIR = path.join(process.cwd(), this.get().build.buildPath);
  }

  get(): IConfigFile {
    return this.configCache;
  }
}

export interface IConfigFile {
  build: {
    contentPath: string,
    skeletonPath: string,
    buildPath: string,
    siteBuildScript: string,
  };
  general: IGeneralConfig;
  collections: {
    config: ICollectionConfigFile,
    definition: Array<ICollectionDefinitionFile>
  };
  media: {
    defaultWidth: number,
    imageWidths: Array<number>,
    imageExtensions: Array<string>
  };
  // tslint:disable-next-line:no-any
  template: any;
  content: IContentConfig;
}

export interface IGeneralConfig {
  baseUrl: string;
}
export interface ICollectionConfigFile {
  collectionsPermalink: string;
  collectionPermalink: string;
  categoryFirstPermalink: string;
  categoryPermalink: string;
  pagination: number;
  categorySorting: ICategorySortingObject|ICategorySortingFn;
  contentSorting: IContentSortingObject|IContentSortingFn;
  subCategorySeparator: string;
}

export interface ICategorySortingFn {
  (category1: Category, category2: Category): number;
}
export interface ICategorySortingObject {
  sortBy: string; // should be "id" or "title" or "contentCount"
  reverse: boolean;
}
export interface IContentSortingObject {
  sortBy: string; // should be "id" or "title" or "date"
  reverse: boolean;
}
export interface IContentSortingFn {
  (content1: Content, content2: Content): number;
}

export interface ICollectionDefinitionFile {
  id: string;
  categoryFn?: (content: Content) => Array<string>; // for a given Content returns array of category id

  collectionPermalink?: string;
  categoryFirstPermalink?: string;
  categoryPermalink?: string;
  pagination?: number;
  categorySorting?: ICategorySortingObject|ICategorySortingFn;
  contentSorting?: IContentSortingObject|IContentSortingFn;
  subCategorySeparator?: string;
  categoryIdToNameFn?: (id: string) => string;
}

// // config in app representation
// interface IConfig {
//   collectionConfig: {
//     collectionsPermalink: string;
//   }
//   collections: Array<ICollectionConfig>,
//   template: ITemplateConfig,
//   content: IPostConfig
// }
//
// interface ICollectionConfig {
//
// }

interface IContentConfig {
  permalink: string|IContentPermalinkCalculatorFnIn; // valid: :title :day :month :year
  templateOptions: Object|((content: Content) => Object);
}
export type IContentPermalinkCalculatorFnIn = (contentId: string, contentTitle: string, contentCreateDate: Date) => string;

export interface IConfig {}
