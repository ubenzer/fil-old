import {provideConstructor, TYPES} from "../core/inversify.config";
import {Content} from "./content";
import {ContentAsset} from "./contentAsset";

@provideConstructor(TYPES.ContentLookupConstructor)
export class ContentLookup {
  private contentLookupById: Map<string, Content> = null;

  /**
   * Create a new ContentLookup that can be used for fast search within the
   * provided content objects. This can be think like database index.
   *
   * @param contents Contents to be indexed as array
   */
  constructor(private contents: Array<Content>) {
    this.contentLookupById = new Map<string, Content>();

    contents.forEach(post => {
      this.contentLookupById.set(post.contentId.normalize(), post);
    });
  }

  /**
   * Does a quick hash map search by content id and returns the content
   * @param contentId
   * @returns {Content} actual content object or null if no content found with that id
   */
  getContentById(contentId: string): Content {
    let maybeContent = this.contentLookupById.get(contentId.normalize());
    if (maybeContent === undefined) {
      return null;
    }
    return maybeContent;
  }

  getContentAssetByContent(content: Content, assetId: string): ContentAsset {
    let maybeContentAsset = content.fileAssets.find((fa) => {
      return fa.assetId.normalize() === assetId.normalize();
    });
    if (maybeContentAsset === undefined) {
      return null;
    }
    return maybeContentAsset;
  }
}
