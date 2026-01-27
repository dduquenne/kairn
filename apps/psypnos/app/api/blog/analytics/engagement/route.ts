// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

/**
 * POST - Update reading engagement metrics for a blog article
 *
 * This endpoint receives scroll depth and time on page data
 * and updates the corresponding BlogAnalytics record.
 *
 * Expected body:
 * {
 *   slug: string,
 *   sessionId: string,
 *   scrollDepthPercent: number (0-100),
 *   timeOnPage: number (milliseconds),
 *   completed: boolean,
 *   isFinal: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Handle both JSON and Blob (from sendBeacon)
    let body;
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      body = await request.json();
    } else {
      // Handle sendBeacon blob
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        return NextResponse.json(
          { error: 'Invalid JSON body' },
          { status: 400 }
        );
      }
    }

    const {
      slug,
      sessionId,
      scrollDepthPercent,
      timeOnPage,
      completed,
      isFinal,
    } = body;

    // Validation
    if (!slug || !sessionId) {
      return NextResponse.json(
        { error: 'slug and sessionId are required' },
        { status: 400 }
      );
    }

    // Find the most recent analytics record for this session and article
    // (created within the last 2 hours to avoid updating old sessions)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const existingRecord = await prisma.blogAnalytics.findFirst({
      where: {
        articleSlug: slug,
        sessionId: sessionId,
        timestamp: {
          gte: twoHoursAgo,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    if (existingRecord) {
      // Update existing record with engagement data
      // Only update if new values are higher (keep maximum engagement)
      const newScrollDepth = Math.max(
        existingRecord.scrollDepthPercent ?? 0,
        scrollDepthPercent ?? 0
      );
      const newTimeOnPage = Math.max(
        existingRecord.timeOnPage ?? 0,
        timeOnPage ?? 0
      );
      const newCompleted = existingRecord.completed || completed || false;

      await prisma.blogAnalytics.update({
        where: { id: existingRecord.id },
        data: {
          scrollDepthPercent: newScrollDepth,
          timeOnPage: newTimeOnPage,
          completed: newCompleted,
        },
      });

      return NextResponse.json({
        success: true,
        updated: true,
        id: existingRecord.id,
        scrollDepthPercent: newScrollDepth,
        timeOnPage: newTimeOnPage,
        completed: newCompleted,
      });
    } else {
      // No existing record found, create a new one with engagement data
      const newRecord = await prisma.blogAnalytics.create({
        data: {
          articleSlug: slug,
          sessionId: sessionId,
          scrollDepthPercent: scrollDepthPercent ?? 0,
          timeOnPage: timeOnPage ?? 0,
          completed: completed || false,
        },
      });

      return NextResponse.json({
        success: true,
        created: true,
        id: newRecord.id,
        scrollDepthPercent: scrollDepthPercent ?? 0,
        timeOnPage: timeOnPage ?? 0,
        completed: completed || false,
      });
    }
  } catch (error) {
    console.error('Error updating engagement metrics:', error);
    return NextResponse.json(
      { error: 'Failed to update engagement metrics' },
      { status: 500 }
    );
  }
}
