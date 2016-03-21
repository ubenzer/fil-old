// import {Category} from "./category";
// import {Collection} from "./collection";

// interface IPost {
//   title: string;
//   date: Date;
//   template: string;
//   templateOptions: Object;
//   permalink: String;
//
//   // belongsTo: WeakMap<Collection, Array<Category>>;
// }

import fs = require("fs");
import path = require("path");
import {Constants} from "../constants";
import {Template} from "../lib/template";

let rho = require("rho");
let frontMatter = require("front-matter");

export class Post {
  templateFile: string; // which jade template to be used, relative to template folder
  originalContent: string; // original content
  htmlContent: string; // html compiled content

  constructor(
    originalContent: string,
    htmlContent: string,
    templateFile: string = "post.jade"
  ) {
    this.originalContent = originalContent;
    this.htmlContent = htmlContent;
    this.templateFile = templateFile;
  }

  /**
   * Renders post and writes to specified file
   * @param targetPath Path relative to output folder
     */
  renderTo(targetPath: string): void {
    let builtTemplate = Template.renderPost(this);
    let normalizedPath = path.join(Constants.OUTPUT_DIR, targetPath);

    fs.writeFileSync(normalizedPath, builtTemplate);
  }

  /**
   * Creates a post reading from file
   * @param relativePath path relative to POSTS_DIR
     */
  static fromFile(relativePath: string): Post {
    let fullPath = path.join(Constants.POSTS_DIR, relativePath);
    let rawContent = fs.readFileSync(fullPath, "utf8");

    let doc = frontMatter(rawContent);
    let html = rho.toHtml(doc.body);
    let templateFile = (typeof doc.attributes.templateFile === "string") ? doc.attributes.templateFile : undefined;

    return new Post(doc.body, html, templateFile);
  }
}
