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
        // Loading all entries
        const classes = Object.values(luaLibrary.classes);
        const tables = Object.values(luaLibrary.tables);
        console.log("Sorting classes...");
        classes.sort((a, b) => a.name.localeCompare(b.name));
        console.log("Sorting tables...");
        tables.sort((a, b) => a.name.localeCompare(b.name));
        console.log("Loading classes...");
        for (const index in classes) {
            modelUIManager.setClass(classes[index].name);
        }
        console.log("Loading tables...");
        for (const index in classes) {
            modelUIManager.setTable(tables[index].name);
        }
        console.log('### Ready ###');
    }, 100);
};
