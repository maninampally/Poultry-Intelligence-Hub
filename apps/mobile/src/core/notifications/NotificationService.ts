export class NotificationService {
  static async schedule(title: string, message: string): Promise<{ title: string; message: string }> {
    return { title, message };
  }
}
