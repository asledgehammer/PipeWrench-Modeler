import { LuaElement } from "./LuaElement";
import { LuaField } from "./LuaField";
import { LuaFile } from "./LuaFile";
import { LuaMethod } from "./LuaMethod";

export type LuaContainerType = 'table' | 'class';

export class LuaContainer extends LuaElement {
    
    readonly type: LuaContainerType;
    
    proxies: string[] = [];
    methods: { [id: string]: LuaMethod } = {};
    fields: { [id: string]: LuaField } = {};
    superClass: LuaContainer | null;
    file: LuaFile;

    constructor(file: LuaFile, name: string, type: LuaContainerType = 'table') {
        super(name);
        this.file = file;
        this.type = type;
    }

    hasSuperClass(): boolean {
        return this.superClass != null;
    }
}
