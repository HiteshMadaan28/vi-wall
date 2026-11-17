import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { applyAdminAction, type AdminAction } from "@/lib/admin-data";

export const dynamic = "force-dynamic";

const ALLOWED: AdminAction[] = ["approve", "reject", "remove", "suspend", "restore"];

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: { participantId?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const { participantId, action } = body;
  if (!participantId || !action || !ALLOWED.includes(action as AdminAction)) {
    return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  }

  const ok = await applyAdminAction(participantId, action as AdminAction, "admin");
  if (!ok) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
