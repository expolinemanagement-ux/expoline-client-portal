import {NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {requireUser,canAccessCompany} from '@/lib/auth';
import {saveDocument,MAX_DOCUMENT_BYTES,deleteDocumentFile} from '@/lib/document-storage';
import {audit} from '@/lib/audit';
import crypto from 'node:crypto';
import {DocumentCategory} from '@prisma/client';

export const runtime='nodejs';
const allowed=new Set(['application/pdf','image/jpeg','image/png','image/webp']);

function detectMime(bytes:Buffer){
  if(bytes.length>=4&&bytes.subarray(0,4).toString('ascii')==='%PDF')return 'application/pdf';
  if(bytes.length>=3&&bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff)return 'image/jpeg';
  if(bytes.length>=8&&bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return 'image/png';
  if(bytes.length>=12&&bytes.subarray(0,4).toString('ascii')==='RIFF'&&bytes.subarray(8,12).toString('ascii')==='WEBP')return 'image/webp';
  return null;
}

export async function POST(request:Request){
  try{
    const user=await requireUser();
    const form=await request.formData();
    const file=form.get('file');
    const companyId=String(form.get('companyId')||'');
    const personnelId=String(form.get('personnelId')||'')||null;
    if(!(file instanceof File)||!companyId)return NextResponse.json({error:'File and company are required.'},{status:400});
    if(file.size===0||file.size>MAX_DOCUMENT_BYTES)return NextResponse.json({error:'File must be between 1 byte and 10 MB.'},{status:400});
    if(!allowed.has(file.type))return NextResponse.json({error:'Only PDF, JPG, PNG and WebP files are allowed.'},{status:400});
    const bytes=Buffer.from(await file.arrayBuffer());
    const detectedMime=detectMime(bytes);
    if(!detectedMime||detectedMime!==file.type||!allowed.has(detectedMime))return NextResponse.json({error:'File content does not match its declared type.'},{status:400});
    if(!canAccessCompany(user,companyId))return NextResponse.json({error:'Company access denied.'},{status:403});
    const company=await prisma.company.findUnique({where:{id:companyId}});
    if(!company)return NextResponse.json({error:'Company not found.'},{status:404});
    if(personnelId){const person=await prisma.personnel.findFirst({where:{id:personnelId,companyId}});if(!person)return NextResponse.json({error:'Personnel does not belong to this company.'},{status:400});}
    const category=String(form.get('category')||'OTHER');
    if(!Object.values(DocumentCategory).includes(category as DocumentCategory))return NextResponse.json({error:'Invalid document category.'},{status:400});
    const storageKey=`${companyId}/${crypto.randomUUID()}`;
    await saveDocument(storageKey,bytes);
    try{
      const doc=await prisma.document.create({data:{companyId,personnelId,name:String(form.get('name')||file.name).trim().slice(0,200),category:category as DocumentCategory,storageKey,mimeType:detectedMime,sizeBytes:file.size,issueDate:form.get('issueDate')?new Date(String(form.get('issueDate'))):null,expiryDate:form.get('expiryDate')?new Date(String(form.get('expiryDate'))):null,status:'VALID',uploadedById:user.id},include:{company:true,personnel:true}});
      await audit(user.id,companyId,'CREATE','Document',doc.id,{name:doc.name,category:doc.category});
      return NextResponse.json(doc,{status:201})
    }catch(error){await deleteDocumentFile(storageKey).catch(()=>{});throw error}
  }catch(error){
    if(error instanceof Error&&error.message==='UNAUTHENTICATED')return NextResponse.json({error:'Unauthorized.'},{status:401});
    return NextResponse.json({error:'Unable to upload document.'},{status:500})
  }
}