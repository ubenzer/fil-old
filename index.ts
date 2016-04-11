import {Constants} from "./constants";
import {Post} from "./models/post";
import {Assets} from "./lib/assets";

import fs = require("fs-extra");
import path = require("path");
import jade = require("jade");

let templateDir = Constants.TEMPLATE_DIR;
let outDir = Constants.OUTPUT_DIR;

// post array
let posts = Post.fromPostsFolder();

posts.forEach((post) => {
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
