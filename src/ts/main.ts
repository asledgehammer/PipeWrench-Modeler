import * as electron from 'electron';
import { LuaLibrary } from './lua/LuaLibrary';
import { ModelUIManager } from './ui/UIManager';
var modelUIManager: ModelUIManager;
var luaLibrary;

// Entry Point from HTML.
export let start = function () {
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
    luaLibrary = new LuaLibrary();
    luaLibrary.scan();
    luaLibrary.parse();

    modelUIManager = new ModelUIManager(luaLibrary);

    (window as any).setClass = (className: string) => {
      modelUIManager.setClass(className);
    };

    (window as any).setTable = (tableName: string) => {
      modelUIManager.setTable(tableName);
    };

    for (const index in luaLibrary.classes) {
      modelUIManager.setClass(luaLibrary.classes[index].name);
    }

    console.log('### Ready ###');
  }, 100);
};
