import {ICategorySorting, IContentSorting, ICollectionDefinitionFile, ICollectionConfigFile} from "../lib/config"
import {Content} from "./content"
import {Category} from "./category"

export class Collection {
  id: string;
  categoryIdGeneratorFunction: (content: Content) => Array<string>;
  templateOptions: (category: Category) => Object;

  collectionPermalink: string;
  categoryFirstPermalink: string;
  categoryPermalink: string;
  pagination: number;
  categorySorting: ICategorySorting|((category1: Category, category2: Category) => number);
  contentSorting: IContentSorting|((post1: Content, post2: Content) => number);
  subCategorySeparator: string;

  categories: Array<Category> = [];

  constructor(
    id: string,
    categoryIdGeneratorFunction: (content: Content) => Array<string> = null,
    templateOptions: (Category) => Object = Collection.defaultTemplateOptionsFn,
    collectionPermalink: string,
    categoryFirstPermalink: string,
    categoryPermalink: string,
    pagination: number,
    categorySorting: ICategorySorting|((category1: Category, category2: Category) => number),
    contentSorting: IContentSorting|((post1: Content, post2: Content) => number),
    subCategorySeparator: string
  ) {
    this.id = id;
    this.categoryIdGeneratorFunction = categoryIdGeneratorFunction || this.defaultCategoryIdGeneratorFn;
    this.templateOptions = templateOptions;
    this.collectionPermalink = collectionPermalink;
    this.categoryFirstPermalink = categoryFirstPermalink;
    this.categoryPermalink = categoryPermalink;
    this.pagination = pagination;
    this.categorySorting = categorySorting;
    this.contentSorting = contentSorting;
    this.subCategorySeparator = subCategorySeparator;
  }

  /**
   * Processes given content and update category index accordingly
   * @param content to be registered
   * @returns {Array<IContentBelongsTo>} A relationship lookup representing
   *   categories that this content belongs to for this Collection
     */
  registerContent(content: Content): Array<IContentBelongsTo> {
    let categoryIdStrings: Array<string> = this.categoryIdGeneratorFunction(content);

    let contentBelongsTo: Array<IContentBelongsTo> = [];

    categoryIdStrings.forEach(
      unsortedCategoryInfo => {
        let unsortedCategoryChain = unsortedCategoryInfo.split(this.subCategorySeparator);
        let parentCategory = null;

        let parentContentBelongsToArray = contentBelongsTo;

        unsortedCategoryChain.forEach(
          (currentUnsortedCategory: string, idx: number, array: Array<string>) => {
            let isLast = idx === array.length - 1;
            let currentCategory = this.createGetCategory(parentCategory, currentUnsortedCategory);
            currentCategory.registerContent(content, isLast);

            let contentBelongsToRelationship: IContentBelongsTo =
              createOrUpdateContentBelongsTo(parentContentBelongsToArray, currentCategory);

            parentContentBelongsToArray = contentBelongsToRelationship.subCategories;
          }
        );
      }
    );

    // TODO update inner index

    return contentBelongsTo;

    /**
     * Creates (if not exists) and returns IContentBelongsTo.
     * Please note that belongsToArray will be mutated/updated.
     * @param belongsToArray A list of belongs relationships to check existence
     * @param category Belongs to relationship category
     * @return Existing or new IContentBelongsTo object
     */
    function createOrUpdateContentBelongsTo(belongsToArray: Array<IContentBelongsTo>, category: Category): IContentBelongsTo {
      let maybeRelationship = belongsToArray.find(bt => bt.category === category);

      if (maybeRelationship instanceof Object) {
        return maybeRelationship;
      }

      let belongsTo: IContentBelongsTo = {
        category: category,
        subCategories: []
      };
      belongsToArray.push(belongsTo);
      return belongsTo;
    }
  }

  /**
   * Returns the category with given id under parentCategory. If
   * category is not existent, it is created.
   * @param parentCategory Category to search inside. (null means root for this content type)
   * @param categoryId as string
   * @returns Category object that represents categoryId
     */
  private createGetCategory(parentCategory: Category, categoryId: string): Category {
    // TODO create a category
    return null;
  }

  private defaultCategoryIdGeneratorFn(content: Content): Array<string> {
    let maybeCollectionRelatedFrontmatter = content.rawFrontmatter[this.id];
    if (typeof maybeCollectionRelatedFrontmatter === "string") {
      maybeCollectionRelatedFrontmatter = [maybeCollectionRelatedFrontmatter];
    }
    if (!(maybeCollectionRelatedFrontmatter instanceof Array)) {
      console.log(`"${this.id}" collection related information in content "${content.contentId}" is not understood.`);
      return [];
    }

    return maybeCollectionRelatedFrontmatter;
  }

  static fromCollectionConfig(definition: ICollectionDefinitionFile, config: ICollectionConfigFile): Collection {
    let normalizedTemplateOptions = undefined;
    if (definition.templateOptions instanceof Object) {
      normalizedTemplateOptions = () => definition.templateOptions;
    } else if (definition.templateOptions instanceof Function) {
      normalizedTemplateOptions = definition.templateOptions;
    }

    return new Collection(
      definition.id,
      definition.categoryFn,
      normalizedTemplateOptions,
      definition.collectionPermalink || config.collectionPermalink,
      definition.categoryFirstPermalink || config.categoryFirstPermalink,
      definition.categoryPermalink || config.categoryPermalink,
      definition.pagination || config.pagination,
      definition.categorySorting || config.categorySorting,
      definition.contentSorting || config.contentSorting,
      definition.subCategorySeparator || config.subCategorySeparator
    );
  }

  private static defaultTemplateOptionsFn(): Object {
    return {};
  }
}

export interface IContentBelongsTo {
  category: Category,
  subCategories: Array<IContentBelongsTo>
}
