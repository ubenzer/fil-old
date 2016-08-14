import {interfaces, inject} from "inversify";
import {provide, TYPES} from "../inversify.config";
import {ICollectionDefinitionFile, ICollectionConfigFile} from "../lib/config";
import {Collection} from "./collection";

@provide(TYPES.CollectionStatic)
export class CollectionStatic {
  constructor(
    @inject(TYPES.CollectionConstructor) private Collection: interfaces.Newable<Collection>
  ) {}
  fromCollectionConfig(definition: ICollectionDefinitionFile, config: ICollectionConfigFile): Collection {
    return new this.Collection(
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
