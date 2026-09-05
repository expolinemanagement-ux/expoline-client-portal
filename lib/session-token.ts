const MAX_AGE=60*60*8;type SessionPayload={sub:string;exp:number};
function secret(){const value=process.env.AUTH_SECRET;if(!value)throw new Error('AUTH_SECRET is required.');return value;}
function base64url(bytes:Uint8Array){let s='';for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function fromBase64url(value:string){const padded=value.replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((value.length+3)%4);const s=atob(padded);return Uint8Array.from(s,c=>c.charCodeAt(0));}
async function sign(value:string){const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret()),{name:'HMAC',hash:'SHA-256'},false,['sign']);return base64url(new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(value))));}
export async function createSessionToken(userId:string){const payload=base64url(new TextEncoder().encode(JSON.stringify({sub:userId,exp:Math.floor(Date.now()/1000)+MAX_AGE})));return `${payload}.${await sign(payload)}`;}
export async function verifySessionToken(token:string|undefined){if(!token)return null;const [payload,signature]=token.split('.');if(!payload||!signature)return null;const expected=await sign(payload);if(signature!==expected)return null;try{const data=JSON.parse(new TextDecoder().decode(fromBase64url(payload))) as SessionPayload;if(!data.sub||data.exp<Math.floor(Date.now()/1000))return null;return data}catch{return null;}}
export {MAX_AGE};
