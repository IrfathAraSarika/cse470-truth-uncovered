// Plain TypeScript model — no ORM. The app's database is Supabase/Postgres;
// this prototype module keeps the sync-job shape in an in-memory store.

export interface IOfflineSync {
  id: string;
  sourceId: string;
  status: 'pending' | 'running' | 'done' | 'failed';
  startedAt?: Date | undefined;
  finishedAt?: Date | undefined;
  error?: string | undefined;
  createdAt: Date;
}

const records: IOfflineSync[] = [];
let nextId = 1;

export const OfflineSyncStore = {
  create(input: { sourceId: string; status: IOfflineSync['status']; startedAt?: Date }): IOfflineSync {
    const record: IOfflineSync = {
      id: String(nextId++),
      sourceId: input.sourceId,
      status: input.status,
      startedAt: input.startedAt,
      createdAt: new Date(),
    };
    records.unshift(record);
    return record;
  },

  findById(id: string): IOfflineSync | null {
    return records.find((record) => record.id === id) ?? null;
  },

  recent(limit: number): IOfflineSync[] {
    return [...records]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, limit);
  },
};
