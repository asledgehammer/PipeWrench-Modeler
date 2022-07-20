import { LuaElement } from "./LuaElement";
import { LuaFile } from "./LuaFile";

export class LuaFunction extends LuaElement {

    readonly file: LuaFile;
    readonly name: string;
    readonly params: string[];
    readonly isLocal: boolean;

    constructor(file: LuaFile, name: string, params: string[], isLocal: boolean) {
        super(name);

        this.file = file;
        this.params = params;
        this.isLocal = isLocal;
    }
}
