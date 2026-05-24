import React from "react"
import { useState, useEffect } from "react";

const TABS = [
  { id: "deals",    label: "Deal Finder",      icon: "⚡" },
  { id: "estate",   label: "Estate Sales",     icon: "🏚" },
  { id: "projects", label: "Projects & Donors", icon: "🔧" },
  { id: "scanner",  label: "Serial Scanner",    icon: "🔍" },
  { id: "prices",   label: "Price Analyzer",    icon: "📊" },
  { id: "pnl",      label: "P&L",               icon: "💰" },
];

const POPULAR_SEARCHES = {
  lenses:  ["Helios 44-2 58mm","Canon FD 50mm f1.4","Pentax Takumar 55mm","Nikon 50mm f1.8 AI","Minolta Rokkor 58mm","Meyer Optik Trioplan"],
  cameras: ["Canon AE-1","Pentax K1000","Nikon FM2","Olympus OM-1","Sony A7 ii","Fujifilm X-T3","Canon 5D Mark III","Nikon D750"],
  gear:    ["camera bag","M42 adapter","lens filter 52mm","camera strap","flash Speedlite","tripod ball head"],
  lots:    ["camera lot untested","vintage lens lot as-is","film camera lot for parts","camera equipment lot","SLR lot untested","lens collection lot"],
};

const ESTATE_KEYWORDS = [
  "camera","cameras","lens","lenses","nikon","canon","pentax","minolta","olympus","leica",
  "photography","darkroom","film camera","vintage camera","SLR","rangefinder","stereo","hifi",
  "electronics","equipment lot","vintage electronics",
];

const REPAIR_TYPES    = ["Cosmetic","Functional","CLA","Full Rebuild"];
const PROJECT_STATUSES = ["Needs Donor","Have Donor","In Progress","Ready to List","Complete"];
const DONOR_STATUSES  = ["Intact","Partially Harvested","Fully Harvested"];

const RISK_FLAGS = [
  { pattern:/fungus|fungi/i,                   label:"Fungus",          weight:9,  tip:"Can spread — may be unresolvable" },
  { pattern:/separat|delamina/i,                label:"Separation",      weight:9,  tip:"Irreparable optical damage" },
  { pattern:/cracked lens|broken element/i,     label:"Cracked element", weight:10, tip:"Fatal — no repair" },
  { pattern:/water damage|flood/i,              label:"Water damage",    weight:9,  tip:"Internal corrosion risk" },
  { pattern:/missing.*part|parts missing/i,     label:"Missing parts",   weight:7,  tip:"Verify sourcing cost first" },
  { pattern:/haze|fogg/i,                       label:"Haze/fog",        weight:5,  tip:"Sometimes cleanable" },
  { pattern:/shutter stick|sticky shutter/i,    label:"Shutter issues",  weight:2,  tip:"Serviceable — low risk for you" },
  { pattern:/light leak|light seal/i,           label:"Light seals",     weight:1,  tip:"Routine repair for you" },
  { pattern:/filter thread|dented.*thread/i,    label:"Filter thread",   weight:1,  tip:"You can repair these" },
  { pattern:/sold as.?is|no return/i,           label:"No returns",      weight:3,  tip:"Seller may know something" },
  { pattern:/estate|attic|storage/i,            label:"Unknown storage", weight:2,  tip:"Unknown history" },
];

const GREEN_FLAGS = [
  { pattern:/tested.*work|works.*great|fully.*function/i, label:"Tested working",    bonus:20 },
  { pattern:/shutter.*fires|all speeds/i,                  label:"Shutter confirmed", bonus:15 },
  { pattern:/glass.*clean|no fungus|clear glass/i,         label:"Clean glass",       bonus:15 },
  { pattern:/include.*cap|with cap/i,                      label:"Caps included",     bonus:8  },
  { pattern:/original box|with box/i,                      label:"Original box",      bonus:10 },
  { pattern:/light seal.*replac|new seal/i,                label:"Seals replaced",    bonus:12 },
  { pattern:/CLA|clean.*lube.*adjust/i,                    label:"Recently CLA'd",    bonus:18 },
];

const MISREP_FLAGS = [
  { pattern:/untested/i,                                       label:"Untested",             tip:"Common battery camera — no excuse not to test" },
  { pattern:/sold as.?is|no return/i,                         label:"No returns",            tip:"Seller protecting themselves — they know something" },
  { pattern:/not a camera (expert|person)|don't know much/i,  label:"Feigned ignorance",     tip:"Classic liability dodge" },
  { pattern:/great for display|display only/i,                label:"Display-only",          tip:"Dead camera, seller knows it" },
  { pattern:/shutter fires but|works but|functional but/i,    label:"Buried qualifier",      tip:"'But' always precedes the real problem" },
  { pattern:/seems (smooth|functional|ok|fine|to work)/i,     label:"Hedged claim",          tip:"'Seems' = tested, didn't like what they found" },
  { pattern:/haven't tested|didn't test|unable to test/i,     label:"Untested claim",        tip:"On a AA camera this is a choice, not a limitation" },
  { pattern:/as found|found in (attic|basement|estate)/i,     label:"Estate deflection",     tip:"Seller won't take responsibility for known condition" },
  { pattern:/powers on|turns on/i,                            label:"Powers on only",        tip:"They stopped testing there — something else failed" },
];

const PROTECTED_BUY_PATTERNS = [
  /major systems (are |remain )?functional/i,
  /shutter (is |fires |works |operates )?functional/i,
  /fully (tested|functional|working)/i,
  /tested (and )?working/i,
  /meter (is |works |reads )?accurately/i,
  /film advance (works|functional|tested)/i,
  /functions as (intended|expected|described)/i,
];

const LEVERAGE_PATTERNS = [
  { pattern:/untested/i,                                   angle:"untested",    weight:3 },
  { pattern:/sold as.?is|no return/i,                     angle:"no-returns",  weight:2 },
  { pattern:/for parts|not working/i,                     angle:"parts-only",  weight:3 },
  { pattern:/shutter stick|aperture|light leak|haze/i,    angle:"known-issue", weight:3 },
  { pattern:/estate|attic|inherited|storage/i,            angle:"provenance",  weight:2 },
  { pattern:/make offer|best offer|obo/i,                 angle:"obo",         weight:3 },
  { pattern:/seems|appears|looks like/i,                  angle:"hedged",      weight:2 },
  { pattern:/haven't tested|didn't test|unable to test/i, angle:"untested",    weight:3 },
];

const MOCK_DEALS = [
  { itemId:"1", title:"Helios 44-2 58mm f/2 M42 — Sharp Glass, Tested Working", price:{value:"38.00"}, condition:"Used", itemWebUrl:"#", marketPrice:85,  description:"Tested working. Glass is clean, no fungus. Aperture blades clean. Includes both caps." },
  { itemId:"2", title:"Canon FD 50mm f/1.4 — Works Great, Minor Dust",          price:{value:"62.00"}, condition:"Used", itemWebUrl:"#", marketPrice:110, description:"Shutter fires on all speeds. Minor internal dust. Sold as-is." },
  { itemId:"3", title:"Pentax K1000 — Untested, Estate Find, As-Is",            price:{value:"35.00"}, condition:"For parts or not working", itemWebUrl:"#", marketPrice:95,  description:"Found in attic. Untested, sold as-is. No returns. Light seals likely need replacing." },
  { itemId:"4", title:"Vintage Camera Lot x6 — Canon/Minolta/Pentax, Untested", price:{value:"65.00"}, condition:"For parts or not working", itemWebUrl:"#", marketPrice:210, description:"Lot of 6 cameras. Includes Canon AE-1, Minolta SRT-101, Pentax K1000, and 3 others. Estate sale find.", isLot:true, lotCount:6 },
  { itemId:"5", title:"Meyer-Optik Trioplan 100mm f/2.8 — Soap Bubble Bokeh",   price:{value:"120.00"}, condition:"Used", itemWebUrl:"#", marketPrice:280, description:"Tested working. Some minor haze on rear element. Shutter fires." },
  { itemId:"6", title:"Nikon FM2 Body — Shutter Sticks, For Parts",             price:{value:"45.00"}, condition:"For parts or not working", itemWebUrl:"#", marketPrice:140, description:"Shutter sticks on 1/500. Light seals need replacing. Sold for parts or repair." },
  { itemId:"7", title:"SLR Lens Lot x8 — Various M42 Untested Estate",          price:{value:"48.00"}, condition:"For parts or not working", itemWebUrl:"#", marketPrice:180, description:"8 M42 lenses, untested as-is. Takumar, Helios, Industar visible. Some haze on a couple.", isLot:true, lotCount:8 },
  { itemId:"8", title:"Canon AE-1 — Light Leak, Filter Thread Dented",          price:{value:"28.00"}, condition:"For parts or not working", itemWebUrl:"#", marketPrice:90,  description:"Light leak present, seals need replacing. 50mm lens has dented filter thread. Shutter fires." },
];

const MOCK_PROJECTS = [
  { id:"p1", model:"Pentax K1000",   repairType:"Functional", status:"Needs Donor",    notes:"Shutter needs replacing, fires but sticks at high speeds",            dateAdded:"2026-01-15", costBasis:22, repairCost:0 },
  { id:"p2", model:"Canon AE-1",     repairType:"Cosmetic",   status:"Have Donor",     notes:"Top plate scratched badly, have donor body in drawer",                 dateAdded:"2026-02-03", costBasis:18, repairCost:0 },
  { id:"p3", model:"Minolta SRT-101",repairType:"CLA",        status:"In Progress",    notes:"Full CLA in progress, mirror damper replaced",                        dateAdded:"2026-03-10", costBasis:35, repairCost:8 },
  { id:"p4", model:"Olympus OM-1",   repairType:"Functional", status:"Ready to List",  notes:"Meter repaired, shutter serviced, CLA done. Looking to sell for ~$120",dateAdded:"2025-12-01", costBasis:40, repairCost:15 },
];

const MOCK_DONORS = [
  { id:"d1", model:"Canon AE-1",      status:"Partially Harvested", notes:"Top plate still intact and usable. Shutter already pulled.",            dateAdded:"2026-01-20" },
  { id:"d2", model:"Pentax ME Super", status:"Intact",              notes:"Full donor body. Compatible shutter assy with K1000 series.",            dateAdded:"2026-02-14" },
  { id:"d3", model:"Minolta SRT-100", status:"Intact",              notes:"Full donor. Good source for SRT-101 parts.",                             dateAdded:"2026-03-01" },
];

const SERVER_URL = "https://gearstack-server-production.up.railway.app";

// West Coast city coordinates for quick selection
const WEST_COAST_CITIES = [
  { label:"Seattle, WA",      lat:"47.6062", lng:"-122.3321" },
  { label:"Portland, OR",     lat:"45.5051", lng:"-122.6750" },
  { label:"San Francisco, CA",lat:"37.7749", lng:"-122.4194" },
  { label:"Sacramento, CA",   lat:"38.5816", lng:"-121.4944" },
  { label:"Los Angeles, CA",  lat:"34.0522", lng:"-118.2437" },
  { label:"San Diego, CA",    lat:"32.7157", lng:"-117.1611" },
  { label:"Tacoma, WA",       lat:"47.2529", lng:"-122.4443" },
  { label:"Oakland, CA",      lat:"37.8044", lng:"-122.2712" },
];

async function storageGet(key) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; } catch { return null; } }
async function storageSet(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

async function callClaude(prompt, system = "") {
  const body = { model:"claude-sonnet-4-20250514", max_tokens:1000, messages:[{ role:"user", content:prompt }] };
  if (system) body.system = system;
  const r = await fetch("https://api.anthropic.com/v1/messages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(body) });
  const d = await r.json();
  return d.content?.map(b => b.text||"").join("") || "";
}

async function callClaudeWithSearch(prompt, system = "") {
  // Claude with web search may stop_reason="tool_use" and need a follow-up turn
  const messages = [{ role: "user", content: prompt }];
  const tools = [{ type: "web_search_20250305", name: "web_search" }];
  let fullText = "";

  for (let turn = 0; turn < 5; turn++) {
    const body = { model: "claude-sonnet-4-20250514", max_tokens: 2000, tools, messages };
    if (system) body.system = system;
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body)
    });
    const d = await r.json();
    if (d.error) throw new Error("API error: " + (d.error.message || JSON.stringify(d.error)));
    const content = d.content || [];

    // Collect any text from this turn
    fullText += content.filter(b => b.type === "text").map(b => b.text).join("");

    if (d.stop_reason === "end_turn") break;

    if (d.stop_reason === "tool_use") {
      // Build tool results for next turn
      const toolResults = content
        .filter(b => b.type === "tool_use")
        .map(b => ({ type: "tool_result", tool_use_id: b.id, content: "Search completed." }));
      messages.push({ role: "assistant", content });
      messages.push({ role: "user", content: toolResults });
    } else {
      break;
    }
  }

  return fullText;
}

