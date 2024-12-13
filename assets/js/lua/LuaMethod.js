"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LuaMethod = void 0;
const ModelUtils_1 = require("./model/ModelUtils");
const ZomboidGenerator_1 = require("../ZomboidGenerator");
const LuaUtils_1 = require("./LuaUtils");
const LuaNamedObject_1 = require("./LuaNamedObject");
const LuaClass_1 = require("./LuaClass");
const LuaTable_1 = require("./LuaTable");
const LuaField_1 = require("./LuaField");
/** @author JabDoesThings */
class LuaMethod extends LuaNamedObject_1.LuaNamedObject {
    constructor(library, container, parsed, name, parameters, isStatic) {
        super(name);
        this.library = library;
        this.container = container;
        this.parsed = parsed;
        this.parameters = LuaUtils_1.fixParameters(parameters);
        this.isStatic = isStatic;
    }
    onCompile(prefix) {
        const { container, library } = this;
        let documentationString = '';
        let methodModel = null;
        if (container instanceof LuaClass_1.LuaClass) {
            const classModel = library.getClassModel(container);
            methodModel = classModel ? classModel.getMethodModel(this) : null;
            documentationString = methodModel ? methodModel.generateDocumentation(prefix, this) : '';
        }
        else if (container instanceof LuaTable_1.LuaTable) {
            const tableModel = library.getTableModel(container);
            methodModel = tableModel ? tableModel.getMethodModel(this) : null;
            documentationString = methodModel ? methodModel.generateDocumentation(prefix, this) : '';
        }
        const compileTypes = (types) => {
            let returnString = '';
            if (types && types.length) {
                for (const type of types) {
                    if (returnString.length)
                        returnString += ' | ';
                    returnString += ModelUtils_1.sanitizeName(type);
                }
            }
            return returnString;
        };
        // Compile parameter(s). (If any)
        let parametersString = '';
        let parameters = [];
        // If the model is present, set parameter names from it as some parameters may be renamed.
        if (methodModel) {
            for (const parameter of methodModel.parameters) {
                const types = parameter.types && parameter.types.length ? compileTypes(parameter.types) : ZomboidGenerator_1.WILDCARD_TYPE;
                parameters.push(`${parameter.name}: ${types}`);
            }
        }
        else {
            parameters = LuaUtils_1.fixParameters(this.parameters).map((param) => `${param}: ${ZomboidGenerator_1.WILDCARD_TYPE}`);
        }
        if (parameters.length) {
            for (const parameter of parameters)
                parametersString += `${parameter}, `;
            parametersString = parametersString.substring(0, parametersString.length - 2);
        }
        // Compile return type(s). (If any)
        let returnString = '';
        let returnTypes = [];
        let wrapWildcardType = true;
        if (methodModel) {
            const { _return_ } = methodModel;
            if (_return_) {
                wrapWildcardType = _return_.wrapWildcardType;
                if (_return_.types && _return_.types.length) {
                    for (const type of _return_.types) {
                        // Prevent duplicate return types.
                        if (returnTypes.indexOf(type) === -1)
                            returnTypes.push(ModelUtils_1.sanitizeName(type));
                    }
                }
            }
        }
        if (returnTypes.length) {
            returnString = '';
            for (const type of returnTypes) {
                if (returnString.length)
                    returnString += ' | ';
                returnString += type;
            }
        }
        else {
            // Default return type.
            returnString = ZomboidGenerator_1.WILDCARD_TYPE;
        }
        let s = '';
        if (documentationString.length)
            s += `${documentationString}\n`;
        let compiled = `${s}${prefix}${this.isStatic ? 'static ' : ''}${this.name}`;
        const containerIsClass = container instanceof LuaClass_1.LuaClass;
        // Temporary solution for fixing class method override errors
        // Conflict with typescript' override rule: 
        // https://www.typescriptlang.org/docs/handbook/2/classes.html#overriding-methods
        // Perhaps it can never be truly repaired
        const wrongClassOverrideTempFix = containerIsClass || this.isStatic ? `${parametersString.trim() ? ', ' : ''}...__args: never[]` : '';
        if (containerIsClass && !this.isStatic) {
            // Declare as a class method instead of a class field
            compiled += `(${parametersString}${wrongClassOverrideTempFix}): ${returnString}`;
        }
        else {
            compiled += `: `;
            if (wrapWildcardType && !this.isStatic)
                compiled += '(';
            // KONIJIMA FIX
            // Fix the static method using ':' instead of '.' by removing the '| any'
            compiled += `(${parametersString}${wrongClassOverrideTempFix}) => ${returnString}`;
            if (wrapWildcardType && !this.isStatic)
                compiled += `) | ${ZomboidGenerator_1.WILDCARD_TYPE}`;
        }
        compiled += ';';
        return compiled;
    }
    scanFields() {
        const { parsed, container } = this;
        if (!parsed || !container || container.type !== 'class') {
            return;
        }
        if (parsed.type === 'FunctionDeclaration') {
            this.scanFieldsAsFunctionDeclaration(parsed);
        }
    }
    scanFieldsAsFunctionDeclaration(declaration) {
        if (!declaration.body.length)
            return;
        const fieldReferences = LuaUtils_1.scanBodyForFields(declaration.body, this.container.name, [].concat(this.parameters));
        for (const reference of fieldReferences) {
            const { containerName, fieldName, isStatic } = reference;
            let container = this.library.classes[containerName];
            if (!container)
                container = this.library.tables[containerName];
            if (!container)
                continue;
            const field = new LuaField_1.LuaField(this.container, fieldName, isStatic);
            container.fields[fieldName] = field;
        }
    }
}
exports.LuaMethod = LuaMethod;
