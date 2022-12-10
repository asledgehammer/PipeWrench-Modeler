"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LuaNamedObject = void 0;
const LuaObject_1 = require("./LuaObject");
class LuaNamedObject extends LuaObject_1.LuaObject {
    constructor(name) {
        super();
        this.name = name;
    }
}
exports.LuaNamedObject = LuaNamedObject;
