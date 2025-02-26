export interface Database {
  connect(config: ConnectionConfig): Promise<void>;
  disconnect(): Promise<void>;
  query(sql: string, params?: any[]): Promise<any>;
  // Add more methods as needed
}

export interface ConnectionConfig {
  type: "mysql" | "sqlite" | "pg";
  // Add common configuration options
  [key: string]: any;
}

export interface MySQLConfig extends Omit<ConnectionConfig, "type"> {
  host: string;
  user: string;
  password: string;
  database: string;
}
