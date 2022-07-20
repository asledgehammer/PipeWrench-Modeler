import { FieldDoc, FieldDocJson } from "./doc/FieldDoc";

export class FieldModel {
    doc: FieldDoc;
    types: string[] = [];
    applyUnknownType: boolean = true;

    constructor(json?: FieldModelJson) {
        if(json) this.load(json);
    }

    load(json: FieldModelJson) {
        this.doc = new FieldDoc(json.doc);
        this.types = json.types;
        this.applyUnknownType = json.applyUnknownType;
    }

    save(): FieldModelJson {
        const doc = this.doc.save();
        const types = this.types;
        const applyUnknownType = this.applyUnknownType;
        return { doc, types, applyUnknownType };
    }
}

export type FieldModelJson = {
    doc: FieldDocJson;
    types: string[];
    applyUnknownType: boolean;
};
