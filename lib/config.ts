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
//   template: ITemplateConfig,
   post: IPostConfig
}

export interface ICollectionConfigFile {
  collectionsPermalink: string;
  collectionPermalink: string;
  categoryFirstPermalink: string;
  categoryPermalink: string;
  pagination: number;
  categorySorting: ICategorySorting|((category1: Category, category2: Category) => number)
  contentSorting: IContentSorting|((content1: Content, content2: Content) => number)
  subCategorySeparator: string;
}

export interface ICategorySorting extends ISorting {}
export interface IContentSorting extends ISorting {}
interface ISorting {
  sortBy: string; // should be "id" or "date"
  reverse: boolean;
}

export interface ICollectionDefinitionFile {
  id: string;
  categoryFn?: (content: Content) => Array<string>; // for a given Content returns array of category id
  templateOptions?: Object|((Category) => Object)

  collectionPermalink?: string;
  categoryFirstPermalink?: string;
  categoryPermalink?: string;
  pagination?: number;
  categorySorting?: ICategorySorting|((category1: Category, category2: Category) => number)
  contentSorting?: IContentSorting|((content1: Content, content2: Content) => number)
  subCategorySeparator?: string;
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
interface IPostConfig {
  permalink: string|IPostPermalinkCalculatorFnIn; // valid: :title :day :month :year
  templateOptions: Object|((Post) => Object)
}
export type IPostPermalinkCalculatorFnIn = (postId: string, postTitle: string, postCreateDate: Date) => string;
