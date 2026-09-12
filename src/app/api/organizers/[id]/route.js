import { NextResponse } from 'next/server';

/**
 * @file api/organizers/[id]/route.js
 * @description Next.js route handler for client-admin to delete an organizer by ID or slug.
 */

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { name, deleteEvents } = body;

    const targetId = id || (name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : null);
    if (!targetId) {
      return NextResponse.json({ success: false, error: 'Organizer ID is required' }, { status: 400 });
    }

    const authHeader = request.headers.get('authorization') || '';

    try {
      const res = await fetch(`http://localhost:5000/api/admin/organizers/${encodeURIComponent(targetId)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader ? { Authorization: authHeader } : {})
        },
        body: JSON.stringify({ name, deleteEvents })
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        return NextResponse.json(data);
      } else {
        return NextResponse.json(
          { success: false, error: data.error || data.message || 'Failed to delete organizer from backend' },
          { status: res.status || 500 }
        );
      }
    } catch (e) {
      console.error('[client-admin/api/organizers/[id] DELETE] Express port 5000 error:', e.message);
      return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
