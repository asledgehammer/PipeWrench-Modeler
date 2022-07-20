import * as fs from 'fs';
import { LuaFile } from './LuaFile';
import { LuaClass } from './LuaClass';
import { LuaElement } from './LuaElement';
import { LuaTable } from './LuaTable';

/**
 * **LuaLibrary**
 * 
 * @author JabDoesThings
 */
export class LuaLibrary {

    private files: string[] = [];

    luaFiles: {[id: string]: LuaFile} = {};
    classes: {[id: string]: LuaClass} = {};
    tables: {[id: string]: LuaTable} = {};
    properties: {[id: string]: LuaElement} = {};

    scan() {
        this.files = [];
        this.scanDir('./assets/media/lua/shared');
        this.scanDir('./assets/media/lua/client');
        this.scanDir('./assets/media/lua/server');
        this.files.sort((a: string, b: string) => {
            return a.localeCompare(b);
        });
    }

    private scanDir(dir: string) {

        const entries = fs.readdirSync(dir);
        const dirs: string[] = [];

        for (const entry of entries) {
            const path = dir + '/' + entry;   
            if(path === '.' || path === '..' || path === '...') {
                continue;
            }
            const stats = fs.lstatSync(path);
            if(stats.isDirectory() && dirs.indexOf(path) === -1) {
                dirs.push(path);
                continue;
            }
            if(path.toLowerCase().endsWith('.lua') && this.files.indexOf(path) === -1) {
              this.files.push(path);
            }
        }

        if(dirs.length !== 0) {
            for(const dir of dirs) {
                this.scanDir(dir);
            }
        }
    }

    parse() {
        this.classes = {};
        this.tables = {};
        this.properties = {};

        // The root class doesn't define itself using 'derive(type: string)'.
        // Add it manually.
        this.classes['ISBaseObject'] = new LuaClass(null, 'ISBaseObject');

        for(const file of this.files) {
            const id = file
          .replace('./assets/media/lua/client/', '')
          .replace('./assets/media/lua/server/', '')
          .replace('./assets/media/lua/shared/', '')
          .replace('.lua', '')
          .replace('.Lua', '')
          .replace('.LUA', '');

          const luaFile = new LuaFile(this, id, file);
          luaFile.parse();
          luaFile.scanRequires();

          this.luaFiles[id] = luaFile;
        }

        for(const file of Object.values(this.luaFiles)) {
            file.scanGlobalAssignments();
        }

        for(const file of Object.values(this.luaFiles)) {
            // console.log(`### ${file.id}`);
            file.scan();
        }

        console.log(this.tables['luautils']);

        this.linkClasses();
    }

    private linkClasses() {
        for(const name of Object.keys(this.classes)) {
            const clazz = this.classes[name];

            let superClazz = this.classes[clazz.superClassName];
            if(!superClazz) {
                superClazz = this.resolveProxyClass(clazz.superClassName);
            }
            if(!superClazz) {
                console.warn(`[LuaLibrary] Lua Superclass not found: ${clazz.name} extends ${clazz.superClassName}`);
            }

            clazz.superClass = superClazz;
        }
    }

    private resolveProxyClass(clazzName: string): LuaClass | null {
        for(const clazz of Object.values(this.luaFiles)) {
            if(clazz.proxies[clazzName]) return this.classes[clazz.proxies[clazzName]];
        }
        return null;
    }

    setClass(clazz: LuaClass) {
      this.classes[clazz.name] = clazz;
    }

    setProperty(element: LuaElement) {
        this.properties[element.name] = element;
    }
}
