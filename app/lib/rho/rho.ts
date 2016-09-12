import {lazyInject, provideConstructor, TYPES} from "../../core/inversify.config";
import {Content} from "../../models/content";
import {ContentLookup} from "../../models/contentLookup";
import {Config} from "../config";
import {ImageResizer} from "../imageResizer";
import {Template} from "../template";
import {ExtendedBlockCompiler} from "./ExtendedBlockCompiler";
import * as s from "string";

enum ParserState {CONTENT_ID, ASSET_ID}
const CLOSE_DELIMITER = "@";

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
@provideConstructor(TYPES.RhoConstructor)
export class Rho {
  @lazyInject(TYPES.Config) _config: Config;
  @lazyInject(TYPES.ImageResizer) _imageResizer: ImageResizer;
  @lazyInject(TYPES.Template) _template: Template;

  private post: Content;
  private contentLookup: ContentLookup;
  private blockCompiler: ExtendedBlockCompiler;

  constructor(post: Content, contentLookup: ContentLookup) {
    this.init(post, contentLookup);
  }

  resolveUrl(url: string): string {
    if (!this.checkOwnUrl(url)) { return url; }
    return this.normalizeUrl(url);
  }

  toHtml(str: string): string {
    return this.blockCompiler.toHtml(str);
  }

  private init(post: Content, contentLookup: ContentLookup): void {
    this.post = post;
    this.contentLookup = contentLookup;
    this.blockCompiler = new ExtendedBlockCompiler(this);
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

    let contentId = "";
    let assetId = "";
    let parserState = ParserState.CONTENT_ID;

    while (charArray.length > 0) {
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
}
