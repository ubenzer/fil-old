import "reflect-metadata";
import {interfaces, decorate, injectable, Kernel} from "inversify";
import getDecorators from "inversify-inject-decorators";
import {makeProvideDecorator} from "inversify-binding-decorators";

let kernel = new Kernel();

let {lazyInject} = getDecorators(kernel);
let provide = makeProvideDecorator(kernel);

let TYPES = {
  CategoryConstructor: Symbol(),
  CollectionStatic: Symbol(),
  CollectionConstructor: Symbol(),
  Config: Symbol(),
  ContentAssetConstructor: Symbol(),
  ContentConstructor: Symbol(),
  ContentStatic: Symbol(),
  ContentLookupConstructor: Symbol(),
  Fil: Symbol(),
  ImageResizer: Symbol(),
  Page: Symbol(),
  RhoConstructor: Symbol(),
  Sitemap: Symbol(),
  SortingHelper: Symbol(),
  Template: Symbol()
};

function provideConstructor(serviceIdentifier: (string|Symbol|inversify.interfaces.Newable<any>)) {
  return function (target: any) {
    decorate(injectable(), target);
    kernel.bind<interfaces.Newable<any>>(serviceIdentifier).toConstructor(target);
    return target;
  };
}

export { TYPES, lazyInject, provide, kernel, provideConstructor };
