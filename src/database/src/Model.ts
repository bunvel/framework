import { DB } from "@bunvel/facade";
import type { QueryBuilder } from "./query-builder/QueryBuilder";

export class Model {
  static tableName: string = "";

  static fillable: string[] = [];
  static hidden: string[] = [];
  static guarded: string[] = [];

  private attributes: Record<string, any> = {};

  private static queryBuilder: QueryBuilder | null = null;
  private static selectedColumns: string[] = ["*"];

  private static async initializeQueryBuilder() {
    if (!this.queryBuilder) {
      try {
        this.queryBuilder = await DB.qb;
      } catch (error) {
        console.error("Error initializing query builder:", error);
        throw error;
      }
    }
  }

  public assign(data: Record<string, any>) {
    const { fillable, guarded } = this.constructor as typeof Model;
    for (const key of fillable) {
      if (!guarded.includes(key) && key in data) {
        this.attributes[key] = data[key];
      }
    }
  }

  public toJSON() {
    const { hidden } = this.constructor as typeof Model;
    return Object.fromEntries(
      Object.entries(this.attributes).filter(([key]) => !hidden.includes(key))
    );
  }

  public static select(columns: string[]): typeof Model {
    this.selectedColumns = columns;
    return this;
  }

  public static async create(data: Record<string, any>): Promise<Model> {
    await this.initializeQueryBuilder();

    const instance = new this();
    instance.assign(data);
    await this.queryBuilder!.table(this.tableName).insert(instance.attributes);

    return instance;
  }

  public static async insert(
    data: Record<string, any> | Record<string, any>[]
  ): Promise<void> {
    await this.initializeQueryBuilder();

    if (Array.isArray(data)) {
      await this.queryBuilder!.table(this.tableName).insert(data);
    } else {
      await this.queryBuilder!.table(this.tableName).insert([data]);
    }
  }

  public async update(data: Record<string, any>): Promise<this> {
    await (this.constructor as typeof Model).initializeQueryBuilder();
    this.assign(data);

    const updateData = { ...this.attributes };
    delete updateData.id;

    await (this.constructor as typeof Model)
      .queryBuilder!.table((this.constructor as typeof Model).tableName)
      .where("id", "=", this.attributes.id)
      .update(updateData);

    return this;
  }

  public async delete(): Promise<void> {
    await (this.constructor as typeof Model).initializeQueryBuilder();
    await (this.constructor as typeof Model)
      .queryBuilder!.table((this.constructor as typeof Model).tableName)
      .where("id", "=", this.attributes.id)
      .delete();
  }

  public static where(
    column: string,
    operator: string,
    value: any
  ): typeof Model {
    this.initializeQueryBuilder();
    this.queryBuilder!.table(this.tableName)
      .select(this.selectedColumns)
      .where(column, operator, value);
    return this;
  }

  public static async get(): Promise<Model[]> {
    await this.initializeQueryBuilder();
    const results = await this.queryBuilder!.get();

    return results.map((result: Record<string, any>) => {
      const instance = new this();
      instance.assign(result);
      return instance;
    });
  }

  public static async all(): Promise<Model[]> {
    await this.initializeQueryBuilder();

    const results = await this.queryBuilder!.table(this.tableName)
      .select(this.selectedColumns)
      .get();

    return results.map((result: Record<string, any>) => {
      const instance = new this();
      instance.assign(result);
      return instance;
    });
  }

  public static async findById(id: any): Promise<Model | null> {
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
}
