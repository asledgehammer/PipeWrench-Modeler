"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LuaConstructor = void 0;
const ZomboidGenerator_1 = require("../ZomboidGenerator");
const LuaField_1 = require("./LuaField");
const LuaMethod_1 = require("./LuaMethod");
const LuaUtils_1 = require("./LuaUtils");
const ModelUtils_1 = require("./model/ModelUtils");
class LuaConstructor extends LuaMethod_1.LuaMethod {
    constructor(library, _class_, parsed, parameters) {
        super(library, _class_, parsed, 'constructor', parameters, false);
        this._class_ = _class_;
    }
    onCompile(prefix) {
        const { _class_ } = this;
        const { library } = _class_.file;
        let classModel = library.getClassModel(_class_);
        if (!classModel)
            classModel = library.getClassModel(_class_);
        const constructorModel = classModel ? classModel._constructor_ : null;
        const docs = constructorModel ? constructorModel.generateDoc(prefix, this) : '';
        const compileTypes = (types) => {
            let returnS = '';
            if (types && types.length) {
                for (const type of types) {
                    if (returnS.length)
                        returnS += ' | ';
                    returnS += ModelUtils_1.sanitizeName(type);
                }
            }
            else {
                returnS = ZomboidGenerator_1.WILDCARD_TYPE;
            }
            return returnS;
        };
        let parametersString = '';
        let parameters = [];
        if (constructorModel && constructorModel.testSignature(this)) {
            for (const parameter of constructorModel.parameters) {
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
        return `${docs.length ? `${docs}\n` : ''}${prefix}constructor(${parametersString});`;
    }
    scan() {
        const { parsed, container } = this;
        if (!parsed || !container || container.type !== 'class')
            return;
        const declaration = parsed;
        const fieldRefs = LuaUtils_1.scanBodyForFields(declaration.body, this.container.name, [].concat(this.parameters), true);
        let returnName;
        for (let index = declaration.body.length - 1; index >= 0; index--) {
            const statement = declaration.body[index];
            if (statement.type === 'ReturnStatement') {
                const returnStatement = statement;
                returnName = returnStatement.arguments[0].name;
                break;
            }
        }
        for (const ref of fieldRefs) {
            if (ref.containerName === returnName) {
                const { fieldName } = ref;
                if (!this.container.fields[fieldName]) {
                    const field = new LuaField_1.LuaField(this.container, ref.fieldName, false);
                    container.fields[fieldName] = field;
                }
            }
        }
    }
}
exports.LuaConstructor = LuaConstructor;
