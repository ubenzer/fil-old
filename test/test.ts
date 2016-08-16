import {interfaces, decorate, injectable} from "inversify";
import {kernel, TYPES} from "../app/inversify.config";
import {IConfig} from "../app/lib/config";

var normalizedPath = require("path").join(__dirname, "..", "app", "lib");

require("fs").readdirSync(normalizedPath).forEach(function(file) {
  require("../app/lib/" + file);
});

var normalizedPath = require("path").join(__dirname, "..", "app", "models");
require("fs").readdirSync(normalizedPath).forEach(function(file) {
  require("../app/models/" + file);
});

require("../app/index");
require("../app/inversify.config");

console.log(kernel.guid);
let gotSnapshot = false;

function mock<T>(target: Symbol, mock: { new(...args: any[]): T; }): T {
  if (!gotSnapshot) {
    kernel.snapshot();
    gotSnapshot = true;
  }
  decorate(injectable(), mock);
  kernel.unbind(target);
  kernel.bind<T>(target).to(mock);
  return kernel.get<T>(target);
}
function restore(): void {
  if (!gotSnapshot) { return; }
  kernel.restore();
}

var assert = require('assert');
describe('Array', function() {
  it("should create an instance", function() {

    mock<IConfig>(TYPES.Config, ConfigMock);

    let Category: any = kernel.get(TYPES.CategoryConstructor);
    let c = new Category("id", "title",
      "categoryFirstPermalink",
      "categoryPermalink",
      12,
      function() {}, function() {},
      null);
    //console.log(c.Config);
    console.log(c.Config.get())
  });
});


class ConfigMock implements IConfig {
  getConfig() {
    return "hello"
  }
}
