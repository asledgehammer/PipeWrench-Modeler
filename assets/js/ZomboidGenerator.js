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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZomboidGenerator = exports.WILDCARD_TYPE = void 0;
const fs = __importStar(require("fs"));
// import os module
const os = require('os');
// check the available memory
const userHomeDir = os.homedir();
const Utils_1 = require("./Utils");
exports.WILDCARD_TYPE = 'any';
class ZomboidGenerator {
    constructor(library) {
        this.moduleName = 'PipeWrench';
        this.zomboidDir = `${userHomeDir}/Zomboid`;
        this.rootDir = `${this.zomboidDir}/PipeWrench`;
        this.outputDir = `${this.rootDir}/output`;
        this.luaDir = `${this.outputDir}/lua`;
        this.generatedDir = `${this.rootDir}/generated`;
        this.partialsDir = `${this.generatedDir}/partials`;
        this.library = library;
    }
    run() {
        ZomboidGenerator.FUNCTION_CACHE.length = 0;
        console.log("- setupDirectories...");
        this.setupDirectories();
        console.log("- generateDefinitions...");
        this.generateDefinitions();
        console.log("- generateReferencePartial...");
        this.generateReferencePartial();
        console.log("- generateLuaInterfacePartial...");
        this.generateLuaInterfacePartial();
        console.log("- generateAPIPartial...");
        this.generateAPIPartial();
    }
    setupDirectories() {
        const { rootDir: distDir, generatedDir, partialsDir, outputDir, luaDir, zomboidDir } = this;
        // Initialize directories.
        if (!fs.existsSync(zomboidDir))
            fs.mkdirSync(zomboidDir, { recursive: true });
        if (!fs.existsSync(distDir))
            fs.mkdirSync(distDir, { recursive: true });
        if (!fs.existsSync(generatedDir))
            fs.mkdirSync(generatedDir, { recursive: true });
        if (!fs.existsSync(partialsDir))
            fs.mkdirSync(partialsDir, { recursive: true });
        if (!fs.existsSync(outputDir))
            fs.mkdirSync(outputDir, { recursive: true });
        if (!fs.existsSync(luaDir))
            fs.mkdirSync(luaDir, { recursive: true });
        else
            Utils_1.cleardirsSync(this.luaDir);
    }
    generateDefinitions() {
        const { library, moduleName } = this;
        const { luaFiles } = library;
        const luaFileNames = Object.keys(luaFiles).sort((o1, o2) => o1.localeCompare(o2));
        for (const fileName of luaFileNames) {
            const file = luaFiles[fileName];
            console.log(`Generating: ${file.id.replace('.lua', '.d.ts')}..`);
            console.log(file.folder);
            const code = file.generateDefinitionFile(moduleName);
            Utils_1.mkdirsSync(`${this.luaDir}/${file.folder}`);
            Utils_1.writeTSFile(`${this.outputDir}/lua/${file.fileLocal.replace('.lua', '.d.ts')}`, Utils_1.prettify(code));
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
            if (fileCode.length)
                code += `${fileCode}\n`;
        }
        // Wrap and save the code.
        let s = '/** @noResolution @noSelfInFile */\n';
        s += `/// <reference path="reference.d.ts" />\n\n`;
        s += `declare module '${moduleName}' {\n`;
        s += '// [PARTIAL:START]\n';
        s += code;
        s += '// [PARTIAL:STOP]\n';
        s += '}\n';
        Utils_1.writeTSFile(`${partialsDir}/Lua.api.partial.d.ts`, Utils_1.prettify(s));
    }
    generateReferencePartial() {
        const { rootDir: distDir, partialsDir } = this;
        // Grab the entire file tree generated so far.
        const luaDir = Utils_1.scandirs(`${distDir}`);
        const references = [];
        // Generate the index.
        const recurse = (dir) => {
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
            for (const subdirName of dirNames)
                recurse(dir.dirs[subdirName]);
        };
        // Start the filetree walk.
        recurse(luaDir.dirs['output'].dirs['lua']);
        // Generate the reference partial.
        references.sort((o1, o2) => o1.localeCompare(o2));
        let code = '// [PARTIAL:START]\n';
        for (const reference of references)
            code += `${reference}\n`;
        code += '// [PARTIAL:STOP]\n';
        Utils_1.writeTSFile(`${partialsDir}/Lua.reference.partial.d.ts`, Utils_1.prettify(code));
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
            if (fileCode.length)
                luaCode += `${fileCode}\n`;
        }
        luaCode += `${prefix}_G.PIPEWRENCH_READY = true\n`;
        luaCode += `${prefix}-- Trigger reimport blocks for all compiled PipeWrench TypeScript file(s).\n`;
        luaCode += `${prefix}triggerEvent('OnPipeWrenchBoot', true)\n`;
        luaCode += 'end)\n';
        luaCode += '-- [PARTIAL:STOP]\n\n';
        luaCode += 'return Exports\n';
        Utils_1.writeLuaFile(`${partialsDir}/Lua.interface.partial.lua`, luaCode);
    }
}
exports.ZomboidGenerator = ZomboidGenerator;
ZomboidGenerator.FUNCTION_CACHE = [];
