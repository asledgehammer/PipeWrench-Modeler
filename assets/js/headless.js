#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = void 0;
const path_1 = __importDefault(require("path"));
const LuaLibrary_1 = require("./lua/LuaLibrary");
const ZomboidGenerator_1 = require("./ZomboidGenerator");
exports.start = function () {
    console.log('### Loading please wait ###');
    const argv = process.argv.slice(2, process.argv.length);
    const args = {};
    argv.forEach((arg) => {
        const split = arg.split("=");
        args[split[0]] = split[1];
    });
    console.log("Args:", args);
    let luaPath = args.luapath || path_1.default.resolve(__dirname, "../media/lua");
    let outDir = args.outDir || path_1.default.resolve(__dirname, "./dist");
    const moduleName = args.moduleName || "@asledgehammer/pipewrench";
    const luaLibrary = new LuaLibrary_1.LuaLibrary(luaPath || undefined);
    const generator = new ZomboidGenerator_1.ZomboidGenerator(luaLibrary, moduleName, outDir);
    luaLibrary.scan();
    luaLibrary.parse();
    const classes = Object.values(luaLibrary.classes);
    const tables = Object.values(luaLibrary.tables);
    console.log("Sorting classes...");
    classes.sort((a, b) => a.name.localeCompare(b.name));
    console.log("Sorting tables...");
    tables.sort((a, b) => a.name.localeCompare(b.name));
    console.log("Generating class models...");
    for (const index in classes) {
        const _class = classes[index];
        luaLibrary.models.classes[_class.name] = _class.generateModel();
    }
    console.log("Generating table models...");
    for (const index in tables) {
        const _table = tables[index];
        luaLibrary.models.tables[_table.name] = _table.generateModel();
    }
    console.log("Running generator...");
    generator.run();
    console.log("### Generator Completed ###");
};
