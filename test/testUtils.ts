import {kernel} from "../app/core/inversify.config";
import {decorate, injectable} from "inversify";

export class TestUtils {
  private static gotSnapshot: boolean = false;

  // tslint:disable-next-line:no-empty
  static noop(): void {}

  // tslint:disable-next-line:no-any
  static mock<T>(target: Symbol, mock: { new(...args: any[]): T; }): T {
    if (!TestUtils.gotSnapshot) {
      kernel.snapshot();
      TestUtils.gotSnapshot = true;
    }
    decorate(injectable(), mock);
    kernel.unbind(target);
    kernel.bind<T>(target).to(mock);
    return kernel.get<T>(target);
  }
  static restore(): void {
    if (!TestUtils.gotSnapshot) { return; }
    kernel.restore();
  }
}
