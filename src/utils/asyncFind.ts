export const asyncFind = async <Element>(
  array: Array<Element>,
  predicate: (element: Element) => Promise<boolean>
) => {
  const index = (await Promise.allSettled(array.map(predicate)))
    .map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else throw new Error(`asyncFind rejected predicate at index ${index}`);
    })
    .findIndex(Boolean);

  return array[index];
};
