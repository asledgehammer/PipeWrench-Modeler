export const sanitizeMethodName = (name: string): string => {
  if (name === 'toString') return `_${name}`;
  return name;
};

export const unsanitizeMethodName = (name: string): string => {
  if (name === '_toString') return name.substring(1);
  return name;
};