async function scanImage(url) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:"claude-sonnet-4-20250514", max_tokens:1000, messages:[{ role:"user", content:[
      { type:"image", source:{ type:"url", url } },
      { type:"text",  text:`You are a camera reseller expert. Examine this listing photo carefully. Extract any visible serial numbers, model numbers, condition observations, and note any components that could be donor parts. Reply ONLY with JSON (no markdown): {"found":true/false,"serial":"serial or null","location":"where or null","confidence":"high/medium/low","modelVisible":"model if visible or null","conditionNotes":"what you observe about condition","donorPotential":"harvestable components if any"}` }
    ]}] })
  });
  const d = await r.json();
  const t = d.content?.map(b => b.text||"").join("") || "{}";
  try { return JSON.parse(t.replace(/```json|```/g,"").trim()); }
  catch { return { found:false, serial:null, confidence:"low", conditionNotes:"Parse error" }; }
}

function scoreRisk(title, desc, projects=[], donors=[]) {
  const text = `${title} ${desc}`.toLowerCase();
  const fired   = RISK_FLAGS.filter(f => f.pattern.test(text));
  const bonuses = GREEN_FLAGS.filter(f => f.pattern.test(text));
  const raw  = fired.reduce((s,f) => s + f.weight, 0);
  const bon  = bonuses.reduce((s,f) => s + f.bonus, 0);
  const net  = Math.max(0, Math.min(100, raw * 5 - bon));
  const titleLow = title.toLowerCase();
  const matchingProjects = projects.filter(p => p.status !== "Complete" && titleLow.includes(p.model.toLowerCase().split(" ").slice(0,2).join(" ")));
  const matchingDonors   = donors.filter(d => d.status !== "Fully Harvested" && titleLow.includes(d.model.toLowerCase().split(" ").slice(0,2).join(" ")));
  let label = net < 20 ? "Low" : net < 50 ? "Medium" : net < 75 ? "High" : "Very High";
  if (matchingDonors.length && (label === "High" || label === "Very High")) label = "Medium";
  const misrepFlags = MISREP_FLAGS.filter(f => f.pattern.test(text));
  const isProtectedBuy = PROTECTED_BUY_PATTERNS.some(p => p.test(text));
  const leverageHits = LEVERAGE_PATTERNS.filter(f => f.pattern.test(text));
  const leverageScore = Math.min(10, leverageHits.reduce((s,f) => s + f.weight, 0));
  const leverageAngles = [...new Set(leverageHits.map(f => f.angle))];
  return { net, label, fired, bonuses, matchingProjects, matchingDonors, misrepFlags, isProtectedBuy, leverageScore, leverageAngles };
}

function marginPct(price, market) { return market ? Math.round(((market - price) / market) * 100) : null; }

