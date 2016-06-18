import * as s from "string";
import {ContentLookup} from "../models/contentLookup";
import {Content} from "../models/content";
import {Config} from "./config";
import {ImageResizer} from "./imageResizer";
import * as mime from "mime";
import * as path from "path";

enum ParserState {CONTENT_ID, ASSET_ID}
const CLOSE_DELIMITER = "@";
let config = Config.getConfig();

/**
 * This class wraps original rho project and does the following changes:
 *
 * 1. Alter how images and links are compiled. Urls are resolved via a `ContentLookup`
 *    object. This enables in-project linking.
 *
 *    To access a content use:
 *    @path/to/content/folder
 *
 *    To access a content asset use:
 *    @path/to/content/folder@/asset/address.jpg
 *
 *    To access own content's asset use:
 *    asset/address.jpg
 *
 *    To give 3rd party link use;
 *    //site.com
 *    https://site.com
 *    http://site.com
 *
 *    If a reference is pointing to non-existing content or content asset compiler will throw an error.
 *
 * 2. You can add 'flags' to links and images using the following syntax:
 *
 *    ![title](url){flags,separated,by,comma}
 *    [title](url){flags,separated,by,comma}
 *
 *    This flags can be used by template engine to do something magical. (or can be used as classes)
 *
 */
export class Rho {
  private post: Content;
  private contentLookup: ContentLookup;
  private blockCompiler: any;

  constructor(post: Content, contentLookup: ContentLookup) {
    this.post = post;
    this.contentLookup = contentLookup;

    this.setupRho();
  }

  private checkOwnUrl(url: string): boolean {
    let sUrl = s(url);
    return !(sUrl.length === 0 || sUrl.contains("://") || sUrl.startsWith("//"));
  }

  private normalizeUrl(urlWithReference: string): string {
    if (urlWithReference[0] !== "@") {
      let postContent = this.contentLookup.getContentAssetByContent(this.post, urlWithReference);
      if (postContent === null) {
        throw new Error(`Cannot resolve content asset in ${urlWithReference}`);
      }
      return postContent.getUrl();
    }

    let charArray = urlWithReference.split("");
    charArray.shift(); // throw first @ away

    let contentId: string = "";
    let assetId: string = "";
    let parserState = ParserState.CONTENT_ID;

    while(charArray.length > 0) {
      let char = charArray.shift();

      if (char === CLOSE_DELIMITER && parserState === ParserState.CONTENT_ID) {
        parserState = ParserState.ASSET_ID;
      } else {
        if (parserState === ParserState.CONTENT_ID) {
          contentId += char;
        } else {
          if (assetId.length > 0 || char !== "/") { // skip first / in asset id
            assetId += char;
          }
        }
      }
    }

    let post = this.contentLookup.getContentById(contentId);
    if (post === null) {
      throw new Error(`Cannot resolve content in ${urlWithReference}`);
    }

    if (assetId.length === 0) {
      return post.getUrl();
    }

    let postContent = this.contentLookup.getContentAssetByContent(post, assetId);
    if (postContent === null) {
      throw new Error(`Cannot resolve content asset in ${urlWithReference}`);
    }
    return postContent.getUrl();
  }

  private resolveUrl(url: string): string {
    if (!this.checkOwnUrl(url)) { return url; }
    return this.normalizeUrl(url);
  }

