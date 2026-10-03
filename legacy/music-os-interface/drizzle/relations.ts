import { relations } from "drizzle-orm";
import { compositions, users } from "./schema";

export const userRelations = relations(users, ({ many }) => ({
  compositions: many(compositions),
}));

export const compositionRelations = relations(compositions, ({ one }) => ({
  user: one(users, {
    fields: [compositions.userId],
    references: [users.id],
  }),
}));
