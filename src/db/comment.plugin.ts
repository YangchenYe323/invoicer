/**
 * This plugin adds comments to the database tables f
 */

import { getTableColumns, getTableName, Table } from "drizzle-orm";
import { db } from "./db.ts";

type ColumnComments<T extends Table> = {
    [K in keyof T['_']['columns']]: string;
}

const comments: [Table, ColumnComments<Table>][] = []

/**
 * Adds comments to the specified table.
 * 
 * @param table The table to add comments to.
 * @param columnComments The comments to add to the table.
 */
export function pgComments<T extends Table>(table: T, columnComments: ColumnComments<T>) {
    comments.push([table, columnComments])
}


export async function runPgComments() {
    function escapeIdentifier(identifier: string): string {
        return `"${identifier.replace(/"/g, '""')}"`;
    }
    function escapeString(str: string): string {
        return `'${str.replace(/'/g, "''")}'`;
    }

    for (const [table, columnComments] of comments) {
        for (const [columnName, comment] of Object.entries(columnComments)) {
            const column = getTableColumns(table)[columnName]

            // Prepared statements don't work with COMMENT ON COLUMN
            // the following line throws `syntax error at or near "$1"`
            // await tx.execute(sql`COMMENT ON COLUMN ${column} IS ${comment}`);

            // so we have to use raw SQL instead
            const escapedQuery = `COMMENT ON COLUMN ${escapeIdentifier(getTableName(table))}.${escapeIdentifier(column!.name)} IS ${escapeString(comment)}`;
            await db.execute(escapedQuery);
        }
    }
    console.log("Comments added successfully");
}