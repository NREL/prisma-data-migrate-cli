import fs from "node:fs/promises";

export const fileExists = async (path: string) => {
  try {
    await fs.access(path, fs.constants.F_OK);
    return true;
  } catch (_e) {
    return false;
  }
};