const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#0a0a0b;--surface:#111113;--surface2:#1a1a1e;--border:#2a2a30;--accent:#e8ff47;--accent2:#ff6b35;--text:#f0f0f0;--muted:#666;--success:#47ffb2;--danger:#ff4757;--info:#47b2ff}
body{background:var(--bg);color:var(--text);font-family:'DM Mono',monospace}
.app{min-height:100vh;max-width:1100px;margin:0 auto;padding:0 16px}
.hdr{padding:26px 0 18px;border-bottom:1px solid var(--border)}
.hdr-top{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;flex-wrap:wrap}
.mark{font-family:'Syne',sans-serif;font-weight:800;font-size:25px;letter-spacing:-1px;line-height:1}
.mark span{color:var(--accent)}
.sub{font-size:10px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-top:4px}
.api-row{display:flex;gap:7px;flex-wrap:wrap;margin-top:14px;align-items:center}
.api-in{flex:1;min-width:200px;background:var(--surface2);border:1px solid var(--border);color:var(--text);font-family:'DM Mono',monospace;font-size:12px;padding:7px 11px;border-radius:4px;outline:none;transition:border-color .2s}
.api-in:focus{border-color:var(--accent)}
.pill{font-family:'DM Mono',monospace;font-size:11px;padding:5px 11px;border-radius:4px;border:1px solid var(--border);cursor:pointer;background:transparent;color:var(--muted);transition:all .15s;white-space:nowrap}
.pill:hover{color:var(--text);border-color:var(--text)}
.pill.on{background:var(--accent);color:#000;border-color:var(--accent);font-weight:500}
.pill.d{border-color:var(--danger);color:var(--danger)}
.dot{width:7px;height:7px;border-radius:50%;background:var(--muted);display:inline-block;margin-right:5px}
.dot.g{background:var(--success);box-shadow:0 0 5px var(--success)}
.dot.y{background:var(--accent);box-shadow:0 0 5px var(--accent)}
.tabs{display:flex;border-bottom:1px solid var(--border);margin-bottom:22px;overflow-x:auto}
.tb{font-family:'Syne',sans-serif;font-size:12px;font-weight:600;padding:12px 16px;background:transparent;border:none;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;transition:all .15s;white-space:nowrap}
.tb:hover{color:var(--text)}
.tb.on{color:var(--accent);border-bottom-color:var(--accent)}
.panel{animation:fi .2s ease;padding-bottom:40px}
@keyframes fi{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
.pt{font-family:'Syne',sans-serif;font-weight:700;font-size:19px;letter-spacing:-.5px}
.pt span{color:var(--accent)}
.ps{font-size:11px;color:var(--muted);margin-top:3px}
.box{display:flex;flex-direction:column;gap:9px;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:13px;margin-bottom:14px}
.row{display:flex;gap:9px;flex-wrap:wrap;align-items:flex-end}
.f{display:flex;flex-direction:column;gap:3px;flex:1;min-width:110px}
label{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted)}
input,select,textarea{background:var(--surface2);border:1px solid var(--border);color:var(--text);font-family:'DM Mono',monospace;font-size:12px;padding:6px 9px;border-radius:4px;outline:none;transition:border-color .2s;width:100%}
input:focus,select:focus,textarea:focus{border-color:var(--accent)}
select option{background:var(--surface2)}
textarea{resize:vertical;min-height:65px;line-height:1.5}
.btn{font-family:'Syne',sans-serif;font-weight:700;font-size:11px;padding:7px 16px;border-radius:4px;border:none;cursor:pointer;transition:all .15s;white-space:nowrap}
.bp{background:var(--accent);color:#000}.bp:hover{background:#d4eb3a}.bp:disabled{opacity:.4;cursor:not-allowed}
.bs{background:var(--surface2);color:var(--text);border:1px solid var(--border)}.bs:hover{border-color:var(--text)}
.bd{background:transparent;color:var(--danger);border:1px solid var(--danger)}.bd:hover{background:var(--danger);color:#fff}
.bsu{background:transparent;color:var(--success);border:1px solid var(--success)}.bsu:hover{background:var(--success);color:#000}
.bi{background:transparent;color:var(--info);border:1px solid var(--info)}.bi:hover{background:var(--info);color:#000}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:9px}
.card{background:var(--surface);border:1px solid var(--border);border-radius:6px;overflow:hidden;transition:border-color .2s,transform .15s}
.card:hover{border-color:#3a3a42;transform:translateY(-1px)}
.card.deal{border-color:rgba(232,255,71,.35)}
.card.dm{border-color:rgba(71,178,255,.4)}
.card.pm{border-color:rgba(255,107,53,.4)}
.card.estate-hit{border-color:rgba(71,255,178,.35)}
.ph{width:100%;height:120px;background:var(--surface2);display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:26px;overflow:hidden;position:relative}
.ph img{width:100%;height:100%;object-fit:cover;opacity:.85}
.ph-placeholder{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:26px;color:var(--muted)}
.cb{padding:10px}
.ct{font-family:'Syne',sans-serif;font-weight:600;font-size:12px;line-height:1.3;margin-bottom:6px}
.cm{display:flex;align-items:center;justify-content:space-between;gap:5px;flex-wrap:wrap}
.price{font-size:16px;font-weight:500;color:var(--accent)}
.po{font-size:10px;color:var(--muted);text-decoration:line-through}
.pp{font-size:10px;color:var(--accent2);margin-top:1px}
.bdg{font-size:9px;font-weight:500;padding:2px 5px;border-radius:3px;letter-spacing:.4px;text-transform:uppercase}
.bdg-deal{background:rgba(232,255,71,.1);color:var(--accent);border:1px solid rgba(232,255,71,.2)}
.bdg-hot{background:rgba(255,107,53,.1);color:var(--accent2);border:1px solid rgba(255,107,53,.2)}
.bdg-u{background:rgba(255,255,255,.04);color:var(--muted);border:1px solid var(--border)}
.bdg-lo{background:rgba(71,255,178,.1);color:var(--success);border:1px solid rgba(71,255,178,.2)}
.bdg-me{background:rgba(232,255,71,.1);color:var(--accent);border:1px solid rgba(232,255,71,.2)}
.bdg-hi{background:rgba(255,71,87,.1);color:var(--danger);border:1px solid rgba(255,71,87,.2)}
.bdg-in{background:rgba(71,178,255,.1);color:var(--info);border:1px solid rgba(71,178,255,.2)}
.bdg-es{background:rgba(71,255,178,.1);color:var(--success);border:1px solid rgba(71,255,178,.2)}
.flags{display:flex;flex-wrap:wrap;gap:3px;margin-top:6px}
.ca{display:flex;gap:4px;margin-top:7px}
.ca a,.ca button{flex:1;text-align:center;font-family:'DM Mono',monospace;font-size:10px;padding:5px;border-radius:3px;background:var(--surface2);color:var(--text);text-decoration:none;border:1px solid var(--border);cursor:pointer;transition:all .15s}
.ca a:hover,.ca button:hover{border-color:var(--accent);color:var(--accent)}
.ma{margin-top:7px;padding:6px 8px;border-radius:4px;font-size:10px;line-height:1.5}
.ma.don{background:rgba(71,178,255,.07);border:1px solid rgba(71,178,255,.18);color:var(--info)}
.ma.pro{background:rgba(255,107,53,.07);border:1px solid rgba(255,107,53,.18);color:var(--accent2)}
.ma.est{background:rgba(71,255,178,.07);border:1px solid rgba(71,255,178,.18);color:var(--success)}
.empty{text-align:center;padding:44px 20px;color:var(--muted)}
.ei{font-size:32px;margin-bottom:9px}
.et{font-family:'Syne',sans-serif;font-size:15px;color:var(--text);margin-bottom:4px}
.es{font-size:11px;line-height:1.6;max-width:360px;margin:0 auto}
.loading{display:flex;align-items:center;justify-content:center;gap:9px;padding:32px;color:var(--muted);font-size:12px}
.spin{width:15px;height:15px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:sp .7s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
.err{background:rgba(255,71,87,.08);border:1px solid rgba(255,71,87,.3);border-radius:5px;padding:11px 13px;font-size:11px;color:var(--danger);margin-bottom:13px}
.demo{background:rgba(232,255,71,.05);border:1px solid rgba(232,255,71,.15);border-radius:4px;padding:8px 11px;font-size:11px;color:var(--accent);margin-bottom:13px}
.ar{display:flex;align-items:center;justify-content:space-between;padding:8px 11px;background:var(--surface);border:1px solid var(--border);border-radius:4px;font-size:11px;gap:7px;flex-wrap:wrap;margin-bottom:4px}
.sl{font-size:10px;color:var(--muted);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:7px}
.tr{display:flex;gap:4px;flex-wrap:wrap;margin-top:4px}
.tag{font-size:10px;padding:3px 6px;border-radius:3px;background:var(--surface2);border:1px solid var(--border);color:var(--muted);cursor:pointer;transition:all .15s}
.tag:hover{color:var(--text);border-color:var(--text)}
.tag.lot{border-color:rgba(255,107,53,.3);color:var(--accent2)}
.tag.lot:hover{background:rgba(255,107,53,.08)}
.tag.es-tag{border-color:rgba(71,255,178,.2);color:var(--success)}
.tag.es-tag:hover{background:rgba(71,255,178,.06)}
.pc{background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:12px;margin-bottom:7px;transition:border-color .2s}
.pc:hover{border-color:#3a3a42}
.pc.done{opacity:.5}
.ph2{display:flex;align-items:flex-start;justify-content:space-between;gap:7px;margin-bottom:6px}
.pm2{font-family:'Syne',sans-serif;font-weight:700;font-size:14px}
.pmeta{font-size:10px;color:var(--muted);line-height:1.6;margin-bottom:5px}
.pn{font-size:11px;color:var(--text);line-height:1.5;padding:6px 8px;background:var(--surface2);border-radius:4px;border:1px solid var(--border)}
.pact{display:flex;gap:4px;margin-top:8px;flex-wrap:wrap}
.sr{background:var(--surface);border:1px solid var(--border);border-radius:5px;overflow:hidden;margin-bottom:7px}
.srh{display:flex;align-items:center;justify-content:space-between;padding:7px 11px;background:var(--surface2);border-bottom:1px solid var(--border);font-size:11px}
.srb{display:flex;gap:9px;padding:9px;align-items:flex-start;flex-wrap:wrap}
.sth{width:68px;height:68px;object-fit:cover;border-radius:3px;flex-shrink:0;background:var(--surface2)}
.si{flex:1;min-width:150px}
.sser{font-size:14px;color:var(--accent);font-weight:500;margin:3px 0}
.sn{font-size:10px;color:var(--muted);line-height:1.5;margin-top:3px}
.cb2{height:2px;background:var(--border);border-radius:2px;margin-top:5px;overflow:hidden}
.cf{height:100%;border-radius:2px;transition:width .5s ease}
.sg{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:7px;margin-bottom:14px}
.sc{background:var(--surface);border:1px solid var(--border);border-radius:5px;padding:11px}
.slb{font-size:9px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:4px}
.sv{font-family:'Syne',sans-serif;font-size:21px;font-weight:700;color:var(--accent)}
.ss{font-size:10px;color:var(--muted);margin-top:2px}
.ov{position:fixed;inset:0;background:rgba(0,0,0,.8);display:flex;align-items:center;justify-content:center;z-index:100;padding:16px}
.modal{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:18px;width:100%;max-width:520px;max-height:90vh;overflow-y:auto}
.mt{font-family:'Syne',sans-serif;font-weight:700;font-size:16px;margin-bottom:14px}
.mact{display:flex;gap:7px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap}
.lo{background:var(--surface2);border:1px solid var(--border);border-radius:4px;padding:12px;font-size:12px;line-height:1.7;white-space:pre-wrap;max-height:380px;overflow-y:auto;margin-top:10px}
.tc{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.itabs{display:flex;border-bottom:1px solid var(--border);margin-bottom:12px}
.itb{font-family:'DM Mono',monospace;font-size:11px;padding:7px 13px;background:transparent;border:none;color:var(--muted);cursor:pointer;border-bottom:2px solid transparent;transition:all .15s}
.itb.on{color:var(--accent);border-bottom-color:var(--accent)}
.plrow{display:flex;align-items:center;justify-content:space-between;padding:8px 11px;background:var(--surface);border:1px solid var(--border);border-radius:4px;font-size:11px;gap:7px;flex-wrap:wrap;margin-bottom:4px}
.misrep-bar{background:rgba(255,107,53,.07);border:1px solid rgba(255,107,53,.2);border-radius:4px;padding:6px 8px;margin-top:6px;font-size:10px;color:var(--accent2);line-height:1.5}
.protected-bar{background:rgba(71,255,178,.07);border:1px solid rgba(71,255,178,.2);border-radius:4px;padding:6px 8px;margin-top:6px;font-size:10px;color:var(--success);line-height:1.5}
.leverage-bar{background:rgba(71,178,255,.07);border:1px solid rgba(71,178,255,.2);border-radius:4px;padding:6px 8px;margin-top:6px;font-size:10px;color:var(--info);line-height:1.5}
.lev-meter{height:3px;background:var(--border);border-radius:2px;margin-top:5px;overflow:hidden}
.lev-fill{height:100%;background:var(--info);border-radius:2px;transition:width .4s ease}
.neg-section{margin-bottom:12px}
.neg-label{font-size:10px;color:var(--muted);letter-spacing:1.5px;text-transform:uppercase;margin-bottom:5px}
.neg-output{background:var(--surface2);border:1px solid var(--border);border-radius:4px;padding:12px;font-size:12px;line-height:1.8;white-space:pre-wrap;max-height:320px;overflow-y:auto}
.neg-price{font-family:'Syne',sans-serif;font-size:28px;font-weight:800;color:var(--accent);margin:4px 0}
.neg-price-sub{font-size:11px;color:var(--muted)}
.city-grid{display:flex;gap:4px;flex-wrap:wrap;margin-top:6px}
.server-bar{background:rgba(71,255,178,.05);border:1px solid rgba(71,255,178,.15);border-radius:4px;padding:8px 11px;font-size:11px;color:var(--success);margin-bottom:13px;display:flex;align-items:center;gap:7px}
.es-sale{background:var(--surface);border:1px solid var(--border);border-radius:6px;overflow:hidden;transition:border-color .2s,transform .15s;margin-bottom:8px}
.es-sale:hover{border-color:#3a3a42;transform:translateY(-1px)}
.es-sale.hit{border-color:rgba(71,255,178,.3)}
.es-sale-img{width:100%;height:110px;object-fit:cover;background:var(--surface2);display:flex;align-items:center;justify-content:center;color:var(--muted);font-size:22px}
.es-sale-img img{width:100%;height:100%;object-fit:cover}
.es-sale-body{padding:10px}
.es-title{font-family:'Syne',sans-serif;font-weight:600;font-size:12px;line-height:1.3;margin-bottom:4px}
.es-meta{font-size:10px;color:var(--muted);line-height:1.6;margin-bottom:5px}
.es-signals{display:flex;flex-wrap:wrap;gap:3px;margin-top:5px}
.distance-row{display:flex;align-items:center;gap:8px;margin-top:4px}
.distance-label{font-size:10px;color:var(--muted);white-space:nowrap}
input[type=range]{padding:0;height:4px;accent-color:var(--accent);background:var(--border);border:none;border-radius:2px;cursor:pointer}
@media(max-width:600px){.tc{grid-template-columns:1fr}.mark{font-size:19px}.grid{grid-template-columns:1fr}}
`;

function RiskBadge({ label }) {
  const c = label === "Low" ? "bdg-lo" : label === "Medium" ? "bdg-me" : "bdg-hi";
  return <span className={`bdg ${c}`}>Risk: {label}</span>;
}
function SBadge({ status }) {
  const m = { "Needs Donor":"bdg-hi","Have Donor":"bdg-me","In Progress":"bdg-in","Ready to List":"bdg-lo","Complete":"bdg-u","Intact":"bdg-lo","Partially Harvested":"bdg-me","Fully Harvested":"bdg-u" };
  return <span className={`bdg ${m[status]||"bdg-u"}`}>{status}</span>;
}

// ── Negotiate Modal ────────────────────────────────────────────────────────────
function NegotiateModal({ item, risk, onClose }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [openingPrice, setOpeningPrice] = useState(null);
  const [targetPrice, setTargetPrice] = useState(null);
  const [copied, setCopied] = useState(false);

  const price = parseFloat(item.price?.value || 0);
  const market = item.marketPrice || null;

  const generate = async () => {
    setLoading(true); setMessage("");
    const angles = risk.leverageAngles || [];
    const misrepLabels = (risk.misrepFlags || []).map(f => f.label).join(", ");
    const prompt = `You are helping a skilled camera reseller negotiate an eBay listing price down. Generate a polite, professional, and logically compelling opening offer message.

Listing: "${item.title}"
Asking price: $${price}
Market value when working: ${market ? "$" + market : "unknown"}
Condition stated: ${item.condition || "not stated"}
Description: "${item.description || "none provided"}"
Leverage angles detected: ${angles.join(", ") || "general uncertainty"}
Misrepresentation signals: ${misrepLabels || "none flagged"}
Protected buy (seller made functional claims): ${risk.isProtectedBuy ? "YES" : "NO"}

The buyer (us) is a skilled camera technician who can diagnose and repair most issues. We are NOT a naive buyer — frame this from a position of knowledge.

Write:
1. OPENING OFFER PRICE — suggest a specific dollar amount to open at (aim 20-30% below our actual target, leaving room to settle). Format as: "Opening offer: $XX"
2. TARGET PRICE — what we actually want to land at. Format as: "Target price: $XX"  
3. OFFER MESSAGE — the actual message to send the seller. Should be:
   - Polite and respectful, not aggressive
   - Frame the uncertainty as a shared risk we're being asked to absorb
   - Reference the professional evaluation cost angle if untested
   - Mention that a verified working example commands full price — this one isn't verified
   - If protected buy: subtly acknowledge their functional claim creates some confidence but uncertainty remains
   - If misrepresentation flags: gently imply we've read the listing carefully (don't accuse)
   - End with a clear, specific offer and willingness to move quickly
   - Keep it under 120 words — concise and businesslike`;

    const result = await callClaude(prompt);
    const openMatch = result.match(/Opening offer:\s*\$?([\d.]+)/i);
    const targetMatch = result.match(/Target price:\s*\$?([\d.]+)/i);
    const msgMatch = result.match(/Offer Message[:\s\-]*([\s\S]+)/i);

    setOpeningPrice(openMatch ? parseFloat(openMatch[1]) : Math.round(price * 0.65));
    setTargetPrice(targetMatch ? parseFloat(targetMatch[1]) : Math.round(price * 0.80));
    setMessage(msgMatch ? msgMatch[1].trim() : result);
    setLoading(false);
  };

  const copy = () => { navigator.clipboard?.writeText(message); setCopied(true); setTimeout(()=>setCopied(false),2000); };
  useEffect(() => { generate(); }, []);

  return (
    <div className="ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal" style={{maxWidth:560}}>
        <div className="mt">💬 Negotiate — {item.title?.slice(0,40)}…</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
          {risk.isProtectedBuy && <span className="bdg bdg-lo">⚡ Protected Buy</span>}
          {(risk.misrepFlags||[]).length > 0 && <span className="bdg bdg-hot">⚠ {risk.misrepFlags.length} misrep signal{risk.misrepFlags.length>1?"s":""}</span>}
          {risk.leverageScore > 0 && <span className="bdg bdg-in">Leverage: {risk.leverageScore}/10</span>}
        </div>
        {!loading && (openingPrice || targetPrice) && (
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
            <div className="sc"><div className="slb">Open At</div><div className="neg-price">${openingPrice}</div><div className="neg-price-sub">Leave room to meet in the middle</div></div>
            <div className="sc"><div className="slb">Land At</div><div className="neg-price" style={{color:"var(--success)"}}>${targetPrice}</div><div className="neg-price-sub">Your actual target</div></div>
          </div>
        )}
        {loading && <div className="loading"><div className="spin"/>&nbsp;Claude is building your negotiation strategy…</div>}
        {message && (
          <div className="neg-section">
            <div className="neg-label">Offer Message — ready to send</div>
            <div className="neg-output">{message}</div>
          </div>
        )}
        {(risk.misrepFlags||[]).length > 0 && (
          <div className="neg-section">
            <div className="neg-label">Misrepresentation signals detected</div>
            {risk.misrepFlags.map(f=>(
              <div key={f.label} style={{fontSize:10,padding:"3px 0",borderBottom:"1px solid var(--border)",color:"var(--muted)"}}>
                <span style={{color:"var(--accent2)"}}>⚠ {f.label}</span> — {f.tip}
              </div>
            ))}
          </div>
        )}
        {risk.isProtectedBuy && (
          <div style={{fontSize:11,color:"var(--success)",padding:"8px 10px",background:"rgba(71,255,178,.06)",border:"1px solid rgba(71,255,178,.15)",borderRadius:4,marginBottom:10}}>
            ⚡ Seller made binding functional claims — dispute-eligible if non-functional.
          </div>
        )}
        <div className="mact">
          {message && <button className="btn bp" onClick={copy}>{copied?"Copied!":"Copy Message"}</button>}
          <button className="btn bs" onClick={generate} disabled={loading}>Regenerate</button>
          <button className="btn bs" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Estate Sales Tab ───────────────────────────────────────────────────────────
function EstateSalesTab({ projects, donors }) {
  const [keywords, setKeywords] = useState("camera lens");
  const [city, setCity] = useState(WEST_COAST_CITIES[0]);
  const [miles, setMiles] = useState(50);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    fetch(SERVER_URL + "/")
      .then(r => r.json())
      .then(d => { if (!d.status) setError("Server offline — check Railway"); })
      .catch(() => setError("Cannot reach estate server — check Railway is running"));
  }, []);

  const search = async (pg = 1) => {
    setLoading(true); setError("");
    if (pg === 1) setResults([]);
    try {
      const url = `${SERVER_URL}/search?keywords=${encodeURIComponent(keywords)}&lat=${city.lat}&lng=${city.lng}&miles=${miles}&page=${pg}`;
      const res = await fetch(url);
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Server error");
      if (pg === 1) {
        setResults(data.sales || []);
      } else {
        setResults(prev => [...prev, ...(data.sales || [])]);
      }
      setHasMore((data.sales || []).length >= 10);
      setPage(pg);
    } catch(e) {
      setError(e.message);
    }
    setLoading(false);
  };

  const loadMore = () => search(page + 1);

  return (
    <div className="panel">
      <div style={{marginBottom:14}}>
        <div className="pt">Estate <span>Sales</span></div>
        <div className="ps">Claude searches EstateSales.net live — spot gear before it hits eBay</div>
      </div>
      <div className="box">
        <div className="row">
          <div className="f" style={{flex:2}}>
            <label>Keywords</label>
            <input value={keywords} onChange={e=>setKeywords(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="camera lens nikon canon..."/>
          </div>
          <div style={{display:"flex",alignItems:"flex-end"}}>
            <button className="btn bp" onClick={search} disabled={loading}>{loading?"Scanning...":"Search"}</button>
          </div>
        </div>
        <div>
          <label>Quick keywords</label>
          <div className="tr" style={{marginTop:5}}>
            {["camera lens","nikon canon","vintage electronics","photography darkroom","film camera lot","camera equipment","stereo hifi"].map(k=>(
              <span key={k} className="tag es-tag" onClick={()=>setKeywords(k)}>{k}</span>
            ))}
          </div>
        </div>
        <div>
          <label>Search near</label>
          <div className="city-grid">
            {WEST_COAST_CITIES.map(c=>(
              <button key={c.label} className={"pill"+(city.label===c.label?" on":"")} onClick={()=>setCity(c)}>{c.label}</button>
            ))}
          </div>
        </div>
        <div>
          <div className="distance-row">
            <span className="distance-label">Radius: <strong style={{color:"var(--accent)"}}>{miles} mi</strong></span>
            <input type="range" min="10" max="200" step="10" value={miles} onChange={e=>setMiles(parseInt(e.target.value))} style={{flex:1}}/>
          </div>
          <div style={{fontSize:10,color:"var(--muted)",marginTop:3}}>
            {miles <= 30 ? "Local only" : miles <= 75 ? "Day trip range" : miles <= 120 ? "Worth it for the right score" : "Long haul — needs serious upside"}
          </div>
        </div>
      </div>
      {error && <div className="err">&#9888; {error}</div>}
      {loading && <div className="loading"><div className="spin"/>&nbsp;{status || "Searching EstateSales.net..."}</div>}
      {!loading && !results.length && !error && (
        <div className="empty">
          <div className="ei">&#127968;</div>
          <div className="et">Hunt estate sales</div>
          <div className="es">Claude searches EstateSales.net in real time. Pick a city, set your radius, hit Search. Results matched against your projects and donors.</div>
        </div>
      )}
      {results.length > 0 && (
        <>
          <div style={{fontSize:11,color:"var(--muted)",marginBottom:9}}>{results.length} sale{results.length!==1?"s":""} found near {city.label}</div>
          <div className="grid">
            {results.map((sale, i) => {
              const titleLow = ((sale.title||"") + " " + (sale.description||"")).toLowerCase();
              const matchingProjects = projects.filter(p => p.status !== "Complete" && titleLow.includes(p.model.toLowerCase().split(" ").slice(0,2).join(" ")));
              const matchingDonors = donors.filter(d => d.status !== "Fully Harvested" && titleLow.includes(d.model.toLowerCase().split(" ").slice(0,2).join(" ")));
              const signals = sale.signalWords || [];
              const isHit = signals.length > 0;
              return (
                <div key={i} className={"es-sale"+(isHit?" hit":"")}>
                  <div className="es-sale-img"><span>&#127968;</span></div>
                  <div className="es-sale-body">
                    <div className="es-title">{sale.title}</div>
                    <div className="es-meta">
                      {sale.location && <span>&#128205; {sale.location}</span>}
                      {sale.dates && <span style={{marginLeft:8}}>&#128197; {sale.dates}</span>}
                      {sale.company && <div style={{marginTop:2,color:"var(--muted)"}}>by {sale.company}</div>}
                    </div>
                    {sale.description && <div style={{fontSize:10,color:"var(--muted)",lineHeight:1.5,marginBottom:5}}>{sale.description.slice(0,140)}{sale.description.length>140?"...":""}</div>}
                    {signals.length > 0 && (
                      <div className="es-signals">
                        {signals.slice(0,5).map(s=><span key={s} className="bdg bdg-es">&#10003; {s}</span>)}
                      </div>
                    )}
                    {matchingProjects.length > 0 && <div className="ma pro">&#128295; May have parts for your {matchingProjects.map(p=>p.model).join(", ")} project</div>}
                    {matchingDonors.length > 0 && <div className="ma don">&#10003; You have a {matchingDonors.map(d=>d.model).join(", ")} donor already</div>}
                    {isHit && !matchingProjects.length && !matchingDonors.length && <div className="ma est">&#128247; Camera/gear signals detected</div>}
                    <div className="ca" style={{marginTop:8}}>
                      {sale.url && <a href={sale.url} target="_blank" rel="noopener noreferrer">View sale &#8594;</a>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {hasMore && (
            <div style={{textAlign:"center",marginTop:12}}>
              <button className="btn bs" onClick={loadMore} disabled={loading}>{loading?"Loading...":"Load more"}</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Deal Finder ────────────────────────────────────────────────────────────────
function DealFinder({ apiKey, projects, donors, onNegotiate }) {
  const [query, setQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minMargin, setMinMargin] = useState("25");
  const [condition, setCondition] = useState("Any");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [alerts, setAlerts] = useState([]);
  const [isDemo, setIsDemo] = useState(false);
  const [blacklist, setBlacklist] = useState([]);
  const [blInput, setBlInput] = useState("");
  const [showBl, setShowBl] = useState(false);

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(""); setIsDemo(false);
    if (!apiKey) {
      setIsDemo(true);
      await new Promise(r => setTimeout(r, 700));
      setResults(MOCK_DEALS.filter(item => {
        const p = parseFloat(item.price.value);
        const m = marginPct(p, item.marketPrice);
        return (!maxPrice || p <= parseFloat(maxPrice))
          && (!m || m >= parseInt(minMargin || 0))
          && (condition === "Any" || item.condition === condition)
          && !blacklist.some(b => item.title.toLowerCase().includes(b.toLowerCase()));
      }));
    } else {
      try {
        const params = new URLSearchParams({ q: query + (condition !== "Any" ? " " + condition : ""), limit: 24 });
        const res = await fetch(`https://api.ebay.com/buy/browse/v1/item_summary/search?${params}`, {
          headers:{ Authorization:`Bearer ${apiKey}`, "Content-Type":"application/json", "X-EBAY-C-MARKETPLACE-ID":"EBAY_US" }
        });
        if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.errors?.[0]?.message || `eBay error ${res.status}`); }
        const data = await res.json();
        setResults((data.itemSummaries||[]).filter(i => !blacklist.some(b => i.title?.toLowerCase().includes(b.toLowerCase()))));
      } catch(e) { setError(e.message); }
    }
    setLoading(false);
  };

  const addAlert = () => { if (!query.trim()) return; setAlerts(prev => [{ id:Date.now(), query, maxPrice:maxPrice||"any", minMargin:minMargin+"%", condition, created:new Date().toLocaleDateString() }, ...prev]); };
  const addBl    = () => { if (!blInput.trim()) return; setBlacklist(prev => [...prev, blInput.trim()]); setBlInput(""); };

  return (
    <div className="panel">
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14,flexWrap:"wrap",gap:7}}>
        <div><div className="pt">Deal <span>Finder</span></div><div className="ps">Surface underpriced gear — scored for margin, risk, and your project database</div></div>
        <button className="pill" onClick={() => setShowBl(s=>!s)}>⊘ Blacklist ({blacklist.length})</button>
      </div>

      {showBl && (
        <div className="box">
          <div className="sl">Model Blacklist — suppressed from all results</div>
          <div className="row"><div className="f"><input value={blInput} onChange={e=>setBlInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addBl()} placeholder="e.g. Kodak, Argus…" /></div><button className="btn bs" onClick={addBl}>Add</button></div>
          <div className="tr">{blacklist.map(b=><span key={b} className="tag" onClick={()=>setBlacklist(p=>p.filter(x=>x!==b))} title="Click to remove">{b} ✕</span>)}{!blacklist.length&&<span style={{fontSize:11,color:"var(--muted)"}}>None</span>}</div>
        </div>
      )}

      {isDemo && <div className="demo">⚡ Demo mode — sample deals. Add eBay API key for live results.</div>}
      {error  && <div className="err">⚠ {error}</div>}

      <div className="box">
        <div className="row">
          <div className="f" style={{flex:2}}><label>Search</label><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&search()} placeholder="e.g. Canon AE-1, Helios 44-2, camera lot…" /></div>
          <div className="f"><label>Condition</label><select value={condition} onChange={e=>setCondition(e.target.value)}><option>Any</option><option>Used</option><option>For parts or not working</option><option>Untested lot</option></select></div>
        </div>
        <div className="row">
          <div className="f"><label>Max Price ($)</label><input value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} placeholder="e.g. 150" type="number" /></div>
          <div className="f"><label>Min Margin (%)</label><input value={minMargin} onChange={e=>setMinMargin(e.target.value)} placeholder="25" type="number" /></div>
          <div style={{display:"flex",gap:5,alignItems:"flex-end",flexWrap:"wrap"}}>
            <button className="btn bp" onClick={search} disabled={loading}>{loading?"Scanning…":"Search"}</button>
            <button className="btn bs" onClick={addAlert}>+ Alert</button>
          </div>
        </div>
        <div>
          <div className="sl">Quick searches</div>
          {[["Lenses","lenses",""],["Cameras","cameras",""],["Gear","gear",""],["⚡ Untested Lots","lots","lot"]].map(([lbl,key,tc])=>(
            <div key={key} style={{marginBottom:5}}>
              <div style={{fontSize:10,color:key==="lots"?"var(--accent2)":"var(--muted)",marginBottom:2}}>{lbl}</div>
              <div className="tr">{POPULAR_SEARCHES[key].slice(0,5).map(l=><span key={l} className={`tag ${tc}`} onClick={()=>{setQuery(l);if(key==="lots")setCondition("For parts or not working");}}>{l}</span>)}</div>
            </div>
          ))}
        </div>
      </div>

      {alerts.length > 0 && (
        <div style={{marginBottom:14}}>
          <div className="sl">Saved Alerts ({alerts.length})</div>
          {alerts.map(a=>(
            <div key={a.id} className="ar">
              <div><span style={{color:"var(--text)"}}>{a.query}</span><div style={{fontSize:10,color:"var(--muted)"}}>max ${a.maxPrice} · {a.minMargin} margin · {a.condition} · {a.created}</div></div>
              <div style={{display:"flex",gap:4}}><button className="pill" onClick={()=>{setQuery(a.query);setCondition(a.condition);search();}}>Run</button><button className="pill d" onClick={()=>setAlerts(p=>p.filter(x=>x.id!==a.id))}>✕</button></div>
            </div>
          ))}
        </div>
      )}

      {loading && <div className="loading"><div className="spin"/>&nbsp;Scanning eBay listings…</div>}
      {!loading && !results.length && !error && <div className="empty"><div className="ei">⚡</div><div className="et">Ready to hunt</div><div className="es">Results are scored for margin and risk, and automatically matched against your projects and donor inventory.</div></div>}

      {!loading && results.length > 0 && (
        <>
          <div style={{fontSize:11,color:"var(--muted)",marginBottom:9}}>{results.length} listings{isDemo?" (demo)":""}</div>
          <div className="grid">
            {results.map(item => {
              const price = parseFloat(item.price?.value||0);
              const m = marginPct(price, item.marketPrice);
              const isDeal = m && m >= parseInt(minMargin||25);
              const risk = scoreRisk(item.title, item.description||"", projects, donors);
              const hasPM = risk.matchingProjects.length > 0;
              const hasDM = risk.matchingDonors.length > 0;
              return (
                <div key={item.itemId} className={`card${isDeal?" deal":""}${hasPM?" pm":hasDM?" dm":""}`}>
                  <div className="ph">📷</div>
                  <div className="cb">
                    <div className="ct">{item.title}</div>
                    <div className="cm">
                      <div>
                        <div className="price">${price.toFixed(2)}</div>
                        {item.marketPrice && <div className="po">~${item.marketPrice} market</div>}
                        {item.isLot && item.lotCount && <div className="pp">~${(price/item.lotCount).toFixed(2)}/item · {item.lotCount} items</div>}
                      </div>
                      <div style={{display:"flex",flexDirection:"column",gap:3,alignItems:"flex-end"}}>
                        {isDeal && <span className="bdg bdg-deal">↑ {m}% margin</span>}
                        {item.isLot && <span className="bdg bdg-hot">LOT</span>}
                        <RiskBadge label={risk.label}/>
                      </div>
                    </div>
                    {(risk.fired.length>0||risk.bonuses.length>0) && (
                      <div className="flags">
                        {risk.bonuses.slice(0,2).map(f=><span key={f.label} className="bdg bdg-lo">✓ {f.label}</span>)}
                        {risk.fired.filter(f=>f.weight>=5).slice(0,2).map(f=><span key={f.label} className="bdg bdg-hi">⚠ {f.label}</span>)}
                      </div>
                    )}
                    {risk.isProtectedBuy && <div className="protected-bar">⚡ Protected Buy — seller made functional claims.</div>}
                    {(risk.misrepFlags||[]).length > 0 && !risk.isProtectedBuy && <div className="misrep-bar">⚠ Possibly misrepresented — {risk.misrepFlags.slice(0,2).map(f=>f.label).join(", ")}</div>}
                    {risk.leverageScore >= 4 && (
                      <div className="leverage-bar">
                        💬 Negotiation leverage detected ({risk.leverageScore}/10)
                        <div className="lev-meter"><div className="lev-fill" style={{width:(risk.leverageScore*10)+"%"}}/></div>
                      </div>
                    )}
                    {hasPM && <div className="ma pro">🔧 Donor opportunity — matches your {risk.matchingProjects.map(p=>p.model).join(", ")} project{risk.matchingProjects.length>1?"s":""}</div>}
                    {hasDM && <div className="ma don">✓ You have a {risk.matchingDonors.map(d=>d.model).join(", ")} donor — you may already have the fix</div>}
                    <div className="ca">
                      <a href={item.itemWebUrl||"#"} target="_blank" rel="noopener noreferrer">View listing →</a>
                      {risk.leverageScore >= 3 && <button onClick={()=>onNegotiate(item, risk)}>💬 Negotiate</button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ── Projects & Donors ──────────────────────────────────────────────────────────
function ProjectsTab({ projects, setProjects, donors, setDonors, onGenerate }) {
  const [tab, setTab] = useState("projects");
  const [showAddP, setShowAddP] = useState(false);
  const [showAddD, setShowAddD] = useState(false);
  const [pForm, setPForm] = useState({ model:"", repairType:"Functional", status:"Needs Donor", notes:"", costBasis:"", repairCost:"0" });
  const [dForm, setDForm] = useState({ model:"", status:"Intact", notes:"" });
  const [filter, setFilter] = useState("All");
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");
  const [importResult, setImportResult] = useState(null);

  const exportData = () => {
    const allData = { projects, donors, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "gearstack-backup.json"; a.click();
    URL.revokeObjectURL(url);
  };

  const runImport = () => {
    try {
      const parsed = JSON.parse(importText.trim());
      const newProjects = [...projects];
      const newDonors = [...donors];
      let addedP = 0, addedD = 0;
      const processItem = (item) => {
        if (item.type === "project" || item.repairType || PROJECT_STATUSES.includes(item.status)) {
          newProjects.unshift({ id:"p"+Date.now()+Math.random(), model:item.model||"Unknown", repairType:item.repairType||"Functional", status:item.status||"Needs Donor", notes:item.notes||"", costBasis:parseFloat(item.costBasis)||0, repairCost:parseFloat(item.repairCost)||0, dateAdded:item.dateAdded||new Date().toISOString().split("T")[0] }); addedP++;
        } else if (item.type === "donor" || DONOR_STATUSES.includes(item.status)) {
          newDonors.unshift({ id:"d"+Date.now()+Math.random(), model:item.model||"Unknown", status:item.status||"Intact", notes:item.notes||"", dateAdded:item.dateAdded||new Date().toISOString().split("T")[0] }); addedD++;
        }
      };
      if (Array.isArray(parsed)) { parsed.forEach(processItem); }
      else if (parsed.projects || parsed.donors) {
        (parsed.projects||[]).forEach(p => { newProjects.unshift({...p, id:"p"+Date.now()+Math.random()}); addedP++; });
        (parsed.donors||[]).forEach(d => { newDonors.unshift({...d, id:"d"+Date.now()+Math.random()}); addedD++; });
      }
      setProjects(newProjects); storageSet("projects", newProjects);
      setDonors(newDonors); storageSet("donors", newDonors);
      setImportResult({ success:true, addedP, addedD });
      setImportText("");
    } catch(e) { setImportResult({ success:false, error:e.message }); }
  };

  const saveProject = () => {
    if (!pForm.model.trim()) return;
    const p = { id:"p"+Date.now(), ...pForm, costBasis:parseFloat(pForm.costBasis)||0, repairCost:parseFloat(pForm.repairCost)||0, dateAdded:new Date().toISOString().split("T")[0] };
    const u = [p,...projects]; setProjects(u); storageSet("projects",u);
    setPForm({ model:"", repairType:"Functional", status:"Needs Donor", notes:"", costBasis:"", repairCost:"0" }); setShowAddP(false);
  };
  const saveDonor = () => {
    if (!dForm.model.trim()) return;
    const d = { id:"d"+Date.now(), ...dForm, dateAdded:new Date().toISOString().split("T")[0] };
    const u = [d,...donors]; setDonors(u); storageSet("donors",u);
    setDForm({ model:"", status:"Intact", notes:"" }); setShowAddD(false);
  };
  const updP = (id,c) => { const u=projects.map(p=>p.id===id?{...p,...c}:p); setProjects(u); storageSet("projects",u); };
  const updD = (id,c) => { const u=donors.map(d=>d.id===id?{...d,...c}:d); setDonors(u); storageSet("donors",u); };
  const delP = id => { const u=projects.filter(p=>p.id!==id); setProjects(u); storageSet("projects",u); };
  const delD = id => { const u=donors.filter(d=>d.id!==id); setDonors(u); storageSet("donors",u); };
  const filtered = filter==="All" ? projects : projects.filter(p=>p.status===filter);

  return (
    <div className="panel">
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14,gap:7,flexWrap:"wrap"}}>
        <div><div className="pt">Projects <span>&</span> Donors</div><div className="ps">Stalled repairs, parts inventory, and donor matching</div></div>
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
          <button className="btn bs" onClick={()=>setShowImport(s=>!s)}>⬇ Import</button>
          <button className="btn bs" onClick={exportData}>⬆ Export</button>
          <button className="btn bp" onClick={()=>tab==="projects"?setShowAddP(s=>!s):setShowAddD(s=>!s)}>+ Add {tab==="projects"?"Project":"Donor"}</button>
        </div>
      </div>

      {showImport && (
        <div className="box" style={{marginBottom:12}}>
          <div className="sl">Import Data</div>
          <div className="f"><label>JSON Data</label><textarea value={importText} onChange={e=>setImportText(e.target.value)} placeholder={`{"type":"project","model":"Minolta XD-11","repairType":"Functional","status":"Needs Donor","costBasis":10}`} style={{minHeight:100,fontSize:11}} /></div>
          {importResult && <div style={{fontSize:11,padding:"7px 9px",borderRadius:4,background:importResult.success?"rgba(71,255,178,.07)":"rgba(255,71,87,.07)",border:`1px solid ${importResult.success?"rgba(71,255,178,.2)":"rgba(255,71,87,.2)"}`,color:importResult.success?"var(--success)":"var(--danger)"}}>{importResult.success?`✓ Imported ${importResult.addedP} project(s) and ${importResult.addedD} donor(s)`:`✗ ${importResult.error}`}</div>}
          <div className="row" style={{justifyContent:"flex-end"}}><button className="btn bs" onClick={()=>{setShowImport(false);setImportResult(null);setImportText("");}}>Cancel</button><button className="btn bp" onClick={runImport} disabled={!importText.trim()}>Import</button></div>
        </div>
      )}

      <div className="itabs">
        <button className={`itb${tab==="projects"?" on":""}`} onClick={()=>setTab("projects")}>🔧 Projects ({projects.filter(p=>p.status!=="Complete").length} active)</button>
        <button className={`itb${tab==="donors"?" on":""}`}   onClick={()=>setTab("donors")}>🗄 Donors ({donors.filter(d=>d.status!=="Fully Harvested").length} available)</button>
      </div>

      {tab==="projects" && <>
        {showAddP && (
          <div className="box">
            <div className="sl">New Project</div>
            <div className="tc">
              <div className="f"><label>Model</label><input value={pForm.model} onChange={e=>setPForm(f=>({...f,model:e.target.value}))} placeholder="e.g. Pentax K1000" /></div>
              <div className="f"><label>Repair Type</label><select value={pForm.repairType} onChange={e=>setPForm(f=>({...f,repairType:e.target.value}))}>{REPAIR_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
              <div className="f"><label>Status</label><select value={pForm.status} onChange={e=>setPForm(f=>({...f,status:e.target.value}))}>{PROJECT_STATUSES.slice(0,4).map(t=><option key={t}>{t}</option>)}</select></div>
              <div className="f"><label>Cost Basis ($)</label><input value={pForm.costBasis} onChange={e=>setPForm(f=>({...f,costBasis:e.target.value}))} type="number" placeholder="0.00" /></div>
            </div>
            <div className="f"><label>Notes</label><textarea value={pForm.notes} onChange={e=>setPForm(f=>({...f,notes:e.target.value}))} /></div>
            <div className="row" style={{justifyContent:"flex-end"}}><button className="btn bs" onClick={()=>setShowAddP(false)}>Cancel</button><button className="btn bp" onClick={saveProject}>Save</button></div>
          </div>
        )}
        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:11}}>
          {["All",...PROJECT_STATUSES].map(s=><button key={s} className={`pill${filter===s?" on":""}`} onClick={()=>setFilter(s)}>{s}</button>)}
        </div>
        {!filtered.length && <div className="empty"><div className="ei">🔧</div><div className="et">No projects</div><div className="es">Log stalled repairs. Deal Finder will flag matching donors in search results automatically.</div></div>}
        {filtered.map(p=>(
          <div key={p.id} className={`pc${p.status==="Complete"?" done":""}`}>
            <div className="ph2">
              <div><div className="pm2">{p.model}</div><div style={{display:"flex",gap:4,marginTop:4,flexWrap:"wrap"}}><SBadge status={p.status}/><span className="bdg bdg-u">{p.repairType}</span></div></div>
              <div style={{display:"flex",gap:4}}>
                {p.status==="Ready to List"&&<button className="btn bsu" style={{fontSize:10,padding:"4px 9px"}} onClick={()=>onGenerate(p)}>Generate Listing</button>}
                <button className="btn bd" style={{fontSize:10,padding:"4px 7px"}} onClick={()=>delP(p.id)}>✕</button>
              </div>
            </div>
            <div className="pmeta">Added {p.dateAdded} · Cost ${p.costBasis||0} · Repair spend ${p.repairCost||0}</div>
            {p.notes&&<div className="pn">{p.notes}</div>}
            <div className="pact">{PROJECT_STATUSES.filter(s=>s!==p.status).map(s=><button key={s} className="pill" style={{fontSize:9}} onClick={()=>updP(p.id,{status:s})}>{s}</button>)}</div>
          </div>
        ))}
      </>}

      {tab==="donors" && <>
        {showAddD && (
          <div className="box">
            <div className="sl">New Donor</div>
            <div className="tc">
              <div className="f"><label>Model</label><input value={dForm.model} onChange={e=>setDForm(f=>({...f,model:e.target.value}))} placeholder="e.g. Pentax ME Super" /></div>
              <div className="f"><label>Status</label><select value={dForm.status} onChange={e=>setDForm(f=>({...f,status:e.target.value}))}>{DONOR_STATUSES.map(t=><option key={t}>{t}</option>)}</select></div>
            </div>
            <div className="f"><label>Notes</label><textarea value={dForm.notes} onChange={e=>setDForm(f=>({...f,notes:e.target.value}))} /></div>
            <div className="row" style={{justifyContent:"flex-end"}}><button className="btn bs" onClick={()=>setShowAddD(false)}>Cancel</button><button className="btn bp" onClick={saveDonor}>Save</button></div>
          </div>
        )}
        {!donors.length&&<div className="empty"><div className="ei">🗄</div><div className="et">No donors logged</div></div>}
        {donors.map(d=>(
          <div key={d.id} className={`pc${d.status==="Fully Harvested"?" done":""}`}>
            <div className="ph2">
              <div><div className="pm2">{d.model}</div><div style={{marginTop:4}}><SBadge status={d.status}/></div></div>
              <button className="btn bd" style={{fontSize:10,padding:"4px 7px"}} onClick={()=>delD(d.id)}>✕</button>
            </div>
            <div className="pmeta">Added {d.dateAdded}</div>
            {d.notes&&<div className="pn">{d.notes}</div>}
            <div className="pact">{DONOR_STATUSES.filter(s=>s!==d.status).map(s=><button key={s} className="pill" style={{fontSize:9}} onClick={()=>updD(d.id,{status:s})}>{s}</button>)}</div>
          </div>
        ))}
      </>}
    </div>
  );
}

// ── Listing Modal ──────────────────────────────────────────────────────────────
function ListingModal({ project, onClose }) {
  const [loading, setLoading] = useState(false);
  const [listing, setListing] = useState("");
  const [tone, setTone] = useState("Detailed");
  const [price, setPrice] = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true); setListing("");
    const result = await callClaude(`You are an expert camera reseller writing an eBay listing.\n\nModel: ${project.model}\nRepair type: ${project.repairType}\nWork done / notes: ${project.notes}\nCost basis: $${project.costBasis}\nRepair spend: $${project.repairCost}\nTarget price: ${price?"$"+price:"suggest based on market"}\nTone: ${tone}\n\nWrite:\n1. TITLE (80 chars max)\n2. CONDITION (one line)\n3. DESCRIPTION (make repair history a trust signal)\n4. SUGGESTED PRICE (with brief reasoning)\n\nBe honest and specific.`);
    setListing(result); setLoading(false);
  };
  useEffect(() => { generate(); }, []);
  const copy = () => { navigator.clipboard?.writeText(listing); setCopied(true); setTimeout(()=>setCopied(false),2000); };

  return (
    <div className="ov" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="mt">Generate Listing — {project.model}</div>
        <div className="row" style={{marginBottom:10}}>
          <div className="f"><label>Tone</label><select value={tone} onChange={e=>setTone(e.target.value)}><option>Detailed</option><option>Approachable</option></select></div>
          <div className="f"><label>Target Price ($)</label><input value={price} onChange={e=>setPrice(e.target.value)} placeholder="Leave blank to auto-suggest" type="number" /></div>
          <div style={{display:"flex",alignItems:"flex-end"}}><button className="btn bs" onClick={generate} disabled={loading}>Regenerate</button></div>
        </div>
        {loading && <div className="loading"><div className="spin"/>&nbsp;Claude is writing your listing…</div>}
        {listing && <div className="lo">{listing}</div>}
        <div className="mact">
          {listing && <button className="btn bp" onClick={copy}>{copied?"Copied!":"Copy Listing"}</button>}
          <button className="btn bs" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Serial Scanner ─────────────────────────────────────────────────────────────
function SerialScanner() {
  const [urls, setUrls] = useState("");
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  const run = async () => {
    setError(""); setResults([]);
    const list = urls.split("\n").map(u=>u.trim()).filter(Boolean);
    if (!list.length) { setError("Paste at least one image URL."); return; }
    setScanning(true);
    const out = [];
    for (let i=0; i<list.length; i++) {
      try { out.push({ url:list[i], index:i+1, ...(await scanImage(list[i])) }); }
      catch(e) { out.push({ url:list[i], index:i+1, found:false, serial:null, confidence:"low", conditionNotes:"Scan failed: "+e.message }); }
      setResults([...out]);
    }
    setScanning(false);
  };

  const cw = c => c==="high"?"100%":c==="medium"?"60%":"25%";
  const cc = c => c==="high"?"var(--success)":c==="medium"?"var(--accent)":"var(--danger)";

  return (
    <div className="panel">
      <div style={{marginBottom:14}}><div className="pt">Serial <span>Scanner</span></div><div className="ps">Claude vision identifies serials, models, condition, and donor components from listing photos</div></div>
      {error && <div className="err">⚠ {error}</div>}
      <div className="box">
        <div className="f"><label>Image URLs — one per line</label><textarea value={urls} onChange={e=>setUrls(e.target.value)} placeholder={"https://i.ebayimg.com/images/g/.../s-l500.jpg"} style={{minHeight:85}}/></div>
        <div className="row">
          <button className="btn bp" onClick={run} disabled={scanning}>{scanning?`Scanning image ${results.length+1}…`:"Scan Images"}</button>
          <button className="btn bs" onClick={()=>{setResults([]);setUrls("");setError("");}}>Clear</button>
        </div>
      </div>
      {!scanning && !results.length && <div className="empty"><div className="ei">🔍</div><div className="et">Paste image URLs to scan</div></div>}
      {results.map(r=>(
        <div key={r.index} className="sr">
          <div className="srh"><span style={{color:"var(--muted)"}}>Image {r.index}</span><span style={{color:r.found?"var(--success)":"var(--muted)"}}>{r.found?"✓ Serial found":"✗ No serial"}</span></div>
          <div className="srb">
            <img className="sth" src={r.url} alt="" onError={e=>{e.target.style.display="none";}}/>
            <div className="si">
              {r.found&&<><div style={{fontSize:10,color:"var(--muted)"}}>Serial</div><div className="sser">{r.serial}</div>{r.location&&<div style={{fontSize:10,color:"var(--muted)"}}>On: {r.location}</div>}</>}
              {r.modelVisible&&<div style={{fontSize:11,color:"var(--info)",marginTop:4}}>Model: {r.modelVisible}</div>}
              {r.conditionNotes&&<div className="sn">{r.conditionNotes}</div>}
              {r.donorPotential&&<div style={{fontSize:10,color:"var(--accent2)",marginTop:3}}>🔧 Donor: {r.donorPotential}</div>}
              <div style={{fontSize:10,color:"var(--muted)",marginTop:4}}>Confidence: {r.confidence}</div>
              <div className="cb2"><div className="cf" style={{width:cw(r.confidence),background:cc(r.confidence)}}/></div>
            </div>
          </div>
        </div>
      ))}
      {scanning && <div className="loading"><div className="spin"/>&nbsp;Analyzing image {results.length+1} with Claude vision…</div>}
    </div>
  );
}

// ── Price Analyzer ─────────────────────────────────────────────────────────────
function PriceAnalyzer() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const analyze = async () => {
    if (!query.trim()) return;
    setLoading(true); setData(null);
    await new Promise(r=>setTimeout(r,650));
    setData({ avgSold:87.50, avgAsking:102.30, bestBuyBelow:55, targetSell:89, fastSellers:["Tested working","Glass is clean","Includes caps","Seals replaced","Recently CLA'd"], slowSellers:["For parts only","Fungus noted","No caps","Sticky shutter untested"] });
    setLoading(false);
  };

  return (
    <div className="panel">
      <div style={{marginBottom:14}}><div className="pt">Price <span>Analyzer</span></div><div className="ps">Know what to pay and what to charge</div></div>
      <div className="demo">⚡ Demo mode — live sold-price data requires eBay API key</div>
      <div className="box">
        <div className="row">
          <div className="f" style={{flex:1}}><label>Camera / Lens / Gear</label><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>e.key==="Enter"&&analyze()} placeholder="e.g. Canon AE-1, Helios 44-2…"/></div>
          <div style={{display:"flex",alignItems:"flex-end"}}><button className="btn bp" onClick={analyze} disabled={loading}>{loading?"Analyzing…":"Analyze"}</button></div>
        </div>
      </div>
      {loading && <div className="loading"><div className="spin"/>&nbsp;Pulling market data…</div>}
      {data && <>
        <div className="sg">
          {[["Avg Sold Price","$"+data.avgSold,"last 90 days","var(--accent)"],["Avg Asking","$"+data.avgAsking,"current listings","var(--muted)"],["Buy Below","$"+data.bestBuyBelow,"for 30%+ margin","var(--accent2)"],["Target List At","$"+data.targetSell,"fast-sell price","var(--success)"]].map(([l,v,s,c])=>(
            <div key={l} className="sc"><div className="slb">{l}</div><div className="sv" style={{color:c}}>{v}</div><div className="ss">{s}</div></div>
          ))}
        </div>
        <div className="tc">
          <div className="box"><div className="sl" style={{color:"var(--success)"}}>Fast-sell signals</div>{data.fastSellers.map(k=><div key={k} style={{fontSize:11,padding:"3px 0",borderBottom:"1px solid var(--border)",color:"var(--text)"}}>✓ {k}</div>)}</div>
          <div className="box"><div className="sl" style={{color:"var(--danger)"}}>Slow-sell signals</div>{data.slowSellers.map(k=><div key={k} style={{fontSize:11,padding:"3px 0",borderBottom:"1px solid var(--border)",color:"var(--muted)"}}>✗ {k}</div>)}</div>
        </div>
      </>}
      {!loading && !data && <div className="empty"><div className="ei">📊</div><div className="et">Market intelligence</div></div>}
    </div>
  );
}

// ── P&L Tracker ───────────────────────────────────────────────────────────────
function PnL() {
  const [sales, setSales] = useState([]);
  const [form, setForm] = useState({ model:"", buyPrice:"", sellPrice:"", repairCost:"0", category:"Camera", date:new Date().toISOString().split("T")[0] });

  useEffect(()=>{ storageGet("sales").then(d=>d&&setSales(d)); },[]);

  const add = () => {
    if (!form.model||!form.buyPrice||!form.sellPrice) return;
    const buy=parseFloat(form.buyPrice), sell=parseFloat(form.sellPrice), rep=parseFloat(form.repairCost||0);
    const profit=sell-buy-rep, margin=Math.round((profit/sell)*100);
    const u=[{ id:"s"+Date.now(), ...form, buy, sell, rep, profit, margin },...sales];
    setSales(u); storageSet("sales",u);
    setForm(f=>({...f,model:"",buyPrice:"",sellPrice:"",repairCost:"0"}));
  };
  const del = id=>{ const u=sales.filter(s=>s.id!==id); setSales(u); storageSet("sales",u); };

  const rev  = sales.reduce((s,x)=>s+x.sell,0);
  const prof = sales.reduce((s,x)=>s+x.profit,0);
  const avgM = sales.length ? Math.round(sales.reduce((s,x)=>s+x.margin,0)/sales.length) : 0;
  const best = sales.length ? sales.reduce((a,b)=>a.profit>b.profit?a:b) : null;

  return (
    <div className="panel">
      <div style={{marginBottom:14}}><div className="pt">P<span>&</span>L Tracker</div><div className="ps">Log every sale — track what's actually making money</div></div>
      {sales.length>0 && (
        <div className="sg">
          {[["Total Revenue","$"+rev.toFixed(2),sales.length+" sales","var(--text)"],["Total Profit","$"+prof.toFixed(2),"after all costs","var(--success)"],["Avg Margin",avgM+"%","per sale","var(--accent)"],["Best Sale",best?"$"+best.profit.toFixed(2):"—",best?.model||"","var(--accent2)"]].map(([l,v,s,c])=>(
            <div key={l} className="sc"><div className="slb">{l}</div><div className="sv" style={{color:c}}>{v}</div><div className="ss">{s}</div></div>
          ))}
        </div>
      )}
      <div className="box">
        <div className="sl">Log a Sale</div>
        <div className="tc">
          <div className="f"><label>Model</label><input value={form.model} onChange={e=>setForm(f=>({...f,model:e.target.value}))} placeholder="e.g. Canon AE-1"/></div>
          <div className="f"><label>Category</label><select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}><option>Camera</option><option>Lens</option><option>Gear</option><option>Lot</option><option>Donor Parts</option></select></div>
          <div className="f"><label>Buy Price ($)</label><input value={form.buyPrice} onChange={e=>setForm(f=>({...f,buyPrice:e.target.value}))} type="number" placeholder="0.00"/></div>
          <div className="f"><label>Sell Price ($)</label><input value={form.sellPrice} onChange={e=>setForm(f=>({...f,sellPrice:e.target.value}))} type="number" placeholder="0.00"/></div>
          <div className="f"><label>Repair Cost ($)</label><input value={form.repairCost} onChange={e=>setForm(f=>({...f,repairCost:e.target.value}))} type="number" placeholder="0.00"/></div>
          <div className="f"><label>Date Sold</label><input value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} type="date"/></div>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end"}}><button className="btn bp" onClick={add}>Log Sale</button></div>
      </div>
      {!sales.length && <div className="empty"><div className="ei">💰</div><div className="et">No sales logged</div></div>}
      {sales.map(s=>(
        <div key={s.id} className="plrow">
          <div>
            <div style={{fontFamily:"Syne,sans-serif",fontWeight:600,fontSize:13}}>{s.model}</div>
            <div style={{fontSize:10,color:"var(--muted)"}}>{s.category} · {s.date} · bought ${s.buy.toFixed(2)} · sold ${s.sell.toFixed(2)}{s.rep>0?` · repair $${s.rep.toFixed(2)}`:""}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <div style={{fontFamily:"Syne,sans-serif",fontWeight:700,fontSize:14,color:s.profit>=0?"var(--success)":"var(--danger)"}}>{s.profit>=0?"+":""}${s.profit.toFixed(2)}</div>
            <span className="bdg bdg-deal">{s.margin}%</span>
            <button className="btn bd" style={{fontSize:10,padding:"3px 6px"}} onClick={()=>del(s.id)}>✕</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Root ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab]       = useState("deals");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [projects, setProjects] = useState(MOCK_PROJECTS);
  const [donors,   setDonors]   = useState(MOCK_DONORS);
  const [listingProject, setListingProject] = useState(null);
  const [negotiateItem, setNegotiateItem] = useState(null);
  const [negotiateRisk, setNegotiateRisk] = useState(null);
  const openNegotiate = (item, risk) => { setNegotiateItem(item); setNegotiateRisk(risk); };

  useEffect(()=>{
    storageGet("projects").then(d=>d&&setProjects(d));
    storageGet("donors").then(d=>d&&setDonors(d));
  },[]);

  const ks = apiKey.length > 20 ? "g" : apiKey.length > 0 ? "y" : null;

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <div className="hdr">
          <div className="hdr-top">
            <div><div className="mark">GEAR<span>STACK</span></div><div className="sub">Camera reseller intelligence suite</div></div>
            <div style={{display:"flex",gap:7,alignItems:"center",flexWrap:"wrap",marginTop:6}}>
              {ks && <div style={{fontSize:11,color:ks==="g"?"var(--success)":"var(--accent)",display:"flex",alignItems:"center",gap:5}}><span className={`dot ${ks}`}/>{ks==="g"?"eBay connected":"Key too short"}</div>}

            </div>
          </div>
          <div className="api-row">
            <input className="api-in" type={showKey?"text":"password"} value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="eBay API key (optional — demo mode works without it)"/>
            <button className="pill" onClick={()=>setShowKey(s=>!s)}>{showKey?"Hide":"Show"}</button>
            {apiKey && <button className="pill d" onClick={()=>setApiKey("")}>Clear</button>}
          </div>

        </div>

        <div className="tabs">
          {TABS.map(t=>(
            <button key={t.id} className={`tb${tab===t.id?" on":""}`} onClick={()=>setTab(t.id)}>
              <span style={{marginRight:5}}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {tab==="deals"    && <DealFinder apiKey={apiKey} projects={projects} donors={donors} onNegotiate={openNegotiate}/>}
        {tab==="estate"   && <EstateSalesTab projects={projects} donors={donors}/>}
        {tab==="projects" && <ProjectsTab projects={projects} setProjects={setProjects} donors={donors} setDonors={setDonors} onGenerate={setListingProject}/>}
        {tab==="scanner"  && <SerialScanner/>}
        {tab==="prices"   && <PriceAnalyzer/>}
        {tab==="pnl"      && <PnL/>}

        {listingProject && <ListingModal project={listingProject} onClose={()=>setListingProject(null)}/>}
        {negotiateItem && <NegotiateModal item={negotiateItem} risk={negotiateRisk} onClose={()=>{setNegotiateItem(null);setNegotiateRisk(null);}}/>}
      </div>
    </>
  );
}
