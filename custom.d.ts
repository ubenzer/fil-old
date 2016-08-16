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
