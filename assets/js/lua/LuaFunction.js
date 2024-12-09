"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LuaFunction = void 0;
const ZomboidGenerator_1 = require("../ZomboidGenerator");
const LuaUtils_1 = require("./LuaUtils");
const ModelUtils_1 = require("./model/ModelUtils");
const LuaNamedObject_1 = require("./LuaNamedObject");
/** @author JabDoesThings */
class LuaFunction extends LuaNamedObject_1.LuaNamedObject {
    constructor(file, parsed, name, parameters, isLocal) {
        super(name);
        this.parsed = parsed;
        this.file = file;
        this.parameters = LuaUtils_1.fixParameters(parameters);
        this.isLocal = isLocal;
    }
    generateDocumentation(prefix) {
        const library = this.file.library;
        const model = library.getGlobalFunctionModel(this);
        return model ? model.generateDocumentation(prefix, this) : `${prefix}/** @noSelf */`;
    }
    onCompile(prefix) {
        const library = this.file.library;
        let { name } = this;
        const model = library.getGlobalFunctionModel(this);
        let documentationString = this.generateDocumentation(prefix);
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
        if (model) {
            for (const parameter of model.parameters) {
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
        if (model) {
            const { _return_: returns } = model;
            if (returns) {
                wrapWildcardType = returns.wrapWildcardType;
                if (returns.types && returns.types.length) {
                    for (const type of returns.types) {
                        // Prevent duplicate return types.
                        if (returnTypes.indexOf(type) === -1)
                            returnTypes.push(type);
                    }
                }
            }
        }
        if (returnTypes.length) {
            returnString = '';
            for (const type of returnTypes) {
                if (returnString.length)
                    returnString += ' | ';
                returnString += ModelUtils_1.sanitizeName(type);
            }
        }
        else {
            // Default return type.
            returnString = ZomboidGenerator_1.WILDCARD_TYPE;
        }
        let s = '';
        if (documentationString.length)
            s += `${documentationString}\n`;
        let compiled = `${s}${prefix}export const ${ModelUtils_1.sanitizeName(name)}: `;
        if (wrapWildcardType)
            compiled += '(';
        compiled += `(${parametersString}) => ${returnString}`;
        if (wrapWildcardType)
            compiled += `)`;
        compiled += ';';
        return compiled;
    }
    generateAPI(prefix) {
        // This is the only way I know how to have this not error out. -Jab
        return this.onCompile(prefix);
        // const { name, fullPath } = this;
        // const documentation = this.generateDocumentation(prefix);
        // return `${prefix}${
        //   documentation ? `${documentation}\n` : ''
        // }${prefix}export const ${sanitizeName(name)} = ${fullPath};`;
    }
    generateLuaInterface(prefix = '') {
        // Compile parameter(s)..
        let parametersString = '(';
        const { name, parameters } = this;
        if (parameters.length) {
            for (let index = 0; index < parameters.length; index++)
                parametersString += `arg${index},`;
            parametersString = parametersString.substring(0, parametersString.length - 1);
        }
        parametersString += ')';
        // Functions are assigned differently.
        return `${prefix} function Exports.${ModelUtils_1.sanitizeName(name)}${parametersString} return ${name}${parametersString} end\n`;
    }
    get namespace() {
        return this.file.propertyNamespace;
    }
    get fullPath() {
        const { name } = this;
        return `${this.namespace}.${ModelUtils_1.sanitizeName(name)}`;
    }
}
exports.LuaFunction = LuaFunction;
