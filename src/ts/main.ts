import * as hljs from 'highlight.js';
import { LuaLibrary } from './lua/LuaLibrary';

const luaLibrary = new LuaLibrary();

// Entry Point from HTML.
export let start = function () {
  setTimeout(() => {
    luaLibrary.scan();
    luaLibrary.parse();

    
    // const listItems = document.getElementById("class-list");
    // const classKeys = Object.keys(luaLibrary.classes);
    // classKeys.sort((o1, o2) => o1.localeCompare(o2));
    // for (const key of classKeys) {
      // const s = `<div class="item"><div class="hover-cube"></div><label>${key}</label></div>`;
      // listItems.innerHTML += s;
    // }

    const code = luaLibrary.classes['ISUIElement'].compile();
    const html = hljs.default.highlight(code, {language: 'typescript'}).value;
    let s = '<pre><code class="hljs language-typescript">' + html + '</code></pre>'
    document.getElementById('code').innerHTML += s;    
  }, 100);
};
