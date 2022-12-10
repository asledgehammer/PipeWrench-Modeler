"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LuaObject = void 0;
class LuaObject {
    compile(prefix = '') {
        return this.onCompile(prefix);
    }
}
exports.LuaObject = LuaObject;
