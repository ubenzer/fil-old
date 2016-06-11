import path = require("path");
import {Category} from "../models/category";
import {Content} from "../models/content";
let config = require(path.join(process.cwd(), "config.js"));

export class Config {
  static getConfig(): IConfigFile {
    return config;
  }
}

interface IConfigFile {
   collections: {
     config: ICollectionConfigFile,
     definition: Array<ICollectionDefinitionFile>
   },
   template: any,
   content: IContentConfig
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
  templateOptions?: Object|((Category) => Object)

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
//
// interface ITemplateConfig {
//   img: Array<ITemplateImageConfig>
// }
//
// interface ITemplateImageConfig {
//   id: string;
//   height: number;
//   width: number;
//   extension: string;
// }
//
interface IContentConfig {
  permalink: string|IContentPermalinkCalculatorFnIn; // valid: :title :day :month :year
  templateOptions: Object|((content: Content) => Object)
}
export type IContentPermalinkCalculatorFnIn = (contentId: string, contentTitle: string, contentCreateDate: Date) => string;
