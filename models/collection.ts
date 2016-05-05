import {IContentSortingObject, IContentSortingFn, ICategorySortingObject, ICategorySortingFn, ICollectionDefinitionFile, ICollectionConfigFile} from "../lib/config"
import {SortingHelper} from "../lib/sortingHelper";
import {Content} from "./content"
import {Category} from "./category"

export class Collection {
  id: string;
  categoryIdGeneratorFunction: (content: Content) => Array<string>;
  templateOptionsFn: (category: Category) => Object;

  collectionPermalink: string;
  categoryFirstPermalink: string;
  categoryPermalink: string;
  pagination: number;
  categorySortingFn: ICategorySortingFn;
  contentSortingFn: IContentSortingFn;
  subCategorySeparator: string;
  categoryIdToNameFn: (string) => string;

  categories: Array<Category> = [];

  constructor(
    id: string,
    categoryIdGeneratorFunction: (content: Content) => Array<string> = null,
    templateOptionsFn: (Category) => Object = Collection.defaultTemplateOptionsFn,
    collectionPermalink: string,
    categoryFirstPermalink: string,
    categoryPermalink: string,
    pagination: number,
    categorySorting: ICategorySortingObject|ICategorySortingFn,
    contentSorting: IContentSortingObject|IContentSortingFn,
    subCategorySeparator: string,
    categoryIdToNameFn: (string) => string = Collection.defaultCategoryIdToNameFn
  ) {
    this.id = id;
    this.categoryIdGeneratorFunction = categoryIdGeneratorFunction || this.defaultCategoryIdGeneratorFn;
    this.templateOptionsFn = templateOptionsFn;
    this.collectionPermalink = collectionPermalink;
    this.categoryFirstPermalink = categoryFirstPermalink;
    this.categoryPermalink = categoryPermalink;
    this.pagination = pagination;
    this.categorySortingFn = SortingHelper.getNormalizedCategorySortingFn(categorySorting);
    this.contentSortingFn = SortingHelper.getNormalizedContentSortingFn(contentSorting);
    this.subCategorySeparator = subCategorySeparator;
    this.categoryIdToNameFn = categoryIdToNameFn;
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

            if (isLast) {
              currentCategory.registerContent(content);
            }

            let contentBelongsToRelationship: IContentBelongsTo =
              createOrUpdateContentBelongsTo(parentContentBelongsToArray, currentCategory);

            parentContentBelongsToArray = contentBelongsToRelationship.subCategories;
            parentCategory = currentCategory;
          }
        );
      }
    );

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
   * Sort categories of this Collection by the defined rule.
   * Reason for need of calling this function separately is that
   * before completing to register all categories & contents first
   * may cause wrong sorting for sorting rules that depend on
   * stats of a certain category. (e.g. sorting category by
   * content count/subcategory count)
   *
   * This method does not return anything, changes order of
   * category arrays for collection and sub categories.
   */
  sortCategories(): void {
    this.categories.forEach(c => c.sortCategories());
    this.categories.sort(this.categorySortingFn);
  }

  calculatePagination(): void {
    this.categories.forEach(c => c.calculatePagination());
  }

  /**
   * Returns the category with given id under parentCategory. If
   * category is not existent, it is created.
   *
   * This also registers new categories inside of parent category or collection
   *
   * @param parentCategory Category to search inside. (null means root for this content type)
   * @param categoryId as string
   * @returns Category object that represents categoryId
     */
  private createGetCategory(parentCategory: Category, categoryId: string): Category {
    let maybeCategory = null;
    if (parentCategory === null) {
      maybeCategory = this.findCategoryById(this.categories, categoryId);
    } else {
      maybeCategory = this.findCategoryById(parentCategory.subCategories, categoryId);
    }

    if (maybeCategory instanceof Category) {
      return maybeCategory;
    }

    let category = new Category(
      categoryId,
      this.categoryIdToNameFn(categoryId),
      this.categoryFirstPermalink,
      this.categoryPermalink,
      this.pagination,
      this.categorySortingFn,
      this.contentSortingFn,
      this
    );

    if (parentCategory === null) {
      // register on Collection
      this.categories.push(category);
    } else {
      // register on parent category
      parentCategory.registerSubcategory(category, parentCategory);
    }

    return category;
  }

  private findCategoryById(lookupArray: Array<Category>, categoryId: string): Category {
    return lookupArray.find(c => c.id === categoryId);
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
      definition.subCategorySeparator || config.subCategorySeparator,
      definition.categoryIdToNameFn
    );
  }

  private static defaultTemplateOptionsFn(): Object {
    return {};
  }

  private static defaultCategoryIdToNameFn(id: string): string {
    return id;
  }
}

export interface IContentBelongsTo {
  category: Category,
  subCategories: Array<IContentBelongsTo>
}
