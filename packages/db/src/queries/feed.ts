import { runQuery } from "../sqlLoader";

export interface FeedLog {
  id: string;
  batchId: string;
  shedId: string;
  date: Date;
  shift: string;
  feedType: string;
  feedBrand: string | null;
  bagNumber: string | null;
  kgGiven: number;
  kgReturned: number;
  createdAt: Date;
}

export async function insertFeed(log: {
  batchId: string;
  shedId: string;
  date: Date;
  shift: string;
  feedType: string;
  feedBrand?: string | null;
  bagNumber?: string | null;
  kgGiven: number;
  kgReturned: number;
}): Promise<FeedLog> {
  const rows = await runQuery<FeedLog>("feed/insert-feed.sql", [
    log.batchId,
    log.shedId,
    log.date,
    log.shift,
    log.feedType,
    log.feedBrand ?? null,
    log.bagNumber ?? null,
    log.kgGiven,
    log.kgReturned,
  ]);
  return rows[0];
}

export async function listFeedByBatch(batchId: string): Promise<FeedLog[]> {
  return runQuery<FeedLog>("feed/list-by-batch.sql", [batchId]);
}

export async function listAllFeed(): Promise<FeedLog[]> {
  return runQuery<FeedLog>("feed/list-all.sql");
}

export async function getFeedTotalsByBatch(
  batchId: string,
): Promise<{ given: number; returned: number }> {
  const rows = await runQuery<{ given: number; returned: number }>(
    "feed/totals-by-batch.sql",
    [batchId],
  );
  return rows[0] ?? { given: 0, returned: 0 };
}
