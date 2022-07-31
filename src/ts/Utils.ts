import * as fs from 'fs';
import * as prettier from 'prettier';
import { DocumentationBuilder } from './DocumentationBuilder';

export const MIT_LICENSE = [
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
  'File generated at: $TIME_GENERATED$',
];

export type Directory = {
  path: string;
  name: string;
  dirs: { [id: string]: Directory };
  files: { [id: string]: File };
};

export type File = {
  path: string;
  name: string;
  extension: string;
};

export const rmdirsync = function (path: string) {
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

export const cleardirsSync = function (path: string) {
  let files = [];
  if (fs.existsSync(path)) {
    // Remove dir(s) first.
    files = fs.readdirSync(path);
    files.forEach((dir) => {
      var dirPath = `${path}/${dir}`;
      if (fs.lstatSync(dirPath).isDirectory()) {
        cleardirsSync(dirPath);
        fs.rmdirSync(dirPath);
      }
    });

    // Remove file(s).
    files = fs.readdirSync(path);
    files.forEach((file) => {
      var filePath = `${path}/${file}`;
      if (fs.lstatSync(filePath).isFile()) fs.unlinkSync(filePath);
    });
  }
};

export const scandirs = function (path: string): Directory {
  const name = path.split('/').pop();
  const dirs: { [id: string]: Directory } = {};
  const files: { [id: string]: File } = {};

  let _files = [];
  if (fs.existsSync(path)) {
    _files = fs.readdirSync(path);
    _files.forEach((file) => {
      var curPath = `${path}/${file}`;
      const stats = fs.lstatSync(curPath);
      if (stats.isFile()) {
        const split = file.split('.');
        const extension = split.pop();
        const name = split.join('.');
        files[file] = { path: curPath, name, extension };
      } else if (stats.isDirectory()) {
        dirs[file] = scandirs(curPath);
      }
    });
  }
  return { path, name, dirs, files };
};

export const generateTSLicense = (): string => {
  const date = new Date();
  const doc = new DocumentationBuilder(true);
  for (const line of MIT_LICENSE) {
    doc.appendLine(
      line
        .replace('$YEAR$', date.getFullYear().toString())
        .replace('$TIME_GENERATED$', date.toISOString())
    );
  }
  return doc.build();
};

export const generateLuaLicense = (): string => {
  const date = new Date();
  const dateS = date.toISOString();
  let lines = '';
  const year = date.getFullYear().toString();
  for (const line of MIT_LICENSE) {
    lines += '-- ' + line.replace('$YEAR$', year).replace('$TIME_GENERATED$', dateS) + '\n';
  }
  return lines;
};

export const wrapModule = (
  moduleName: string,
  fileLocal: string,
  namespace: string,
  code: string
): string => {
  let backup = '';
  for (let i = 0; i < fileLocal.split('/').length; i++) backup += '../';

  let s = '/** @noResolution @noSelfInFile */\n';
  s += `/// <reference path="${backup}reference.d.ts" />\n`;
  s += `/// <reference path="${backup}PipeWrench.d.ts" />\n`;
  s += "import * as PipeWrench from 'PipeWrench';\n\n";
  s += `declare module '${moduleName}' {\n`;
  return `${s}${code}}\n`;
};

export const mkdirsSync = (path: string) => {
  const split = path.split('/');
  let built = '';
  for (const next of split) {
    built += built.length ? `/${next}` : next;
    if (next === '.') continue;
    if (!fs.existsSync(built)) fs.mkdirSync(built);
  }
};

export const writeTSFile = (path: string, code: string) => {
  code = `${generateTSLicense()}\n\n${code}`;
  fs.writeFileSync(path, code);
};

export const writeLuaFile = (path: string, code: string) => {
  code = `${generateLuaLicense()}\n\n${code}`;
  fs.writeFileSync(path, code);
};

export const prettify = (code: string): string => {
  return prettier.format(code, {
    singleQuote: true,
    bracketSpacing: true,
    parser: 'typescript',
    printWidth: 120,
  });
};

/**
 * A temporary workaround for no `replaceAll` function by default.
 *
 * @param string The string to transform.
 * @param target The target phrase to replace.
 * @param to The phrase to replace the target.
 * @returns The transformed string.
 */
 export const replaceAll = (string: string, target: string, to: string, position: number = 0): string => {
  let index: number;
  let lastIndex: number = position;
  while ((index = string.indexOf(target, lastIndex)) !== -1) {
    string = string.replace(target, to);
    lastIndex = index + to.length;
    if (index > string.length) break;
  }
  return string;
};

export const applyTextArea = (textarea: HTMLTextAreaElement, destination: string[]): void => {
  const source = textarea.value.split('\n');
  destination.length = 0;
  for (let line of source) {
    line = line.trim();
    if (line.length) destination.push(line);
  }
};