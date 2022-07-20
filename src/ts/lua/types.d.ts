export type RequireInfo = {
    path: string;
}

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
}

export type FunctionInfo = {
  name: string;
  params: string[];
  isLocal: boolean;
};

export type MethodInfo = {
  className: string;
  name: string;
  params: string[];
  isStatic: boolean;
};
