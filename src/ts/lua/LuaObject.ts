export abstract class LuaObject {

  compile(prefix: string = '') {
    return this.onCompile(prefix);
  }

  protected abstract onCompile(prefix: string): string;
}
