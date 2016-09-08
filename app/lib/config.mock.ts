import {IConfig, IConfigFile} from "./config";
export class MockConfig implements IConfig {
  CONTENTS_DIR: string = "MOCK_CONTENTS_DIR";
  TEMPLATE_DIR: string = "MOCK_TEMPLATE_DIR";
  PAGES_DIR: string = "MOCK_PAGES_DIR";
  OUTPUT_DIR: string = "MOCK_OUTPUT_DIR";

  get(): IConfigFile {
    throw new Error("Trying to get config from mock object!");
  }
}
