export abstract class Model<JsonType> {
  dom: string;

  abstract load(json: JsonType): void;
  abstract save(): JsonType;
  abstract generateDom(): string;
}