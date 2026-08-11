// app/api/cron/listing-lifecycle/route.ts
import { NextResponse } from "next/server";
import { runListingLifecycleSweep } from "@/lib/listing-lifecycle";

/**
 * Triggered on a schedule (e.g. Vercel Cron, once a day). Protected by
 * a shared secret so the sweep can't be triggered by anyone who finds
 * the URL.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 });
  }

  const result = await runListingLifecycleSweep();
  return NextResponse.json({ ok: true, data: result });
}
