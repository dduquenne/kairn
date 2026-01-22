// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { NextRequest } from "next/server";
import { getPageVisits } from "../store-index";
import { promises as fs } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

/**
 * Update time on page for a specific session and page
 * This endpoint receives FormData via sendBeacon
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const sessionId = formData.get("sessionId") as string;
    const page = formData.get("page") as string;
    const timeOnPage = parseInt(formData.get("timeOnPage") as string, 10);

    if (!sessionId || !page || isNaN(timeOnPage)) {
      return Response.json(
        { error: "Missing required fields: sessionId, page, timeOnPage" },
        { status: 400 }
      );
    }

    // Read current analytics data
    const dataFilePath = join(process.cwd(), "public", "data", "analytics.json");
    let data;

    try {
      const fileContent = await fs.readFile(dataFilePath, "utf-8");
      data = JSON.parse(fileContent);
    } catch (error) {
      // File doesn't exist yet, create empty structure
      data = {
        pageVisits: [],
        sectionTimes: [],
        conversionEvents: [],
      };
    }

    // Find the most recent page visit for this session and page
    const visitIndex = data.pageVisits
      .map((v: any, i: number) => ({ ...v, index: i }))
      .reverse()
      .find((v: any) => v.sessionId === sessionId && v.page === page)?.index;

    if (visitIndex !== undefined) {
      // Update the existing visit
      data.pageVisits[visitIndex].timeOnPage = timeOnPage;

      // Write back to file
      await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));

      return Response.json(
        { success: true, updated: true },
        { status: 200 }
      );
    } else {
      // Visit not found (maybe sent before page visit was recorded)
      // We'll just acknowledge receipt but not update
      return Response.json(
        { success: true, updated: false, note: "Visit not found" },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error updating time on page:", error);
    return Response.json(
      { error: "Failed to update time on page" },
      { status: 500 }
    );
  }
}
