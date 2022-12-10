"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LuaClass = void 0;
const LuaContainer_1 = require("./LuaContainer");
const ClassModel_1 = require("./model/ClassModel");
const ZomboidGenerator_1 = require("../ZomboidGenerator");
const ModelUtils_1 = require("./model/ModelUtils");
class LuaClass extends LuaContainer_1.LuaContainer {
    constructor(file, name, superClassName) {
        super(file, name, 'class');
        this.file = file;
        this.superClassName = superClassName;
    }
    generateModel() {
        const model = new ClassModel_1.ClassModel(this, this.name);
        model.populate();
        return model;
    }
    onCompile(prefix) {
        const { library } = this.file;
        const { name } = this;
        let documentation;
        const model = library.getClassModel(this);
        documentation = this.generateDocumentation(prefix, model);
        if (this.isEmpty()) {
            let s = `${prefix}${documentation}\n${prefix}export class ${ModelUtils_1.sanitizeName(name)}`;
            if (this.superClass)
                s += ` extends ${this.superClass.fullPath}`;
            return `${s} { [id: string]: ${ZomboidGenerator_1.WILDCARD_TYPE}; static [id: string]: ${ZomboidGenerator_1.WILDCARD_TYPE}; }`;
        }
        const { staticFields, nonStaticFields } = this.sortFields();
        const { staticMethods, nonStaticMethods } = this.sortMethods();
        const newPrefix = prefix + '  ';
        let s = '';
        if (documentation.length)
            s += `${prefix}${documentation}\n`;
        s += `${prefix}export class ${ModelUtils_1.sanitizeName(name)}`;
        if (this.superClass)
            s += ` extends ${this.superClass.fullPath}`;
        s += ' {\n\n';
        s += `${newPrefix}[id: string]: ${ZomboidGenerator_1.WILDCARD_TYPE};\n${newPrefix}static [id: string]: ${ZomboidGenerator_1.WILDCARD_TYPE};\n\n`;
        if (staticFields.length) {
            for (const field of staticFields) {
                if (this.superHasField(field.name))
                    continue;
                s += `${field.compile(newPrefix)}\n\n`;
            }
        }
        if (nonStaticFields.length) {
            for (const field of nonStaticFields) {
                if (this.superHasField(field.name))
                    continue;
                s += `${field.compile(newPrefix)}\n\n`;
            }
        }
        if (this._constructor_)
            s += `${this._constructor_.compile(newPrefix)}\n\n`;
        if (nonStaticMethods.length) {
            for (const method of nonStaticMethods) {
                if (this.superHasMethod(method.name))
                    continue;
                s += `${method.compile(newPrefix)}\n\n`;
            }
        }
        if (staticMethods.length) {
            for (const method of staticMethods) {
                if (this.superHasMethod(method.name))
                    continue;
                s += `${method.compile(newPrefix)}\n\n`;
            }
        }
        return `${s}${prefix}}`;
    }
    superHasField(fieldName) {
        if (!this.superClass)
            return false;
        return this.superClass.fields[fieldName] != null;
    }
    superHasMethod(methodName) {
        if (!this.superClass)
            return false;
        return this.superClass.methods[methodName] != null;
    }
    generateDocumentation(prefix, model) {
        return model ? model.generateDoc(prefix, this) : `/** @customConstructor ${this.name}:new */`;
    }
    generateAPI(prefix) {
        const { library } = this.file;
        let { name } = this;
        const model = library.getClassModel(this);
        const documentation = this.generateDocumentation(prefix, model);
        return `${prefix}${documentation ? `${documentation}\n` : ''}${prefix}export class ${ModelUtils_1.sanitizeName(name)} extends ${this.fullPath} {}`;
    }
    generateLuaInterface(prefix = '') {
        const { name } = this;
        return `${prefix}Exports.${ModelUtils_1.sanitizeName(name)} = loadstring("return _G['${name}']")()\n`;
    }
    scanMethods() {
        if (this._constructor_)
            this._constructor_.scan();
        for (const method of Object.values(this.methods))
            method.scanFields();
    }
    hasSuperClass() {
        return this.superClass != null;
    }
    isEmpty() {
        return (!Object.keys(this.fields).length && !Object.keys(this.methods).length && !this._constructor_);
    }
    get namespace() {
        return this.name === 'ISBaseObject' ? 'lua.shared.ISBaseObject' : this.file.containerNamespace;
    }
    get fullPath() {
        return `${this.namespace}.${ModelUtils_1.sanitizeName(this.name)}`;
    }
}
exports.LuaClass = LuaClass;
