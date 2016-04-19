// import {Category} from "./category";
// import {Collection} from "./collection";

import fs = require("fs-extra");
import path = require("path");
import glob = require("glob");
import padleft = require("pad-left");

import {Config, IPostPermalinkCalculatorFnIn} from "../lib/config";
import {Constants} from "../constants";
import {Template} from "../lib/template";
import {ContentLookup} from "./postsLookup";
import {Rho} from "../lib/rho";
import {PostAsset} from "./postAsset";

let slug = require("slug");
let frontMatter = require("front-matter");

export class Post {
  contentRoot: string; // content directory root relative to POSTS_DIR
  title: string; // content title
  content: string; // original content
  templateFile: string; // which jade template to be used, relative to template folder
  createDate: Date; // content's original creation date
  editDate: Date; // content's last update date

  contentId: string; // content's id, using this it can be referenced
  contentOutFile: string; // content's final path, relative to OUTPUT_DIR

  htmlContent: string = null; // compiled html content, this is null, call calculateHtmlContent() once to fill this.

  fileAssets: Array<PostAsset>; // files attached to this content as array of file name relative to contentRoot
  // belongsTo: WeakMap<Collection, Array<Category>>;

  constructor(
    contentRoot: string,
    title: string,
    content: string,
    templateFile: string = "post.jade",
    createDate: Date,
    editDate: Date,
    contentId: string,
    contentOutFile: string,
    fileAssets: Array<PostAsset>
  ) {
    this.contentRoot = contentRoot;
    this.title = title;
    this.content = content;
    this.templateFile = templateFile;
    this.createDate = createDate;
    this.editDate = editDate;
    this.contentId = contentId;
    this.contentOutFile = contentOutFile;
    this.fileAssets = fileAssets;
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

  getUrl(): string {
    return "TODO";
  }

  /**
   * Creates a post reading from file
   * @param relativePath path relative to POSTS_DIR
     */
  static fromFile(relativePath: string): Post {
    let contentDirectory = Post.getContentDirectory(relativePath);

    let fullPath = path.join(Constants.POSTS_DIR, relativePath);
    let rawContent = fs.readFileSync(fullPath, "utf8");

    let doc = frontMatter(rawContent);
    let templateFile = (typeof doc.attributes.templateFile === "string") ? doc.attributes.templateFile : undefined;

    let createDate = doc.attributes.create;
    if (!(createDate instanceof Date)) {
      throw new Error(`${relativePath} has no create date.`);
    }

    let editDate = (doc.attributes.edit instanceof Date) ? doc.attributes.edit : new Date(createDate);

    let extractedTitleObject = Post.extractTitleFromMarkdown(doc.body);

    let markdownContent = extractedTitleObject.content;
    let title = (typeof doc.attributes.title === "string") ? doc.attributes.title : extractedTitleObject.title;

    let fileId = Post.getFileId(relativePath);
    let permalink = Post.getPermalink(fileId, title, createDate);

    let fileAssets = Post.getFileAssets(contentDirectory);

    return new Post(
      contentDirectory,
      title,
      markdownContent,
      templateFile,
      createDate,
      editDate,
      fileId,
      permalink,
      fileAssets
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
   * @param id
   * @param title
   * @param date
   * @returns {string} Permalink string with real values
     */
  private static getPermalink(id: string, title: string, date: Date): string {
    let permalinkConfig: string|IPostPermalinkCalculatorFnIn = Config.getConfig().post.permalink;
    if (permalinkConfig instanceof Function) {
      return (<IPostPermalinkCalculatorFnIn>permalinkConfig)(id, title, date);
    }
    return Post.defaultPermalinkFn(<string>permalinkConfig, title, date);
  }

  /**
   * Default implementation for replacing a permalink string with the real value
   * @param permalinkTemplateString :title, :day, :month, :year are valid (e.g. :year/index.html)
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
    let lines = markdown.split("\n").filter(l => l.trim().length > 0);
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

  /**
   * Retrieves a list of file names related to the content directory
   * @param contentDirectory
   * @returns Array<string> File names relative to content directory
     */
  private static getFileAssets(contentDirectory): Array<PostAsset> {
    return glob.sync("**/*", {cwd: path.join(Constants.POSTS_DIR, contentDirectory)})
      .filter(f => f !== "index.md")
      .map(fileName => new PostAsset(fileName));
  }
}

interface IExtractedTitle {
  title: string;
  content: string;
}
