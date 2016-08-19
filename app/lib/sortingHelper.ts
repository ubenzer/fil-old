import {provideSingleton, TYPES} from "../core/inversify.config";
import {Category} from "../models/category";
import {Content} from "../models/content";
import {ICategorySortingFn, ICategorySortingObject, IContentSortingFn, IContentSortingObject} from "./config";

@provideSingleton(TYPES.SortingHelper)
export class SortingHelper {

  getNormalizedContentSortingFn(contentSorting: IContentSortingObject|IContentSortingFn): IContentSortingFn {
    if (contentSorting instanceof Function) {
      return <IContentSortingFn>contentSorting;
    }

    let normalizedSortingFn = null;
    let sortingObj: IContentSortingObject = <IContentSortingObject>contentSorting;
    if (sortingObj.sortBy === "id") {
      normalizedSortingFn = this.sortContentByIdFunction;
    } else if (sortingObj.sortBy === "title") {
      normalizedSortingFn = this.sortContentByTitleFunction;
    } else if (sortingObj.sortBy === "date") {
      normalizedSortingFn = this.sortContentByDateFunction;
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

  getNormalizedCategorySortingFn(categorySorting: ICategorySortingObject|ICategorySortingFn): ICategorySortingFn {
    if (categorySorting instanceof Function) {
      return <ICategorySortingFn>categorySorting;
    }

    let normalizedSortingFn = null;
    let sortingObj: ICategorySortingObject = <ICategorySortingObject>categorySorting;
    if (sortingObj.sortBy === "id") {
      normalizedSortingFn = this.sortCategoryByIdFunction;
    } else if (sortingObj.sortBy === "title") {
      normalizedSortingFn = this.sortCategoryByTitleFunction;
    } else if (sortingObj.sortBy === "contentCount") {
      normalizedSortingFn = this.sortCategoryByContentCountFunction;
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

  putIntoSortedArray<T>(array: Array<T>, item: T, sortingFn: ((item1: T, item2: T) => number)): void {
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

  private sortContentByIdFunction(content1: Content, content2: Content): number {
    return content1.contentId.localeCompare(content2.contentId);
  }
  private sortContentByTitleFunction(content1: Content, content2: Content): number {
    return content1.title.localeCompare(content2.title);
  }
  private sortContentByDateFunction(content1: Content, content2: Content): number {
    return +(content1.createDate) - (+(content2.createDate));
  }

  private sortCategoryByIdFunction(category1: Category, category2: Category): number {
    return category1.id.localeCompare(category2.id);
  }
  private sortCategoryByTitleFunction(category1: Category, category2: Category): number {
    return category1.title.localeCompare(category2.title);
  }
  private sortCategoryByContentCountFunction(category1: Category, category2: Category): number {
    return category1.contents.length - category2.contents.length;
  }
}
