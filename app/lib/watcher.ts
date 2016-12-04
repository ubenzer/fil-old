import * as chokidar from "chokidar";
import {inject} from "inversify";
import * as Rx from "rxjs/Rx";
import {provideSingleton, TYPES} from "../core/inversify.config";
import {Config} from "../lib/config";

@provideSingleton(TYPES.Watcher)
export class Watcher {

  constructor(
    @inject(TYPES.Config) private _config: Config
  ) {}

  startFileWatcher(): Rx.Observable<void> {
    let subject = new Rx.Subject<void>();
    let watcher = chokidar.watch(
      [
        this._config.get().build.contentPath,
        this._config.get().build.pagePath,
        this._config.get().build.templatePath
      ],
      {
        atomic: true,
        awaitWriteFinish: {
          pollInterval: 100,
          stabilityThreshold: 2000
        },
        cwd: process.cwd(),
        followSymlinks: true,
        ignoreInitial: true,
        ignorePermissionErrors: false,
        ignored: ["**/.*"],
        persistent: true
      }
    );
    watcher.on("all", () => {
      subject.next();
    });
    return subject.asObservable().debounce(() => { return Rx.Observable.timer(700); });
  }
}
