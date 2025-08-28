import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUser, roleRequired } from '@/lib/auth';

// GET all residents
export async function GET(req: NextRequest) {
    const flats = await redis.get('flats') || [];
    return NextResponse.json(flats);
}

// POST a new resident
async function addResidentHandler(req: NextRequest) {
    const data = await req.json();
    const user = await getCurrentUser(req);

    if (!user) {
        return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    const flats: any[] = await redis.get('flats') || [];
    const newResident = {
        id: uuidv4(),
        name: data.name,
        flat_number: data.flat_number,
        contact: data.contact || {},
        notes: data.notes || ""
    };
    flats.push(newResident);
    await redis.set('flats', JSON.stringify(flats));
    // NOTE: Logging will be added in a future step
    // await addLogEntry(user.email, `Resident Added: ${newResident.name}`);
    return NextResponse.json(newResident, { status: 201 });
}

export const POST = roleRequired(['superuser', 'editor'], addResidentHandler);

