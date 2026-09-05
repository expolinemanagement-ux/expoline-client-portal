import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireUser,canAccessCompany} from '@/lib/auth';
import {saveDocument,MAX_DOCUMENT_BYTES} from '@/lib/document-storage';
import crypto from 'node:crypto';

export const runtime='nodejs';

const allowed=new Set(['application/pdf','image/jpeg','image/png','image/webp']);

export async function POST(request:Request){
  try{
    const user=await requireUser();
    const form=await request.formData();
    const file=form.get('file');
    const companyId=String(form.get('companyId')||'');
    const personnelId=String(form.get('personnelId')||'')||null;
    if(!(file instanceof File)||!companyId) return NextResponse.json({error:'File and company are required.'},{status:400});
    if(file.size===0||file.size>MAX_DOCUMENT_BYTES) return NextResponse.json({error:'File must be between 1 byte and 10 MB.'},{status:400});
    if(!allowed.has(file.type)) return NextResponse.json({error:'Only PDF, JPG, PNG and WebP files are allowed.'},{status:400});
    if(!canAccessCompany(user,companyId)) return NextResponse.json({error:'Company access denied.'},{status:403});
    const company=await prisma.company.findUnique({where:{id:companyId}});
    if(!company) return NextResponse.json({error:'Company not found.'},{status:404});
    if(personnelId){const person=await prisma.personnel.findFirst({where:{id:personnelId,companyId}});if(!person)return NextResponse.json({error:'Personnel does not belong to this company.'},{status:400});}
    const category=String(form.get('category')||'OTHER');
    const validCategories=['PASSPORT','IDENTITY','EMPLOYMENT','VISA','WORK_PERMIT','MEDICAL','INSURANCE','PHOTO','OTHER'];
    if(!validCategories.includes(category)) return NextResponse.json({error:'Invalid document category.'},{status:400});
    const storageKey=`${companyId}/${crypto.randomUUID()}`;
    const buffer=Buffer.from(await file.arrayBuffer());
    await saveDocument(storageKey,buffer);
    try{
      const doc=await prisma.document.create({data:{companyId,personnelId,name:String(form.get('name')||file.name).trim().slice(0,200),category:category as never,storageKey,mimeType:file.type,sizeBytes:file.size,issueDate:form.get('issueDate')?new Date(String(form.get('issueDate'))):null,expiryDate:form.get('expiryDate')?new Date(String(form.get('expiryDate'))):null,status:'VALID',uploadedById:user.id},include:{company:true,personnel:true}});
      return NextResponse.json(doc,{status:201});
    }catch(error){
      const {deleteDocumentFile}=await import('@/lib/document-storage');
      await deleteDocumentFile(storageKey).catch(()=>{});
      throw error;
    }
  }catch(error){
    if(error instanceof Error&&error.message==='UNAUTHENTICATED') return NextResponse.json({error:'Unauthorized.'},{status:401});
    return NextResponse.json({error:'Unable to upload document.'},{status:500});
  }
}
