#!/usr/bin/env node
import {Fil} from "../core/index";
import {kernel, TYPES} from "../core/inversify.config";
import {Loader} from "../core/loader";

Loader.loadProject();
let fil: Fil = <Fil>kernel.get(TYPES.Fil);
fil.start();
