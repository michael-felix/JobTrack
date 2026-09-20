import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireCurrentUser } from "@/lib/current-user";
import { errorResponse } from "@/lib/api-helpers";
import { bulkAddLabel } from "@/lib/repositories/applications";
import { assertLabelsOwnedByUser } from "@/lib/repositories/labels";

const bodySchema = z.object({
  applicationIds: z.array(z.string()).min(1),
});

/** Bulk-assigns this label to many applications at once (board "select and
 * label" action). Adds the label alongside whatever labels each application
 * already has — it does not replace them. */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const user = await requireCurrentUser();
    const { applicationIds } = bodySchema.parse(await request.json());
    await assertLabelsOwnedByUser(user.id, [id]);
    const updated = await bulkAddLabel(user.id, id, applicationIds);
    return NextResponse.json({ updated });
  } catch (error) {
    return errorResponse(error);
  }
}
