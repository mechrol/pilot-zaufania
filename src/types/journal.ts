export type JournalAuthorRole = "passenger" | "driver";
export type JournalVisibility = "private" | "shared" | "public";
export interface JournalEntry { entryId:string; rideId?:string; authorId:string; authorRole:JournalAuthorRole; promptId?:string; content:string; visibility:JournalVisibility; createdAt:string; }
export interface ReflectionPrompt { id:string; text:string; category:string; createdAt:string; }
export interface CreateJournalEntryInput { rideId?:string; authorId:string; authorRole:JournalAuthorRole; promptId?:string; content:string; visibility?:JournalVisibility; }
export interface UpdateJournalEntryInput { content?:string; visibility?:JournalVisibility; }
