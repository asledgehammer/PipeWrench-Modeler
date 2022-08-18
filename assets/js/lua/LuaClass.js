"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LuaClass = void 0;
const LuaContainer_1 = require("./LuaContainer");
const ClassModel_1 = require("./model/ClassModel");
const ZomboidGenerator_1 = require("../ZomboidGenerator");
const ModelUtils_1 = require("./model/ModelUtils");
/**
 * **LuaClass** represents tables that are declared using `ISBaseObject:derive(..)`. This is the
 * signature for all pseudo-classes in the codebase.
 *
 * All pseudo-classes house a constructor-like method as follows:
 *  - `<class>:new(..)`
 *
 * All functions that are assigned with ':' indexers are interpreted as methods. Functions that
 * are assigned with '.' are considered as static functions.
 *
 * All 'self.<property>' calls are interpreted as fields in the pseudo-class. All
 * '<class>.<property>' calls are interpreted as static fields.
 *
 * @author JabDoesThings
 */
class LuaClass extends LuaContainer_1.LuaContainer {
    /**
     * @param file The file containing the pseudo-class declaration.
     * @param name The name of the pseudo-class table. (In global)
     * @param superClassName (Optional) The name of the super-class.
     */
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
        // Render empty classes on one line.
        if (this.isEmpty()) {
            let s = `${prefix}${documentation}\n${prefix}export class ${ModelUtils_1.sanitizeName(name)}`;
            if (this.superClass)
                s += ` extends ${this.superClass.fullPath}`;
            return `${s} { [id: string]: ${ZomboidGenerator_1.WILDCARD_TYPE}; static [id: string]: ${ZomboidGenerator_1.WILDCARD_TYPE}; }`;
        }
        const { staticFields, nonStaticFields } = this.sortFields();
        const { staticMethods, nonStaticMethods } = this.sortMethods();
        const newPrefix = prefix + '  ';
        // Class Declaration line.
        let s = '';
        if (documentation.length)
            s += `${prefix}${documentation}\n`;
        s += `${prefix}export class ${ModelUtils_1.sanitizeName(name)}`;
        if (this.superClass)
            s += ` extends ${this.superClass.fullPath}`;
        s += ' {\n\n';
        // Wildcard.
        s += `${newPrefix}[id: string]: ${ZomboidGenerator_1.WILDCARD_TYPE};\n${newPrefix}static [id: string]: ${ZomboidGenerator_1.WILDCARD_TYPE};\n\n`;
        // Render static field(s). (If any)
        if (staticFields.length) {
            for (const field of staticFields) {
                if (this.superHasField(field.name))
                    continue;
                s += `${field.compile(newPrefix)}\n\n`;
            }
        }
        // Render static field(s). (If any)
        if (nonStaticFields.length) {
            for (const field of nonStaticFields) {
                if (this.superHasField(field.name))
                    continue;
                s += `${field.compile(newPrefix)}\n\n`;
            }
        }
        // Render the constructor. (If defined)
        if (this._constructor_)
            s += `${this._constructor_.compile(newPrefix)}\n\n`;
        // Render static method(s). (If any)
        if (nonStaticMethods.length) {
            for (const method of nonStaticMethods) {
                if (this.superHasMethod(method.name))
                    continue;
                s += `${method.compile(newPrefix)}\n\n`;
            }
        }
        // Render static method(s). (If any)
        if (staticMethods.length) {
            for (const method of staticMethods) {
                if (this.superHasMethod(method.name))
                    continue;
                s += `${method.compile(newPrefix)}\n\n`;
            }
        }
        // End of Class Declaration line.
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
        // Render the class documentation. (If present)
        const model = library.getClassModel(this);
        const documentation = this.generateDocumentation(prefix, model);
        // Render empty classes on one line.
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
    /**
     * @returns True if a super-class is assigned and linked successfully.
     */
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
