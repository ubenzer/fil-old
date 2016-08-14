import * as fs from "fs-extra";
import * as glob from "glob";
import * as path from "path";
import {provide, TYPES} from "../inversify.config";
import {Config, IContentPermalinkCalculatorFnIn} from "../lib/config";
import {Content} from "./content";
import {inject} from "inversify";

let padleft = require("pad-left");
let slug = require("slug");
let frontMatter = require("front-matter");

@provide(TYPES.ContentStatic)
export class ContentStatic {
  constructor(
    @inject(TYPES.Config) private Config: Config
  ) {}

  /**
   * Creates a content reading from file
   * @param relativePath path relative to CONTENTS_DIR
     */
  fromFile(relativePath: string): Content {
    let inputFolder = this.getContentDirectory(relativePath);

    let fullPath = path.join(this.Config.CONTENTS_DIR, relativePath);
    let rawContent = fs.readFileSync(fullPath, "utf8");

    let doc = frontMatter(rawContent);
    let templateFile = (typeof doc.attributes.templateFile === "string") ? doc.attributes.templateFile : undefined;

    let createDate = doc.attributes.created;
    if (!(createDate instanceof Date)) {
      throw new Error(`${relativePath} has no create date.`);
    }

    let editDate = (doc.attributes.edited instanceof Date) ? doc.attributes.edited : new Date(createDate);

    let extractedTitleObject = this.extractTitleFromMarkdown(doc.body);

    let markdownContent = extractedTitleObject.content;
    let title = (typeof doc.attributes.title === "string") ? doc.attributes.title : extractedTitleObject.title;

    let fileId = this.getFileId(relativePath);
    let outputFolder = this.getTargetDirectory(fileId, title, createDate);

    return new Content(
      fileId,
      inputFolder,
      outputFolder,
      title,
      markdownContent,
      templateFile,
      createDate,
      editDate,
      doc.attributes
    );
  }

  /**
   * Creates content object representation for all
   * posts in CONTENTS_DIR
   * @returns {Array<Content>} Array of posts
     */
  fromPostsFolder(): Array<Content> {
    let posts = [];
    glob.sync("**/index.md", {cwd: this.Config.CONTENTS_DIR})
      .forEach((file) => {
        let post = this.fromFile(file);
        posts.push(post);
      });
    return posts;
  }

  /**
   * Returns content directory relative to CONTENTS_DIR
   * @param relativePath Content index.md file relative to CONTENTS_DIR
     */
  private getContentDirectory(relativePath: string): string {
    let paths = relativePath.split(path.sep);
    paths.pop();
    return paths.join(path.sep);
  }

  /**
   * Creates a content id based on content file path relative to CONTENTS_DIR
   * @param relativePath
     */
  private getFileId(relativePath: string): string {
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
  private getTargetDirectory(id: string, title: string, date: Date): string {
    let permalinkConfig: string|IContentPermalinkCalculatorFnIn = this.Config.getConfig().content.permalink;
    if (permalinkConfig instanceof Function) {
      return (<IContentPermalinkCalculatorFnIn>permalinkConfig)(id, title, date).replace(new RegExp("/", "g"), path.sep);
    }
    return this.defaultPermalinkFn(<string>permalinkConfig, title, date).replace(new RegExp("/", "g"), path.sep);
  }

  /**
   * Default implementation for replacing a permalink string with the real value
   * @param permalinkTemplateString :title, :day, :month, :year are valid (e.g. :year/:month)
   * @param postTitle
   * @param postCreateDate
   * @returns {string} Permalink string with real values
     */
  private defaultPermalinkFn(permalinkTemplateString: string, postTitle: string, postCreateDate: Date): string {
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
  private extractTitleFromMarkdown(markdown: string): IExtractedTitle {
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
