import {mkdir,writeFile,readFile,unlink} from 'node:fs/promises';
import path from 'node:path';

export const MAX_DOCUMENT_BYTES=10*1024*1024;

export function storageRoot(){return path.resolve(process.env.DOCUMENT_STORAGE_PATH||'./storage/documents');}

export function safeStoragePath(storageKey:string){
  const root=storageRoot();
  const resolved=path.resolve(root,storageKey);
  if(resolved!==root&&!resolved.startsWith(root+path.sep)) throw new Error('INVALID_STORAGE_KEY');
  return resolved;
}

export async function saveDocument(storageKey:string,data:Buffer){
  if(data.byteLength>MAX_DOCUMENT_BYTES) throw new Error('FILE_TOO_LARGE');
  const target=safeStoragePath(storageKey);
  await mkdir(path.dirname(target),{recursive:true});
  await writeFile(target,data,{flag:'wx'});
  return target;
}

export async function loadDocument(storageKey:string){return readFile(safeStoragePath(storageKey));}

export async function deleteDocumentFile(storageKey:string){
  try{await unlink(safeStoragePath(storageKey));}catch(error){if((error as NodeJS.ErrnoException).code!=='ENOENT')throw error;}
}
