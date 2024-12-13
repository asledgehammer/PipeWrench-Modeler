"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LuaNamedObject = void 0;
const LuaObject_1 = require("./LuaObject");
/**
 * **LuaElement** is the base class for all compiled Lua elements in the generator.
 *
 * @author JabDoesThings
 */
class LuaNamedObject extends LuaObject_1.LuaObject {
    /**
     * @param name The name of the element. (If stored globally, identifies as such)
     */
    constructor(name) {
        super();
        this.name = name;
    }
}
exports.LuaNamedObject = LuaNamedObject;
