"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyTextArea = exports.replaceAll = exports.prettify = exports.writeLuaFile = exports.writeTSFile = exports.mkdirsSync = exports.wrapModule = exports.generateLuaLicense = exports.generateTSLicense = exports.scandirs = exports.cleardirsSync = exports.rmdirsync = exports.MIT_LICENSE = void 0;
const fs = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
const prettier = __importStar(require("prettier"));
const DocumentationBuilder_1 = require("./DocumentationBuilder");
exports.MIT_LICENSE = [
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
];
exports.rmdirsync = function (path) {
    let files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach((file) => {
            var curPath = `${path}/${file}`;
            if (fs.lstatSync(curPath).isDirectory())
                exports.rmdirsync(curPath);
            else
                fs.unlinkSync(curPath);
        });
        fs.rmdirSync(path);
    }
};
exports.cleardirsSync = function (path) {
    let files = [];
    if (fs.existsSync(path)) {
        files = fs.readdirSync(path);
        files.forEach((dir) => {
            var dirPath = `${path}/${dir}`;
            if (fs.lstatSync(dirPath).isDirectory()) {
                exports.cleardirsSync(dirPath);
                fs.rmdirSync(dirPath);
            }
        });
        files = fs.readdirSync(path);
        files.forEach((file) => {
            var filePath = `${path}/${file}`;
            if (fs.lstatSync(filePath).isFile())
                fs.unlinkSync(filePath);
        });
    }
};
exports.scandirs = function (path) {
    const name = path.split('/').pop();
    const dirs = {};
    const files = {};
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
            }
            else if (stats.isDirectory()) {
                dirs[file] = exports.scandirs(curPath);
            }
        });
    }
    return { path, name, dirs, files };
};
exports.generateTSLicense = () => {
    const date = new Date();
    const doc = new DocumentationBuilder_1.DocumentationBuilder(true);
    for (const line of exports.MIT_LICENSE) {
        doc.appendLine(line
            .replace('$YEAR$', date.getFullYear().toString())
            .replace('$TIME_GENERATED$', date.toISOString()));
    }
    return doc.build();
};
exports.generateLuaLicense = () => {
    const date = new Date();
    const dateS = date.toISOString();
    let lines = '';
    const year = date.getFullYear().toString();
    for (const line of exports.MIT_LICENSE) {
        lines += '-- ' + line.replace('$YEAR$', year).replace('$TIME_GENERATED$', dateS) + '\n';
    }
    return lines;
};
exports.wrapModule = (moduleName, fileLocal, code) => {
    let backup = '';
    for (let i = 1; i < fileLocal.split('/').length; i++)
        backup += '../';
    let s = '/**  @noSelfInFile */\n';
    s += `\ndeclare module '${moduleName}' {\n`;
    return `${s}${code}}\n`;
};
exports.mkdirsSync = (fp) => {
    const dir = path_1.default.dirname(fp);
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir, { recursive: true });
};
exports.writeTSFile = (path, code) => {
    fs.writeFileSync(path, code);
};
exports.writeLuaFile = (path, code) => {
    fs.writeFileSync(path, code);
};
exports.prettify = (code) => {
    return prettier.format(code, {
        singleQuote: true,
        bracketSpacing: true,
        parser: 'typescript',
        printWidth: 120,
    });
};
exports.replaceAll = (string, target, to, position = 0) => {
    let index;
    let lastIndex = position;
    while ((index = string.indexOf(target, lastIndex)) !== -1) {
        string = string.replace(target, to);
        lastIndex = index + to.length;
        if (index > string.length)
            break;
    }
    return string;
};
exports.applyTextArea = (textarea, destination) => {
    const source = textarea.value.split('\n');
    destination.length = 0;
    for (let line of source) {
        line = line.trim();
        if (line.length)
            destination.push(line);
    }
};
