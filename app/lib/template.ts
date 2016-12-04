import {inject} from "inversify";
import * as path from "path";
import * as pug from "pug";
import {provideSingleton, TYPES} from "../core/inversify.config";
import {Category, IPaginatedCategory} from "../models/category";
import {Collection} from "../models/collection";
import {Content} from "../models/content";
import {Config, IGeneralConfig} from "./config";

@provideSingleton(TYPES.Template)
export class Template {
  private templateGlobals: ITemplateGlobals = null;

  constructor(
    @inject(TYPES.Config) private _config: Config
  ) {}

  /**
   * Renders a content into html
   * @param content Content to be rendered
   * @param collections Whole available collections in the system
   */
  renderContent(content: Content, collections: Array<Collection>): string {
    let templateFile = path.join(this._config.TEMPLATE_DIR, content.templateFile);
    let compileFn = pug.compileFile(templateFile, {pretty: true});

    let locals: ISingleContentTemplateVariables = {
      content: content,
      global: this.getTemplateGlobals(collections)
    };
    return compileFn(locals);
  }

  /**
   * Renders a category page into html
   * @param category to be rendered
   * @param paginationInfo related to a specific page of that category
   * @param collections Whole available collections in the system
   */
  renderCategory(category: Category, paginationInfo: IPaginatedCategory, collections: Array<Collection>): string {
    // TODO
    let templateFile = path.join(this._config.TEMPLATE_DIR, "index.pug");
    let compileFn = pug.compileFile(templateFile, {pretty: true});

    let locals: ICategoryPageTemplateVariables = {
      category: category,
      global: this.getTemplateGlobals(collections),
      page: paginationInfo
    };
    return compileFn(locals);
  }

  renderTag(tagName: string, tagData: string): string {
    let templateFile = path.join(this._config.TEMPLATE_DIR, "tags", `${tagName}.pug`);
    let compileFn = pug.compileFile(templateFile, {pretty: true});

    let locals: ITagTemplateVariables = {
      data: tagData
    };
    return compileFn(locals);
  }

  renderPage(filePath: string, collections: Array<Collection>): string {
    let compileFn = pug.compileFile(filePath, {pretty: true});

    let locals: IPageTemplateVariables = {
      global: this.getTemplateGlobals(collections)
    };
    return compileFn(locals);
  }

  private getTemplateGlobals(collections: Array<Collection>): ITemplateGlobals {
    if (this.templateGlobals !== null) { return this.templateGlobals; }

    this.templateGlobals = {
      collections: collections,
      general: this._config.get().general,
      template: this._config.get().template
    };

    return this.templateGlobals;
  }
}

interface ITagTemplateVariables {
  data: string;
}
interface ITemplateGlobals {
  general: IGeneralConfig;
  collections: Array<Collection>;
  // tslint:disable-next-line: no-any
  template: any; // Free from config area, corresponds to config/template
}

interface ISingleContentTemplateVariables {
  global: ITemplateGlobals;
  content: Content;
}

interface ICategoryPageTemplateVariables {
  page: IPaginatedCategory;
  category: Category;
  global: ITemplateGlobals;
}

interface IPageTemplateVariables {
  global: ITemplateGlobals;
}
