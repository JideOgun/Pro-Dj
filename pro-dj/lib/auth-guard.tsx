import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function requireAdmin() {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if(role !== "ADMIN") {
        return { ok: false as const, status: 403, error: "Forbidden"}
    }
    return { ok: true as const, session }
}