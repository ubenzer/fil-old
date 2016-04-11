// import {Category} from "./category";
// import {Collection} from "./collection";

import fs = require("fs-extra");
import path = require("path");
import glob = require("glob");
import padleft = require("pad-left");

import {Config, IPostPermalinkCalculatorFnIn} from "../lib/config";
import {Constants} from "../constants";
import {Template} from "../lib/template";

let slug = require("slug");
let rho = require("rho");
let frontMatter = require("front-matter");

export class Post {
  title: string; // content title
  content: string; // original content
  templateFile: string; // which jade template to be used, relative to template folder
  createDate: Date; // content's original creation date
  editDate: Date; // content's last update date

  contentId: string; // content's id, using this it can be referenced
  contentOutFile: string; // content's final path, relative to OUTPUT_DIR

  // belongsTo: WeakMap<Collection, Array<Category>>;

  constructor(
    title: string,
    content: string,
    templateFile: string = "post.jade",
    createDate: Date,
    editDate: Date,
    contentId: string,
    contentOutFile: string
  ) {
    this.title = title;
    this.content = content;
    this.templateFile = templateFile;
    this.createDate = createDate;
    this.editDate = editDate;
    this.contentId = contentId;
    this.contentOutFile = contentOutFile;
  }

  /**
   * Renders post and writes to specified file
   * @param targetPath Path relative to output folder
     */
  renderToFile(targetPath: string = this.contentOutFile): void {
    let builtTemplate = Template.renderPost(this);
    let normalizedPath = path.join(Constants.OUTPUT_DIR, targetPath);

    fs.outputFileSync(normalizedPath, builtTemplate);
  }

  /**
   * Renders original content as rendered html and returns it
   * @returns {string} rendered html content
   */
  getHtmlContent(): string {
    return rho.toHtml(this.content);
  }

  /**
   * Creates a post reading from file
   * @param relativePath path relative to POSTS_DIR
     */
  static fromFile(relativePath: string): Post {
    let fullPath = path.join(Constants.POSTS_DIR, relativePath);
    let rawContent = fs.readFileSync(fullPath, "utf8");

    let doc = frontMatter(rawContent);
    let templateFile = (typeof doc.attributes.templateFile === "string") ? doc.attributes.templateFile : undefined;

    let createDate = doc.attributes.create;
    if (!(createDate instanceof Date)) {
      throw new Error(`${relativePath} has no create date.`);
    }

    let editDate = (doc.attributes.edit instanceof Date) ? doc.attributes.edit : new Date(createDate);

    let extractedTitleObject = Post.exractTitleFromMarkdown(doc.body);

    let markdownContent = extractedTitleObject.content;
    let title = (typeof doc.attributes.title === "string") ? doc.attributes.title : extractedTitleObject.title;

    let fileId = Post.getFileId(relativePath);
    let permalink = Post.getPermalink(fileId, title, createDate);

    //post.writeToFile(`${fileNameWithoutExtension}.html`);
    return new Post(
      title,
      markdownContent,
      templateFile,
      createDate,
      editDate,
      fileId,
      permalink
    );
  }

  /**
   * Creates post object representation for all
   * posts in POSTS_DIR
   * @returns {Array<Post>} Array of posts
     */
  static fromPostsFolder(): Array<Post> {
    let posts = [];
    glob.sync("**/index.md", {cwd: Constants.POSTS_DIR})
      .forEach((file) => {
        let post = Post.fromFile(file);
        posts.push(post);
      });
    return posts;
  }

  /**
   * Creates a content id based on content file path relative to POSTS_DIR
   * @param relativePath
     */
  private static getFileId(relativePath: string): string {
    let paths = relativePath.split(path.sep);
    paths.pop();
    return paths.join("/");
  }

  private static getPermalink(id: string, title: string, date: Date): string {
    let permalinkConfig: string|IPostPermalinkCalculatorFnIn = Config.getConfig().post.permalink;
    if (permalinkConfig instanceof Function) {
      return (<IPostPermalinkCalculatorFnIn>permalinkConfig)(id, title, date);
    }
    return Post.defaultPermalinkFn(<string>permalinkConfig, title, date);
  }

  private static defaultPermalinkFn(permalinkTemplateString: string, postTitle: string, postCreateDate: Date): string {
    let slugTitle: string = slug(postTitle, slug.defaults.modes["rfc3986"]);
    let slugDay: string = padleft(postCreateDate.getDay().toString(), 2, "0");
    let slugMonth: string = padleft((postCreateDate.getMonth() + 1).toString(), 2, "0");
    let slugYear: string = postCreateDate.getFullYear().toString();

    return permalinkTemplateString
      .replace(new RegExp(":title", "g"), slugTitle)
      .replace(new RegExp(":day", "g"), slugDay)
      .replace(new RegExp(":month", "g"), slugMonth)
      .replace(new RegExp(":year", "g"), slugYear);
  }

  private static exractTitleFromMarkdown(markdown: string): IExtractedTitle {
    let lines = markdown.split("\n", 10).filter(l => l.trim().length > 0);
    if (lines.length === 0 || lines[0].length < 3 || lines[0].substr(0, 2) != "# ") {
      return {
        title: null,
        content: markdown
      };
    }

    let titleLine = lines.pop();
    return {
      title: titleLine.substr(2),
      content: lines.join("\n")
    };
  }
}

interface IExtractedTitle {
  title: string;
  content: string;
}
