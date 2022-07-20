import { LuaClass } from "./LuaClass";
import { LuaElement } from "./LuaElement";

/**
 * **LuaField**
 * 
 * @author JabDoesThings
 */
export class LuaField extends LuaElement {

    readonly clazz: LuaClass;
    readonly isStatic: boolean;

    constructor(clazz: LuaClass, name: string, isStatic: boolean) {
        super(name);

        this.clazz = clazz;
        this.isStatic = isStatic;
    }
}
