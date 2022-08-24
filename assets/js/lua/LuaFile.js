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
exports.LuaFile = void 0;
const fs = __importStar(require("fs"));
const parser = __importStar(require("luaparse"));
const Utils_1 = require("../Utils");
const LuaUtils_1 = require("./LuaUtils");
const ZomboidGenerator_1 = require("../ZomboidGenerator");
const LuaClass_1 = require("./LuaClass");
const LuaTable_1 = require("./LuaTable");
const LuaFunction_1 = require("./LuaFunction");
const LuaMethod_1 = require("./LuaMethod");
const LuaConstructor_1 = require("./LuaConstructor");
const path_1 = __importDefault(require("path"));
/**
 * **LuaFile** loads, parses, and processes Lua code stored in files.
 *
 * @author JabDoesThings
 */
class LuaFile {
    /**
     * @param library The library storing all discovered Lua.
     * @param id The `require(..) / require '..'` path to the file.
     * @param file The path to the file on the disk.
     */
    constructor(library, id, file) {
        /** All proxy assigners discovered in the file. */
        this.proxies = {};
        /** All pseudo-classes discovered in the file. */
        this.classes = {};
        /** All tables discovered in the file. */
        this.tables = {};
        this.globalFields = {};
        this.globalFunctions = {};
        /** All requires in the file. (Used for dependency chains) */
        this.requires = [];
        this.library = library;
        this.id = id;
        this.file = file;
        this.fileLocal = path_1.default.join("lua", path_1.default.relative(library.luaPath, file));
        this.folder = path_1.default.dirname(this.fileLocal);
        const propertyName = path_1.default.parse(this.fileLocal).name;
        const containerName = path_1.default.dirname(this.fileLocal).split(path_1.default.sep).join(".");
        this.containerNamespace = containerName;
        this.propertyNamespace = `${containerName}.${propertyName}`;
        console.log("Luafile: ", this.id);
        console.log("Property: ", this.propertyNamespace);
    }
    /**
     * Cleans & parses Lua in the file using LuaParse.
     */
    parse() {
        let raw = fs.readFileSync(this.file).toString();
        raw = LuaUtils_1.correctKahluaCode(raw);
        this.parsed = parser.parse(raw, { luaVersion: '5.1' });
    }
    /**
     * Ran first, scans for all `require(..) | require '..'` call-statements in the file.
     * These statements are used for generating dependency-chains for all files in the
     * library.
     */
    scanRequires() {
        const processRequire = (statement) => {
            const info = LuaUtils_1.getRequireInfo(statement);
            if (!info)
                return false;
            if (LuaUtils_1.DEBUG)
                LuaUtils_1.printRequireInfo(info);
            const { path } = info;
            if (this.requires.indexOf(path) === -1) {
                this.requires.push(path);
            }
            return true;
        };
        for (const statement of this.parsed.body) {
            if (statement.type === 'CallStatement') {
                if (processRequire(statement))
                    continue;
            }
        }
    }
    /**
     * Ran second, scans and discovers global functions, global pseudo-classes, and proxy
     * assignments to discovered elements in the file.
     */
    scanGlobals() {
        const { parsed } = this;
        const localVars = [];
        const processTable = (statement) => {
            const info = LuaUtils_1.getTableConstructor(statement);
            if (!info)
                return false;
            // Double-check if reused local tables are being reassigned. Ignore these.
            if (localVars.indexOf(info.name) !== -1)
                return false;
            // Make sure that the root class isn't rendered as a table.
            if (info.name === 'ISBaseObject') {
                this.classes['ISBaseObject'] = this.library.classes['ISBaseObject'];
                return false;
            }
            const table = new LuaTable_1.LuaTable(this, info.name);
            this.tables[info.name] = this.library.tables[info.name] = table;
            // console.log(`Adding table: ${table.name}`);
            return true;
        };
        const processDerive = (statement) => {
            const info = LuaUtils_1.getDeriveInfo(statement);
            if (!info)
                return false;
            if (info.subClass === 'ISBaseObject') {
                this.library.classes['ISBaseObject'].file = this;
                return true;
            }
            const _class_ = new LuaClass_1.LuaClass(this, info.subClass, info.superClass);
            this.classes[info.subClass] = this.library.classes[info.subClass] = _class_;
            // console.log(`Adding class: ${_class_.name}`);
            return true;
        };
        const processLocalProxy = (statement) => {
            const info = LuaUtils_1.getProxyInfo(statement);
            if (!info)
                return false;
            if (LuaUtils_1.DEBUG)
                LuaUtils_1.printProxyInfo(info);
            // Check to make sure a class exists for the proxy.
            if (!this.library.classes[info.target])
                return false;
            this.proxies[info.proxy] = info.target;
            return true;
        };
        const processFunction = (declaration) => {
            const info = LuaUtils_1.getFunctionDeclaration(declaration);
            if (!info)
                return false;
            if (LuaUtils_1.DEBUG)
                LuaUtils_1.printFunctionInfo(info);
            const _function_ = new LuaFunction_1.LuaFunction(this, declaration, info.name, info.parameters, info.isLocal);
            this.globalFunctions[info.name] = _function_;
            if (!info.isLocal) {
                this.globalFunctions[_function_.name] = this.library.globalFunctions[_function_.name] = _function_;
            }
            return true;
        };
        // Scan for local vars.
        for (const statement of parsed.body) {
            if (statement.type === 'LocalStatement') {
                localVars.push(statement.variables[0].name);
            }
        }
        // Scan for explicit class declaractions.
        for (const statement of parsed.body) {
            if (statement.type === 'AssignmentStatement') {
                if (processDerive(statement))
                    continue;
                else if (processTable(statement))
                    continue;
            }
            else if (statement.type === 'FunctionDeclaration') {
                if (processFunction(statement))
                    continue;
            }
        }
        // Scan for local references to class declarations.
        for (const statement of parsed.body) {
            if (statement.type === 'LocalStatement') {
                if (processLocalProxy(statement))
                    continue;
            }
        }
    }
    /**
     * Ran third, scans for elements assigned to global elements like methods and static
     * functions | properties.
     */
    scanMembers() {
        const { parsed } = this;
        const processMethod = (declaration) => {
            const info = LuaUtils_1.getMethodDeclaration(this.id.endsWith('luautils'), declaration);
            if (!info)
                return false;
            if (LuaUtils_1.DEBUG)
                console.log(`\tMethod: ${LuaUtils_1.printMethodInfo(info)}`);
            if (this.proxies[info.className]) {
                if (LuaUtils_1.DEBUG)
                    console.log(`${info.className} -> ${this.proxies[info.className]}`);
                info.className = this.proxies[info.className];
            }
            const _class_ = this.library.classes[info.className];
            if (_class_) {
                if (!info.isStatic && info.name === 'new') {
                    const _constructor_ = new LuaConstructor_1.LuaConstructor(this.library, _class_, declaration, info.parameters);
                    _class_._constructor_ = _constructor_;
                }
                else {
                    const method = new LuaMethod_1.LuaMethod(this.library, _class_, declaration, info.name, info.parameters, info.isStatic);
                    _class_.methods[info.name] = method;
                }
                return true;
            }
            const table = this.library.tables[info.className];
            if (table) {
                const method = new LuaMethod_1.LuaMethod(this.library, table, declaration, info.name, info.parameters, info.isStatic);
                table.methods[info.name] = method;
                return true;
            }
            // console.warn(`Cannot resolve container for method: \n\t${printMethodInfo(info)}`);
            return true;
        };
        const processMethodFromAssignment = (statement) => {
            const info = LuaUtils_1.getMethodDeclarationFromAssignment(this.id.endsWith('luautils'), statement);
            if (!info)
                return false;
            if (LuaUtils_1.DEBUG)
                console.log(`\tMethod: ${LuaUtils_1.printMethodInfo(info)}`);
            if (this.proxies[info.className]) {
                if (LuaUtils_1.DEBUG)
                    console.log(`${info.className} -> ${this.proxies[info.className]}`);
                info.className = this.proxies[info.className];
            }
            const _class_ = this.library.classes[info.className];
            if (_class_) {
                if (!info.isStatic && info.name === 'new') {
                    const _constructor_ = new LuaConstructor_1.LuaConstructor(this.library, _class_, statement, info.parameters);
                    _class_._constructor_ = _constructor_;
                }
                else {
                    const method = new LuaMethod_1.LuaMethod(this.library, _class_, statement, info.name, info.parameters, info.isStatic);
                    _class_.methods[info.name] = method;
                }
                return true;
            }
            const table = this.library.tables[info.className];
            if (table) {
                const method = new LuaMethod_1.LuaMethod(this.library, table, statement, info.name, info.parameters, info.isStatic);
                table.methods[info.name] = method;
                return true;
            }
            // console.warn(`Cannot resolve container for method: \n\t${printMethodInfo(info)}`);
            return true;
        };
        // Scan for class function declarations.
        for (const statement of parsed.body) {
            if (statement.type === 'FunctionDeclaration') {
                if (processMethod(statement))
                    continue;
                const info = LuaUtils_1.getFunctionDeclaration(statement);
                if (!info || info.isLocal || info.name === 'new' || info.name === 'toString')
                    continue;
                // console.log(`Global function: ${info.name}`);
                const _function_ = new LuaFunction_1.LuaFunction(this, statement, info.name, info.parameters, info.isLocal);
                this.library.globalFunctions[_function_.name] = _function_;
            }
            else if (statement.type === 'AssignmentStatement') {
                if (statement.init.length === 1) {
                    const init = statement.init[0];
                    if (init.type === 'FunctionDeclaration') {
                        // These assignments can only be static.
                        if (processMethodFromAssignment(statement))
                            continue;
                    }
                }
            }
        }
        if (LuaUtils_1.DEBUG)
            console.log('\n');
    }
    generateDefinitionFile(moduleName) {
        const { classes, tables, globalFields: fields, globalFunctions: functions } = this;
        const classNames = Object.keys(classes).sort((o1, o2) => o1.localeCompare(o2));
        const tableNames = Object.keys(tables).sort((o1, o2) => o1.localeCompare(o2));
        const fieldNames = Object.keys(fields).sort((o1, o2) => o1.localeCompare(o2));
        const funcNames = Object.keys(functions).sort((o1, o2) => o1.localeCompare(o2));
        let code = `  export namespace ${this.containerNamespace} {\n`;
        for (const className of classNames)
            code += `${classes[className].compile('    ')}\n\n`;
        for (const tableName of tableNames)
            code += `${tables[tableName].compile('    ')}\n\n`;
        code += '  }\n';
        code += `  export namespace ${this.propertyNamespace} {\n`;
        for (const fieldName of fieldNames)
            code += `${fields[fieldName].compile('  ')}\n\n`;
        for (const functionName of funcNames) {
            // Not sure why these two would exist in the global scope.
            if (functionName === 'new' || functionName === 'toString')
                continue;
            const _function_ = functions[functionName];
            if (_function_.isLocal)
                continue;
            code += `${_function_.compile('  ')}\n\n`;
        }
        code += '}\n';
        code = Utils_1.wrapModule(moduleName, this.fileLocal, code);
        return code;
    }
    generateLuaInterface(prefix = '') {
        const { classes, tables, globalFields: fields, globalFunctions: funcs } = this;
        const classNames = Object.keys(classes).sort((o1, o2) => o1.localeCompare(o2));
        const tableNames = Object.keys(tables).sort((o1, o2) => o1.localeCompare(o2));
        const fieldNames = Object.keys(fields).sort((o1, o2) => o1.localeCompare(o2));
        const funcionNames = Object.keys(funcs).sort((o1, o2) => o1.localeCompare(o2));
        if (!classNames.length && !tableNames.length && !fieldNames.length && !funcionNames.length) {
            return '';
        }
        let code = `--[${this.fileLocal.replace('.lua', '.d.ts')}]\n`;
        if (classNames.length) {
            for (const className of classNames)
                code += classes[className].generateLuaInterface(prefix);
        }
        if (tableNames.length) {
            for (const tableName of tableNames)
                code += tables[tableName].generateLuaInterface(prefix);
        }
        if (fieldNames.length) {
            for (const fieldName of fieldNames)
                code += fields[fieldName].generateLua(prefix);
        }
        if (funcionNames.length) {
            for (const functionName of funcionNames)
                funcs[functionName].generateLuaInterface(prefix);
        }
        return code;
    }
    generateAPI(partial) {
        const { classes, tables, globalFields: fields, globalFunctions: functions } = this;
        const classNames = Object.keys(classes).sort((o1, o2) => o1.localeCompare(o2));
        const tableNames = Object.keys(tables).sort((o1, o2) => o1.localeCompare(o2));
        const fieldNames = Object.keys(fields).sort((o1, o2) => o1.localeCompare(o2));
        const functionNames = Object.keys(functions).sort((o1, o2) => o1.localeCompare(o2));
        if (!classNames.length && !tableNames.length && !fieldNames.length && !functionNames.length) {
            return '';
        }
        let code = `// [${this.fileLocal.replace('.lua', '.d.ts')}]\n`;
        for (const className of classNames)
            code += `${classes[className].generateAPI(partial)}\n`;
        for (const tableName of tableNames)
            code += `${tables[tableName].generateAPI(partial)}\n`;
        for (const fieldName of fieldNames)
            code += `${fields[fieldName].generateAPI(partial, this)}\n`;
        for (const functionName of functionNames) {
            const _function_ = functions[functionName];
            // Only render global functions for the API.
            if (_function_.isLocal)
                continue;
            // Not sure why these two would exist in the global scope.
            if (functionName === 'new' || functionName === 'toString')
                continue;
            // Avoid duplicate global functions.
            if (ZomboidGenerator_1.ZomboidGenerator.FUNCTION_CACHE.indexOf(functionName) !== -1)
                continue;
            ZomboidGenerator_1.ZomboidGenerator.FUNCTION_CACHE.push(functionName);
            code += `${_function_.generateAPI(partial)}\n`;
        }
        return code;
    }
}
exports.LuaFile = LuaFile;
