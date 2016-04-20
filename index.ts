import {Constants} from "./constants";
import {Content} from "./models/content";
import {Assets} from "./lib/assets";

import fs = require("fs-extra");
import path = require("path");
import jade = require("jade");
import {ContentLookup} from "./models/contentLookup";

let templateDir = Constants.TEMPLATE_DIR;
let outDir = Constants.OUTPUT_DIR;

// post array
let posts: Array<Content> = Content.fromPostsFolder();
let contentLookup = new ContentLookup(posts);

posts.forEach((post) => {
  post.calculateHtmlContent(contentLookup);
  post.renderToFile();
});

let builtTemplate = jade.compileFile(
  path.join(templateDir, "index.jade"),
  {pretty: true}
)({
  posts: posts
});
fs.outputFileSync(path.join(outDir, "index.html"), builtTemplate);

Assets.processTemplateImages();
Assets.processStylesheets();
