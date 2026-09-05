import {PrismaClient,Role} from '@prisma/client';import {hashPassword} from '../lib/password';
const prisma=new PrismaClient();
async function main(){const password=process.env.DEMO_PASSWORD||'Demo123!';const hash=await hashPassword(password);const result=await prisma.user.updateMany({data:{passwordHash:hash},where:{active:true}});console.log(`Set demo password hash for ${result.count} synthetic users.`);console.log(`Demo password: ${password}`);console.log('Change all passwords before production.');}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>prisma.$disconnect());
