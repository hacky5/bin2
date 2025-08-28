import {NextRequest, NextResponse} from 'next/server';
import {redis} from '@/lib/redis';
import {roleRequired, getCurrentUser} from '@/lib/auth';
import {v4 as uuidv4} from 'uuid';
import bcrypt from 'bcryptjs';
import {addLogEntry} from '@/lib/utils';

async function getAdminsHandler(req: NextRequest) {
  let admins: any[] = (await redis.get('admins')) || [];
  if (typeof admins === 'string') {
    admins = JSON.parse(admins);
  }
  const safeAdmins = admins.map(admin => {
    const {password_hash, ...safeAdmin} = admin;
    return safeAdmin;
  });
  return NextResponse.json(safeAdmins);
}

export const GET = roleRequired(['superuser'], getAdminsHandler);

async function createAdminHandler(req: NextRequest) {
  const {email, password, role} = await req.json();
  if (!email || !password || !role) {
    return NextResponse.json(
      {message: 'Email, password, and role are required'},
      {status: 400}
    );
  }

  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json({message: 'Unauthorized'}, {status: 401});
  }

  let admins: any[] = (await redis.get('admins')) || [];
  if (typeof admins === 'string') {
    admins = JSON.parse(admins);
  }

  if (admins.some(admin => admin.email === email)) {
    return NextResponse.json(
      {message: 'Admin with this email already exists'},
      {status: 409}
    );
  }

  const password_hash = bcrypt.hashSync(password, 10);
  const newAdmin = {
    id: uuidv4(),
    email,
    password_hash,
    role,
  };

  admins.push(newAdmin);
  await redis.set('admins', JSON.stringify(admins));
  await addLogEntry(
    user.email,
    `Admin Created: ${newAdmin.email} with role ${newAdmin.role}`
  );

  const {password_hash: _, ...safeNewAdmin} = newAdmin;
  return NextResponse.json(safeNewAdmin, {status: 201});
}

export const POST = roleRequired(['superuser'], createAdminHandler);
