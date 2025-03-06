export type SupportedDatabase = "mysql" | "sqlite" | "postgresql";

export function isValidDatabase(type: string): type is SupportedDatabase {
  return ["mysql", "sqlite", "postgresql"].includes(type);
}
