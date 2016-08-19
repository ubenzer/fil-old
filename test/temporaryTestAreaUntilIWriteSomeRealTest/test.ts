import {kernel, TYPES} from "../../app/core/inversify.config";
import {Loader} from "../../app/core/loader";
import {IConfig} from "../../app/lib/config";
import {Category} from "../../app/models/category";
import {TestUtils} from "../testUtils";
import * as assert from "assert";
import {interfaces} from "inversify";

Loader.loadProject();

afterEach(() => {
  TestUtils.restore();
});

describe("Test system", () => {
  it("works", () => {

    TestUtils.mock<IConfig>(TYPES.Config, ConfigMock);

    let _category = <interfaces.Newable<Category>>kernel.get(TYPES.CategoryConstructor);
    let c = new _category("id", "title", "categoryFirstPermalink", "categoryPermalink", 12,
                          TestUtils.noop, TestUtils.noop, null);
    assert.equal(c._config.get(), "hello");
  });
});

class ConfigMock implements IConfig {
  get(): string {
    return "hello";
  }
}
