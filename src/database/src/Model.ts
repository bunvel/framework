import { ConfigServiceProvider } from "../../config";
import { Application, Config } from "../../core";
import { DatabaseAdapterFactory } from "./DatabaseFactory";
import { DatabaseServiceProvider } from "./DatabaseServiceProvider";
import type { ConnectionConfig } from "./interfaces";
import { MetadataManager } from "./MetadataManager";
import type { QueryBuilder } from "./QueryBuilder";

type SupportedDatabaseTypes = "mysql" | "sqlite" | "pg";

export class Model {
  // Table name
  static tableName: string = "";

  // Fillable fields
  public fillable: string[] = [];

  // Hidden fields (not exposed in output)
  public hidden: string[] = [];

  // Guarded fields (cannot be mass assigned)
  public guarded: string[] = [];

  // Holds the field data
  private attributes: Record<string, any> = {};

  // Holds the query conditions
  private static queryBuilder: QueryBuilder | null = null;

  private static selectedColumns: string[] = ["*"];

  // Initialize the query builder
  private static async initializeQueryBuilder() {
    if (Model.queryBuilder) return;

    try {
      const app = Application.getInstance();
      await app.register([ConfigServiceProvider, DatabaseServiceProvider]);
      await app.boot();

      const dbType = await Config.string("database.default");

      if (!isValidDatabaseType(dbType)) {
        throw new Error(`Unsupported database type: ${dbType}`);
      }

      const dbConfig = await Config.get<Omit<ConnectionConfig, "type">>(
        `database.connections.${dbType}`
      );

      if (!dbConfig) {
        throw new Error("Database configuration not found");
      }

      const fullConfig: ConnectionConfig = { ...dbConfig, type: dbType };
      const adapter = DatabaseAdapterFactory.createAdapter(fullConfig);
      Model.queryBuilder = DatabaseAdapterFactory.createQueryBuilder(adapter);

      await adapter.connect(fullConfig);
    } catch (error) {
      console.error("Error initializing query builder:", error);
      throw error;
    }
  }

  // Assign values to the fillable fields, respecting guarded fields
  public assign(data: Record<string, any>) {
    Object.keys(data).forEach((key) => {
      this.attributes[key] = data["id"];
      if (this.fillable.includes(key) && !this.guarded.includes(key)) {
        this.attributes[key] = data[key];
      }
    });
  }

  // Convert model instance to JSON, hiding sensitive fields
  public toJSON() {
    const raw = { ...this.attributes };
    this.hidden.forEach((field) => {
      delete raw[field];
    });
    return raw;
  }

  public static select(columns: string[]): typeof Model {
    this.selectedColumns = columns;
    return this;
  }

  // CRUD Operations
  public static async create(data: Record<string, any>): Promise<Model> {
    await this.initializeQueryBuilder();
    const instance = new this();
    instance.assign(data);
    await this.queryBuilder!.table(this.tableName).insert(instance.attributes);
    return instance;
  }

  public async update(data: Record<string, any>): Promise<Model> {
    await Model.initializeQueryBuilder();
    this.assign(data);

    const updateData = { ...this.attributes };
    delete updateData.id; // Assuming 'id' is the primary key

    await Model.queryBuilder!.table(
      (this.constructor as typeof Model).tableName
    )
      .where("id", "=", this.attributes.id)
      .update(updateData);

    return this;
  }

  public async delete(id: number | string): Promise<void> {
    await Model.initializeQueryBuilder();
    await Model.queryBuilder!.table(
      (this.constructor as typeof Model).tableName
    )
      .where("id", "=", id)
      .delete();
  }

  // Query Builder Methods
  public static where(
    column: string,
    operator: string,
    value: any
  ): typeof Model {
    this.initializeQueryBuilder(); // Note: This is now synchronous
    this.queryBuilder!.table(this.tableName)
      .select(this.selectedColumns)
      .where(column, operator, value);
    return this;
  }

  public static orWhere(
    column: string,
    operator: string,
    value: any
  ): typeof Model {
    this.initializeQueryBuilder(); // Note: This is now synchronous
    this.queryBuilder!.orWhere(column, operator, value);
    return this;
  }

  public static limit(value: number): typeof Model {
    this.initializeQueryBuilder(); // Note: This is now synchronous
    this.queryBuilder!.limit(value);
    return this;
  }

  public static offset(value: number): typeof Model {
    this.initializeQueryBuilder(); // Note: This is now synchronous
    this.queryBuilder!.offset(value);
    return this;
  }

  public static orderBy(
    column: string,
    direction: "asc" | "desc" = "asc"
  ): typeof Model {
    this.initializeQueryBuilder(); // Note: This is now synchronous
    this.queryBuilder!.orderBy(column, direction);
    return this;
  }

  public static async get(): Promise<Model[]> {
    await this.initializeQueryBuilder();
    try {
      const results = await this.queryBuilder!.get();
      return results.map((result: Record<string, any>) => {
        const instance = new this();
        instance.assign(result);
        return instance;
      });
    } catch (error) {
      console.error("Error executing query:", error);
      throw error;
    }
  }

  public static async all(): Promise<Model[]> {
    await this.initializeQueryBuilder();
    this.queryBuilder!.table(this.tableName).select(this.selectedColumns);
    return this.get();
  }

  public static async find(id: any): Promise<Model | null> {
    await this.initializeQueryBuilder();
    const results = await this.queryBuilder!.table(this.tableName)
      .select(this.selectedColumns)
      .where("id", "=", id)
      .limit(1)
      .get();

    if (results[0]) {
      const instance = new this();
      instance.assign(results[0]);
      return instance;
    }

    return null;
  }

  public static async first(): Promise<Model | null> {
    await this.initializeQueryBuilder();
    const results = await this.queryBuilder!.table(this.tableName)
      .select(this.selectedColumns)
      .limit(1)
      .get();
    if (results[0]) {
      const instance = new this();
      instance.assign(results[0]);
      return instance;
    }
    return null;
  }

  public static async last(): Promise<Model | null> {
    await this.initializeQueryBuilder();
    const results = await this.queryBuilder!.table(this.tableName)
      .select(this.selectedColumns)
      .limit(1)
      .orderBy("id", "desc")
      .get();
    if (results[0]) {
      const instance = new this();
      instance.assign(results[0]);
      return instance;
    }
    return null;
  }

  // Relationships
  public belongsTo(RelatedModel: typeof Model, foreignKey: string) {
    return { type: "belongsTo", model: RelatedModel, foreignKey };
  }

  public hasOne(RelatedModel: typeof Model, foreignKey: string) {
    return { type: "hasOne", model: RelatedModel, foreignKey };
  }

  public hasMany(RelatedModel: typeof Model, foreignKey: string) {
    return { type: "hasMany", model: RelatedModel, foreignKey };
  }

  // Helper methods to get and set attributes
  public getAttribute(key: string) {
    return this.attributes[key];
  }

  public setAttribute(key: string, value: any) {
    this.attributes[key] = value;
  }

  // Get metadata for the model
  public static getColumnMetadata() {
    return MetadataManager.getColumnMetadata(this.tableName);
  }
}

function isValidDatabaseType(type: string): type is SupportedDatabaseTypes {
  return ["mysql", "sqlite", "pg"].includes(type);
}
