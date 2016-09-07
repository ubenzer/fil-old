import {kernel, TYPES} from "../../app/core/inversify.config";
import {TestUtils} from "../../test/testUtils";
import {MockConfig} from "../lib/config";
import {Template} from "../lib/template";
import {Collection} from "./collection";
import {Content} from "./content";
import * as assert from "assert";
import * as fs from "fs-extra";
import {interfaces} from "inversify";
import * as moment from "moment";
import * as path from "path";
import * as sinon from "sinon";

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

  it("renders content into a file as html", () => {
    let _collection = <interfaces.Newable<Collection>>kernel.get(TYPES.CollectionConstructor);

    let renderContent = sinon.stub(Template.prototype, "renderContent").returns("<html></html>");
    let join = sinon.stub(path, "join").returns("pathJoinResult");
    let outputFileSync = sinon.stub(fs, "outputFileSync");

    TestUtils.stub.push(renderContent);
    TestUtils.stub.push(join);
    TestUtils.stub.push(outputFileSync);

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

  class Helper {
    static getMockContent(): Content {
      return new _content("contentId", "inputFolder", "outputFolder", "title", "content", "template",
                          new Date("2000-01-01"), new Date("2010-01-01"), {});
    }
  }
});
