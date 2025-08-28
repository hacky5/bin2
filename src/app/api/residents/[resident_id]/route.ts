'use server';

import {NextRequest, NextResponse} from 'next/server';
import {redis} from '@/lib/redis';
import {roleRequired, getCurrentUser} from '@/lib/auth';

// PUT to update a resident
async function updateResidentHandler(
  req: NextRequest,
  {params}: {params: {resident_id: string}}
) {
  const {resident_id} = params;
  const data = await req.json();
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      {message: 'Authentication required'},
      {status: 401}
    );
  }

  let flats: any[] = (await redis.get('flats')) || [];
  let residentFound = false;

  flats = flats.map(flat => {
    if (flat.id === resident_id) {
      residentFound = true;
      return {
        ...flat,
        name: data.name || flat.name,
        flat_number: data.flat_number || flat.flat_number,
        contact: data.contact || flat.contact,
        notes: data.notes || flat.notes,
      };
    }
    return flat;
  });

  if (!residentFound) {
    return NextResponse.json({error: 'Resident not found'}, {status: 404});
  }

  await redis.set('flats', JSON.stringify(flats));
  const updatedName = flats.find(f => f.id === resident_id)!.name;
  // NOTE: Logging will be added in a future step
  // await addLogEntry(user.email, `Resident Updated: ${updatedName}`);
  return NextResponse.json({message: 'Resident updated successfully'});
}
export const PUT = roleRequired(['superuser', 'editor'], updateResidentHandler);

// DELETE a resident
async function deleteResidentHandler(
  req: NextRequest,
  {params}: {params: {resident_id: string}}
) {
  const {resident_id} = params;
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      {message: 'Authentication required'},
      {status: 401}
    );
  }

  let flats: any[] = (await redis.get('flats')) || [];
  const initialLength = flats.length;
  const residentName = flats.find(f => f.id === resident_id)?.name || 'Unknown';

  flats = flats.filter(flat => flat.id !== resident_id);

  if (flats.length === initialLength) {
    return NextResponse.json({error: 'Resident not found'}, {status: 404});
  }

  await redis.set('flats', JSON.stringify(flats));
  // NOTE: Logging will be added in a future step
  // await addLogEntry(user.email, `Resident Deleted: ${residentName}`);
  return NextResponse.json({message: 'Resident deleted successfully'});
}

export const DELETE = roleRequired(
  ['superuser', 'editor'],
  deleteResidentHandler
);
