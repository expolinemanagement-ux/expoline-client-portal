import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireUser,canAccessCompany} from '@/lib/auth';

const statuses=['VALID','EXPIRING_SOON','EXPIRED','PENDING','NOT_REQUIRED'] as const;
type Status=typeof statuses[number];
type Params={params:Promise<{type:string;id:string}>};
function parse(type:string){if(type==='visa')return 'visa';if(type==='work-permit')return 'workPermit';if(type==='medical')return 'medicalRecord';if(type==='insurance')return 'insuranceRecord';return null;}

export async function GET(_request:Request,{params}:Params){
 const {type,id}=await params;const model=parse(type);if(!model)return NextResponse.json({error:'Invalid record type.'},{status:400});
 try{const user=await requireUser();const item=await (prisma as any)[model].findUnique({where:{id},include:{personnel:true}});if(!item||!canAccessCompany(user,item.personnel.companyId))return NextResponse.json({error:'Record not found.'},{status:404});return NextResponse.json(item);}
 catch(error){if(error instanceof Error&&error.message==='UNAUTHENTICATED')return NextResponse.json({error:'Unauthorized.'},{status:401});return NextResponse.json({error:'Unable to load record.'},{status:500});}
}

export async function PUT(request:Request,{params}:Params){
 const {type,id}=await params;const model=parse(type);if(!model)return NextResponse.json({error:'Invalid record type.'},{status:400});
 try{const user=await requireUser();const existing=await (prisma as any)[model].findUnique({where:{id},include:{personnel:true}});if(!existing||!canAccessCompany(user,existing.personnel.companyId))return NextResponse.json({error:'Record not found.'},{status:404});const b=await request.json();const status:Status=statuses.includes(b.status)?b.status:'PENDING';const expiryDate=b.expiryDate?new Date(b.expiryDate):null;const issueDate=b.issueDate?new Date(b.issueDate):null;let data:any={status,expiryDate,notes:b.notes?.trim()||null};if(model==='visa')data={...data,visaNumber:b.referenceNumber?.trim()||null,visaType:b.type?.trim()||'Employment',issueDate};if(model==='workPermit')data={...data,permitNumber:b.referenceNumber?.trim()||null,permitType:b.type?.trim()||'Employment',issueDate};if(model==='medical')data={...data,medicalType:b.type?.trim()||'Employment Medical',completionDate:issueDate};if(model==='insurance')data={...data,provider:b.provider?.trim()||'Demo Insurance Provider',policyNumber:b.referenceNumber?.trim()||null,coverageType:b.type?.trim()||'Employment',startDate:issueDate};const item=await (prisma as any)[model].update({where:{id},data,include:{personnel:true}});return NextResponse.json(item);}
 catch(error){if(error instanceof Error&&error.message==='UNAUTHENTICATED')return NextResponse.json({error:'Unauthorized.'},{status:401});return NextResponse.json({error:'Unable to update compliance record.'},{status:500});}
}

export async function DELETE(_request:Request,{params}:Params){
 const {type,id}=await params;const model=parse(type);if(!model)return NextResponse.json({error:'Invalid record type.'},{status:400});
 try{const user=await requireUser();const existing=await (prisma as any)[model].findUnique({where:{id},include:{personnel:true}});if(!existing||!canAccessCompany(user,existing.personnel.companyId))return NextResponse.json({error:'Record not found.'},{status:404});await (prisma as any)[model].delete({where:{id}});return NextResponse.json({ok:true});}
 catch(error){if(error instanceof Error&&error.message==='UNAUTHENTICATED')return NextResponse.json({error:'Unauthorized.'},{status:401});return NextResponse.json({error:'Unable to delete compliance record.'},{status:500});}
}