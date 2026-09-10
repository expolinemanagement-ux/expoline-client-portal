import { cookies } from 'next/headers';import { prisma } from '@/lib/prisma';import {createSessionToken,verifySessionToken,MAX_AGE} from '@/lib/session-token';
const COOKIE_NAME='expoline_session';
export {createSessionToken,verifySessionToken,MAX_AGE,COOKIE_NAME};
export async function getCurrentUser(){const store=await cookies();const session=await verifySessionToken(store.get(COOKIE_NAME)?.value);if(!session)return null;const user=await prisma.user.findFirst({where:{id:session.sub,active:true}});if(!user||user.sessionVersion!==session.sv)return null;return user;}
export async function requireUser(){const user=await getCurrentUser();if(!user)throw new Error('UNAUTHENTICATED');return user;}
export function canAccessCompany(user:{role:string;companyId:string|null},companyId:string){return user.role==='SUPER_ADMIN'||user.role==='EXPOLINE_STAFF'||user.companyId===companyId;}
