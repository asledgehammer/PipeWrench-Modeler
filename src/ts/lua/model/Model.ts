export abstract class Model<JsonType> {
  abstract load(json: JsonType): void;
  abstract save(): JsonType;
  abstract generateDom(): string;
  abstract isDefault(): boolean;
}
