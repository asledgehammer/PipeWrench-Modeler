import * as fs from 'fs';
import { LuaLibrary } from './lua/LuaLibrary';
import path from "path";
// import os module
const os = require('os');

// check the available memory
const userHomeDir = os.homedir();

import {
  Directory,
  mkdirsSync,
  prettify,
  scandirs,
  writeLuaFile,
  writeTSFile,
} from './Utils';

export const WILDCARD_TYPE = 'any';

export class ZomboidGenerator {
  static FUNCTION_CACHE: string[] = [];
  readonly library: LuaLibrary;
  private readonly moduleName: string

  private readonly outDir: string
  constructor(library: LuaLibrary, moduleName: string, outDir: string) {
    this.library = library;
    this.moduleName = moduleName || '@asledgehammer/pipewrench'
    this.outDir = outDir || './dist'
  }

  run() {
    ZomboidGenerator.FUNCTION_CACHE.length = 0;
    console.log("- setupDirectories...")
    const rootRef = "lua.reference.partial.d.ts"
    const luaRef = "lua.interface.partial.lua"
    const rootDef = "lua.api.partial.d.ts"

    this.setupDirectories(rootRef, luaRef, rootDef);
    console.log("- generateDefinitions...")
    this.generateDefinitions();

    console.log("- generateReferencePartial...")
    this.generateReferencePartial(rootRef);

    console.log("- generateLuaInterfacePartial...")
    this.generateLuaInterfacePartial(luaRef);

    console.log("- generateAPIPartial...")
    this.generateAPIPartial(rootDef, rootRef);
  }

  setupDirectories(rootRef: string, luaRef: string, rootDef: string) {
    const { outDir } = this;
    // Initialize directories.
    fs.rmSync(path.join(outDir, rootRef), { "force": true })
    fs.rmSync(path.join(outDir, luaRef), { "force": true })
    fs.rmSync(path.join(outDir, rootDef), { "force": true })
    fs.rmSync(path.join(outDir, "lua"), { "force": true, recursive: true })
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  }

  generateDefinitions() {
    const { library, moduleName, outDir } = this;
    const { luaFiles } = library;
    const luaFileNames = Object.keys(luaFiles).sort((o1, o2) => o1.localeCompare(o2));
    for (const fileName of luaFileNames) {
      const file = luaFiles[fileName];
      const newFileName = path.basename(file.fileLocal, ".lua") + '.d.ts'
      const newFolder = path.join(outDir, file.folder)
      const newFilePath = path.join(newFolder, newFileName)
      console.log(`Generating: ${newFilePath}..`);
      const code = file.generateDefinitionFile(moduleName);
      mkdirsSync(newFilePath);
      writeTSFile(
        newFilePath,
        prettify(code)
      );
    }
  }

  generateAPIPartial(rootDef: string, rootRef: string) {
    const { library, moduleName, outDir } = this;
    const { luaFiles } = library;
    const luaFileNames = Object.keys(luaFiles).sort((o1, o2) => o1.localeCompare(o2));
    let code = '';
    for (const fileName of luaFileNames) {
      const file = luaFiles[fileName];
      const fileCode = file.generateAPI('  ');
      if (fileCode.length) code += `${fileCode}\n`;
    }

    // Wrap and save the code.
    let s = '/** @noSelfInFile */\n';
    s += `/// <reference path="${rootRef}" />\n\n`;
    s += `declare module '${moduleName}' {\n`;
    s += '// [PARTIAL:START]\n';
    s += code;
    s += '// [PARTIAL:STOP]\n';
    s += '}\n';
    writeTSFile(`${outDir}/${rootDef}`, prettify(s));
  }

  generateReferencePartial(rootRef: string) {
    const { outDir } = this;
    // Grab the entire file tree generated so far.
    const luaDir = scandirs(outDir);
    const references: string[] = [];
    // Generate the index.
    const recurse = (dir: Directory) => {
      if (dir.name !== 'dist') {
        const fileNames = Object.keys(dir.files).sort((o1, o2) => o1.localeCompare(o2));
        if (fileNames.length) {
          for (const fileName of fileNames) {
            const file = dir.files[fileName];
            const refPath = file.path.replace(`${outDir}/`, '');
            references.push(`/// <reference path="${refPath}" />`);
          }
        }
      }
      const dirNames = Object.keys(dir.dirs).sort((o1, o2) => o1.localeCompare(o2));
      for (const subdirName of dirNames) recurse(dir.dirs[subdirName]);
    };
    // Start the filetree walk.
    recurse(luaDir.dirs['lua']);
    // Generate the reference partial.
    references.sort((o1, o2) => o1.localeCompare(o2));
    let code = '// [PARTIAL:START]\n';
    for (const reference of references) code += `${reference}\n`;
    code += '// [PARTIAL:STOP]\n';
    writeTSFile(`${outDir}/${rootRef}`, prettify(code));
  }

  generateLuaInterfacePartial(luaRef: string) {
    const { library, outDir } = this;
    const { luaFiles } = library;
    const luaFileNames = Object.keys(luaFiles).sort((o1, o2) => o1.localeCompare(o2));
    let luaCode = '';
    let prefix = '  ';
    luaCode += 'local Exports = {}\n';
    luaCode += '-- [PARTIAL:START]\n';
    luaCode += '_G.PIPEWRENCH_READY = false\n';
    luaCode += `triggerEvent('OnPipeWrenchBoot', false)\n`;
    luaCode += 'Events.OnGameBoot.Add(function()\n\n';
    for (const fileName of luaFileNames) {
      const file = luaFiles[fileName];
      const fileCode = file.generateLuaInterface(prefix);
      if (fileCode.length) luaCode += `${fileCode}\n`;
    }
    luaCode += `${prefix}_G.PIPEWRENCH_READY = true\n`;
    luaCode += `${prefix}-- Trigger reimport blocks for all compiled PipeWrench TypeScript file(s).\n`;
    luaCode += `${prefix}triggerEvent('OnPipeWrenchBoot', true)\n`;
    luaCode += 'end)\n';
    luaCode += '-- [PARTIAL:STOP]\n\n';
    luaCode += 'return Exports\n';

    writeLuaFile(`${outDir}/${luaRef}`, luaCode);
  }
}
