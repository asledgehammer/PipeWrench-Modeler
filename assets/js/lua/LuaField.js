"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LuaField = void 0;
const ModelUtils_1 = require("./model/ModelUtils");
const ZomboidGenerator_1 = require("../ZomboidGenerator");
const LuaNamedObject_1 = require("./LuaNamedObject");
const LuaClass_1 = require("./LuaClass");
const LuaTable_1 = require("./LuaTable");
/**
 * **LuaField** stores calls to constants or variables.
 *
 * LuaFields are treated as fields for classes and treated as properties for tables and global.
 *
 * @author JabDoesThings
 */
class LuaField extends LuaNamedObject_1.LuaNamedObject {
    /**
     * @param container (Optional) The container the field is assigned to.
     * @param name The name of the element. (If stored globally, identifies as such)
     * @param isStatic (Optional) If assigned to a class, this tells the generator if the field should be accessed statically or accessed only from a class instance.
     */
    constructor(container, name, isStatic = true) {
        super(name);
        this.container = container;
        this.isStatic = isStatic;
    }
    getModel() {
        const { container } = this;
        const { library } = container.file;
        let model;
        if (container instanceof LuaClass_1.LuaClass) {
            const classModel = library.getClassModel(container);
            model = classModel ? classModel.getFieldModel(this) : null;
        }
        else if (container instanceof LuaTable_1.LuaTable) {
            const tableModel = library.getTableModel(container);
            model = tableModel ? tableModel.getFieldModel(this) : null;
        }
        return model;
    }
    generateDocumentation(prefix) {
        const model = this.getModel();
        return model ? model.generateDocumentation(prefix) : '';
    }
    onCompile(prefix) {
        const { name, container, isStatic } = this;
        const documentationString = this.generateDocumentation(prefix);
        const processTypes = (types, model) => {
            const { _return_ } = model;
            const { types: returnTypes } = _return_;
            if (!returnTypes.length) {
                return;
            }
            types.length = 0;
            for (const type of returnTypes) {
                if (types.indexOf(type) === -1)
                    types.push(type);
            }
        };
        const types = [ZomboidGenerator_1.WILDCARD_TYPE];
        if (container) {
            const fieldModel = this.getModel();
            if (fieldModel)
                processTypes(types, fieldModel);
        }
        const sStatic = isStatic ? 'static ' : '';
        const sanitizedName = ModelUtils_1.sanitizeName(name);
        if (documentationString.length)
            return `${documentationString}\n${prefix}${sStatic}${sanitizedName}: ${types.join(' | ')};`;
        return `${prefix}${sStatic}${sanitizedName}: ${types.join(' | ')};`;
    }
    generateAPI(prefix, file) {
        const { name } = this;
        const doc = this.generateDocumentation(prefix);
        return `${prefix}${doc ? `${doc}\n` : ''}${prefix}export const ${ModelUtils_1.sanitizeName(name)} = ${this.getFullPath(file)};`;
    }
    generateLua(prefix = '') {
        const { name } = this;
        return `${prefix}Exports.${ModelUtils_1.sanitizeName(name)} = loadstring("return _G['${name}']")()\n`;
    }
    getNamespace(file) {
        return file.propertyNamespace;
    }
    getFullPath(file) {
        const { name } = this;
        return `${this.getNamespace(file)}.${ModelUtils_1.sanitizeName(name)}`;
    }
}
exports.LuaField = LuaField;
