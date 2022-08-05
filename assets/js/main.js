"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.start = void 0;
const LuaLibrary_1 = require("./lua/LuaLibrary");
const UIManager_1 = require("./ui/UIManager");
var modelUIManager;
var luaLibrary;
// Entry Point from HTML.
exports.start = function () {
    // const fileTemplate = [
    //   {
    //     label: 'Open',
    //     onclick: function() {modelUIManager.open()}
    //   }
    // ];
    // const fileMenu = electron.remote.Menu.buildFromTemplate(fileTemplate);
    // const template = [
    //   {
    //     label: 'File',
    //     menu: fileMenu,
    //   },
    // ];
    // const menu = electron.remote.Menu.buildFromTemplate(template);
    // electron.remote.Menu.setApplicationMenu(menu);
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
        for (const index in luaLibrary.classes) {
            modelUIManager.setClass(luaLibrary.classes[index].name);
        }
        console.log('### Ready ###');
    }, 100);
};
