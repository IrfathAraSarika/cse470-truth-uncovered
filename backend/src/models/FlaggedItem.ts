// Plain TypeScript model — no ORM. The app's database is Supabase/Postgres;
// production persistence for flagged content lives in models/flaggedItemModel.ts.
// This prototype module keeps the same shape in an in-memory store.

export interface DuplicateMatch {
  id: string;
  score: number;
  excerpt?: string;
}

export interface IFlaggedItem {
  id: string;
  contentId?: string | undefined;
  authorId?: string | undefined;
  text: string;
  reason?: string | undefined;
  createdAt: Date;
  status: 'pending' | 'verified' | 'rejected';
  adminNote?: string | undefined;
  duplicateMatches: DuplicateMatch[];
  fraudSignals: string[];
  reporterIp?: string | undefined;
}

export type NewFlaggedItem = Pick<IFlaggedItem, 'text' | 'duplicateMatches' | 'fraudSignals'> &
  Partial<Pick<IFlaggedItem, 'contentId' | 'authorId' | 'reason' | 'reporterIp'>>;

const items: IFlaggedItem[] = [];
let nextId = 1;

export const FlaggedItemStore = {
  insert(input: NewFlaggedItem): IFlaggedItem {
    const item: IFlaggedItem = {
      ...input,
      id: String(nextId++),
      createdAt: new Date(),
      status: 'pending',
    };
    items.unshift(item);
    return item;
  },

  recent(limit: number): IFlaggedItem[] {
    return [...items]
      .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
      .slice(0, limit);
  },

  findById(id: string): IFlaggedItem | null {
    return items.find((item) => item.id === id) ?? null;
  },

  updateStatus(id: string, status: IFlaggedItem['status'], adminNote?: string): IFlaggedItem | null {
    const item = FlaggedItemStore.findById(id);
    if (!item) return null;
    item.status = status;
    if (adminNote !== undefined) item.adminNote = adminNote;
    return item;
  },
};
