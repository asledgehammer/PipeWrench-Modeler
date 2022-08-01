"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LuaContainer = void 0;
const LuaNamedObject_1 = require("./LuaNamedObject");
class LuaContainer extends LuaNamedObject_1.LuaNamedObject {
    constructor(file, name, type) {
        super(name);
        this.methods = {};
        this.fields = {};
        this.file = file;
        this.type = type;
    }
    sortFields() {
        const staticFields = [];
        const nonStaticFields = [];
        const fieldNames = Object.keys(this.fields);
        fieldNames.sort((o1, o2) => o1.localeCompare(o2));
        for (const fieldName of fieldNames) {
            const field = this.fields[fieldName];
            if (field.isStatic)
                staticFields.push(field);
            else
                nonStaticFields.push(field);
        }
        return { staticFields, nonStaticFields };
    }
    sortMethods() {
        const staticMethods = [];
        const nonStaticMethods = [];
        const methodNames = Object.keys(this.methods);
        methodNames.sort((o1, o2) => o1.localeCompare(o2));
        for (const methodName of methodNames) {
            const method = this.methods[methodName];
            if (method.isStatic)
                staticMethods.push(method);
            else
                nonStaticMethods.push(method);
        }
        return { staticMethods, nonStaticMethods };
    }
    audit() {
        for (const methodName of Object.keys(this.methods)) {
            if (this.fields[methodName])
                delete this.fields[methodName];
        }
    }
}
exports.LuaContainer = LuaContainer;
