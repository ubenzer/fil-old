import {provideSingleton, TYPES} from "../core/inversify.config";
import {ICollectionConfigFile, ICollectionDefinitionFile} from "../lib/config";
import {Collection} from "./collection";
import {inject, interfaces} from "inversify";

@provideSingleton(TYPES.CollectionStatic)
export class CollectionStatic {
  constructor(
    @inject(TYPES.CollectionConstructor) private _collection: interfaces.Newable<Collection>
  ) {}
  fromCollectionConfig(definition: ICollectionDefinitionFile, config: ICollectionConfigFile): Collection {
    return new this._collection(
      definition.id,
      definition.categoryFn,
      definition.collectionPermalink || config.collectionPermalink,
      definition.categoryFirstPermalink || config.categoryFirstPermalink,
      definition.categoryPermalink || config.categoryPermalink,
      definition.pagination || config.pagination,
      definition.categorySorting || config.categorySorting,
      definition.contentSorting || config.contentSorting,
      definition.subCategorySeparator || config.subCategorySeparator,
      definition.categoryIdToNameFn
    );
  }

  defaultCategoryIdToNameFn(id: string): string {
    return id;
  }
}
