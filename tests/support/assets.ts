import {managed} from "./creative.ts";
import {sha} from "./scenario.ts";
import {readFile} from "node:fs/promises";
import path from "node:path";
export async function importAsset(c:any,bytes:Buffer,filename:string,key:string){const inline={filename,base64:bytes.toString("base64"),sha256:sha(bytes)};
const scan=await c.ok("hetu_managed_assets_inspect",{management_ref:c.management,work_ref:c.work,inline_source:inline});
const v=await managed(c,"assets.import",{work_ref:c.work,inline_source:inline,expected_file:{sha256:scan.sha256,size_bytes:scan.size_bytes},title:filename,source:{source_type:"author_supplied",creator_statement:"本轮隔离验收原创绘画或本机系统语音样本"},rights_status:"unknown",redistribution_allowed:false,rights_statement:"",operation_key:key},key);
return {kind:"asset",work_ref:c.work,asset_id:v.asset.asset_id,revision:v.asset.revision,sha256:v.sha256};}
export async function prepareMedia(c:any,p:any,refs:any[],slug:string){
if(slug==="comic-studio"){const bytes=await readFile("tests/fixtures/rain-harbour.png");refs.push(await importAsset(c,bytes,"雨港原创绘画样本.png","art"));for(const panel of p.panels)panel.asset_source_index=refs.length-1;}
if(slug==="audio-drama"){for(const [n,line] of p.lines.entries()){const bytes=await readFile("tests/fixtures/voice-"+n+".wav");refs.push(await importAsset(c,bytes,"台词"+n+".wav","voice-"+n));p.takes.push({id:"take-"+n,title:n?"林溪 第一遍":"叙述 第一遍",line_id:line.id,kind:"dialogue",asset_source_index:refs.length-1,speech_checked:false});let at=12,dataBytes=0,rate=8000;while(at+8<=bytes.length){const name=bytes.toString('ascii',at,at+4),n=bytes.readUInt32LE(at+4);if(name==='fmt ')rate=bytes.readUInt32LE(at+12);if(name==='data')dataBytes=n;at+=8+n+n%2;}const duration=dataBytes/2/rate*1000;p.clips.push({id:"clip-"+n,take_id:"take-"+n,start_ms:n?4000:0,in_ms:0,out_ms:Math.floor(Math.min(duration,3500)),gain_db:-3,pan:n?.25:-.25,fade_in_ms:10,fade_out_ms:20});}}
return refs;}
