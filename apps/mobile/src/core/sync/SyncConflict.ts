export class SyncConflict {
  static resolve<T>(local: T, remote: T): T {
    return remote ?? local;
  }
}
