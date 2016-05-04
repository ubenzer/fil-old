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

  ownPosts: Array<Content>;
  posts: Array<Content>;
  belongsToCollection: Collection;

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
    this.ownPosts = [];
    this.posts = [];
  }
  /**
   * Processes given content and update index accordingly
   * @param content to be registered as a member of this category
     */
  registerContent(content: Content): void {
    SortingHelper.putIntoSortedArray(this.ownPosts, content, this.contentSortingFn);
    SortingHelper.putIntoSortedArray(this.posts, content, this.contentSortingFn);
    if (this.parentCategory !== null) {
      this.parentCategory.registerFromChild(content);
    }
  }

  registerFromChild(content: Content) {
    let indexOfContent = this.ownPosts.indexOf(content);
    if (indexOfContent > -1) {
      this.ownPosts.splice(indexOfContent, 1);
    } else {
      SortingHelper.putIntoSortedArray(this.posts, content, this.contentSortingFn);
    }

    if (this.parentCategory !== null) {
      this.parentCategory.registerFromChild(content);
    }
  }
  registerSubcategory(category: Category, parentCategory: Category): void {
    SortingHelper.putIntoSortedArray(this.subCategories, category, this.categorySortingFn);
    category.parentCategory = parentCategory;
  }
}
