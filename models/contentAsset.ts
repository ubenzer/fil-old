export class ContentAsset {
  assetId: string; // file path (without /) relative to the post it belongs

  constructor(fileName: string) {
    this.assetId = fileName;
  }

  getUrl(): string {
    return "TODO";
  }
}
