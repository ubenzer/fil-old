import {Config} from "../lib/config";
import {Content} from "../models/content";
import {Category, IPaginatedCategory} from "../models/category";
import {Constants} from "../constants";
import {Collection} from "../models/collection";

import jade = require("jade");
import path = require("path");

export class Template {
  private static templateGlobals: ITemplateGlobals = null;

  /**
   * Renders a content into html
   * @param content Content to be rendered
   * @param collections Whole available collections in the system
     */
  static renderContent(content: Content, collections: Array<Collection>): string {
    let templateFile = path.join(Constants.TEMPLATE_DIR, content.templateFile);
    let compileFn = jade.compileFile(templateFile, {pretty: true});

    let locals: ISingleContentTemplateVariables = {
      content: content,
      global: Template.getTemplateGlobals(collections)
    };
    return compileFn(locals);
  }

  /**
   * Renders a category page into html
   * @param category to be rendered
   * @param paginationInfo related to a specific page of that category
   * @param collections Whole available collections in the system
   */
  static renderCategory(category: Category, paginationInfo: IPaginatedCategory, collections: Array<Collection>): string {
    // TODO
    let templateFile = path.join(Constants.TEMPLATE_DIR, "index.jade");
    let compileFn = jade.compileFile(templateFile, {pretty: true});

    let locals: ICategoryPageTemplateVariables = {
      page: paginationInfo,
      category: category,
      global: Template.getTemplateGlobals(collections)
    };
    return compileFn(locals);
  }

  private static getTemplateGlobals(collections: Array<Collection>): ITemplateGlobals {
    if (Template.templateGlobals !== null) { return Template.templateGlobals; }

    Template.templateGlobals = {
      imgRoot: path.relative(Constants.OUTPUT_DIR, Constants.TEMPLATE_IMAGES_OUT_DIR).replace(path.sep, "/"),
      cssFilePath: path.relative(Constants.OUTPUT_DIR, Constants.TEMPLATE_CSS_OUT_FILE).replace(path.sep, "/"),
      jsRootPath: path.relative(Constants.OUTPUT_DIR, Constants.TEMPLATE_SCRIPTS_OUT_DIR).replace(path.sep, "/"),
      collections: collections,
      template: Config.getConfig().template
    };

    return Template.templateGlobals;
  }
}

interface ITemplateGlobals {
  imgRoot: string;
  cssFilePath: string;
  jsRootPath: string;
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


