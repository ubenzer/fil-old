import {Post} from "../models/post";
import {Constants} from "../constants";

import jade = require("jade");
import path = require("path");

export class Template {
  private static templateGlobals: ITemplateGlobals = null;

  /**
   * Renders a post into html
   * @param post Post to be rendered
     */
  static renderPost(post: Post): string {
    let templateFile = path.join(Constants.TEMPLATE_DIR, post.templateFile);
    let compileFn = jade.compileFile(templateFile, {pretty: true});

    let locals: IPostTemplateLocalsInterface = {
      post: post,
      global: Template.getTemplateGlobals()
    };
    return compileFn(locals);
  }

  private static getTemplateGlobals(): ITemplateGlobals {
    if (Template.templateGlobals !== null) { return Template.templateGlobals; }

    Template.templateGlobals = {
      imgRoot: path.relative(Constants.OUTPUT_DIR, Constants.TEMPLATE_IMAGES_OUT_DIR).replace(path.delimiter, "/"),
      cssFilePath: path.relative(Constants.OUTPUT_DIR, Constants.TEMPLATE_CSS_OUT_FILE).replace(path.delimiter, "/"),
    };

    return Template.templateGlobals;
  }
}

interface ITemplateGlobals {
  imgRoot: string;
  cssFilePath: string;
}

interface IPostTemplateLocalsInterface {
  global: ITemplateGlobals;
  post: Post;
}


