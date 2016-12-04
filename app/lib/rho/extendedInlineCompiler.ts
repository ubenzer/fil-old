import * as mime from "mime";
import * as path from "path";
import {IWalker} from "rho";
import * as rho from "rho";
import * as s from "string";
import {Rho} from "./rho";

export class ExtendedInlineCompiler extends rho.InlineCompiler {
  constructor(private rhoClass: Rho) {
    super();
  }
  tryRenderShortcodes(walk: IWalker): boolean {
    // #[sth data]
    let self = this;
    if (!walk.at("#[")) { return; }
    walk.skip(2);

    let end = walk.indexOf("]");
    if (end === null) {
      this.out.push("#[");
      return true;
    }

    let tagContent = walk.yieldUntil(end).trim();
    walk.skip();

    let tagPieces = tagContent.split(" ");
    let tagName = tagPieces[0];
    let tagData = null;
    if (tagPieces.length > 1) {
      tagData = tagPieces[1];
    }

    let renderedTag = this.rhoClass._template.renderTag(tagName, tagData);
    self.out.push(`${renderedTag}\n`);
  };

  // ENHANCE IMAGE
  tryImg(walk: IWalker): boolean {
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
      walk.startFrom(start);
      self.out.push("![");
      return true;
    }
    let endUrl = walk.indexOf(")");
    if (endUrl === null) {
      walk.startFrom(start);
      self.out.push("![");
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
  };

  emitImg(alt: string, src: string, types: Array<string>): void {
    let escapedAlt = s(alt).escapeHTML().s;
    let escapedTypesArr = types.map(type => s(type).trim().escapeHTML().s);

    src = this.rhoClass.resolveUrl(src);

    if (this.rhoClass._imageResizer.IMAGE_EXTENSIONS.indexOf(path.extname(src)) > -1) {
      this.out.push(`<picture>\n`);

      this.rhoClass._config.get().media.imageExtensions.forEach((extension) => {
        let srcset: Array<string> = [];
        let mimeType = mime.lookup(extension);

        this.rhoClass._config.get().media.imageWidths.forEach((width) => {
          let srcSetDefinition = `${this.rhoClass._imageResizer.getResizedUrl(src, width, extension)} ${width}w`;
          srcset.push(srcSetDefinition);
        });
        this.out.push(`<source type="${mimeType}" srcset="${srcset.join(",")}">\n`);
      });

      let srcset: Array<string> = [];
      this.rhoClass._config.get().media.imageWidths.forEach((width) => {
        let srcSetDefinition = `${this.rhoClass._imageResizer.getResizedUrl(src, width)} ${width}w`;
        srcset.push(srcSetDefinition);
      });
      this.out.push(`<img src="${this.rhoClass._imageResizer.getResizedUrl(src, this.rhoClass._config.get().media.defaultWidth)}" 
        srcset="${srcset.join(",")}" alt="${escapedAlt}" title="${escapedAlt}"`);

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
      this.out.push(`<img sfffrc="${src}" alt="${escapedAlt}" title="${escapedAlt}"`);

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

  emitLink(text: string, link: string, flags: Array<string>): void {
    let escapedFlagsArr = flags.map(flag => s(flag).trim().escapeHTML().s);
    let innerLinkHtml = new rho.InlineCompiler().toHtml(text);

    link = this.rhoClass.resolveUrl(link);

    // TODO we need to move html creation to pug at some point
    this.out.push(`<a href="${link}"${escapedFlagsArr.indexOf("new") > -1 ? "{ target='_blank'}" : ""}>${innerLinkHtml}</a>`);
  };

  tryHeadlessLink(walk: IWalker): boolean {
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

  tryLink(walk: IWalker): boolean {
    let self = this;

    if (!walk.at("[")) { return false; }
    // Try to find the ]
    walk.skip();
    let start = walk.position;
    let endText = walk.lookahead((w) => {
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
      walk.startFrom(start);
      self.out.push("[");
      return true;
    }
    let endHref = walk.indexOf(")");
    if (endHref === null) {
      walk.startFrom(start);
      self.out.push("[");
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
  };

  emitNormal(walk: IWalker): void {
    if (this.tryRenderShortcodes(walk)) { return; }
    if (this.emitText(walk)) { return; }
    super.emitNormal(walk);
  };
}
