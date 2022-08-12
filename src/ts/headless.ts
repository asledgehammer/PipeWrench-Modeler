import path from 'path';
import { LuaLibrary } from './lua/LuaLibrary';
import { ZomboidGenerator } from './ZomboidGenerator';



// Entry Point from HTML.
export let start = function () {
  console.log('### Loading please wait ###');

  const argv = process.argv.slice(2, process.argv.length)
  const args: {[key: string]: string} = {};
  argv.forEach((arg) => {
    const split = arg.split("=")
    args[split[0]] = split[1]
  })
  console.log("Args:", args);

  const luaLibrary = new LuaLibrary();
  const generator = new ZomboidGenerator(luaLibrary);

  // Fix luapath
  if (!args.luapath) {
    args.luapath = path.resolve(__dirname, "../media/lua")
  }
  args.luapath = args.luapath.replaceAll("\\", "/")

  luaLibrary.scan(args.luapath || null);
  luaLibrary.parse(args.luapath || null);
  
  // Loading all entries
  const classes: any[] = Object.values(luaLibrary.classes);
  const tables: any[] = Object.values(luaLibrary.tables);

  console.log("Sorting classes...")
  classes.sort((a, b) => a.name.localeCompare(b.name));

  console.log("Sorting tables...")
  tables.sort((a, b) => a.name.localeCompare(b.name));

  console.log("Generating class models...")
  for (const index in classes) {
    const _class = classes[index]
    luaLibrary.models.classes[_class.name] = _class.generateModel()
  }

  console.log("Generating table models...")
  for (const index in tables) {
    const _table = tables[index]
    luaLibrary.models.tables[_table.name] = _table.generateModel()
  }

  console.log("Running generator...")
  generator.run()

  console.log("### Generator Completed ###")
};
