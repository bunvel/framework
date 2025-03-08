import type { Schema } from "./Schema";

/**
 * Abstract base class for database migrations.
 * Similar to Laravel's Migration system, this class defines the structure
 * for applying (`up()`) and rolling back (`down()`) database changes.
 */
export abstract class Migration {
  protected schema: Schema;

  /**
   * Constructs a new Migration instance with a schema.
   * @param schema - The database schema instance for migration operations.
   */
  constructor(schema: Schema) {
    this.schema = schema;
  }

  /**
   * Apply the migration changes to the database.
   * Must be implemented by subclasses.
   */
  abstract up(): Promise<void>;

  /**
   * Revert the migration changes from the database.
   * Must be implemented by subclasses.
   */
  abstract down(): Promise<void>;
}
