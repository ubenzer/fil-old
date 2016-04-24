import path = require("path");

import {Content} from "./content";

export class ContentAsset {
  assetId: string; // file path (without /) relative to the post it belongs
  owner: Content; // owner of this asset

  constructor(fileName: string, owner: Content) {
    this.assetId = fileName;
    this.owner = owner;
  }
  /**
   * Returns permalink URL for this ContentAsset. This can be used to reference
   * it in compiled output.
   * @returns {string}
   */
  getUrl(): string {
    return `${this.owner.outputFolder.replace(new RegExp(path.sep, "g"), "/")}/${this.assetId.replace(new RegExp(path.sep, "g"), "/")}`;
  }
}
