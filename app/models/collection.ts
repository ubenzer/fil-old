import {interfaces} from "inversify";
import {lazyInject, provideConstructor, TYPES} from "../core/inversify.config";
import {ICategorySortingFn, ICategorySortingObject, IContentSortingFn, IContentSortingObject} from "../lib/config";
import {SortingHelper} from "../lib/sortingHelper";
import {Category} from "./category";
import {CollectionStatic} from "./collection.static";
import {Content} from "./content";

@provideConstructor(TYPES.CollectionConstructor)
export class Collection {
  id: string;
  categoryIdGeneratorFunction: (content: Content) => Array<string>;

  collectionPermalink: string;
  categoryFirstPermalink: string;
  categoryPermalink: string;
  pagination: number;
  categorySorting: ICategorySortingObject|ICategorySortingFn;
  contentSorting: IContentSortingObject|IContentSortingFn;
  subCategorySeparator: string;
  categoryIdToNameFn: (id: string) => string;
  categories: Array<Category> = [];

  @lazyInject(TYPES.CollectionStatic) private _collectionStatic: CollectionStatic;
  @lazyInject(TYPES.SortingHelper) private _sortingHelper: SortingHelper;
  @lazyInject(TYPES.CategoryConstructor) private _category: interfaces.Newable<Category>;

  constructor(
    id: string,
    categoryIdGeneratorFunction: (content: Content) => Array<string> = null,
    collectionPermalink: string,
    categoryFirstPermalink: string,
    categoryPermalink: string,
    pagination: number,
    categorySorting: ICategorySortingObject|ICategorySortingFn,
    contentSorting: IContentSortingObject|IContentSortingFn,
    subCategorySeparator: string,
    categoryIdToNameFn: (id: string) => string = null
  ) {
    this.id = id;
    this.categoryIdGeneratorFunction = categoryIdGeneratorFunction || this.defaultCategoryIdGeneratorFn;
    this.collectionPermalink = collectionPermalink;
    this.categoryFirstPermalink = categoryFirstPermalink;
    this.categoryPermalink = categoryPermalink;
    this.pagination = pagination;
    this.categorySorting = categorySorting;
    this.contentSorting = contentSorting;
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
              this.createOrUpdateContentBelongsTo(parentContentBelongsToArray, currentCategory);

            parentContentBelongsToArray = contentBelongsToRelationship.subCategories;
            parentCategory = currentCategory;
          }
        );
      }
    );

    return contentBelongsTo;
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
    this.categories.sort(this._sortingHelper.getNormalizedCategorySortingFn(this.categorySorting));
  }

  calculatePagination(): void {
    this.categories.forEach(c => c.calculatePagination());
  }

  renderToFile(collections: Array<Collection>): void {
    this.categories.forEach(c => c.renderToFile(collections));

    // TODO RENDER COLLECTION PAGE
    // let builtTemplate = Template.renderContent(this);
    // let normalizedPath = path.join(Constants.OUTPUT_DIR, targetPath, HTML_PAGE_NAME);
    //
    // fs.outputFileSync(normalizedPath, builtTemplate);
  }

  /**
   * Creates (if not exists) and returns IContentBelongsTo.
   * Please note that belongsToArray will be mutated/updated.
   * @param belongsToArray A list of belongs relationships to check existence
   * @param category Belongs to relationship category
   * @return Existing or new IContentBelongsTo object
   */
  private createOrUpdateContentBelongsTo(belongsToArray: Array<IContentBelongsTo>, category: Category): IContentBelongsTo {
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

  /**
   * Returns the category with given id under parentCategory. If
   * category is not existent, it is created.
   *
   * This also registers new categories inside of parent category or collection
   *
   * @param parentCategory Category to search inside. (null means root for this content type)
   * @param categoryId as string
   * @returns _category object that represents categoryId
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

    let normalizedCategoryIdToNameFn = this.categoryIdToNameFn || this._collectionStatic.defaultCategoryIdToNameFn;

    let category = new this._category(
      categoryId,
      normalizedCategoryIdToNameFn(categoryId),
      this.categoryFirstPermalink,
      this.categoryPermalink,
      this.pagination,
      this._sortingHelper.getNormalizedCategorySortingFn(this.categorySorting),
      this._sortingHelper.getNormalizedContentSortingFn(this.contentSorting),
      this
    );

    if (parentCategory === null) {
      // register on Collection
      this.categories.push(category);
    } else {
      // register on parent category
      parentCategory.registerSubcategory(category);
    }

    return category;
  }

  private findCategoryById(lookupArray: Array<Category>, categoryId: string): Category {
    return lookupArray.find(c => c.id === categoryId);
  }

  private defaultCategoryIdGeneratorFn(content: Content): Array<string> {
    let maybeCollectionRelatedFrontmatter = content.taxonomy[this.id];
    if (typeof maybeCollectionRelatedFrontmatter === "string") {
      maybeCollectionRelatedFrontmatter = [maybeCollectionRelatedFrontmatter];
    }
    if (!(maybeCollectionRelatedFrontmatter instanceof Array)) {
      return [];
    }

    return maybeCollectionRelatedFrontmatter;
  }
}

export interface IContentBelongsTo {
  category: Category;
  subCategories: Array<IContentBelongsTo>;
}
