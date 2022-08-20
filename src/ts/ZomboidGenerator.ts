import * as fs from 'fs';
import { LuaLibrary } from './lua/LuaLibrary';
import path from "path";
// import os module
const os = require('os');

// check the available memory
const userHomeDir = os.homedir();

import {
  cleardirsSync,
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
  private readonly moduleName = '@asledgehammer/pipewrench';
  private readonly rootDir = `./PipeWrench`;
  private readonly outputDir = `${this.rootDir}`;
  private readonly luaDir = `${this.outputDir}/lua`;

  private readonly generatedDir = `${this.rootDir}/generated`;
  private readonly partialsDir = this.rootDir

  constructor(library: LuaLibrary) {
    this.library = library;
  }

  run() {
    ZomboidGenerator.FUNCTION_CACHE.length = 0;
    console.log("- setupDirectories...")
    this.setupDirectories();

    console.log("- generateDefinitions...")
    this.generateDefinitions();

    console.log("- generateReferencePartial...")
    this.generateReferencePartial();

    console.log("- generateLuaInterfacePartial...")
    this.generateLuaInterfacePartial();

    console.log("- generateAPIPartial...")
    this.generateAPIPartial();
  }

  setupDirectories() {
    const { rootDir: distDir, generatedDir, partialsDir, outputDir, luaDir } = this;
    // Initialize directories.
    if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

    if (!fs.existsSync(generatedDir)) fs.mkdirSync(generatedDir, { recursive: true });
    if (!fs.existsSync(partialsDir)) fs.mkdirSync(partialsDir, { recursive: true });

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    if (!fs.existsSync(luaDir)) fs.mkdirSync(luaDir, { recursive: true });
    else cleardirsSync(this.luaDir);
  }

  generateDefinitions() {
    const { library, moduleName } = this;
    const { luaFiles } = library;
    const luaFileNames = Object.keys(luaFiles).sort((o1, o2) => o1.localeCompare(o2));
    for (const fileName of luaFileNames) {
      const file = luaFiles[fileName];
      const newFileName = path.basename(file.fileLocal, ".lua") + '.d.ts'
      const newFolder = path.join(this.luaDir, file.folder)
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

  generateAPIPartial() {
    const { library, moduleName, partialsDir } = this;
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
    s += `/// <reference path="reference.d.ts" />\n\n`;
    s += `declare module '${moduleName}' {\n`;
    s += '// [PARTIAL:START]\n';
    s += code;
    s += '// [PARTIAL:STOP]\n';
    s += '}\n';
    writeTSFile(`${partialsDir}/index.api.partial.d.ts`, prettify(s));
  }

  generateReferencePartial() {
    const { rootDir: distDir, partialsDir } = this;
    // Grab the entire file tree generated so far.
    const luaDir = scandirs(`${distDir}`);
    const references: string[] = [];
    // Generate the index.
    const recurse = (dir: Directory) => {
      if (dir.name !== 'dist') {
        const fileNames = Object.keys(dir.files).sort((o1, o2) => o1.localeCompare(o2));
        if (fileNames.length) {
          for (const fileName of fileNames) {
            const file = dir.files[fileName];
            const refPath = file.path.replace(`${this.outputDir}/`, '');
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
    writeTSFile(`${partialsDir}/index.reference.partial.d.ts`, prettify(code));
  }

  generateLuaInterfacePartial() {
    const { library, partialsDir } = this;
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

    writeLuaFile(`${partialsDir}/index.interface.partial.lua`, luaCode);
  }
}
