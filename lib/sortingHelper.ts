import {IContentSortingObject, IContentSortingFn, ICategorySortingObject, ICategorySortingFn} from "../lib/config";
import {Content} from "../models/content";
import {Category} from "../models/category";

export class SortingHelper {

  static getNormalizedContentSortingFn(contentSorting: IContentSortingObject|IContentSortingFn): IContentSortingFn {
    if (contentSorting instanceof Function) {
      return <IContentSortingFn>contentSorting;
    }

    let normalizedSortingFn = null;
    let sortingObj: IContentSortingObject = <IContentSortingObject>contentSorting;
    if (sortingObj.sortBy === "id") {
      normalizedSortingFn = SortingHelper.sortContentByIdFunction;
    } else if (sortingObj.sortBy === "title") {
      normalizedSortingFn = SortingHelper.sortContentByTitleFunction;
    } else if (sortingObj.sortBy === "date") {
      normalizedSortingFn = SortingHelper.sortContentByDateFunction;
    } else {
      throw new Error(`I don't know how to sort by ${sortingObj.sortBy}!`);
    }

    return (content1: Content, content2: Content): number => {
      let realSorting = normalizedSortingFn(content1, content2);
      if (sortingObj.reverse) {
        return realSorting * -1;
      }
      return realSorting;
    };
  }

  static getNormalizedCategorySortingFn(categorySorting: ICategorySortingObject|ICategorySortingFn): ICategorySortingFn {
    if (categorySorting instanceof Function) {
      return <ICategorySortingFn>categorySorting;
    }

    let normalizedSortingFn = null;
    let sortingObj: ICategorySortingObject = <ICategorySortingObject>categorySorting;
    if (sortingObj.sortBy === "id") {
      normalizedSortingFn = SortingHelper.sortCategoryByIdFunction;
    } else if (sortingObj.sortBy === "title") {
      normalizedSortingFn = SortingHelper.sortCategoryByTitleFunction;
    } else if (sortingObj.sortBy === "contentCount") {
      normalizedSortingFn = SortingHelper.sortCategoryByContentCountFunction;
    } else {
      throw new Error(`I don't know how to sort by ${sortingObj.sortBy}!`);
    }

    return (category1: Category, category2: Category): number => {
      let realSorting = normalizedSortingFn(category1, category2);
      if (sortingObj.reverse) {
        return realSorting * -1;
      }
      return realSorting;
    };
  }

  static putIntoSortedArray<T>(array: Array<T>, item: T, sortingFn: ((item1: T, item2: T) => number)) {
    if (array.length === 0) {
      array.push(item);
      return;
    }

    let currentIdx = 0;
    while (currentIdx < array.length && sortingFn(array[currentIdx], item) <= 0) {
      currentIdx++;
    }

    array.splice(currentIdx, 0, item);
  }

  private static sortContentByIdFunction(content1: Content, content2: Content): number {
    return content1.contentId.localeCompare(content2.contentId);
  }
  private static sortContentByTitleFunction(content1: Content, content2: Content): number {
    return content1.title.localeCompare(content2.title);
  }
  private static sortContentByDateFunction(content1: Content, content2: Content): number {
    return +(content1.createDate) - (+(content2.createDate));
  }

  private static sortCategoryByIdFunction(category1: Category, category2: Category): number {
    return category1.id.localeCompare(category2.id);
  }
  private static sortCategoryByTitleFunction(category1: Category, category2: Category): number {
    return category1.title.localeCompare(category2.title);
  }
  private static sortCategoryByContentCountFunction(category1: Category, category2: Category): number {
    return category1.contents.length - category2.contents.length;
  }
}
