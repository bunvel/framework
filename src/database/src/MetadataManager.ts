export class MetadataManager {
  private static columnMetadata: Map<string, Map<string, string>> = new Map();

  public static setColumnMetadata(
    modelName: string,
    propertyKey: string,
    dataType: DataType
  ) {
    if (!this.columnMetadata.has(modelName)) {
      this.columnMetadata.set(modelName, new Map());
    }
    this.columnMetadata.get(modelName)?.set(propertyKey, dataType);
  }

  public static getColumnMetadata(
    modelName: string
  ): Map<string, string> | undefined {
    return this.columnMetadata.get(modelName);
  }
}

// ColumnDecorator.ts

export function Column(dataType: DataType) {
  return function (target: any, propertyKey: string | symbol) {
    const modelName = target.constructor.name;

    // Ensure propertyKey is a string
    const propertyKeyStr =
      typeof propertyKey === "symbol" ? propertyKey.toString() : propertyKey;

    MetadataManager.setColumnMetadata(modelName, propertyKeyStr, dataType);
  };
}

export type DataType = "STRING" | "NUMBER" | "BOOLEAN" | "DATE" | "TEXT";
