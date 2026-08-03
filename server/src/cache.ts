const data = new Map<string,{value:unknown;expires:number}>();
export async function cached<T>(key:string, ttl:number, fn:()=>Promise<T>):Promise<T>{const hit=data.get(key);if(hit&&hit.expires>Date.now())return hit.value as T;try{const value=await fn();data.set(key,{value,expires:Date.now()+ttl});return value}catch(error){if(hit)return hit.value as T;throw error}}
