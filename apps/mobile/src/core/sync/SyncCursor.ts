export class SyncCursor {
  private static value: string | null = null;

  static async load(): Promise<string | null> {
    return this.value;
  }

  static async save(cursor: string): Promise<void> {
    this.value = cursor;
  }
}
