"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = void 0;
const LuaLibrary_1 = require("./lua/LuaLibrary");
const UIManager_1 = require("./ui/UIManager");
var modelUIManager;
var luaLibrary;
exports.start = function () {
    setTimeout(() => {
        console.log('### Loading please wait ###');
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
        const classes = Object.values(luaLibrary.classes);
        const tables = Object.values(luaLibrary.tables);
        console.log("Sorting classes...");
        classes.sort((a, b) => a.name.localeCompare(b.name));
        console.log("Sorting tables...");
        tables.sort((a, b) => a.name.localeCompare(b.name));
        console.log("Loading classes...");
        console.log('### Ready ###');
    }, 100);
};
