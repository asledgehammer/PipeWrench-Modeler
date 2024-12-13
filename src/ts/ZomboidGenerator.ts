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
import type { LuaFile } from './lua/LuaFile';

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
    const sides = [
      'shared',
      'server',
      'client',
    ]
    const rootRef = "lua.reference.partial.d.ts"
    const getLuaRef = (side: string) => `lua.${side}.interface.partial.lua`
    const luaRefsWithSide: [string, string][] = sides.map(side => [side, getLuaRef(side)])
    const getRootDef = (side: string) => `lua.${side}.api.partial.d.ts`
    const rootRefsWithSide: [string, string][] = sides.map(side => [side, getRootDef(side)])

    this.setupDirectories(
      rootRef,
      ...luaRefsWithSide.map(r => r[1]),
      ...rootRefsWithSide.map(r => r[1]),
    );
    console.log("- generateDefinitions...")
    this.generateDefinitions();

    console.log("- generateReferencePartial...")
    this.generateReferencePartial(rootRef);

    console.log("- generateLuaInterfacePartial...")
    luaRefsWithSide.forEach(([side, luaRef]) => {
      this.generateLuaInterfacePartial(luaRef, side);
    });

    console.log("- generateAPIPartial...")
    rootRefsWithSide.forEach(([side, luaRef]) => {
      this.generateAPIPartial(luaRef, rootRef, side);
    });
  }

  setupDirectories(...filePaths: string[]) {
    const { outDir } = this;
    // Initialize directories.
    filePaths.forEach(filePath => {
      fs.rmSync(path.join(outDir, filePath), { "force": true })
    })
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

  generateAPIPartial(rootDef: string, rootRef: string, side: string) {
    const { library, moduleName, outDir } = this;
    const { luaFiles } = library;
    const sideLuaFiles = this.getSideLuaFiles(luaFiles, side);
    const luaFileNames = Object.keys(sideLuaFiles).sort((o1, o2) => o1.localeCompare(o2));
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

  getSideLuaFiles(luaFiles: { [id: string]: LuaFile }, side: string) {
    return Object.entries(luaFiles).reduce(
      (acc, [id, luaFile]) => {
        if (luaFile.side !== side) {
          return acc;
        }
        acc[id] = luaFile;
        return acc;
      },
      {} as Record<string, LuaFile>
    )
  }

  generateLuaInterfacePartial(luaRef: string, side: string) {
    const { library, outDir } = this;
    const { luaFiles } = library;
    const sideLuaFiles = this.getSideLuaFiles(luaFiles, side);
    const luaFileNames = Object.keys(sideLuaFiles).sort((o1, o2) => o1.localeCompare(o2));
    let luaCode = '';
    luaCode += 'local Exports = {}\n';
    luaCode += '-- [PARTIAL:START]\n';
    for (const fileName of luaFileNames) {
      const file = luaFiles[fileName];
      const fileCode = file.generateLuaInterface();
      if (fileCode.length) luaCode += `${fileCode}\n`;
    }
    luaCode += '-- [PARTIAL:STOP]\n\n';
    luaCode += 'return Exports\n';

    writeLuaFile(`${outDir}/${luaRef}`, luaCode);
  }
}
