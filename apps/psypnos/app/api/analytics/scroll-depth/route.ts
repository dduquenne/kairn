/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// TODO: Migration - Type incompatibilities to fix
import { promises as fs } from "fs";
import { join } from "path";

import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Update scroll depth for a specific session and page
 * This endpoint receives FormData via sendBeacon
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const sessionId = formData.get("sessionId") as string;
    const page = formData.get("page") as string;
    const scrollDepthPercent = parseInt(formData.get("scrollDepthPercent") as string, 10);

    if (!sessionId || !page || isNaN(scrollDepthPercent)) {
      return Response.json(
        { error: "Missing required fields: sessionId, page, scrollDepthPercent" },
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
      // Update scroll depth (only if new value is higher)
      const currentScrollDepth = data.pageVisits[visitIndex].scrollDepthPercent || 0;
      if (scrollDepthPercent > currentScrollDepth) {
        data.pageVisits[visitIndex].scrollDepthPercent = scrollDepthPercent;

        // Write back to file
        await fs.writeFile(dataFilePath, JSON.stringify(data, null, 2));

        return Response.json(
          { success: true, updated: true, scrollDepthPercent },
          { status: 200 }
        );
      } else {
        return Response.json(
          { success: true, updated: false, note: "Current scroll depth is higher" },
          { status: 200 }
        );
      }
    } else {
      // Visit not found
      return Response.json(
        { success: true, updated: false, note: "Visit not found" },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error updating scroll depth:", error);
    return Response.json(
      { error: "Failed to update scroll depth" },
      { status: 500 }
    );
  }
}
