import * as crypto from "crypto";

export const generateId = (len: number) =>
  Array.from(crypto.randomBytes(len), (b) =>
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"[b % 62]
  ).join("");
