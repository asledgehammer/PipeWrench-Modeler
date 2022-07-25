import { LuaConstructor } from '../../LuaConstructor';
import { BaseDoc, BaseDocJson } from './BaseDoc';

/**
 * **ConstructorDoc**
 *
 * @author JabDoesThings
 */
export class ConstructorDoc extends BaseDoc {
  annotations: { [annotation: string]: any } = {};

  constructor(json?: ConstructorDocJson) {
    super();
    if (json) this.load(json);
  }

  load(json: ConstructorDocJson) {
    super.load(json);
    if(json.annotations) this.annotations = json.annotations;
  }

  save(): ConstructorDocJson {
    const json = super.save() as ConstructorDocJson;
    json.annotations = this.annotations;
    return json;
  }

  clear() {
    super.clear();
    for (const key of Object.keys(this.annotations)) delete this.annotations[key]; 
  }
}

export type ConstructorDocJson = BaseDocJson & {
  annotations: { [annotation: string]: any };
};
