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
    console.log('### Loading please wait ###');

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
    
    // Loading all entries
    const classes: any[] = Object.values(luaLibrary.classes);
    const tables: any[] = Object.values(luaLibrary.tables);

    console.log("Sorting classes...")
    classes.sort((a, b) => a.name.localeCompare(b.name));

    console.log("Sorting tables...")
    tables.sort((a, b) => a.name.localeCompare(b.name));

    console.log("Loading classes...")
    for (const index in classes) {
      modelUIManager.setClass(classes[index].name);
    }

    console.log("Loading tables...")
    for (const index in tables) {
      modelUIManager.setTable(tables[index].name);
    }

    console.log('### Ready ###');
  }, 100);
};
