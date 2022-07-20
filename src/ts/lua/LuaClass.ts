import { LuaFile } from "./LuaFile";
import { LuaContainer } from './LuaContainer';
import { LuaMethod } from "./LuaMethod";

export class LuaClass extends LuaContainer {

    readonly superClassName: string | null;
    superClass: LuaClass | null;
    _constructor_: LuaMethod | null;

    constructor(file: LuaFile, name: string, superClassName?: string) {
        super(file, name, 'class');

        this.file = file;
        this.superClassName = superClassName;
    }

    hasSuperClass(): boolean {
        return this.superClass != null;
    }
}
