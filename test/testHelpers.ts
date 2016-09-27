import {kernel, TYPES} from "../app/core/inversify.config";
import {Category} from "../app/models/category";
import {Content} from "../app/models/content";
import {interfaces} from "inversify";

export class Helper {
  static getMockContent(): Content {
    let _content = <interfaces.Newable<Content>>kernel.get(TYPES.ContentConstructor);
    return new _content("contentId", "inputFolder", "outputFolder", "title", "content", "template",
                        new Date("2000-01-01"), new Date("2010-01-01"), {}, true);
  }

  static getMockCategory(): Category {
    let _category = <interfaces.Newable<Category>>kernel.get(TYPES.CategoryConstructor);
    return new _category("id", "title", "categoryFirstPermalink", "categoryPermalink", 12,
                         () => { return 1; }, () => { return 2; }, {});
  }
}
