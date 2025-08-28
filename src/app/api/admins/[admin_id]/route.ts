import {NextRequest, NextResponse} from 'next/server';
import {redis} from '@/lib/redis';
import {roleRequired, getCurrentUser} from '@/lib/auth';
import bcrypt from 'bcryptjs';
import {addLogEntry} from '@/lib/utils';

async function updateAdminHandler(
  req: NextRequest,
  {params}: {params: {admin_id: string}}
) {
  const {admin_id} = params;
  const data = await req.json();
  const user = await getCurrentUser(req);

  if (!user) {
    return NextResponse.json({message: 'Unauthorized'}, {status: 401});
  }

  let admins: any[] = (await redis.get('admins')) || [];
  if (typeof admins === 'string') {
    admins = JSON.parse(admins);
  }
  let adminFound = false;

  admins = admins.map(admin => {
    if (admin.id === admin_id) {
      adminFound = true;
      const updatedAdmin = {...admin};
      if (data.email) updatedAdmin.email = data.email;
      if (data.role) updatedAdmin.role = data.role;
      if (data.password)
        updatedAdmin.password_hash = bcrypt.hashSync(data.password, 10);
      return updatedAdmin;
    }
    return admin;
  });

  if (!adminFound) {
    return NextResponse.json({error: 'Admin not found'}, {status: 404});
  }

  await redis.set('admins', JSON.stringify(admins));
  const updatedEmail = admins.find(a => a.id === admin_id)!.email;
  await addLogEntry(user.email, `Admin Updated: ${updatedEmail}`);
  return NextResponse.json({message: 'Admin updated successfully'});
}

export const PUT = roleRequired(['superuser'], updateAdminHandler);

async function deleteAdminHandler(
  req: NextRequest,
  {params}: {params: {admin_id: string}}
) {
  const {admin_id} = params;
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({message: 'Unauthorized'}, {status: 401});
  }

  if (user.id === admin_id) {
    return NextResponse.json(
      {message: 'Cannot delete yourself'},
      {status: 403}
    );
  }

  let admins: any[] = (await redis.get('admins')) || [];
  if (typeof admins === 'string') {
    admins = JSON.parse(admins);
  }
  const initialLength = admins.length;
  const adminEmail = admins.find(a => a.id === admin_id)?.email || 'Unknown';

  admins = admins.filter(admin => admin.id !== admin_id);

  if (admins.length === initialLength) {
    return NextResponse.json({error: 'Admin not found'}, {status: 404});
  }

  await redis.set('admins', JSON.stringify(admins));
  await addLogEntry(user.email, `Admin Deleted: ${adminEmail}`);
  return NextResponse.json({message: 'Admin deleted successfully'});
}

export const DELETE = roleRequired(['superuser'], deleteAdminHandler);
