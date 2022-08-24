#!/usr/bin/env node

import path from 'path';
import { LuaLibrary } from './lua/LuaLibrary';
import { ZomboidGenerator } from './ZomboidGenerator';



// Entry Point from HTML.
export let start = function () {
  console.log('### Loading please wait ###');

  const argv = process.argv.slice(2, process.argv.length)
  const args: { [key: string]: string } = {};
  argv.forEach((arg) => {
    const split = arg.split("=")
    args[split[0]] = split[1]
  })
  console.log("Args:", args);


  // Fix luapath
  let luaPath = args.luapath || path.resolve(__dirname, "../media/lua")
  let outDir = args.outDir || path.resolve(__dirname, "./dist")
  const moduleName = args.moduleName || "@asledgehammer/pipewrench"

  const luaLibrary = new LuaLibrary(luaPath || undefined);
  const generator = new ZomboidGenerator(luaLibrary, moduleName, outDir);

  luaLibrary.scan();
  luaLibrary.parse();

  // Loading all entries
  const classes: any[] = Object.values(luaLibrary.classes);
  const tables: any[] = Object.values(luaLibrary.tables);

  console.log("Sorting classes...")
  classes.sort((a, b) => a.name.localeCompare(b.name));

  console.log("Sorting tables...")
  tables.sort((a, b) => a.name.localeCompare(b.name));

  console.log("Generating class models...")
  for (const index in classes) {
    const _class = classes[index]
    luaLibrary.models.classes[_class.name] = _class.generateModel()
  }

  console.log("Generating table models...")
  for (const index in tables) {
    const _table = tables[index]
    luaLibrary.models.tables[_table.name] = _table.generateModel()
  }

  console.log("Running generator...")
  generator.run()

  console.log("### Generator Completed ###")
};
