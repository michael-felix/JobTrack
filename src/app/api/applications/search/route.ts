import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUser } from "@/lib/current-user";
import { errorResponse } from "@/lib/api-helpers";
import { searchApplications } from "@/lib/repositories/applications";

export async function GET(request: NextRequest) {
  try {
    const user = await requireCurrentUser();
    const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (query.length < 2) {
      return NextResponse.json({ applications: [] });
    }
    const applications = await searchApplications(user.id, query);
    return NextResponse.json({ applications });
  } catch (error) {
    return errorResponse(error);
  }
}
