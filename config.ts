// export function test() {
//
// }
//
// // config file format
// interface IConfigFile {
//   collections: {
//     config: ICollectionConfigFile,
//     definition: Array<ICollectionDefinitionFile>
//   },
//   template: ITemplateConfig,
//   post: IPostConfig
// }
//
// interface ICollectionConfigFile {
//   collectionsPermalink: string;
//   collectionPermalink: string;
//   categoryFirstPermalink: string;
//   categoryPermalink: string;
//   pagination: number;
//   categorySorting: ICategorySorting|((category1: ICategory, category2: ICategory) => number)
//   postSorting: IPostSorting|((post1: IPost, post2: IPost) => number)
//   subCategorySeparator: string;
//   templateOptions: Object|((ICategory) => Object)
// }
//
// export interface ICategorySorting extends ISorting {}
// export interface IPostSorting extends ISorting {}
// interface ISorting {
//   sortBy: string;
//   reverse: boolean;
// }
//
// interface ICollectionDefinitionFile {
//   id: string;
//   categoryFn?: (post: IPost) => ICategory;
// }
//
// // config in app representation
// interface IConfig {
//   collectionConfig: {
//     collectionsPermalink: string;
//   }
//   collections: Array<ICollectionConfig>,
//   template: ITemplateConfig,
//   post: IPostConfig
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
// interface IPostConfig {
//   permalink: string;
//   templateOptions: Object|((IPost) => Object)
// }
//
