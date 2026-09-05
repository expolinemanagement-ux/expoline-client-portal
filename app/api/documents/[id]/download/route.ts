import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireUser,canAccessCompany} from '@/lib/auth';
import {loadDocument} from '@/lib/document-storage';

export const runtime='nodejs';

export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){
  try{
    const user=await requireUser();
    const {id}=await params;
    const doc=await prisma.document.findUnique({where:{id}});
    if(!doc||!canAccessCompany(user,doc.companyId)) return NextResponse.json({error:'Document not found.'},{status:404});
    const data=await loadDocument(doc.storageKey);
    const type=doc.mimeType||'application/octet-stream';
    const filename=(doc.name||'document').replace(/[\\/\r\n"]/g,'_').slice(0,180);
    return new Response(data,{headers:{'Content-Type':type,'Content-Length':String(data.byteLength),'Content-Disposition:`attachment; filename="${filename}"`':'','X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store'}});
  }catch(error){
    if(error instanceof Error&&error.message==='UNAUTHENTICATED') return NextResponse.json({error:'Unauthorized.'},{status:401});
    if(error instanceof Error&&error.message==='ENOENT') return NextResponse.json({error:'Document file is missing from local storage.'},{status:404});
    return NextResponse.json({error:'Unable to download document.'},{status:500});
  }
}
