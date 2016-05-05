import {Content} from "../models/content";
import {Category, IPaginatedCategory} from "../models/category";
import {Constants} from "../constants";

import jade = require("jade");
import path = require("path");

export class Template {
  private static templateGlobals: ITemplateGlobals = null;

  /**
   * Renders a content into html
   * @param content Content to be rendered
     */
  static renderContent(content: Content): string {
    let templateFile = path.join(Constants.TEMPLATE_DIR, content.templateFile);
    let compileFn = jade.compileFile(templateFile, {pretty: true});

    let locals: ISingleContentTemplateVariables = {
      content: content,
      global: Template.getTemplateGlobals()
    };
    return compileFn(locals);
  }

  /**
   * Renders a category page into html
   * @param category to be rendered
   * @param paginationInfo related to a specific page of that category
   */
  static renderCategory(category: Category, paginationInfo: IPaginatedCategory): string {
    // TODO
    let templateFile = path.join(Constants.TEMPLATE_DIR, "index.jade");
    let compileFn = jade.compileFile(templateFile, {pretty: true});

    let locals: ICategoryPageTemplateVariables = {
      page: paginationInfo,
      category: category,
      global: Template.getTemplateGlobals()
    };
    return compileFn(locals);
  }

  private static getTemplateGlobals(): ITemplateGlobals {
    if (Template.templateGlobals !== null) { return Template.templateGlobals; }

    Template.templateGlobals = {
      imgRoot: path.relative(Constants.OUTPUT_DIR, Constants.TEMPLATE_IMAGES_OUT_DIR).replace(path.sep, "/"),
      cssFilePath: path.relative(Constants.OUTPUT_DIR, Constants.TEMPLATE_CSS_OUT_FILE).replace(path.sep, "/"),
    };

    return Template.templateGlobals;
  }
}

interface ITemplateGlobals {
  imgRoot: string;
  cssFilePath: string;
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


