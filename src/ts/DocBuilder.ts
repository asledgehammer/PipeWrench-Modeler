/**
 * **DocBuilder** is a simple API that renders TypeScript documentation to a string.
 *
 * @author JabDoesThings
 */
export class DocBuilder {
  private readonly lines: string[] = [];

  /**
   * @param prefix The prepend for each line.
   * @returns The built documentation.
   */
  build(prefix: string = ''): string {
    const { lines: la } = this;
    if (!la) return `${prefix}/** */`;
    else if (la.length === 1) return `${prefix}/** ${la[0]} */`;
    let s = `${prefix}/**\n`;
    for (const l of la) s += !l || !l.length ? `${prefix} *\n` : `${prefix} * ${l}\n`;
    return `${s} */`;
  }

  /**
   * @param lines The lines to append to the documentation.
   * @returns this
   */
  appendLine(...lines: string[]): DocBuilder {
    if (!lines || !lines.length) {
      lines.push('');
      return this;
    }
    for (const line of lines) this.lines.push(line);
    return this;
  }

  appendAnnotation(name: string, value: string = ''): DocBuilder {
    return this.appendLine(`@${name}${value.length ? ` ${value}` : ''}`);
  }

  /**
   * Appends a parameter to the documentation.
   *
   * @param name The name of the parameter.
   * @param description The text to append to the parameter.
   * @returns this
   */
  appendParam(name: string, description: string): DocBuilder {
    return this.appendLine(`@param ${name} ${description}`);
  }

  /**
   * Adds a returns description to the documentation.
   *
   * @param description The text to append to the parameter.
   * @returns this
   */
  appendReturn(description: string): DocBuilder {
    return this.appendLine(`@returns ${description}`);
  }

  /** (Proxy for `this.build()`) */
  toString(): string {
    return this.build();
  }

  /**
   * @returns True if no lines are present.
   */
  isEmpty(): boolean {
    return !this.size;
  }

  /**
   * The amount of lines in the documentation.
   */
  get size() {
    return this.lines.length;
  }
}
