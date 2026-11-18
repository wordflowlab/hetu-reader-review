import {test} from "node:test";
import assert from "node:assert/strict";
import {scenario,range,wav,sha,base,sourceRef,original} from "./support/scenario.ts";
import {validate,clone,canonical} from "../src/domain/model.ts";
import {packetDigest,previewFeedback,feedbackSummary,packetHTML} from "../src/domain/professional.ts";
function submission(p:any,reader="reader-lin"){return {id:"response",packet_id:p.packets[0].id,packet_sha256:packetDigest(p.packets[0]),reader_id:reader,covered_indices:[0],notes:[{id:"note",range_index:0,kind:"question",comment:"钥匙从哪里来？"}]};}
function file(p:any,s:any){const b=Buffer.from(JSON.stringify({format:"hetu.reader-feedback",version:1,packet_id:p.packets[0].id,packet_sha256:packetDigest(p.packets[0]),submission:s}));return {filename:"feedback.json",base64:b.toString("base64"),sha256:sha(b)};}
test("模拟读者不计真人覆盖",()=>{const p=scenario();p.submissions=[submission(p,"simulation")];validate(p);const r=feedbackSummary(p);assert.equal(r.human_submissions,0);assert.equal(r.simulation_submissions,1);assert.deepEqual(r.coverage[0].human_read_indices,[]);});
test("多份同读者提交不伪增读者人数",()=>{const p=scenario();p.submissions=[submission(p),{...submission(p),id:"response2"}];assert.equal(feedbackSummary(p).human_reader_ids.length,1);});
test("旧试读包修改后反馈摘要不再匹配",()=>{const p=scenario();p.submissions=[submission(p)];p.packets[0].instructions="新版问题";assert.throws(()=>validate(p));});
test("未读段落不能附带已读意见",()=>{const p=scenario();p.submissions=[{...submission(p),covered_indices:[]}];assert.throws(()=>validate(p));});
test("意见与处理决定分别保存",()=>{const p=scenario();p.submissions=[submission(p)];p.decisions=[{id:"d",submission_id:"response",note_id:"note",decision:"keep",reason:"后文回收，保留此疑问。",recheck_range:null}];validate(p);assert.equal(p.submissions[0].notes[0].comment,"钥匙从哪里来？");assert.equal(feedbackSummary(p).unresolved_notes.length,0);});
test("孤立意见决定和重复覆盖序号拒绝",()=>{const p=scenario();p.submissions=[{...submission(p),covered_indices:[0,0]}];assert.throws(()=>validate(p));});
test("反馈预览核验原字节与固定包摘要",()=>{const p=scenario(),f=file(p,submission(p));assert.equal(previewFeedback(p,f).id,"response");assert.throws(()=>previewFeedback(p,{...f,sha256:"a".repeat(64)}));p.packets[0].title="新包";assert.throws(()=>previewFeedback(p,f));});
test("离线包转义原著，不执行正文脚本",()=>{const p=scenario();p.packets[0].ranges[0].quote="<script>window.pwned=1</script>";const html=packetHTML(p.packets[0]);assert.match(html,/&lt;script&gt;/);assert.ok(!html.includes("<script>window.pwned"));assert.ok(!/https?:\/\//.test(html));});
