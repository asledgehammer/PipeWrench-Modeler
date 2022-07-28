import * as prettier from 'prettier';
import * as fs from 'fs';
import { DocBuilder } from './DocBuilder';
import { LuaLibrary } from './lua/LuaLibrary';

const LICENSE = [
  'MIT License',
  '',
  'Copyright (c) $YEAR$ JabDoesThings',
  '',
  'Permission is hereby granted, free of charge, to any person obtaining a copy',
  'of this software and associated documentation files (the "Software"), to deal',
  'in the Software without restriction, including without limitation the rights',
  'to use, copy, modify, merge, publish, distribute, sublicense, and/or sell',
  'copies of the Software, and to permit persons to whom the Software is',
  'furnished to do so, subject to the following conditions:',
  '',
  'The above copyright notice and this permission notice shall be included in all',
  'copies or substantial portions of the Software.',
  '',
  'THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR',
  'IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,',
  'FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE',
  'AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER',
  'LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,',
  'OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE',
  'SOFTWARE.',
  '',
  'File generated at: $TIME_GENERATED$'
 ];

 const generateTSLicense = (): string => {
  const date = new Date();
  const doc = new DocBuilder(true);
  for(const line of LICENSE) {
    doc.appendLine(
      line.replace('$YEAR$', date.getFullYear().toString()).replace('$TIME_GENERATED$', date.toISOString())
    );
  }
  return doc.build();
};

const generateLuaLicense = (): string => {
  const date = new Date();
  const dateS = date.toISOString();
  let lines = '';
  const year = date.getFullYear().toString();
  for (const line of LICENSE) {
    lines += '-- ' + line.replace('$YEAR$', year).replace('$TIME_GENERATED$', dateS) + '\n';
  }
  return lines;
};

const rmdirsync = function (path: string) {
  let files = [];
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path);
    files.forEach((file) => {
      var curPath = `${path}/${file}`;
      if (fs.lstatSync(curPath).isDirectory()) rmdirsync(curPath);
      else fs.unlinkSync(curPath);
    });
    fs.rmdirSync(path);
  }
};

const cleardirsync = function (path: string) {
  let files = [];
  if (fs.existsSync(path)) {
    files = fs.readdirSync(path);
    files.forEach((file) => {
      var curPath = `${path}/${file}`;
      if (fs.lstatSync(curPath).isFile()) fs.unlinkSync(curPath);
    });
  }
};

export class Generator {
  readonly library: LuaLibrary;

  constructor(library: LuaLibrary) {
    this.library = library;
  }

  run() {
    const distDir = './dist/';
    const classDir = `${distDir}classes/`;
    const tableDir = `${distDir}tables/`;
    const globalDir = `${distDir}global/`;

    if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);
    if (!fs.existsSync(classDir)) fs.mkdirSync(classDir);
    if (!fs.existsSync(tableDir)) fs.mkdirSync(tableDir);
    if (!fs.existsSync(globalDir)) fs.mkdirSync(globalDir);

    cleardirsync(distDir);
    cleardirsync(classDir);
    cleardirsync(tableDir);
    cleardirsync(globalDir);

    const { classes, tables } = this.library;

    const atlasName = 'ZomboidLua_Atlas.d.ts';
    const atlasPath = `${distDir}${atlasName}`;
    const atlas = `/// <reference path="../${atlasName}" />`;
    const references: string[] = [];

    for (const className of Object.keys(classes)) {
      const path = `${classDir}${className}.d.ts`;
      references.push(`classes/${className}.d.ts`);
      console.log(`Compiling Class: ${className}..`);
      const clazz = this.library.classes[className];
      let tsCode = `/** @noResolution @noSelfInFile */\n${atlas}\n\ndeclare module 'ZomboidLua' {\n${clazz.compile(
        '  '
      )}}\n`;
      tsCode = prettier.format(tsCode, {
        singleQuote: true,
        bracketSpacing: true,
        parser: 'typescript',
        printWidth: 120,
      });
      this.writeTSFile(path, tsCode);
    }

    for (const tableName of Object.keys(tables)) {
      const path = `${tableDir}${tableName}.d.ts`;
      references.push(`tables/${tableName}.d.ts`);
      console.log(`Compiling Table: ${tableName}..`);
      const table = this.library.tables[tableName];
      let tsCode = `/** @noResolution @noSelfInFile */\n${atlas}\n\ndeclare module 'ZomboidLua' {\n${table.compile(
        '  '
      )}}\n`;
      tsCode = prettier.format(tsCode, {
        singleQuote: true,
        bracketSpacing: true,
        parser: 'typescript',
        printWidth: 120,
      });
      this.writeTSFile(path, tsCode);
    }

    references.sort((o1, o2) => o1.localeCompare(o2));

    let atlasCode = `import * as Zomboid from 'Zomboid';\n`;
    for (const ref of references) atlasCode += `/// <reference path="${ref}" />\n`;
    this.writeTSFile(atlasPath, atlasCode);
  }

  writeTSFile(path: string, code: string) {
    code = `${generateTSLicense()}\n\n${code}`;
    fs.writeFileSync(path, code);
  }
}
