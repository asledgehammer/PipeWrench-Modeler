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
exports.LuaLibrary = void 0;
const fs = __importStar(require("fs"));
const LuaFile_1 = require("./LuaFile");
const LuaClass_1 = require("./LuaClass");
const ModelLibrary_1 = require("./model/ModelLibrary");
class LuaLibrary {
    constructor() {
        this.models = new ModelLibrary_1.ModelLibrary(this);
        this.files = [];
        this.luaFiles = {};
        this.classes = {};
        this.tables = {};
        this.globalFields = {};
        this.globalFunctions = {};
    }
    scan() {
        this.files = [];
        this.scanDir('./assets/media/lua/shared');
        this.scanDir('./assets/media/lua/client');
        this.scanDir('./assets/media/lua/server');
        this.files.sort((a, b) => {
            return a.localeCompare(b);
        });
        this.models.scan();
    }
    scanDir(dir) {
        const entries = fs.readdirSync(dir);
        const dirs = [];
        for (const entry of entries) {
            const path = dir + '/' + entry;
            if (path === '.' || path === '..' || path === '...')
                continue;
            const stats = fs.lstatSync(path);
            if (stats.isDirectory() && dirs.indexOf(path) === -1) {
                dirs.push(path);
                continue;
            }
            if (path.toLowerCase().endsWith('.lua') && this.files.indexOf(path) === -1) {
                this.files.push(path);
            }
        }
        if (dirs.length !== 0) {
            for (const dir of dirs)
                this.scanDir(dir);
        }
    }
    parse() {
        this.classes = {};
        this.tables = {};
        this.globalFields = {};
        this.globalFunctions = {};
        this.classes['ISBaseObject'] = new LuaClass_1.LuaClass(null, 'ISBaseObject');
        this.classes['ISBaseObject'].file = new LuaFile_1.LuaFile(this, '', '');
        for (const file of this.files) {
            const id = file
                .replace('./assets/media/lua/client/', '')
                .replace('./assets/media/lua/server/', '')
                .replace('./assets/media/lua/shared/', '')
                .replace('.lua', '')
                .replace('.Lua', '')
                .replace('.LUA', '');
            const luaFile = new LuaFile_1.LuaFile(this, id, file);
            luaFile.parse();
            luaFile.scanRequires();
            this.luaFiles[id] = luaFile;
        }
        for (const file of Object.values(this.luaFiles))
            file.scanGlobals();
        for (const file of Object.values(this.luaFiles))
            file.scanMembers();
        for (const _class_ of Object.values(this.classes))
            _class_.scanMethods();
        this.linkClasses();
        this.audit();
        this.models.parse();
    }
    compileClasses(prefix = '') {
        const classNames = Object.keys(this.classes);
        classNames.sort((o1, o2) => o1.localeCompare(o2));
        let s = '';
        for (const className of classNames)
            s += `${this.classes[className].compile(prefix)}\n`;
        return s;
    }
    compileTables(prefix = '') {
        const tableNames = Object.keys(this.tables);
        tableNames.sort((o1, o2) => o1.localeCompare(o2));
        let s = '';
        for (const tableName of tableNames)
            s += `${this.tables[tableName].compile(prefix)}\n`;
        return s;
    }
    getClassModel(_class_) {
        return this.models ? this.models.getClassModel(_class_) : null;
    }
    getTableModel(table) {
        return this.models ? this.models.getTableModel(table) : null;
    }
    getGlobalFieldModel(field) {
        return this.models ? this.models.getGlobalFieldModel(field) : null;
    }
    getGlobalFunctionModel(_function_) {
        return this.models ? this.models.getGlobalFunctionModel(_function_) : null;
    }
    audit() {
        for (const className of Object.keys(this.classes)) {
            if (this.tables[className])
                delete this.tables[className];
            this.classes[className].audit();
        }
    }
    linkClasses() {
        for (const name of Object.keys(this.classes)) {
            const _class_ = this.classes[name];
            if (_class_.name === 'ISBaseObject')
                continue;
            let superClass = this.classes[_class_.superClassName];
            if (!superClass)
                superClass = this.resolveProxyClass(_class_.superClassName);
            if (!superClass) {
                console.warn(`[LuaLibrary] Lua Superclass not found: ${_class_.name} extends ${_class_.superClassName}`);
            }
            _class_.superClass = superClass;
        }
    }
    resolveProxyClass(className) {
        for (const _class_ of Object.values(this.luaFiles)) {
            if (_class_.proxies[className])
                return this.classes[_class_.proxies[className]];
        }
        return null;
    }
    setClass(_class_) {
        this.classes[_class_.name] = _class_;
    }
}
exports.LuaLibrary = LuaLibrary;
