import assert from "node:assert/strict";
import {test} from "node:test";
import {mkdir,writeFile} from "node:fs/promises";
import path from "node:path";
import manifest from "../contracts/plugin-manifest.json" with {type:"json"};
import {newProject,clone} from "../src/domain/model.ts";
import {config} from "../src/domain/config.ts";
import {scenario,original,sha,base,selection} from "./support/scenario.ts";
import {start} from "./support/machine.ts";
import {importText} from "./support/import.ts";
import {prepareMedia} from "./support/assets.ts";
const slug=manifest.id.replace("org.wordflowlab.","");
const error=(r:any)=>r.error?.code??r.data?.result?.error?.code;
test("正式机器入口全动作、固定成果、恢复与热插拔",{timeout:1200000},async t=>{
 const c=await start();let serial=0;const key=()=>"machine-"+(++serial);const files:any[]=[];
 const artifact=async(action:string,r:any,args:any={})=>{let offset=0,expected:string|undefined,total:number|undefined;const chunks:Buffer[]=[];
 do{const v=await c.invoke(action,{...selection(r),...args,offset,max_bytes:8192});const b=Buffer.from(v.base64,"base64");assert.equal(v.offset,offset);assert.equal(sha(b),v.chunk_sha256);expected??=v.sha256;total??=v.total_bytes;assert.equal(v.sha256,expected);chunks.push(b);if(v.next_offset===null)break;assert.equal(v.next_offset,offset+b.length);offset=v.next_offset;}while(offset<32*1024*1024);
 const bytes=Buffer.concat(chunks);assert.equal(bytes.length,total);assert.equal(sha(bytes),expected);return bytes;};
 try{
 t.diagnostic(c.directory);assert.equal(c.cap.access_mode,"open");
 for(const resource of [undefined,"references/operations.md","references/workflows.md"]){const v=await c.invoke("skills.read",{skill_id:slug,...(resource?{resource}:{})});assert.ok(v.content.length>100);}
 const refs=await importText(c,[original]),p=scenario(c.work);await prepareMedia(c,p,refs,slug);
 let r=await c.invoke("save_project",{content:p,source_refs:refs,expected_revision:0,expected_sha256:"",operation_key:"seed"});const initial=r;
 if(slug==="reader-review"){
 const d=await c.invoke("packet_digest",{...selection(r),packet_id:"round-one"});
 const envelope={format:"hetu.reader-feedback",version:1,packet_id:"round-one",packet_sha256:d.packet_sha256,submission:{id:"reader-response",packet_id:"round-one",packet_sha256:d.packet_sha256,reader_id:"reader-lin",covered_indices:[0],notes:[{id:"question",range_index:0,kind:"question",comment:"这封信的寄信人是谁？"}]}};
 const bytes=Buffer.from(JSON.stringify(envelope)),file={filename:"feedback.json",base64:bytes.toString("base64"),sha256:sha(bytes)};
 assert.equal((await c.invoke("preview_feedback",{...selection(r),file})).imported,false);
 r=await c.invoke("import_feedback",{...base(r,key()),file});
 r=await c.invoke("put_decision",{...base(r,key()),decision:{id:"keep-mystery",submission_id:"reader-response",note_id:"question",decision:"keep",reason:"这是有意保留的开篇悬念，后文回收。",recheck_range:null}});
 assert.equal((await c.invoke("check_feedback",selection(r))).human_submissions,1);
 const html=await artifact("export_packet",r,{packet_id:"round-one"});assert.match(html.toString(),/下载反馈JSON/);files.push({name:"试读包.html",bytes:html});
 const invalid=await c.raw("save_project",{...base(r,key()),content:{...r.object.content,submissions:[]}});assert.ok(error(invalid));
 }
 for(const [item,field] of Object.entries(config.fields))for(const row of r.object.content[field as string])r=await c.invoke("put_"+item,{...base(r,key()),[item]:row});
 if(slug==="adaptation-studio"){
 assert.equal((await c.invoke("check_adaptation",selection(r))).complete,false);
 assert.deepEqual((await c.invoke("preview_impact",{...selection(r),changed_source_indices:[0]})).target_ids,["episode"]);
 assert.equal((await c.invoke("prepare_target",{...selection(r),target_id:"episode"})).target_read_status,"planning_only");
 }
 if(slug==="comic-studio"){
 assert.deepEqual((await c.invoke("check_layout",selection(r))).missing_art_panel_ids,[]);
 assert.match((await c.invoke("render_page",{...selection(r),page_id:"page-one"})).html,/data:image\/png;base64/);
 assert.equal((await c.invoke("locate_panel",{...selection(r),panel_id:"panel-one"})).ranges[0].quote,original);
 const html=await artifact("export_comic",r);assert.match(html.toString(),/这封信/);assert.ok(!/https?:\/\//.test(html.toString()));files.push({name:"漫画.html",bytes:html});
 }
 if(slug==="audio-drama"){
 assert.ok((await c.invoke("inspect_take",{...selection(r),take_id:"take-0"})).frames>1000);
 assert.equal((await c.invoke("locate_audio",{...selection(r),time_ms:100})).clips[0].line.role_id,"narrator");
 const report=await c.invoke("check_mix",selection(r));assert.equal(report.channels,2);assert.deepEqual(report.unrecorded_line_ids,[]);
 const bytes=await artifact("render_mix",r);assert.equal(bytes.subarray(0,4).toString(),"RIFF");assert.equal(bytes.readUInt32LE(4)+8,bytes.length);files.push({name:"有声剧混音.wav",bytes});
 }
 assert.equal((await c.invoke("list_projects",{query:"雨港"})).objects.length,1);
 assert.equal((await c.invoke("get_source",{...selection(r),source_index:0})).source.content,original);
 const before=r;const edit={...base(r,key()),content:{...r.object.content,title:"雨港来信 第二版"}};r=await c.invoke("save_project",edit);assert.equal((await c.invoke("save_project",edit)).sha256,r.sha256);
 assert.equal(error(await c.raw("save_project",{...edit,content:{...edit.content,title:"同键异参"}})),"idempotency_conflict");
 assert.equal(error(await c.raw("save_project",{...edit,operation_key:key()})),"revision_conflict");
 assert.equal((await c.invoke("get_operation",{operation_key:edit.operation_key})).sha256,r.sha256);
 r=await c.invoke("save_project",{...base(r,key()),content:{...r.object.content,basis_refs:[{owner_plugin_id:manifest.id,object_id:initial.object.object_id,revision:initial.object.revision,sha256:initial.sha256}]}});
 assert.equal((await c.invoke("get_basis",{...selection(r),basis_index:0})).basis.sha256,initial.sha256);
 const fixed=selection(r),finalSHA=r.sha256;
 await c.invoke("build_context",{...fixed,goal:"沿固定依据继续创作",max_chars:12000});
 assert.equal((await c.invoke("create_handoff",{...fixed,goal:"准备下一阶段候选"})).basis_ref.sha256,finalSHA);
 await c.invoke("compare_versions",{object_id:r.object.object_id,from_revision:before.object.revision,to_revision:r.object.revision});
 for(const format of ["json","markdown","html"]){const v=await c.invoke("export_project",{...fixed,format,max_bytes:48000});assert.ok(v.total_bytes>100);}
 const read=c.cli("hetu.plugins.invoke",{...c.binding,capabilities_sha256:c.cap.capabilities_sha256,action:"get_project",arguments:fixed});assert.equal(read.status,"succeeded");
 if(slug==="reader-review")for(const d of [...r.object.content.decisions])r=await c.invoke("remove_decision",{...base(r,key()),decision_id:d.id});
 const scratch=clone(r.object.content);if(slug==="reader-review"){scratch.submissions=[];scratch.decisions=[];}
 let remove=await c.invoke("save_project",{content:{...scratch,title:"独立移除用例"},source_refs:refs,expected_revision:0,expected_sha256:"",operation_key:key()});
 for(const [item,field] of Object.entries(config.fields).reverse())for(const row of [...remove.object.content[field as string]])if(manifest.contributions.actions.some(a=>a.id==="remove_"+item))remove=await c.invoke("remove_"+item,{...base(remove,key()),[item+"_id"]:row.id});
 assert.equal((await c.invoke("get_project",fixed)).sha256,finalSHA);
 await c.apply("disable");assert.ok(error(await c.raw("get_project",fixed)));await c.apply("enable");await c.discover();assert.equal((await c.invoke("get_project",fixed)).sha256,finalSHA);
 await c.apply("uninstall");assert.ok(error(await c.raw("get_project",fixed)));await c.apply("install");await c.discover();assert.equal((await c.invoke("get_project",fixed)).sha256,finalSHA);
 assert.deepEqual(manifest.contributions.actions.map(a=>a.id).filter(a=>!c.actions.has(a)),[]);
 const dir=process.env.HETU_RECEIPT_DIRECTORY??"docs/research";await mkdir(dir,{recursive:true});for(const f of files)await writeFile(path.join(dir,f.name),f.bytes);
 await writeFile(path.join(dir,"runtime-acceptance.json"),JSON.stringify({recorded_at:new Date().toISOString(),plugin_id:manifest.id,package_sha256:c.pkg.package_sha256,host_version:c.coreVersion,platform:process.platform,architecture:process.arch,actions:[...c.actions],skill_resources:3,lifecycle:["install","disable","enable","uninstall","install"],fixed_history:true,CAS:true,original_key_recovery:true,artifact_sha256_verified:true,limits:["没有付费模型、作者采纳、定稿或Windows/Linux专业运行验收"]},null,2)+"\n");
 }finally{await c.client.close();}
});
