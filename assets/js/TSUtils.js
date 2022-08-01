"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mkdirsSync = exports.wrapModule = void 0;
exports.wrapModule = (moduleName, fileLocal, namespace, code) => {
    let s = `/** @noResolution @noSelfInFile */\n`;
    s += '/// <reference path="';
    for (let i = 0; i < fileLocal.split('/').length; i++)
        s += '../';
    s += `PipeWrench.d.ts" />\n\ndeclare module '${moduleName}' {\n`;
    s += `export namespace ${namespace} {\n`;
    return `${s}${code}}\n}\n`;
};
exports.mkdirsSync = (path) => {
    const split = path.split('/');
    let built = '';
    for (const next of split) {
        built += built.length ? `/${next}` : next;
        if (next === '.')
            continue;
        if (!fs.existsSync(built))
            fs.mkdirSync(built);
    }
};
