export interface QueryBuilder {
  table(tableName: string): QueryBuilder;
  select(columns: string[]): QueryBuilder;
  where(column: string, operator: string, value: any): QueryBuilder;
  orWhere(column: string, operator: string, value: any): QueryBuilder;
  join(
    tableName: string,
    column1: string,
    operator: string,
    column2: string
  ): QueryBuilder;
  orderBy(column: string, direction: "asc" | "desc"): QueryBuilder;
  limit(limit: number): QueryBuilder;
  offset(offset: number): QueryBuilder;
  get(): Promise<any>;
  first(): Promise<any>;
  insert(data: object): Promise<void>;
  update(data: object): Promise<void>;
  delete(): Promise<void>;
}
