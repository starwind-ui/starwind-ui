#!/usr/bin/env node

import { createProgram } from "./program.js";

await createProgram().parseAsync(process.argv);
