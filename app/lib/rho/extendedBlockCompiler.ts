import * as rho from "rho";
import {ExtendedInlineCompiler} from "./extendedInlineCompiler";
import {Rho} from "./rho";

export class ExtendedBlockCompiler extends rho.BlockCompiler {
  inline: ExtendedInlineCompiler;
  out: Array<string>;
  selector: Object;
  blockIndent: number;

  constructor(private rhoStatic: Rho) {
    super();
  }
  reset(): ExtendedBlockCompiler {
    this.out = [];
    this.selector = {};
    this.blockIndent = 0;
    this.inline = new ExtendedInlineCompiler(this.rhoStatic);
    this.inline.out = this.out;
    return this;
  }

  toHtml(input: string): string {
    return this.reset().append(input).outToString();
  }
}
