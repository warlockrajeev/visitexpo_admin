import { NextResponse } from 'next/server';

/**
 * @file api/events/[id]/route.js
 * @description Next.js route handler for client-admin to delete an event by ID or slug.
 */

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { title, slug, wpPostId, reason } = body;

    const targetId = id || slug || wpPostId;
    if (!targetId) {
      return NextResponse.json({ success: false, error: 'Event ID or slug is required' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization') || '';

    try {
      const res = await fetch(`http://localhost:5000/api/admin/events/${encodeURIComponent(targetId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {})
        },
        body: JSON.stringify({ title, slug, wpPostId, reason })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return NextResponse.json(data);
      } else {
        return NextResponse.json(
          { success: false, error: data.error || data.message || 'Failed to delete event from backend' },
          { status: res.status || 500 }
        );
      }
    } catch (e) {
      console.error('[client-admin/api/events/[id] DELETE] Express port 5000 error:', e.message);
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
