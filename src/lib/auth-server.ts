import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";

const getSessionFn = createServerFn({ method: "GET" }).handler(
    async () => {
        const headers = getRequestHeaders();
        const session = await auth.api.getSession({
            headers,
        });

        return session;
    },
);

const authMiddleware = createMiddleware({ type: "function" }).server(
    async ({ next }) => {
        const session = await getSessionFn();

        if (!session?.user) {
            throw new Error("Unauthorized");
        }
        return next({ context: { session } });
    },
);

export { getSessionFn, authMiddleware };