import type { Schema } from "./Schema";

export abstract class Migration {
  protected schema: Schema;

  constructor(schema: Schema) {
    this.schema = schema;
  }

  /**
   * This method defines the operations for applying the migration.
   */
  abstract up(): Promise<void>;

  /**
   * This method defines the operations for rolling back the migration.
   */
  abstract down(): Promise<void>;
}
