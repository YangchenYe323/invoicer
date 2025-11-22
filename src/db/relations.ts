import { relations } from "drizzle-orm/relations";
import { user, account, session, source, invoice, sourceFolder } from "./schema";

export const accountRelations = relations(account, ({one}) => ({
	user: one(user, {
		fields: [account.userId],
		references: [user.id]
	}),
}));

export const userRelations = relations(user, ({many}) => ({
	accounts: many(account),
	sessions: many(session),
	sources: many(source),
	invoices: many(invoice),
}));

export const sessionRelations = relations(session, ({one}) => ({
	user: one(user, {
		fields: [session.userId],
		references: [user.id]
	}),
}));

export const sourceRelations = relations(source, ({one, many}) => ({
	user: one(user, {
		fields: [source.userId],
		references: [user.id]
	}),
	invoices: many(invoice),
	sourceFolders: many(sourceFolder),
}));

export const invoiceRelations = relations(invoice, ({one}) => ({
	user: one(user, {
		fields: [invoice.userId],
		references: [user.id]
	}),
	source: one(source, {
		fields: [invoice.sourceId],
		references: [source.id]
	}),
}));

export const sourceFolderRelations = relations(sourceFolder, ({one}) => ({
	source: one(source, {
		fields: [sourceFolder.sourceId],
		references: [source.id]
	}),
}));