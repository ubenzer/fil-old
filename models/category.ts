import {ICategorySortingFn, IContentSortingFn} from "../lib/config";
import {SortingHelper} from "../lib/sortingHelper";
import {Content} from "./content";
import {Collection} from "./collection";

export class Category {
  id: string;
  title: string;

  categoryFirstPermalink: string;
  categoryPermalink: string;

  pagination: number;
  categorySortingFn: ICategorySortingFn;
  contentSortingFn: IContentSortingFn;

  parentCategory: Category;
  subCategories: Array<Category>;

  belongsToCollection: Collection;

  ownContents: Array<Content>;
  contents: Array<Content>;

  paginatedOwnContents: Array<Array<Content>>;
  paginatedContents: Array<Array<Content>>;

  constructor(
    id: string,
    title: string,
    categoryFirstPermalink: string,
    categoryPermalink: string,
    pagination: number,
    categorySortingFn: ICategorySortingFn,
    contentSortingFn: IContentSortingFn,
    belongsToCollection: Collection
  ) {
    this.id = id;
    this.title = title;
    this.categoryFirstPermalink = categoryFirstPermalink;
    this.categoryPermalink = categoryPermalink;
    this.pagination = pagination;
    this.categorySortingFn = categorySortingFn;
    this.contentSortingFn = contentSortingFn;
    this.belongsToCollection = belongsToCollection;

    this.parentCategory = null;
    this.subCategories = [];

    this.ownContents = [];
    this.contents = [];

    this.paginatedOwnContents = [];
    this.paginatedContents = [];
  }
  /**
   * Processes given content and update index accordingly
   * @param content to be registered as a member of this category
     */
  registerContent(content: Content): void {
    SortingHelper.putIntoSortedArray(this.ownContents, content, this.contentSortingFn);
    SortingHelper.putIntoSortedArray(this.contents, content, this.contentSortingFn);
    if (this.parentCategory !== null) {
      this.parentCategory.registerFromChild(content);
    }
  }

  registerFromChild(content: Content) {
    let indexOfContent = this.ownContents.indexOf(content);
    if (indexOfContent > -1) {
      this.ownContents.splice(indexOfContent, 1);
    } else {
      SortingHelper.putIntoSortedArray(this.contents, content, this.contentSortingFn);
    }

    if (this.parentCategory !== null) {
      this.parentCategory.registerFromChild(content);
    }
  }

  registerSubcategory(category: Category, parentCategory: Category): void {
    this.subCategories.push(category);
    category.parentCategory = parentCategory;
  }

  calculatePagination(): void {
    this.subCategories.forEach(c => c.calculatePagination());
    this.paginatedOwnContents = Category.chunk(this.ownContents, this.pagination);
    this.paginatedContents = Category.chunk(this.contents, this.pagination);
  }

  /**
   * Sort sub categories of this Category by the defined rule.
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
    this.subCategories.forEach(c => c.sortCategories());
    this.subCategories.sort(this.categorySortingFn);
  }

  private static chunk<T>(array: Array<T>, chunkSize: number): Array<Array<T>> {
    var tbReturned = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      tbReturned.push(array.slice(i, i + chunkSize));
    }
    return tbReturned;
  }
}
