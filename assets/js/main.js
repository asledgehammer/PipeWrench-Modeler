"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = void 0;
const LuaLibrary_1 = require("./lua/LuaLibrary");
const UIManager_1 = require("./ui/UIManager");
var modelUIManager;
var luaLibrary;
exports.start = function () {
    setTimeout(() => {
        luaLibrary = new LuaLibrary_1.LuaLibrary();
        luaLibrary.scan();
        luaLibrary.parse();
        modelUIManager = new UIManager_1.ModelUIManager(luaLibrary);
        window.setClass = (className) => {
            modelUIManager.setClass(className);
        };
        window.setTable = (tableName) => {
            modelUIManager.setTable(tableName);
        };
        console.log('### Ready ###');
    }, 100);
};
