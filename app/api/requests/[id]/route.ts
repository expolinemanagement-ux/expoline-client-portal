import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';

type Params={params:Promise<{id:string}>};
const statuses=['PENDING','SUBMITTED','UNDER_REVIEW','APPROVED','REVISION_REQUIRED','REJECTED','CANCELLED'] as const;
const priorities=['LOW','NORMAL','HIGH','URGENT'] as const;

export async function GET(_request:Request,{params}:Params){
 const {id}=await params;const item=await prisma.request.findUnique({where:{id},include:{company:true,personnel:true,createdBy:true}});
 if(!item)return NextResponse.json({error:'Request not found.'},{status:404});return NextResponse.json(item);
}
export async function PUT(request:Request,{params}:Params){
 try{const {id}=await params;const b=await request.json();if(!b.title?.trim())return NextResponse.json({error:'Title is required.'},{status:400});
 const priority=priorities.includes(b.priority)?b.priority:'NORMAL';const status=statuses.includes(b.status)?b.status:'PENDING';
 const item=await prisma.request.update({where:{id},data:{title:b.title.trim(),description:b.description?.trim()||null,priority,status,dueDate:b.dueDate?new Date(b.dueDate):null},include:{company:true,personnel:true}});return NextResponse.json(item);
 }catch{return NextResponse.json({error:'Unable to update request.'},{status:500});}}
export async function DELETE(_request:Request,{params}:Params){try{const {id}=await params;await prisma.request.delete({where:{id}});return NextResponse.json({ok:true});}catch{return NextResponse.json({error:'Unable to delete request.'},{status:500});}}
