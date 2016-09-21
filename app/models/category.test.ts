import {kernel, TYPES} from "../../app/core/inversify.config";
import {Helper} from "../../test/testHelpers";
import {TestUtils} from "../../test/testUtils";
import {ICategorySortingFn, IContentSortingFn} from "../lib/config";
import {MockConfig} from "../lib/config.mock";
import {ImageResizer} from "../lib/imageResizer";
import {Template} from "../lib/template";
import {Category} from "./category";
import * as assert from "assert";
import * as fs from "fs-extra";
import {interfaces} from "inversify";
import * as path from "path";
import * as sinon from "sinon";

TestUtils.initTestSystem();

describe("Category", () => {
  let _category;

  beforeEach(() => {
    TestUtils.mock(TYPES.Config, MockConfig);
    _category = <interfaces.Newable<Category>>kernel.get(TYPES.CategoryConstructor);
  });

  it("can be constructed", () => {
    let categorySortingFn: ICategorySortingFn = () => { return 1; };
    let contentSortingFn: IContentSortingFn = () => { return 2; };
    let belongsToCollection = {};
    let category = new _category("id", "title", "categoryFirstPermalink", "categoryPermalink", 12, categorySortingFn,
                                 contentSortingFn, belongsToCollection);

    assert.equal(category.id, "id");
    assert.equal(category.title, "title");
    assert.equal(category.categoryFirstPermalink, "categoryFirstPermalink");
    assert.equal(category.categoryPermalink, "categoryPermalink");
    assert.equal(category.pagination, 12);
    assert.equal(category.categorySortingFn, categorySortingFn);
    assert.equal(category.contentSortingFn, contentSortingFn);
    assert.equal(category.belongsToCollection, belongsToCollection);
  });

  it("can register content to itself", () => {
    let _sortingHelper = <ImageResizer>kernel.get(TYPES.SortingHelper);

    let aContent = Helper.getMockContent();
    let category = Helper.getMockCategory();

    let putIntoSortedArray = sinon.stub(_sortingHelper, "putIntoSortedArray");
    TestUtils.addStub(putIntoSortedArray);

    // has no parent
    category.registerContent(aContent);

    assert.equal(putIntoSortedArray.callCount, 2);
    assert(putIntoSortedArray.calledWithExactly(category.ownContents, aContent, category.contentSortingFn));
    assert(putIntoSortedArray.calledWithExactly(category.contents, aContent, category.contentSortingFn));
    assert.equal(category.parentCategory, null);

    // has parent
    let category2 = Helper.getMockCategory();
    category2.parentCategory = category;
    let registerFromChild = sinon.stub(category, "registerFromChild");

    category2.registerContent(aContent);
    assert.equal(registerFromChild.callCount, 1);
    assert(registerFromChild.calledWithExactly(aContent));
  });

  describe("registerFromChild", () => {
    it("registers a content of child categories if it is not registered before", () => {
      let _sortingHelper = <ImageResizer>kernel.get(TYPES.SortingHelper);

      let aContent = Helper.getMockContent();
      let category = Helper.getMockCategory();

      let putIntoSortedArray = sinon.stub(_sortingHelper, "putIntoSortedArray");
      TestUtils.addStub(putIntoSortedArray);

      category.registerFromChild(aContent);

      assert.equal(putIntoSortedArray.callCount, 1);
      assert(putIntoSortedArray.calledWithExactly(category.contents, aContent, category.contentSortingFn));
    });

    it("moves content from own contents to contents, indicating, it also belongs to some of the childs", () => {
      let theContent = Helper.getMockContent();
      let category = Helper.getMockCategory();

      category.ownContents.push(theContent);
      assert.equal(category.ownContents.length, 1);
      category.registerFromChild(theContent);
      assert.equal(category.ownContents.length, 0);
    });

    it("triggers parent category if there is any", () => {
      let aContent = Helper.getMockContent();
      let category = Helper.getMockCategory();
      let parentCategory = Helper.getMockCategory();
      category.parentCategory = parentCategory;
      let registerFromChild = sinon.stub(parentCategory, "registerFromChild");

      category.registerFromChild(aContent);
      assert.equal(registerFromChild.callCount, 1);
      assert(registerFromChild.calledWithExactly(aContent));
    });
  });

  it("registers a category as subcategory", () => {
    let parentCategory = Helper.getMockCategory();
    let childCategory = Helper.getMockCategory();

    assert.equal(childCategory.parentCategory, null);
    assert.equal(parentCategory.subCategories.length, 0);
    parentCategory.registerSubcategory(childCategory);
    assert.equal(parentCategory.subCategories.length, 1);
    assert.equal(childCategory.parentCategory, parentCategory);
  });

  describe("calculatePagination", () => {
    // TODO
  });

  it("renders category and sub categories into html files, paginated", () => {
    let collectionsArray = [];
    let parentCategory = Helper.getMockCategory();
    let childCategory = Helper.getMockCategory();
    parentCategory.subCategories.push(childCategory);
    parentCategory.paginatedContents = [
      {
        contents: [],
        firstPageUrl: "fpu1",
        isFirstPage: true,
        isLastPage: true,
        lastPageUrl: "lpu1",
        nextPageUrl: "npu1",
        numberOfPages: 9988,
        outputFolder: "of1",
        pageNumber: 999,
        previousPageUrl: "ppu1",
        url: "u1"
      },
      {
        contents: [],
        firstPageUrl: "fpu2",
        isFirstPage: true,
        isLastPage: true,
        lastPageUrl: "lpu2",
        nextPageUrl: "npu2",
        numberOfPages: 9988,
        outputFolder: "of2",
        pageNumber: 999,
        previousPageUrl: "ppu2",
        url: "u2"
      }
    ];

    let childRenderToFile = sinon.stub(childCategory, "renderToFile");
    let renderCategory = sinon.stub(Template.prototype, "renderCategory").returns("<html></html>");
    let outputFileSync = sinon.stub(fs, "outputFileSync");
    let join = sinon.stub(path, "join").returns("pathJoinResult");
    TestUtils.addStub(renderCategory, join, outputFileSync);

    parentCategory.renderToFile(collectionsArray);
    assert(childRenderToFile.calledOnce);
    assert(childRenderToFile.calledWithExactly(collectionsArray));

    assert(renderCategory.calledTwice);
    assert(renderCategory.calledWithExactly(parentCategory, parentCategory.paginatedContents[0], collectionsArray));
    assert(renderCategory.calledWithExactly(parentCategory, parentCategory.paginatedContents[1], collectionsArray));
    assert(join.calledWithExactly("MOCK_OUTPUT_DIR", "of1", "index.html"));
    assert(join.calledWithExactly("MOCK_OUTPUT_DIR", "of2", "index.html"));
    assert(outputFileSync.calledWithExactly("pathJoinResult", "<html></html>"));
  });
});
