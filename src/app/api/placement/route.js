import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';
import { initDatabase } from '@/lib/db/init';

export async function GET() {
  try {
    const client = getDbClient();
    await initDatabase();

    const result = await client.execute(`
      SELECT * FROM placement_items ORDER BY updated_at DESC
    `);

    return NextResponse.json({
      success: true,
      items: result.rows,
    });
  } catch (error) {
    console.error('Error fetching placement items:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const client = getDbClient();
    await initDatabase();

    const body = await request.json();
    const { category, title, priority, notes } = body;

    if (!category || !title) {
      return NextResponse.json(
        { success: false, error: 'Category and title are required' },
        { status: 400 }
      );
    }

    const id = `place-${Date.now()}`;
    const now = new Date().toISOString();

    await client.execute({
      sql: `
        INSERT INTO placement_items (id, category, title, status, priority, notes, updated_at)
        VALUES (?, ?, ?, 'NOT_STARTED', ?, ?, ?)
      `,
      args: [id, category, title, priority || 'Medium', notes || '', now],
    });

    return NextResponse.json({
      success: true,
      message: 'Placement item added successfully',
    });
  } catch (error) {
    console.error('Error adding placement item:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const client = getDbClient();
    await initDatabase();

    const body = await request.json();
    const { id, status, priority, notes, title } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    await client.execute({
      sql: `
        UPDATE placement_items
        SET status = COALESCE(?, status),
            priority = COALESCE(?, priority),
            notes = COALESCE(?, notes),
            title = COALESCE(?, title),
            updated_at = ?
        WHERE id = ?
      `,
      args: [status, priority, notes, title, now, id],
    });

    return NextResponse.json({
      success: true,
      message: 'Placement item updated successfully',
    });
  } catch (error) {
    console.error('Error updating placement item:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const client = getDbClient();
    await initDatabase();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      );
    }

    await client.execute({
      sql: `DELETE FROM placement_items WHERE id = ?`,
      args: [id],
    });

    return NextResponse.json({
      success: true,
      message: 'Placement item deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting placement item:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
