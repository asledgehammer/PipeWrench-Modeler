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
exports.ModelFile = void 0;
const fs = __importStar(require("fs"));
const ClassModel_1 = require("./ClassModel");
const TableModel_1 = require("./TableModel");
const FieldModel_1 = require("./FieldModel");
const FunctionModel_1 = require("./FunctionModel");
class ModelFile {
    constructor(library, id, file = '') {
        this.classes = {};
        this.tables = {};
        this.globalFields = {};
        this.globalFunctions = {};
        this.library = library;
        this.id = id;
        this.file = file;
    }
    parse() {
        const raw = fs.readFileSync(this.file).toString();
        this.parsed = JSON.parse(raw);
        this.version = this.parsed.version;
    }
    scan() {
        const { parsed } = this;
        const { classes, tables, globalFields, globalFunctions } = parsed;
        this.clear();
        if (classes) {
            for (const name of Object.keys(classes)) {
                const luaClass = this.library.luaLibrary.classes[name];
                this.library.classes[name] = this.classes[name] = new ClassModel_1.ClassModel(luaClass, name, classes[name]);
            }
        }
        if (tables) {
            for (const name of Object.keys(tables)) {
                const luaTable = this.library.luaLibrary.tables[name];
                this.library.tables[name] = this.tables[name] = new TableModel_1.TableModel(luaTable, name, tables[name]);
            }
        }
        if (globalFields) {
            for (const name of Object.keys(globalFields)) {
                this.library.globalFields[name] = this.globalFields[name] = new FieldModel_1.FieldModel(name, globalFields[name]);
            }
        }
        if (globalFunctions) {
            for (const name of Object.keys(globalFunctions)) {
                this.library.globalFunctions[name] = this.globalFunctions[name] = new FunctionModel_1.FunctionModel(name, globalFunctions[name]);
            }
        }
    }
    populate() {
        for (const _class_ of Object.values(this.classes))
            _class_.populate();
        for (const table of Object.values(this.tables))
            table.populate();
    }
    save(path) {
        let classes = undefined;
        let classNames = Object.keys(this.classes);
        if (classNames.length) {
            classes = {};
            classNames.sort((o1, o2) => o1.localeCompare(o2));
            for (const className of classNames)
                classes[className] = this.classes[className].save();
        }
        let tables = undefined;
        let tableNames = Object.keys(this.tables);
        if (tableNames.length) {
            tables = {};
            tableNames.sort((o1, o2) => o1.localeCompare(o2));
            for (const tableName of tableNames)
                tables[tableName] = this.tables[tableName].save();
        }
        let globalFields = undefined;
        let globalFieldNames = Object.keys(this.globalFields);
        if (globalFieldNames.length) {
            globalFields = {};
            globalFieldNames.sort((o1, o2) => o1.localeCompare(o2));
            for (const fieldName of globalFieldNames)
                globalFields[fieldName] = this.globalFields[fieldName].save();
        }
        let globalFunctions = undefined;
        let globalfunctionsNames = Object.keys(this.globalFunctions);
        if (globalfunctionsNames.length) {
            globalFunctions = {};
            globalfunctionsNames.sort((o1, o2) => o1.localeCompare(o2));
            for (const functionName of globalFieldNames)
                globalFunctions[functionName] = this.globalFunctions[functionName].save();
        }
        const json = { version: 1, classes, tables, globalFields, globalFunctions };
        const data = JSON.stringify(json, null, 2);
        fs.writeFileSync(path, data);
    }
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
}
exports.ModelFile = ModelFile;
