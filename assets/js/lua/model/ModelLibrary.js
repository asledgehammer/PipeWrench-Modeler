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
exports.ModelLibrary = void 0;
const fs = __importStar(require("fs"));
const ModelFile_1 = require("./ModelFile");
const ModelUtils_1 = require("./ModelUtils");
/** @author JabDoesThings */
class ModelLibrary {
    constructor(luaLibrary) {
        /** All model files discovered from scanning directories. */
        this.files = [];
        /** All model files in the library. */
        this.modelFiles = {};
        /** All class models in the library. */
        this.classes = {};
        /** All table models in the library. */
        this.tables = {};
        /** All global field models in the library. */
        this.globalFields = {};
        /** All global function models in the library. */
        this.globalFunctions = {};
        this.luaLibrary = luaLibrary;
    }
    /**
     * Scans and discovers JSON model files to load & read.
     */
    scan() {
        if (fs.existsSync("./assets/media/models")) {
            this.files.length = 0;
            this.scanDir('./assets/media/models');
            this.files.sort((a, b) => a.localeCompare(b));
        }
    }
    /**
     * Parses through all loaded ModelFiles, loading classes, tables, global fields, and global functions.
     */
    parse() {
        this.clear();
        for (const file of this.files) {
            let id = ModelLibrary.getFileId(file);
            const modelFile = new ModelFile_1.ModelFile(this, id, file);
            try {
                modelFile.parse();
                modelFile.scan();
            }
            catch (e) {
                console.error(`Failed to load Model File: ${file}`);
                console.error(e);
                continue;
            }
            this.modelFiles[id] = modelFile;
        }
    }
    /**
     * Clears all classes, tables, global fields, and global functions in the library.
     */
    clear() {
        for (const id of Object.keys(this.classes))
            delete this.classes[id];
        for (const id of Object.keys(this.tables))
            delete this.tables[id];
        for (const id of Object.keys(this.globalFields))
            delete this.globalFields[id];
        for (const id of Object.keys(this.globalFunctions))
            delete this.globalFunctions[id];
    }
    /**
     *
     * @param path The path to the file.
     * @returns The model file instance. Returns null if not valid JSON.
     */
    loadFile(path) {
        const modelFile = new ModelFile_1.ModelFile(this, ModelLibrary.getFileId(path), path);
        try {
            modelFile.parse();
            modelFile.scan();
        }
        catch (e) {
            console.error(`Failed to load Model File: ${path}`);
            console.error(e);
            return null;
        }
        this.modelFiles[modelFile.id] = modelFile;
        return modelFile;
    }
    getClassModel(_class_) {
        const model = this.classes[_class_.name];
        return model && model.testSignature(_class_) ? model : null;
    }
    getTableModel(table) {
        const model = this.tables[table.name];
        return model && model.testSignature(table) ? model : null;
    }
    getGlobalFieldModel(field) {
        const model = this.globalFields[field.name];
        return model && model.testSignature(field) ? model : null;
    }
    getGlobalFunctionModel(func) {
        const model = this.globalFunctions[ModelUtils_1.sanitizeName(func.name)];
        if (model)
            console.log(model);
        return model && model.testSignature(func) ? model : null;
    }
    scanDir(directory) {
        this.files.length = 0;
        const entries = fs.readdirSync(directory);
        const directories = [];
        for (const entry of entries) {
            const path = directory + '/' + entry;
            if (path === '.' || path === '..' || path === '...') {
                continue;
            }
            const stats = fs.lstatSync(path);
            if (stats.isDirectory() && directories.indexOf(path) === -1) {
                directories.push(path);
                continue;
            }
            if (path.toLowerCase().endsWith('.json') && this.files.indexOf(path) === -1) {
                this.files.push(path);
            }
        }
        if (directories.length !== 0) {
            for (const nextDirectory of directories) {
                this.scanDir(nextDirectory);
            }
        }
    }
    createFile(id) {
        const model = new ModelFile_1.ModelFile(this, id);
        this.modelFiles[id] = model;
        return model;
    }
    static getFileId(path) {
        const s = path
            .replace('\\', '/')
            .replace('.json', '')
            .replace('.json', '')
            .replace('.json', '');
        if (s.indexOf('/') !== -1)
            return s.split('/').pop();
        return s;
    }
}
exports.ModelLibrary = ModelLibrary;
