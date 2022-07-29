export const ILLEGAL_NAMES = [
  'tostring',
  'new',
  'default',
  'class',
  'namespace',
  'declare',
  'export',
  'module'
];

export const sanitizeName = (name: string): string => {
  if (ILLEGAL_NAMES.indexOf(name.toLowerCase()) !== -1) return `_${name}_`;
  return name;
};

export const unsanitizeName = (name: string): string => {
  const nameLower = name.toLowerCase();
  for(const illegalName of ILLEGAL_NAMES) {
    if(`_${illegalName}_` === nameLower) {
      return nameLower.substring(1, nameLower.length - 1);
    }
  }
  return name;
};
