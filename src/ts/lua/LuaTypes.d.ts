/** @author JabDoesThings */

/** */
export type RequireInfo = {
  path: string;
};

export type DeriveInfo = {
  superClass: string;
  subClass: string;
};

export type ProxyInfo = {
  proxy: string;
  target: string;
};

export type TableConstructorInfo = {
  name: string;
};

export type FunctionInfo = {
  name: string;
  parameters: string[];
  isLocal: boolean;
};

export type MethodInfo = {
  className: string;
  name: string;
  parameters: string[];
  isStatic: boolean;
};

export type FieldReference = {
  containerName: string;
  fieldName: string;
  isStatic: boolean;
};
