// Contains type definition (stubs) for the packages that are not available in typings repository.

declare module "pug" {
  export function compile(template: string, options?: any): (locals?: any) => string;
  export function compileFile(path: string, options?: any): (locals?: any) => string;
  export function compileClient(template: string, options?: any): (locals?: any) => string;
  export function compileClientWithDependenciesTracked(template: string, options?: any): {
      body: (locals?: any) => string;
      dependencies: string[];
  };
  export function render(template: string, options?: any): string;
  export function renderFile(path: string, options?: any): string;
}

declare module 'front-matter' {
  function frontMatter (str: string): any;

  namespace frontMatter {}

  export = frontMatter;
}

declare module 'sitemap' {
  namespace sitemap {
    function createSitemap(sitemapobj: any): Buffer;
  }
  export = sitemap;
}

declare module "sharp" {
  function sharp(srcFile: string): ISharpChainable;
  namespace sharp {}
  interface ISharpChainable {
    resize(width: number, height: number): ISharpChainable;
    quality(quality: number): ISharpChainable;
    toFile(outputPath: string, callback: (err: any) => void): void;
  }
  export = sharp;
}

declare module "rho" {
  namespace rho {
    export class InlineCompiler {
      tryInlineImg: Function;
      tryRefImg: Function;
      tryInlineLink: Function;
      tryRefLink: Function;
      emitText(walk: IWalker): boolean;
      emitNormal(walk: IWalker): void;
      options: any;
      out: {
        push(str: string): void;
      };
      toHtml(stringToConter: string): string;
      constructor()
    }
    export class BlockCompiler {
      inline: InlineCompiler;
      constructor();
      toHtml(stringToConter: string): string;
      append(string: string): BlockCompiler;
      outToString(): string;
    }
    export interface IWalker {
      position: number;
      at(char: string): boolean;
      hasCurrent(): boolean;
      lookahead(lookaheadfn: (w: IWalker) => number): number;
      skip(charCount?: number): void;
      startFrom(index: number): void;
      yieldUntil(index: number): string;
      indexOf(char: string): number;
    }
  }

  export = rho;
}

declare module "tracer" {
  namespace tracer {
    function colorConsole(IConsoleSettings): Console;
    function console(IConsoleSettings): Console;
  }
  class Console {
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
  }
  interface IConsoleSettings {
    format: Array<string|IFormatSettings>;
    dateformat: string;
    preprocess(data: IPreprocessData): void;
  }
  interface IFormatSettings {
    error: string;
  }
  interface IPreprocessData {
    args: any;
    timestamp: string;
    message: string;
    title: string;
    level: number;
    file: string;
    pos: string;
    line: string;
    path: string;
    method: string;
    stack: string;
  }
  export = tracer;
}

declare module 'pad-left' {
  function padLeft (str: string, num: number, ch?: string): string;
  namespace padLeft {}
  export = padLeft;
}

declare module 'require-all' {
  function requireAll(config: IRequireAllConfig): void;
  namespace requireAll {}
  export = requireAll;
  interface IRequireAllConfig {
    dirname: string,
    filter?: RegExp,
    excludeDirs?: RegExp,
    recursive: boolean
  }
}

declare module 'tildify' {
  function tildify(path: string): string;
  namespace tildify {}
  export = tildify;
}

declare module 'liftoff' {
  function liftoff(settings: ILiftoffConstructor): void;
  namespace liftoff {}

  interface ILiftoffConstructor {
    configName: string;
    name: string;
  }
  export = liftoff;
}


