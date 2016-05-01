import {Content} from "./content"
import {Collection} from "./collection";

export class Category {
  title: string;

  categoryFirstPermalink: string;
  categoryPermalink: string;

  subCategories: Array<Category>;

  ownPosts: Array<Content>;
  posts: Array<Content>;
  belongsToCollection: Collection;

  /**
   * Processes given content and update index accordingly
   * @param content to be registered as a member of this category
   * @param isOwnContent Is this content belongs directly to this
   * category, or is it part of this category because of another
   * thing (e.g. a subCategory has this item)
     */
  registerContent(content: Content, isOwnContent: boolean): void {
    // TODO
  }
}
