import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireUser,canAccessCompany} from '@/lib/auth';

type Params={params:Promise<{id:string}>};
const statusMap:Record<string,'CANDIDATE'|'RECRUITING'|'PROCESSING'|'ACTIVE'|'INACTIVE'>={Candidate:'CANDIDATE',Recruiting:'RECRUITING',Processing:'PROCESSING',Active:'ACTIVE',Inactive:'INACTIVE'};

export async function GET(_request:Request,{params}:Params){
 try{const user=await requireUser();const {id}=await params;const item=await prisma.personnel.findUnique({where:{id},include:{company:true,visas:true,workPermits:true,medicalRecords:true,insuranceRecords:true,documents:true}});if(!item||!canAccessCompany(user,item.companyId))return NextResponse.json({error:'Personnel not found.'},{status:404});return NextResponse.json(item);}
 catch(error){if(error instanceof Error&&error.message==='UNAUTHENTICATED')return NextResponse.json({error:'Unauthorized.'},{status:401});return NextResponse.json({error:'Unable to load personnel.'},{status:500});}
}

export async function PUT(request:Request,{params}:Params){
 try{const user=await requireUser();const {id}=await params;const existing=await prisma.personnel.findUnique({where:{id}});if(!existing||!canAccessCompany(user,existing.companyId))return NextResponse.json({error:'Personnel not found.'},{status:404});const body=await request.json();
 const company=body.companyName?await prisma.company.findFirst({where:{name:body.companyName.trim()}}):null;
 if(body.companyName&&(!company||!canAccessCompany(user,company.id)))return NextResponse.json({error:'Company access denied.'},{status:403});
 const item=await prisma.personnel.update({where:{id},data:{fullName:body.fullName?.trim(),chineseName:body.chineseName?.trim()||null,nationality:body.nationality?.trim()||null,position:body.position?.trim()||null,passportNumber:body.passportNumber?.trim()||null,passportExpiry:body.passportExpiry?new Date(body.passportExpiry):null,status:statusMap[body.status]??'CANDIDATE',...(company?{companyId:company.id}:{})}});return NextResponse.json(item);
 }catch(error){if(error instanceof Error&&error.message==='UNAUTHENTICATED')return NextResponse.json({error:'Unauthorized.'},{status:401});return NextResponse.json({error:'Unable to update personnel.'},{status:500});}
}

export async function DELETE(_request:Request,{params}:Params){
 try{const user=await requireUser();const {id}=await params;const existing=await prisma.personnel.findUnique({where:{id}});if(!existing||!canAccessCompany(user,existing.companyId))return NextResponse.json({error:'Personnel not found.'},{status:404});await prisma.personnel.delete({where:{id}});return NextResponse.json({ok:true});}
 catch(error){if(error instanceof Error&&error.message==='UNAUTHENTICATED')return NextResponse.json({error:'Unauthorized.'},{status:401});return NextResponse.json({error:'Unable to delete personnel.'},{status:500});}
}