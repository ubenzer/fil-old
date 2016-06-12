import fs = require("fs-extra");
import path = require("path");

import {ICategorySortingFn, IContentSortingFn} from "../lib/config";
import {SortingHelper} from "../lib/sortingHelper";
import {Content} from "./content";
import {Collection} from "./collection";
import {Constants} from "../constants";
import {Template} from "../lib/template";

let slug = require("slug");

const HTML_PAGE_NAME = "index.html";

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

  paginatedContents: Array<IPaginatedCategory>;

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
    let paginatedContents = Category.chunk(this.contents, this.pagination);

    this.paginatedContents = paginatedContents.map(
      (paginatedContents, index, array): IPaginatedCategory => {
        // previous permalink and first page calculation
        let prevPagePermalink = null;
        let firstPagePermalink = Category.generatePermalink(this.categoryFirstPermalink, this, 1);

        let isFirstPage = true;
        if (index > 1) {
          prevPagePermalink = Category.generatePermalink(this.categoryPermalink, this, index);
          isFirstPage = false;
        } else if (index === 1) {
          prevPagePermalink = firstPagePermalink;
          isFirstPage = false;
        }

        // current permalink calculation
        let permalink = null;
        if (index === 0) {
          permalink = Category.generatePermalink(this.categoryFirstPermalink, this, 1);
        } else {
          permalink = Category.generatePermalink(this.categoryPermalink, this, index + 1);
        }

        let outputFolder = permalink.replace(new RegExp("/", "g"), path.sep);

        // next permalink and last page calculation
        let nextPagePermalink = null;
        let lastPagePermalink = Category.generatePermalink(this.categoryPermalink, this, array.length);
        let isLastPage = true;
        if (index < array.length - 1) {
          nextPagePermalink = Category.generatePermalink(this.categoryPermalink, this, index + 2);
          isLastPage = false;
        }

        return {
          outputFolder: outputFolder,
          url: permalink,
          firstPageUrl: firstPagePermalink,
          previousPageUrl: prevPagePermalink,
          nextPageUrl: nextPagePermalink,
          lastPageUrl: lastPagePermalink,
          isFirstPage: isFirstPage,
          isLastPage: isLastPage,
          pageNumber: index + 1,
          numberOfPages: paginatedContents.length,
          contents: paginatedContents
        }
      }
    );
  }

  renderToFile(collections: Array<Collection>): void {
    this.subCategories.forEach(c => c.renderToFile(collections));

    this.paginatedContents.forEach(
      paginatedContent => {
        let builtTemplate = Template.renderCategory(this, paginatedContent, collections);
        let normalizedPath = path.join(Constants.OUTPUT_DIR, paginatedContent.outputFolder, HTML_PAGE_NAME);

        fs.outputFileSync(normalizedPath, builtTemplate);
      }
    );
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

  /**
   * Converts a Category permalink template into actual permalink
   * @param permalinkTemplateString :collection, :category, :thisCategory, :page are valid
   * @param category object that is used to create permalink
   * @param page current page
   * @returns {string} Permalink string with real values
   */
  private static generatePermalink(permalinkTemplateString: string, category: Category, page: number): string {
    let slugCollection: string = slug(category.belongsToCollection.id, slug.defaults.modes["rfc3986"]);
    let slugSingleCategory: string = slug(category.id, slug.defaults.modes["rfc3986"]);
    let slugPage: string = page.toString();

    let categorySlugsArray = [slugSingleCategory];
    let currentCategory = category.parentCategory;
    while (currentCategory !== null) {
      categorySlugsArray.unshift(slug(currentCategory.id, slug.defaults.modes["rfc3986"]));
      currentCategory = currentCategory.parentCategory;
    }
    let slugCategory = categorySlugsArray.join("/");

    return permalinkTemplateString
      .replace(new RegExp(":category", "g"), slugCategory)
      .replace(new RegExp(":collection", "g"), slugCollection)
      .replace(new RegExp(":thisCategory", "g"), slugSingleCategory)
      .replace(new RegExp(":page", "g"), slugPage);
  }
}

export interface IPaginatedCategory {
  outputFolder: string;

  url: string;
  firstPageUrl: string;
  previousPageUrl: string;
  nextPageUrl: string;
  lastPageUrl: string;

  isFirstPage: boolean;
  isLastPage: boolean;
  pageNumber: number;
  numberOfPages: number;

  contents: Array<Content>;
}
