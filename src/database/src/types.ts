export type SupportedDatabaseTypes = "mysql" | "sqlite" | "postgresql";

export function isValidDatabaseType(type: string): type is SupportedDatabaseTypes {
    return ["mysql", "sqlite", "postgresql"].includes(type);
  }