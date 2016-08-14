import * as path from "path";
import {Category} from "../models/category";
import {Content} from "../models/content";
import {provide, TYPES} from "../inversify.config";

@provide(TYPES.Config)
export class Config implements IConfig {
  private configCache: IConfigFile = null;

  constructor() {
    this.configCache = <IConfigFile>require(path.join(process.cwd(), process.env.CONFIG || "filconfig.js"));
    this.CONTENTS_DIR = path.join(process.cwd(), this.getConfig().build.contentPath);
    this.TEMPLATE_DIR = path.join(process.cwd(), this.getConfig().build.skeletonPath, "template");
    this.PAGES_DIR = path.join(process.cwd(), this.getConfig().build.skeletonPath, "pages");
    this.OUTPUT_DIR = path.join(process.cwd(), this.getConfig().build.buildPath);
  }

  getConfig(): IConfigFile {
    return this.configCache;
  }

  CONTENTS_DIR: string = null;
  TEMPLATE_DIR: string = null;
  PAGES_DIR: string = null;
  OUTPUT_DIR: string = null;
}

export interface IConfigFile {
  build: {
    contentPath: string,
    skeletonPath: string,
    buildPath: string,
    siteBuildScript: string,
  }
  general: IGeneralConfig
  collections: {
    config: ICollectionConfigFile,
    definition: Array<ICollectionDefinitionFile>
  },
  media: {
    defaultWidth: number,
    imageWidths: Array<number>,
    imageExtensions: Array<string>
  },
  template: any,
  content: IContentConfig
}

export interface IGeneralConfig {
  baseUrl: string
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
  categoryIdToNameFn?: (string) => string;
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
  templateOptions: Object|((content: Content) => Object)
}
export type IContentPermalinkCalculatorFnIn = (contentId: string, contentTitle: string, contentCreateDate: Date) => string;

export interface IConfig {}
