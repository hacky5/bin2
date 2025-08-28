import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { roleRequired, getCurrentUser } from '@/lib/auth';

// PUT to update residents order
async function updateOrderHandler(req: NextRequest) {
    const { residents } = await req.json();
    const user = await getCurrentUser(req);

    if (!user) {
        return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }
    
    if (!residents) {
        return NextResponse.json({ error: 'No residents data provided' }, { status: 400 });
    }
    const currentFlats: any[] = await redis.get('flats') || [];
    const currentIds = new Set(currentFlats.map(f => f.id));
    const newIds = new Set(residents.map((f: any) => f.id));

    if (currentIds.size !== newIds.size || [...currentIds].sort().join(',') !== [...newIds].sort().join(',')) {
        return NextResponse.json({ error: 'Mismatch in resident list' }, { status: 400 });
    }

    await redis.set('flats', JSON.stringify(residents));
    // NOTE: Logging will be added in a future step
    // await addLogEntry(user.email, 'Resident duty order updated');
    return NextResponse.json({ message: 'Resident order updated successfully' });
}

export const PUT = roleRequired(['superuser', 'editor'], updateOrderHandler);

