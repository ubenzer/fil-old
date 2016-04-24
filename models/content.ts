// import {Category} from "./category";
// import {Collection} from "./collection";

import fs = require("fs-extra");
import path = require("path");
import glob = require("glob");
import padleft = require("pad-left");

import {Config, IPostPermalinkCalculatorFnIn} from "../lib/config";
import {Constants} from "../constants";
import {Template} from "../lib/template";
import {ContentLookup} from "./contentLookup";
import {Rho} from "../lib/rho";
import {ContentAsset} from "./contentAsset";

let slug = require("slug");
let frontMatter = require("front-matter");

const HTML_PAGE_NAME = "index.html";

export class Content {
  contentId: string; // content's id, using this it can be referenced
  inputFolder: string; // content directory root relative to POSTS_DIR
  outputFolder: string; // content's final path, relative to OUTPUT_DIR

  title: string; // content title
  content: string; // original content
  templateFile: string; // which jade template to be used, relative to template folder
  createDate: Date; // content's original creation date
  editDate: Date; // content's last update date

  htmlContent: string = null; // compiled html content, this is null, call calculateHtmlContent() once to fill this.

  fileAssets: Array<ContentAsset>; // files attached to this content as array of file name relative to inputFolder
  // belongsTo: WeakMap<Collection, Array<Category>>;

  constructor(
    contentId: string,
    inputFolder: string,
    outputFolder: string,
    title: string,
    content: string,
    templateFile: string = "post.jade",
    createDate: Date,
    editDate: Date
  ) {
    this.inputFolder = inputFolder;
    this.title = title;
    this.content = content;
    this.templateFile = templateFile;
    this.createDate = createDate;
    this.editDate = editDate;
    this.contentId = contentId;
    this.outputFolder = outputFolder;
    this.fileAssets = this.initFileAssets();
  }

  /**
   * Renders post and writes to specified file
   * @param targetPath Path relative to output folder
     */
  renderToFile(targetPath: string = this.outputFolder): void {
    let builtTemplate = Template.renderPost(this);
    let normalizedPath = path.join(Constants.OUTPUT_DIR, targetPath, HTML_PAGE_NAME);

    fs.outputFileSync(normalizedPath, builtTemplate);
  }

  /**
   * Renders original content as rendered html, sets htmlContent
   * field of this post object and returns it
   * @param {ContentLookup} contentLookup object that is going
   * to be used to resolve references to file assets and other contents.
   * @returns {string} rendered html content
   */
  calculateHtmlContent(contentLookup: ContentLookup): string {
    let compiler = new Rho(this, contentLookup);
    this.htmlContent = compiler.toHtml();
    return this.htmlContent;
  }

  /**
   * Returns permalink URL for this Content. This can be used to reference
   * this post in compiled output.
   * @returns {string}
     */
  getUrl(): string {
    return `${this.outputFolder.replace(new RegExp(path.sep, "g"), "/")}/${HTML_PAGE_NAME}`;
  }

  /**
   * Finds assets associated with this content and initializes them
   * @returns Array<ContentAsset> ContentAsset objects
   */
  private initFileAssets(): Array<ContentAsset> {
    return glob.sync("**/*", {cwd: path.join(Constants.POSTS_DIR, this.inputFolder)})
      .filter(f => f !== "index.md")
      .map(fileName => new ContentAsset(fileName, this));
  }

  /**
   * Creates a post reading from file
   * @param relativePath path relative to POSTS_DIR
     */
  static fromFile(relativePath: string): Content {
    let inputFolder = Content.getContentDirectory(relativePath);

    let fullPath = path.join(Constants.POSTS_DIR, relativePath);
    let rawContent = fs.readFileSync(fullPath, "utf8");

    let doc = frontMatter(rawContent);
    let templateFile = (typeof doc.attributes.templateFile === "string") ? doc.attributes.templateFile : undefined;

    let createDate = doc.attributes.created;
    if (!(createDate instanceof Date)) {
      throw new Error(`${relativePath} has no create date.`);
    }

    let editDate = (doc.attributes.edited instanceof Date) ? doc.attributes.edited : new Date(createDate);

    let extractedTitleObject = Content.extractTitleFromMarkdown(doc.body);

    let markdownContent = extractedTitleObject.content;
    let title = (typeof doc.attributes.title === "string") ? doc.attributes.title : extractedTitleObject.title;

    let fileId = Content.getFileId(relativePath);
    let outputFolder = Content.getTargetDirectory(fileId, title, createDate);

    return new Content(
      fileId,
      inputFolder,
      outputFolder,
      title,
      markdownContent,
      templateFile,
      createDate,
      editDate
    );
  }

  /**
   * Creates post object representation for all
   * posts in POSTS_DIR
   * @returns {Array<Content>} Array of posts
     */
  static fromPostsFolder(): Array<Content> {
    let posts = [];
    glob.sync("**/index.md", {cwd: Constants.POSTS_DIR})
      .forEach((file) => {
        let post = Content.fromFile(file);
        posts.push(post);
      });
    return posts;
  }

  /**
   * Returns content directory relative to POSTS_DIR
   * @param relativePath Content index.md file relative to POSTS_DIR
     */
  private static getContentDirectory(relativePath: string): string {
    let paths = relativePath.split(path.sep);
    paths.pop();
    return paths.join(path.sep);
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

  /**
   * Calls custom permalink generation function or default permalink function
   * depending on the configuration that is provided by Config.getConfig
   * converts permalink to a folder structure
   * @param id
   * @param title
   * @param date
   * @returns {string} Permalink string with real values
     */
  private static getTargetDirectory(id: string, title: string, date: Date): string {
    let permalinkConfig: string|IPostPermalinkCalculatorFnIn = Config.getConfig().post.permalink;
    if (permalinkConfig instanceof Function) {
      return (<IPostPermalinkCalculatorFnIn>permalinkConfig)(id, title, date).replace(new RegExp("/", "g"), path.sep);
    }
    return Content.defaultPermalinkFn(<string>permalinkConfig, title, date).replace(new RegExp("/", "g"), path.sep);
  }

  /**
   * Default implementation for replacing a permalink string with the real value
   * @param permalinkTemplateString :title, :day, :month, :year are valid (e.g. :year/:month)
   * @param postTitle
   * @param postCreateDate
   * @returns {string} Permalink string with real values
     */
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

  /**
   * Extracts first h1 heading from markdown and returns
   * the title and the rest separately.
   * @param markdown string
   * @returns {IExtractedTitle} Separated title and content
     */
  private static extractTitleFromMarkdown(markdown: string): IExtractedTitle {
    let lines = markdown.split("\n");

    // remove empty lines in the beginning
    while (lines.length > 0 && lines[0].trim().length === 0) {
      lines.shift();
    }

    if (lines.length === 0 || lines[0].length < 3 || lines[0].substr(0, 2) != "# ") {
      return {
        title: null,
        content: lines.join("\n")
      };
    }

    let titleLine = lines.shift();
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
