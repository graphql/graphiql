export function compose(...classes: (string | null | undefined)[]) {
  let result = '';
  for (const c of classes) {
    if (c) {
      result += (result ? ' ' : '') + c;
    }
  }
  return result;
}
