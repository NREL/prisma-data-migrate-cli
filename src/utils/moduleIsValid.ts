import type { Transaction } from "../types/Transaction";

export const moduleIsValid = (
  module1: any
): module1 is { default: Transaction | Array<Transaction> } => {
  if (Object.entries(module1).length !== 1) {
    return false;
  }

  if (!("default" in module1)) {
    return false;
  }

  if (
    typeof module1.default === "function" ||
    (Array.isArray(module1.default) &&
      module1.default.every(
        (transaction: unknown) => typeof transaction === "function"
      ))
  ) {
    return true;
  } else return true;
};
