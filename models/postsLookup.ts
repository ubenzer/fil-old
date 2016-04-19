import {Post} from "./post";
import {PostAsset} from "./postAsset";

export class ContentLookup {

  private postLookupById: Map<string, Post> = null;

  constructor(private posts: Array<Post>) {
    this.postLookupById = new Map<string, Post>();

    posts.forEach(post => {
      this.postLookupById.set(post.contentId, post);
    });
  }

  getPostById(contentId: string): Post {
    let maybePost = this.postLookupById.get(contentId);
    if (maybePost === undefined) {
      return null;
    }
    return maybePost;
  }

  getPostAssetByPost(post: Post, assetId: string): PostAsset {
    let maybePostAsset = post.fileAssets.find((fa) => { return fa.assetId === assetId});
    if (maybePostAsset === undefined) {
      return null;
    }
    return maybePostAsset;
  }
}