  private setupRho() {
    let rho = require("rho");
    let rhoClass = this;

    let InlineCompiler = function(opts) { rho.InlineCompiler.call(this, opts); };
    InlineCompiler.prototype = rho.InlineCompiler.prototype;

    let BlockCompiler = function():void { rho.BlockCompiler.call(this); };
    rho.BlockCompiler.prototype.InlineCompiler = InlineCompiler;
    BlockCompiler.prototype = rho.BlockCompiler.prototype;

    // ENHANCE IMAGE
    InlineCompiler.prototype.tryImg = function(walk) {
      let self = this;
      if (!walk.at("![")) { return false; }
      // Try to find the ]
      walk.skip(2);
      let start = walk.position;
      let endAlt = walk.indexOf("]");
      if (endAlt === null) {
        this.out.push("![");
        return true;
      }
      // Collecting the text up to ] and matching further
      let text = walk.yieldUntil(endAlt);
      walk.skip();

      // Try to match image url
      if (!walk.at("(")) {
        nothingMatched();
        return true;
      }
      let endUrl = walk.indexOf(")");
      if (endUrl === null) {
        nothingMatched();
        return true;
      }
      walk.skip(1); // (
      let src = walk.yieldUntil(endUrl);
      walk.skip(1); // )

      // Try to match image type but it is not mandatory
      let pushClosingBracketAfterEmitting = false;
      let imageTypes = [];

      if (walk.at("{")) {
        walk.skip(1); // [
        let endType = walk.indexOf("}");
        if (endType === null) {
          pushClosingBracketAfterEmitting = true;
        } else {
          imageTypes = walk.yieldUntil(endType).split(",");
          walk.skip(); // ]
        }
      }

      this.emitImg(text, src, imageTypes);
      if (pushClosingBracketAfterEmitting) {
        this.out.push("{");
      }
      return true;
      // Nothing matched -- rolling back and processing text normally
      function nothingMatched() {
        walk.startFrom(start);
        self.out.push("![");
        return true;
      }
    };
    InlineCompiler.prototype.emitImg = function(alt, src, types) {
      let escapedAlt = s(alt).escapeHTML().s;
      let escapedTypesArr = types.map(type => s(type).trim().escapeHTML().s);

      src = rhoClass.resolveUrl(src);

      if (ImageResizer.IMAGE_EXTENSIONS.indexOf(path.extname(src)) > -1) {
        this.out.push(`<picture>\n`);

        config.media.imageExtensions.forEach((extension) => {
          let srcset: Array<string> = [];
          let mimeType = mime.lookup(extension);

          config.media.imageWidths.forEach((width) => {
            let srcSetDefinition = `${ImageResizer.getResizedUrl(src, width, extension)} ${width}w`;
            srcset.push(srcSetDefinition);
          });
          this.out.push(`<source type="${mimeType}" srcset="${srcset.join(",")}">\n`);
        });

        let srcset: Array<string> = [];
        config.media.imageWidths.forEach((width) => {
          let srcSetDefinition = `${ImageResizer.getResizedUrl(src, width)} ${width}w`;
          srcset.push(srcSetDefinition);
        });
        this.out.push(`<img src="${src}" srcset="${srcset.join(",")}" alt="${escapedAlt}" title="${escapedAlt}"`);

        if (escapedTypesArr.length > 0) {
          if (escapedTypesArr.indexOf("left") === -1 && escapedTypesArr.indexOf("right") === -1 &&
            escapedTypesArr.indexOf("center") === -1) {
            escapedTypesArr.push("center");
          }
          this.out.push(` class="${escapedTypesArr.join(" ")}"`);
        }

        this.out.push(`>\n`);
        this.out.push(`</picture>\n`);
      } else {
        this.out.push(`<img src="${src}" alt="${escapedAlt}" title="${escapedAlt}"`);

        if (escapedTypesArr.length > 0) {
          if (escapedTypesArr.indexOf("left") === -1 && escapedTypesArr.indexOf("right") === -1 &&
            escapedTypesArr.indexOf("center") === -1) {
            escapedTypesArr.push("center");
          }
          this.out.push(` class="${escapedTypesArr.join(" ")}"`);
        }

        this.out.push(`>\n`);
      }
    };

    // ENHANCE A
    /* Links and images are resolved from supplied options. */

    InlineCompiler.prototype.emitLink = function(text, link, flags) {
      let escapedFlagsArr = flags.map(flag => s(flag).trim().escapeHTML().s);
      let innerLinkHtml = new InlineCompiler(this.options).toHtml(text);

      link = rhoClass.resolveUrl(link);

      // TODO we need to move html creation to jade at some point
      this.out.push(`<a href="${link}"${escapedFlagsArr.indexOf("new")>-1?"{ target='_blank'}":""}>${innerLinkHtml}</a>`);
    };

    InlineCompiler.prototype.tryHeadlessLink = function(walk) {
      if (!walk.at("[[")) { return false; }
      walk.skip(2);
      let linkEnd = walk.indexOf("]]");
      // ]] not found, emitting
      if (linkEnd === null) {
        this.out.push("[[");
        return true;
      }
      let link = walk.yieldUntil(linkEnd);
      walk.skip(2);

      // Try to match flags but it is not mandatory
      let pushClosingBracketAfterEmitting = false;
      let flagsFound = [];

      if (walk.at("[")) {
        walk.skip(1); // [
        let endType = walk.indexOf("]");
        if (endType === null) {
          pushClosingBracketAfterEmitting = true;
        } else {
          flagsFound = walk.yieldUntil(endType).split(",");
          walk.skip(); // ]
        }
      }

      this.emitLink(link, link, flagsFound);
      if (pushClosingBracketAfterEmitting) {
        this.out.push("[");
      }
      return true;
    };

    InlineCompiler.prototype.tryLink = function(walk) {
      let self = this;

      if (!walk.at("[")) { return false; }
      // Try to find the ]
      walk.skip();
      let start = walk.position;
      let endText = walk.lookahead(function(w) {
        let nested = 0;
        let found = false;
        while (!found && w.hasCurrent()) {
          if (w.at("\\")) {
            w.skip(2);
          } else if (w.at("![")) {
            nested += 1;
            w.skip(2);
          } else if (w.at("]")) {
            if (nested === 0) {
              found = true;
            } else {
              nested -= 1;
              w.skip();
            }
          } else {
            w.skip();
          }
        }
        return found ? w.position : null;
      });
      if (endText === null) {
        this.out.push("[");
        return true;
      }
      // Collecting the text up to ] and matching further
      let text = walk.yieldUntil(endText);
      walk.skip();

      if (!walk.at("(")) {
        nothingMatched();
        return true;
      }
      let endHref = walk.indexOf(")");
      if (endHref === null) {
        nothingMatched();
        return false;
      }

      walk.skip(1); // (
      let href = walk.yieldUntil(endHref);
      walk.skip(1); // )

      // Try to match flags but it is not mandatory
      let pushClosingBracketAfterEmitting = false;
      let flagsFound = [];

      if (walk.at("{")) {
        walk.skip(1); // [
        let endFlags = walk.indexOf("}");
        if (endFlags === null) {
          pushClosingBracketAfterEmitting = true;
        } else {
          flagsFound = walk.yieldUntil(endFlags).split(",");
          walk.skip(); // ]
        }
      }

      this.emitLink(text, href, flagsFound);
      if (pushClosingBracketAfterEmitting) {
        this.out.push("{");
      }
      return true;

      // Nothing matched -- rolling back and processing text normally
      function nothingMatched() {
        walk.startFrom(start);
        self.out.push("[");
        return true;
      }
    };

    // CLEANUP UNUSED ORIGINAL METHODS
    delete InlineCompiler.prototype.tryInlineImg;
    delete InlineCompiler.prototype.tryRefImg;
    delete InlineCompiler.prototype.tryInlineLink;
    delete InlineCompiler.prototype.tryRefLink;

    let inlineEmitNormalOriginal = InlineCompiler.prototype.emitNormal;

    InlineCompiler.prototype.emitNormal = function(walk) {
      if (this.emitText(walk)) { return; }
      // if (this.tryInputText(walk)) return;
      let inlineEmitNormalOriginalBound = inlineEmitNormalOriginal.bind(this);
      inlineEmitNormalOriginalBound(walk);
    };

    this.blockCompiler = new BlockCompiler();
  }

  toHtml(string: string): string {
    return this.blockCompiler.toHtml(string);
  }
}
