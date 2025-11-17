import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/db.ts"; // your drizzle instance
import * as schema from "../db/schema.ts";
import { reactStartCookies } from "better-auth/react-start";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "pg", // or "mysql", "sqlite"
        schema: schema,
    }),
    emailAndPassword: {
        enabled: true,
    },
    plugins: [
        reactStartCookies() // Make sure this is the last plugin
    ]
});