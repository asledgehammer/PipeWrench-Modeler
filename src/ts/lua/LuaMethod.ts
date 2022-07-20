import { LuaContainer } from "./LuaContainer";
import { LuaElement } from "./LuaElement";

/**
 * **LuaMethod**
 * 
 * @author JabDoesThings
 */
export class LuaMethod extends LuaElement {

    readonly container: LuaContainer;
    readonly params: string[];
    readonly isStatic: boolean;

    constructor(container: LuaContainer, name: string, params: string[], isStatic: boolean) {
        super(name);

        this.container = container;
        this.params = params;
        this.isStatic = isStatic;
    }
}
