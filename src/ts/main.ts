import { LuaLibrary } from './lua/LuaLibrary';
import { ModelUIManager } from './ui/ModelUIManager';

var modelUIManager;
var luaLibrary;

// Entry Point from HTML.
export let start = function () {
  setTimeout(() => {

    luaLibrary = new LuaLibrary();
    luaLibrary.scan();
    luaLibrary.parse();

    modelUIManager = new ModelUIManager(luaLibrary);
    modelUIManager.setClass('ISUIElement');
  }, 100);
};
