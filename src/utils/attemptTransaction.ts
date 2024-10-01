import type { Transaction } from "../types/Transaction";
import { db } from "./db";

export const attemptTransaction = (transaction: Transaction) =>
  db.$transaction(transaction, { maxWait: 10000, timeout: 10000 });
