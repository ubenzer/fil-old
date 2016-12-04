import * as assert from "assert";
import * as fs from "fs-extra";
import {interfaces} from "inversify";
import * as moment from "moment";
import * as path from "path";
import * as sinon from "sinon";
import {kernel, TYPES} from "../../app/core/inversify.config";
import {Helper} from "../../test/testHelpers";
import {TestUtils} from "../../test/testUtils";
import {MockConfig} from "../lib/config.mock";
import {ImageResizer} from "../lib/imageResizer";
import {Rho} from "../lib/rho/rho";
import {Template} from "../lib/template";
import {Collection} from "./collection";
import {Content} from "./content";
import {ContentAsset} from "./contentAsset";
import {ContentLookup} from "./contentLookup";

TestUtils.initTestSystem();

describe("Content", () => {
  let _content;

  beforeEach(() => {
    TestUtils.mock(TYPES.Config, MockConfig);
    _content = <interfaces.Newable<Content>>kernel.get(TYPES.ContentConstructor);
  });

  it("can be constructed", () => {
    let createDate = new Date("2000-01-01");
    let editDate = new Date("2020-01-01");
    let taxonomy = {taxa: "nomy"};
    let content = new _content("contentId", "inputFolder", "outputFolder", "title", "content", "template", createDate, editDate, taxonomy);

    assert.equal(content.contentId, "contentId");
    assert.equal(content.inputFolder, "inputFolder");
    assert.equal(content.outputFolder, "outputFolder");
    assert.equal(content.title, "title");
    assert.equal(content.content, "content");
    assert.equal(content.templateFile, "template");
    assert.equal(content.createDate.diff(moment(createDate)), 0);
    assert.equal(content.editDate.diff(moment(editDate)), 0);
    assert.equal(content.taxonomy, taxonomy);
  });

  it("can be registered to a list of collections", () => {
    let _collection = <interfaces.Newable<Collection>>kernel.get(TYPES.CollectionConstructor);
    let collection1 = new _collection("id", TestUtils.noop, "collectionPermalink", "categoryFirstPermalink",
                                      "categoryPermalink", 2,  TestUtils.noop, TestUtils.noop, "/",
                                      TestUtils.noop);

    let collection2 = new _collection("id2", TestUtils.noop, "collectionPermalink", "categoryFirstPermalink",
                                      "categoryPermalink", 2,  TestUtils.noop, TestUtils.noop, "/",
                                      TestUtils.noop);

    sinon.stub(collection1, "registerContent").returns("collection #1 Array<IContentBelongsTo>");
    sinon.stub(collection2, "registerContent").returns("collection #2 Array<IContentBelongsTo>");

    let content = Helper.getMockContent();
    assert.equal(content.belongsTo.size, 0);
    content.registerOnCollections([collection1, collection2]);
    assert.equal(content.belongsTo.size, 2);
    assert.equal(content.belongsTo.get(collection1), "collection #1 Array<IContentBelongsTo>");
    assert.equal(content.belongsTo.get(collection2), "collection #2 Array<IContentBelongsTo>");
  });

  describe("renderToFile", () => {
    it("renders content into a file as html", () => {
      let _collection = <interfaces.Newable<Collection>>kernel.get(TYPES.CollectionConstructor);

      let renderContent = sinon.stub(Template.prototype, "renderContent").returns("<html></html>");
      let join = sinon.stub(path, "join").returns("pathJoinResult");
      let outputFileSync = sinon.stub(fs, "outputFileSync");

      TestUtils.addStub(renderContent, join, outputFileSync);

      let content = Helper.getMockContent();
      let collectionsArray = [
        new _collection("id", TestUtils.noop, "collectionPermalink", "categoryFirstPermalink",
                        "categoryPermalink", 2,  TestUtils.noop, TestUtils.noop, "/",
                        TestUtils.noop),
        new _collection("id2", TestUtils.noop, "collectionPermalink", "categoryFirstPermalink",
                        "categoryPermalink", 2,  TestUtils.noop, TestUtils.noop, "/",
                        TestUtils.noop)
      ];

      content.renderToFile(collectionsArray);

      assert(renderContent.calledWithExactly(content, collectionsArray));
      assert(join.calledWithExactly("MOCK_OUTPUT_DIR", "outputFolder", "index.html"));
      assert(outputFileSync.calledWithExactly("pathJoinResult", "<html></html>"));
    });
    it("doesn't do anything, if content is marked as render:false", () => {
      let renderContent = sinon.stub(Template.prototype, "renderContent").returns("<html></html>");
      TestUtils.addStub(renderContent);
      let content = Helper.getMockContent();
      content.render = false;
      content.renderToFile([]);
      assert.equal(renderContent.callCount, 0);
    });
  });

  describe("calculateHtmlContent", () => {
    it("compiles rho with --more-- into html and reflects it to the instance", () => {
      let _contentLookup = <interfaces.Newable<ContentLookup>>kernel.get(TYPES.ContentLookupConstructor);
      let _rho = <interfaces.Newable<Rho>>kernel.get(TYPES.RhoConstructor);
      let init = sinon.stub(_rho.prototype, "init");
      let toHtml = sinon.stub(_rho.prototype, "toHtml");
      toHtml.onCall(0).returns("excerpt");
      toHtml.onCall(1).returns("content");
      TestUtils.addStub(init, toHtml);

      let contentLookup = new _contentLookup([]);
      let content = Helper.getMockContent();

      content.content = "a ---more--- b";
      content.calculateHtmlContent(contentLookup);

      assert(init.alwaysCalledWithExactly(content, contentLookup));
      assert(toHtml.calledTwice);
      assert(toHtml.calledWithExactly("a "));
      assert(toHtml.calledWithExactly("a \n\n b"));

      assert(content.htmlContent, "content");
      assert(content.htmlExcerpt, "excerpt");
    });

    it("compiles rho without --more-- into html and reflects it to the instance", () => {
      let _contentLookup = <interfaces.Newable<ContentLookup>>kernel.get(TYPES.ContentLookupConstructor);
      let _rho = <interfaces.Newable<Rho>>kernel.get(TYPES.RhoConstructor);
      let init = sinon.stub(_rho.prototype, "init");
      let toHtml = sinon.stub(_rho.prototype, "toHtml").returns("content");
      TestUtils.addStub(init, toHtml);

      let contentLookup = new _contentLookup([]);
      let content = Helper.getMockContent();

      content.content = "a b c";
      content.calculateHtmlContent(contentLookup);

      assert(toHtml.calledOnce);
      assert(toHtml.calledWithExactly("a b c"));

      assert(content.htmlContent, "content");
      assert(content.htmlExcerpt, "content");
    });
  });

  it("returns url for a content", () => {
    let content = Helper.getMockContent();
    content.outputFolder = "folder";
    let url = content.getUrl();
    assert.equal(url, "folder/");
  });

  it("process assets of this content", () => {
    let _imageResizer = <ImageResizer>kernel.get(TYPES.ImageResizer);
    let copySync = sinon.stub(fs, "copySync");
    let resize = sinon.stub(_imageResizer, "resize");
    TestUtils.addStub(resize);

    let content = Helper.getMockContent();
    content.inputFolder = "if";

    let a1 = new ContentAsset("file1", content);
    let a2 = new ContentAsset("file2", content);

    sinon.stub(content, "fileAssets", { get: () => { return [a1, a2]; }});

    a1.isImage = true;
    sinon.stub(a1, "getOutputFile").returns("of1");
    sinon.stub(a2, "getOutputFile").returns("of2");

    content.processContentAssets();
    assert(copySync.calledTwice);
    assert(resize.calledOnce);
    assert(copySync.calledWithExactly("MOCK_CONTENTS_DIR/if/file1", "MOCK_OUTPUT_DIR/of1"));
    assert(copySync.calledWithExactly("MOCK_CONTENTS_DIR/if/file1", "MOCK_OUTPUT_DIR/of1"));
  });
});
