import { cookies } from 'next/headers';import { prisma } from '@/lib/prisma';import {createSessionToken,verifySessionToken,MAX_AGE} from '@/lib/session-token';
const COOKIE_NAME='expoline_session';
export {createSessionToken,verifySessionToken,MAX_AGE,COOKIE_NAME};
export async function getCurrentUser(){const store=await cookies();const session=await verifySessionToken(store.get(COOKIE_NAME)?.value);if(!session)return null;return prisma.user.findFirst({where:{id:session.sub,active:true}});}
export async function requireUser(){const user=await getCurrentUser();if(!user)throw new Error('UNAUTHENTICATED');return user;}
export function canAccessCompany(user:{role:string;companyId:string|null},companyId:string){return user.role==='SUPER_ADMIN'||user.role==='EXPOLINE_STAFF'||user.companyId===companyId;}
