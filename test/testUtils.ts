import {kernel} from "../app/core/inversify.config";
import {Loader} from "../app/core/loader";
import {decorate, injectable} from "inversify";
import {SinonStub} from "sinon";

export class TestUtils {
  private static stub: Array<SinonStub>;

  private static gotSnapshot: boolean = false;

  static addStub(...stubList: Array<SinonStub>): void {
    stubList.forEach((s) => { TestUtils.stub.push(s); });
  }
  // tslint:disable-next-line:no-empty
  static noop(): void {}

  // tslint:disable-next-line:no-any
  static mock<T>(target: Symbol, mock: { new(...args: any[]): T; }): T {
    if (!TestUtils.gotSnapshot) {
      kernel.snapshot();
      TestUtils.gotSnapshot = true;
    }
    try {
      // Mocks needs to be decorated once
      decorate(injectable(), mock);
      // tslint:disable-next-line:no-empty
    } catch (e) {}
    kernel.unbind(target);
    kernel.bind<T>(target).to(mock);
    return kernel.get<T>(target);
  }

  static restore(): void {
    if (!TestUtils.gotSnapshot) { return; }
    kernel.restore();
    TestUtils.gotSnapshot = false;
  }

  static initTestSystem(): void {
    Loader.loadProject();
    beforeEach(() => {
      TestUtils.stub = [];
    });
    afterEach(() => {
      TestUtils.restore();
      TestUtils.stub.forEach((stub) => {
        stub.restore();
      });
    });
  }
}
