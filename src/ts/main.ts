import * as electron from 'electron';
import { LuaLibrary } from './lua/LuaLibrary';
import { ModelUIManager } from './ui/ModelUIManager';
var modelUIManager: ModelUIManager;
var luaLibrary;

// Entry Point from HTML.
export let start = function () {

  const fileTemplate = [
    {
      label: 'Open',
      onclick: function() {modelUIManager.open()}
    }
  ];

  const fileMenu = electron.remote.Menu.buildFromTemplate(fileTemplate);
  

  const template = [
    {
      label: 'File',
      menu: fileMenu,
    },
  ];
  const menu = electron.remote.Menu.buildFromTemplate(template);
  electron.remote.Menu.setApplicationMenu(menu);

  setTimeout(() => {

    luaLibrary = new LuaLibrary();
    luaLibrary.scan();
    luaLibrary.parse();

    modelUIManager = new ModelUIManager(luaLibrary);
    modelUIManager.setClass('ISUIElement');

  }, 100);
};
