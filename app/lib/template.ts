import {Config, IGeneralConfig, IConfigFile} from "./config";
import {Content} from "../models/content";
import {Category, IPaginatedCategory} from "../models/category";
import {Collection} from "../models/collection";
import * as jade from "jade";
import * as path from "path";
import {provide, TYPES} from "../inversify.config";
import {inject} from "inversify";

@provide(TYPES.Template)
export class Template {
  private config: IConfigFile;

  constructor(
    @inject(TYPES.Config) private Config: Config
  ) {
    this.config = Config.getConfig();
  }

  private templateGlobals: ITemplateGlobals = null;

  /**
   * Renders a content into html
   * @param content Content to be rendered
   * @param collections Whole available collections in the system
     */
  renderContent(content: Content, collections: Array<Collection>): string {
    let templateFile = path.join(this.Config.TEMPLATE_DIR, content.templateFile);
    let compileFn = jade.compileFile(templateFile, {pretty: true});

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
    let templateFile = path.join(this.Config.TEMPLATE_DIR, "index.jade");
    let compileFn = jade.compileFile(templateFile, {pretty: true});

    let locals: ICategoryPageTemplateVariables = {
      page: paginationInfo,
      category: category,
      global: this.getTemplateGlobals(collections)
    };
    return compileFn(locals);
  }

  renderTag(tagName: string, tagData: string): string {
    let templateFile = path.join(this.Config.TEMPLATE_DIR, "tags", `${tagName}.jade`);
    let compileFn = jade.compileFile(templateFile, {pretty: true});

    let locals: ITagTemplateVariables = {
      data: tagData
    };
    return compileFn(locals);
  }

  renderPage(filePath: string, collections: Array<Collection>) {
    let compileFn = jade.compileFile(filePath, {pretty: true});

    let locals: IPageTemplateVariables = {
      global: this.getTemplateGlobals(collections)
    };
    return compileFn(locals);
  }

  private getTemplateGlobals(collections: Array<Collection>): ITemplateGlobals {
    if (this.templateGlobals !== null) { return this.templateGlobals; }

    this.templateGlobals = {
      general: this.Config.getConfig().general,
      collections: collections,
      template: this.Config.getConfig().template
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
  template: any; // Free from config area, corresponds to config/template
}

interface ISingleContentTemplateVariables {
  global: ITemplateGlobals;
  content: Content;
}

interface ICategoryPageTemplateVariables {
  page: IPaginatedCategory,
  category: Category,
  global: ITemplateGlobals
}

interface IPageTemplateVariables {
  global: ITemplateGlobals
}
