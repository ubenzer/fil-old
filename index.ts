//import {Config} from "./config";

import {Constants} from "./constants";
import {Post} from "./models/post";
import {Assets} from "./lib/assets";

import fs = require("fs");
import path = require("path");
import jade = require("jade");


let postDir = Constants.POSTS_DIR;
let templateDir = Constants.TEMPLATE_DIR;
let outDir = Constants.OUTPUT_DIR;

// post array
let posts = [];


fs.readdirSync(postDir).forEach((file) => {
  // build file
  let post = Post.fromFile(file);
  let extension = path.extname(file);
  let fileNameWithoutExtension = path.basename(file, extension);

  post.renderTo(`${fileNameWithoutExtension}.html`);
  posts.push(post);
});

let builtTemplate = jade.compileFile(
  path.join(templateDir, "index.jade"),
  {pretty: true}
)({
  posts: posts
});
fs.writeFileSync(path.join(outDir, "index.html"), builtTemplate);

Assets.processTemplateImages();
Assets.processStylesheets();
