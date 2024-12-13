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
exports.ZomboidGenerator = exports.WILDCARD_TYPE = void 0;
const fs = __importStar(require("fs"));
const path_1 = __importDefault(require("path"));
// import os module
const os = require('os');
// check the available memory
const userHomeDir = os.homedir();
const Utils_1 = require("./Utils");
exports.WILDCARD_TYPE = 'any';
class ZomboidGenerator {
    constructor(library, moduleName, outDir) {
        this.library = library;
        this.moduleName = moduleName || '@asledgehammer/pipewrench';
        this.outDir = outDir || './dist';
    }
    run() {
        ZomboidGenerator.FUNCTION_CACHE.length = 0;
        console.log("- setupDirectories...");
        const sides = [
            'shared',
            'server',
            'client',
        ];
        const rootRef = "lua.reference.partial.d.ts";
        const getLuaRef = (side) => `lua.${side}.interface.partial.lua`;
        const luaRefsWithSide = sides.map(side => [side, getLuaRef(side)]);
        const getRootDef = (side) => `lua.${side}.api.partial.d.ts`;
        const rootRefsWithSide = sides.map(side => [side, getRootDef(side)]);
        this.setupDirectories(rootRef, ...luaRefsWithSide.map(r => r[1]), ...rootRefsWithSide.map(r => r[1]));
        console.log("- generateDefinitions...");
        this.generateDefinitions();
        console.log("- generateReferencePartial...");
        this.generateReferencePartial(rootRef);
        console.log("- generateLuaInterfacePartial...");
        luaRefsWithSide.forEach(([side, luaRef]) => {
            this.generateLuaInterfacePartial(luaRef, side);
        });
        console.log("- generateAPIPartial...");
        rootRefsWithSide.forEach(([side, luaRef]) => {
            this.generateAPIPartial(luaRef, rootRef, side);
        });
    }
    setupDirectories(...filePaths) {
        const { outDir } = this;
        // Initialize directories.
        filePaths.forEach(filePath => {
            fs.rmSync(path_1.default.join(outDir, filePath), { "force": true });
        });
        fs.rmSync(path_1.default.join(outDir, "lua"), { "force": true, recursive: true });
        if (!fs.existsSync(outDir))
            fs.mkdirSync(outDir, { recursive: true });
    }
    generateDefinitions() {
        const { library, moduleName, outDir } = this;
        const { luaFiles } = library;
        const luaFileNames = Object.keys(luaFiles).sort((o1, o2) => o1.localeCompare(o2));
        for (const fileName of luaFileNames) {
            const file = luaFiles[fileName];
            const newFileName = path_1.default.basename(file.fileLocal, ".lua") + '.d.ts';
            const newFolder = path_1.default.join(outDir, file.folder);
            const newFilePath = path_1.default.join(newFolder, newFileName);
            console.log(`Generating: ${newFilePath}..`);
            const code = file.generateDefinitionFile(moduleName);
            Utils_1.mkdirsSync(newFilePath);
            Utils_1.writeTSFile(newFilePath, Utils_1.prettify(code));
        }
    }
    generateAPIPartial(rootDef, rootRef, side) {
        const { library, moduleName, outDir } = this;
        const { luaFiles } = library;
        const sideLuaFiles = this.getSideLuaFiles(luaFiles, side);
        const luaFileNames = Object.keys(sideLuaFiles).sort((o1, o2) => o1.localeCompare(o2));
        let code = '';
        for (const fileName of luaFileNames) {
            const file = luaFiles[fileName];
            const fileCode = file.generateAPI('  ');
            if (fileCode.length)
                code += `${fileCode}\n`;
        }
        // Wrap and save the code.
        let s = '/** @noSelfInFile */\n';
        s += `/// <reference path="${rootRef}" />\n\n`;
        s += `declare module '${moduleName}' {\n`;
        s += '// [PARTIAL:START]\n';
        s += code;
        s += '// [PARTIAL:STOP]\n';
        s += '}\n';
        Utils_1.writeTSFile(`${outDir}/${rootDef}`, Utils_1.prettify(s));
    }
    generateReferencePartial(rootRef) {
        const { outDir } = this;
        // Grab the entire file tree generated so far.
        const luaDir = Utils_1.scandirs(outDir);
        const references = [];
        // Generate the index.
        const recurse = (dir) => {
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
            for (const subdirName of dirNames)
                recurse(dir.dirs[subdirName]);
        };
        // Start the filetree walk.
        recurse(luaDir.dirs['lua']);
        // Generate the reference partial.
        references.sort((o1, o2) => o1.localeCompare(o2));
        let code = '// [PARTIAL:START]\n';
        for (const reference of references)
            code += `${reference}\n`;
        code += '// [PARTIAL:STOP]\n';
        Utils_1.writeTSFile(`${outDir}/${rootRef}`, Utils_1.prettify(code));
    }
    getSideLuaFiles(luaFiles, side) {
        return Object.entries(luaFiles).reduce((acc, [id, luaFile]) => {
            if (luaFile.side !== side) {
                return acc;
            }
            acc[id] = luaFile;
            return acc;
        }, {});
    }
    generateLuaInterfacePartial(luaRef, side) {
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
            if (fileCode.length)
                luaCode += `${fileCode}\n`;
        }
        luaCode += '-- [PARTIAL:STOP]\n\n';
        luaCode += 'return Exports\n';
        Utils_1.writeLuaFile(`${outDir}/${luaRef}`, luaCode);
    }
}
exports.ZomboidGenerator = ZomboidGenerator;
ZomboidGenerator.FUNCTION_CACHE = [];
