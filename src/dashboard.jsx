import { useState, useRef, useEffect } from "react";
import { apiFetch, useSession } from "@kato8/core/react";
import { TEAM, STUDIO, toolUrl } from "@kato8/core";

const HUB_URL = toolUrl("hub", (name) => import.meta.env[name]);
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// KATO.8 BRAND THEME
// ─────────────────────────────────────────────────────────────────────────────
const K8 = {
  dark:        "#12102A",
  card:        "#1C1938",
  surface:     "#252246",
  border:      "#3A3660",
  borderLight: "#4A4580",
  purple:      "#8B7EC8",
  purpleLight: "#A99FD8",
  pink:        "#E0607A",
  pinkLight:   "#F08098",
  coral:       "#E87055",
  white:       "#F0EEFF",
  muted:       "#7A75A0",
  mutedLight:  "#9D98C0",
};

// ─────────────────────────────────────────────────────────────────────────────
// PLATFORM CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const PLATFORMS = [
  { id: "instagram", label: "Instagram",  color: "#E1306C", icon: "📸" },
  { id: "tiktok",   label: "TikTok",     color: "#ff0050", icon: "🎵" },
  { id: "youtube",  label: "YouTube",    color: "#FF0000", icon: "▶️" },
  { id: "twitter",  label: "X / Twitter",color: "#1DA1F2", icon: "𝕏"  },
  { id: "bluesky",  label: "Bluesky",    color: "#0085ff", icon: "🦋" },
  { id: "linkedin", label: "LinkedIn",   color: "#0A66C2", icon: "💼" },
];

// People come from the shared demo studio so every Kato.8 tool agrees on who is on the team.
const TEAM_MEMBERS = ["ceo", "ux-003", "exec-001", "des-001", "des-005", "art-001"].map((id) => TEAM.find((m) => m.id === id)?.name).filter(Boolean);

// ─────────────────────────────────────────────────────────────────────────────
// SEED DATA
// ─────────────────────────────────────────────────────────────────────────────
// Shown only when a platform is not connected. All values are fictional sample data and are labelled as such in the UI.
const DUMMY = {
  instagram: { followers:12480, growth:2.8,  impressions:184000, engagement:4.6, reach:96500,  clicks:2310 },
  tiktok:    { followers:8730,  growth:6.4,  impressions:402000, engagement:8.9, reach:258000, clicks:5120 },
  youtube:   { followers:5190,  growth:1.9,  impressions:91000,  engagement:5.7, reach:61000,  clicks:1480 },
  twitter:   { followers:3340,  growth:-0.6, impressions:47500,  engagement:2.2, reach:29800,  clicks:760  },
  bluesky:   { followers:1870,  growth:3.3,  impressions:12900,  engagement:6.1, reach:8800,   clicks:190  },
  linkedin:  { followers:940,   growth:1.1,  impressions:15200,  engagement:3.8, reach:11700,  clicks:420  },
};
const WEEKLY = [
  { day:"Mon", instagram:5200, tiktok:9100,  youtube:2400, twitter:1300, bluesky:380, linkedin:420 },
  { day:"Tue", instagram:5800, tiktok:10400, youtube:2700, twitter:1500, bluesky:410, linkedin:510 },
  { day:"Wed", instagram:4900, tiktok:8800,  youtube:2300, twitter:1200, bluesky:350, linkedin:480 },
  { day:"Thu", instagram:6300, tiktok:11800, youtube:3100, twitter:1700, bluesky:470, linkedin:530 },
  { day:"Fri", instagram:7100, tiktok:13600, youtube:3500, twitter:1900, bluesky:520, linkedin:450 },
  { day:"Sat", instagram:8400, tiktok:16200, youtube:4100, twitter:2100, bluesky:590, linkedin:260 },
  { day:"Sun", instagram:7600, tiktok:14900, youtube:3800, twitter:1800, bluesky:540, linkedin:240 },
];
const SENTIMENT = [
  { name:"Positive", value:61, color:"#E0607A" },
  { name:"Neutral",  value:28, color:"#7A75A0" },
  { name:"Negative", value:11, color:"#E87055" },
];
const COMMENTS_DATA = [
  { id:1, platform:"tiktok",   user:"@retrowave_dev", text:"This is exactly the vibe I needed — love the pixel art style 🎮", sentiment:"positive", time:"2h", likes:87 },
  { id:2, platform:"tiktok",   user:"@indiegamefan",  text:"Backed it! What engine are you building on?",                    sentiment:"positive", time:"3h", likes:42 },
  { id:3, platform:"bluesky",  user:"studio.bsky",    text:"The retro aesthetic is so well done. Following for updates 🦋",  sentiment:"positive", time:"4h", likes:18 },
  { id:4, platform:"twitter",  user:"@kato8_demo", text:"When's the demo dropping? Been watching since day 1",            sentiment:"positive", time:"5h", likes:31 },
  { id:5, platform:"twitter",  user:"@pixelskeptic",  text:"Crowdfunding a game studio feels risky — what's the plan?",      sentiment:"negative", time:"6h", likes:9  },
  { id:6, platform:"youtube",  user:"@8bitreviewer",  text:"Audio mix on the studio tour is a bit low, but content is 🔥",   sentiment:"neutral",  time:"8h", likes:23 },
];
const MSGS_DATA = [
  { id:1, from:"Priya", time:"9:14 AM",  text:"Studio tour edit is ready for review 🎬",   unread:true  },
  { id:2, from:"You",   time:"9:22 AM",  text:"On it — will check before noon."                         },
  { id:3, from:"Priya", time:"9:24 AM",  text:"Should we push the LinkedIn post to next week?"          },
  { id:4, from:"You",   time:"9:31 AM",  text:"Good call. Move it to April 30th."                       },
  { id:5, from:"Priya", time:"10:02 AM", text:"Last Light devlog clip is cut and ready for TikTok 🚀", unread:true },
];

// ─────────────────────────────────────────────────────────────────────────────
// CMS SEED  (Topics — update when spreadsheet provided)
// ─────────────────────────────────────────────────────────────────────────────
const CMS_STATUSES = [
  { id:"needs_record", label:"Needs Recording", color:"#E87055", bg:"#2A1E18", border:"#5A3020", icon:"🎬" },
  { id:"editing",      label:"In Editing",      color:"#A99FD8", bg:"#1E1B38", border:"#4A4580", icon:"✂️" },
  { id:"needs_post",   label:"Ready to Post",   color:"#0085ff", bg:"#101E38", border:"#1A3A68", icon:"📤" },
  { id:"posted",       label:"Posted",          color:"#22c55e", bg:"#101E18", border:"#1A4028", icon:"✅" },
];
const CMS_SEED = [
  { id:1,  title:"Studio Origin Story — Why Retro?",       type:"Video",    status:"posted",      platforms:["tiktok","youtube"],              assignee:"Terry", due:"Nov 18", notes:"Strong views on TikTok",               tags:["founder","story"]         },
  { id:2,  title:"Game Dev Day in the Life",               type:"Video",    status:"posted",      platforms:["tiktok","instagram"],            assignee:"Terry", due:"Nov 20", notes:"Strong engagement",                 tags:["bts","devlog"]            },
  { id:3,  title:"Studio Tour — Behind the Pixel Curtain", type:"Video",    status:"editing",     platforms:["tiktok","youtube"],              assignee:"Priya", due:"Nov 25", notes:"Cut needs music + colour grade",    tags:["bts","studio"]            },
  { id:4,  title:"Corebound Character Reveal — The Enforcer", type:"Carousel", status:"needs_post",  platforms:["instagram","twitter","bluesky"],  assignee:"Marisol Q", due:"Dec 10", notes:"Art approved — caption finalised",    tags:["corebound","reveal"]      },
  { id:5,  title:"Retro Game Feature Showcase",            type:"Carousel", status:"needs_post",  platforms:["instagram","bluesky"],           assignee:"Priya", due:"Nov 24", notes:"Design done, caption finalised",    tags:["game","feature"]          },
  { id:6,  title:"Community Q&A — Ask the Dev",           type:"Thread",   status:"needs_post",  platforms:["twitter","bluesky"],             assignee:"Terry", due:"Nov 25", notes:"Draft approved",                    tags:["community","engagement"]  },
  { id:7,  title:"Gameplay Walkthrough Clip",              type:"Video",    status:"editing",     platforms:["youtube","tiktok"],              assignee:"Priya", due:"Nov 26", notes:"Waiting on voiceover",              tags:["gameplay","tutorial"]     },
  { id:8,  title:"Meet the Team — Priya",                  type:"Article",  status:"needs_record",platforms:["linkedin","instagram"],          assignee:"Terry", due:"Nov 28", notes:"Script approved, filming TBD",      tags:["team","culture"]          },
  { id:9,  title:"Last Light — Development Update Video",   type:"Video",    status:"needs_record",platforms:["youtube","tiktok"],              assignee:"Priya", due:"Dec 15", notes:"Outline ready, needs filming",      tags:["lastlight","devlog"]      },
  { id:10, title:"Retro vs Modern — Why It Matters",       type:"Carousel", status:"needs_record",platforms:["instagram","twitter","bluesky"], assignee:"Terry", due:"Dec 2",  notes:"Research done, design not started", tags:["retro","opinion"]         },
  { id:11, title:"Team Spotlight — Bexley C (Lead Artist)",  type:"Article",  status:"needs_record",platforms:["linkedin","instagram"],           assignee:"Terry", due:"Dec 17", notes:"Script in progress",                tags:["team","spotlight"]        },
  { id:12, title:"December Dev Sprint Teaser",             type:"Story",    status:"needs_record",platforms:["instagram","tiktok","bluesky"],  assignee:"Priya", due:"Nov 30", notes:"Not started",                       tags:["teaser","devlog"]         },
];

// ─────────────────────────────────────────────────────────────────────────────
// PROJECTS / PM SEED
// ─────────────────────────────────────────────────────────────────────────────
const TICKET_STATUSES = [
  { id:"backlog",     label:"Backlog",     color:"#7A75A0", bg:"#1C1938", border:"#3A3660" },
  { id:"todo",        label:"To Do",       color:"#A99FD8", bg:"#1E1B38", border:"#4A4580" },
  { id:"in_progress", label:"In Progress", color:"#0085ff", bg:"#101E38", border:"#1A3A68" },
  { id:"review",      label:"In Review",   color:"#E87055", bg:"#2A1E18", border:"#5A3020" },
  { id:"done",        label:"Done",        color:"#22c55e", bg:"#101E18", border:"#1A4028" },
];
const PRIORITY_LEVELS = [
  { id:"critical", label:"Critical", color:"#E0607A" },
  { id:"high",     label:"High",     color:"#E87055" },
  { id:"med",      label:"Medium",   color:"#E8B455" },
  { id:"low",      label:"Low",      color:"#7A75A0" },
];
const TICKETS_SEED = [
  { id:1, title:"Publish Last Light character reveal", description:"Coordinate and publish Last Light character reveal across TikTok, Instagram, and Twitter with matching caption set.", assignee:"Marisol Q", due:"2026-12-10", priority:"critical", platforms:["tiktok","instagram","twitter"], status:"todo", tags:["lastlight","reveal"] },
  { id:2, title:"Finish studio tour video edit",    description:"Complete colour grade, add music, export final cut.", assignee:"Priya",  due:"2026-11-24", priority:"high",     platforms:["tiktok","youtube"],     status:"in_progress", tags:["video","edit"]  },
  { id:3, title:"Reply to TikTok comments",         description:"Respond to all unanswered comments from the last 3 posts.", assignee:"Terry", due:"2026-11-25", priority:"med",      platforms:["tiktok"],               status:"todo",        tags:["community"]    },
  { id:4, title:"Write Bluesky Q&A thread",         description:"Draft a 10-post Q&A thread for Bluesky community engagement.", assignee:"Terry", due:"2026-11-25", priority:"med",      platforms:["bluesky"],              status:"todo",        tags:["community"]    },
  { id:5, title:"Upload gameplay clip to YouTube",  description:"Edit 60s clip from raw footage, add captions.", assignee:"Priya",  due:"2026-11-26", priority:"low",      platforms:["youtube","tiktok"],     status:"backlog",     tags:["gameplay"]     },
  { id:6, title:"Set up LinkedIn company page bio", description:"Write and publish official company bio with links.", assignee:"Terry", due:"2026-11-28", priority:"low",      platforms:["linkedin"],             status:"done",        tags:["setup"]        },
];
const SCHED_SEED = [
  { id:1, title:"Last Light devlog — week in the life",   platform:"tiktok",    date:"Dec 6",  time:"10:00 AM", status:"scheduled", type:"Video"    },
  { id:2, title:"Corebound character art showcase",       platform:"instagram", date:"Dec 7",  time:"12:30 PM", status:"scheduled", type:"Carousel" },
  { id:3, title:"Corebound dev diary — episode 1",        platform:"youtube",   date:"Dec 10", time:"2:00 PM",  status:"scheduled", type:"Video"    },
  { id:4, title:"Q&A thread: ask the dev",                platform:"bluesky",   date:"Dec 11", time:"9:00 AM",  status:"draft",     type:"Thread"   },
  { id:5, title:"Studio update — December sprint kickoff",     platform:"linkedin",  date:"Dec 12", time:"11:00 AM", status:"draft",     type:"Article"  },
  { id:6, title:"Big Boss Cleanup gameplay reveal",       platform:"youtube",   date:"Dec 15", time:"3:00 PM",  status:"review",    type:"Video"    },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
// Metrics a platform API does not provide arrive as null and render as an em dash, never as 0 or an estimate.
function fmt(n) { return n==null?"—":n>=1e6?(n/1e6).toFixed(1)+"M":n>=1000?(n/1000).toFixed(1)+"K":String(n); }
const pct = (n) => n==null?"—":`${n}%`;
const signedPct = (n) => n==null?"—":`${n>0?"+":""}${n}%`;
function getPl(id)   { return PLATFORMS.find(p=>p.id===id); }
function getSt(id)   { return CMS_STATUSES.find(s=>s.id===id); }
function getTkSt(id) { return TICKET_STATUSES.find(s=>s.id===id); }
function getPr(id)   { return PRIORITY_LEVELS.find(p=>p.id===id); }

function ScBadge({ status }) {
  const m = { scheduled:`bg-emerald-900/40 text-emerald-300 border-emerald-700`, draft:`bg-amber-900/40 text-amber-300 border-amber-700`, review:`bg-blue-900/40 text-blue-300 border-blue-700` };
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${m[status]||m.draft}`}>{status[0].toUpperCase()+status.slice(1)}</span>;
}

// Card wrapper using brand surface color
function Card({ children, className="" }) {
  return <div className={`rounded-xl border p-5 ${className}`} style={{background:K8.card,borderColor:K8.border}}>{children}</div>;
}

// ─────────────────────────────────────────────────────────────────────────────
// LIVE DATA HOOK
// ─────────────────────────────────────────────────────────────────────────────
function useLiveData() {
  const [liveData,  setLiveData]  = useState({});
  const [available, setAvailable] = useState({});
  useEffect(() => {
    PLATFORMS.filter(p=>!p.manual).forEach(p=>{
      apiFetch(`/api/${p.id}`)
        .then(r=>r.ok?r.json():null)
        .then(d=>{ if(d&&!d.error){ setLiveData(v=>({...v,[p.id]:d})); setAvailable(v=>({...v,[p.id]:true})); } })
        .catch(()=>{});
    });
  }, []);
  return { liveData, available };
}

// ─────────────────────────────────────────────────────────────────────────────
// AI AGENT
// ─────────────────────────────────────────────────────────────────────────────
const AGENT_SYSTEM = `You are Orbit AI, a specialist social media strategist and content agent for ${STUDIO.name} — an indie retro game studio run by ${STUDIO.founder}, developing three original titles: ${STUDIO.projects.join(", ")}.

The studio is active on TikTok, Instagram, YouTube, X/Twitter, Bluesky and LinkedIn. Content pillars: game dev devlogs, art showcases, behind-the-scenes studio life, community Q&As and release teasers.

Their goals: grow the TikTok and Bluesky followings, build hype for all three game titles, attract collaborators and players, and establish the studio as a credible indie voice.

When suggesting content:
1. Reference what's already working (high-engagement content types)
2. Identify trending formats in the indie game / retro gaming niche
3. Suggest specific, actionable ideas with: title, format, platforms, why it works, and a hook/caption
4. Tie content suggestions to the right game title and its tone when relevant

Format suggestions as:
**[Title]** | [Platform(s)] | [Format]
Hook: ...
Why it works: ...
Caption: ...`;

function AIAgent({ cmsItems }) {
  const [messages, setMessages] = useState([
    { role:"assistant", content:"Hey! I'm Orbit AI 👾 Ready to help Kato.8 Studios grow.\n\nI know your full content library and your platform stats. Ask me for ideas, trend analysis, or a full campaign sprint — what are we building today?" }
  ]);
  const [input, setInput]   = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:"smooth"}); },[messages,loading]);

  const existingContent = cmsItems.map(i=>`"${i.title}" (${i.type}, ${i.status}, platforms: ${i.platforms.join(",")})`).join("\n");

  async function send(overrideMsg) {
    const text = overrideMsg||input.trim(); if(!text) return;
    setInput("");
    const newMessages = [...messages,{role:"user",content:text}];
    setMessages(newMessages); setLoading(true);
    try {
      // The server chooses the model; the browser only sends the conversation.
      const res = await apiFetch("/api/ai",{ method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ max_tokens:1000,
          system:AGENT_SYSTEM+`\n\nContent library:\n${existingContent}`, messages:newMessages })});
      const data = await res.json();
      const reply = data.content?.find(b=>b.type==="text")?.text||"Sorry, something went wrong.";
      setMessages(m=>[...m,{role:"assistant",content:reply}]);
    } catch { setMessages(m=>[...m,{role:"assistant",content:"Connection error — please try again."}]); }
    setLoading(false);
  }

  const QUICK_PROMPTS = [
    "Suggest 3 TikTok ideas for a retro game studio that could go viral",
    "Build a reveal campaign for the Last Light character roster",
    "How do we double our TikTok followers faster?",
    "What retro gaming trends should Kato.8 be tapping into?",
    "Analyse our existing content and tell me what we should do more of",
    "Give me a 7-day sprint plan across TikTok, Bluesky and YouTube",
  ];

  function renderMessage(msg) {
    return msg.content.split("\n").map((line,i)=>{
      if(line.startsWith("**")&&line.includes("**")){const parts=line.split(/(\*\*[^*]+\*\*)/g);return<p key={i} className="mb-1">{parts.map((p,j)=>p.startsWith("**")?<strong key={j} style={{color:K8.pinkLight}}>{p.replace(/\*\*/g,"")}</strong>:<span key={j}>{p}</span>)}</p>;}
      if(line.startsWith("Hook:")||line.startsWith("Why it works:")||line.startsWith("Caption:")){const[label,...rest]=line.split(":");return<p key={i} className="mb-1"><span className="font-semibold" style={{color:K8.purple}}>{label}:</span>{rest.join(":")}</p>;}
      if(line.match(/^\d+\./))return<p key={i} className="mb-1 pl-2">{line}</p>;
      if(line==="")return<div key={i} className="h-2"/>;
      return<p key={i} className="mb-0.5">{line}</p>;
    });
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5 flex items-center gap-4" style={{background:`linear-gradient(135deg, ${K8.surface} 0%, #2A1E40 100%)`,border:`1px solid ${K8.border}`}}>
        <img src="/kato8-icon.png" alt="Orbit AI" className="w-12 h-12 rounded-xl object-cover" style={{imageRendering:"pixelated"}}/>
        <div className="flex-1">
          <p className="font-bold text-base" style={{color:K8.white}}>Orbit AI — Content Strategy Agent</p>
          <p className="text-xs mt-0.5" style={{color:K8.muted}}>Powered by Claude · Knows your content library · Suggests platform-specific ideas</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full px-3 py-1" style={{background:"#0D2A1A",border:"1px solid #1A5030"}}>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>
          <span className="text-xs font-medium text-emerald-400">Live</span>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{color:K8.muted}}>Quick Prompts</p>
        <div className="flex flex-wrap gap-2">
          {QUICK_PROMPTS.map((p,i)=>(
            <button key={i} onClick={()=>send(p)} disabled={loading}
              className="text-xs px-3 py-1.5 rounded-full transition-all disabled:opacity-40"
              style={{border:`1px solid ${K8.border}`,background:K8.surface,color:K8.mutedLight}}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{border:`1px solid ${K8.border}`}}>
        <div className="h-[420px] overflow-y-auto p-5 space-y-4" style={{background:K8.dark}}>
          {messages.map((msg,i)=>(
            <div key={i} className={`flex ${msg.role==="user"?"justify-end":"justify-start"}`}>
              {msg.role==="assistant"&&<div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-0.5 overflow-hidden" style={{background:K8.surface}}><img src="/kato8-icon.png" alt="" className="w-full h-full object-cover" style={{imageRendering:"pixelated"}}/></div>}
              <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed"
                style={msg.role==="user"?{background:K8.pink,color:"#fff",borderRadius:"16px 16px 4px 16px"}:{background:K8.card,border:`1px solid ${K8.border}`,color:K8.white,borderRadius:"4px 16px 16px 16px"}}>
                {msg.role==="assistant"?renderMessage(msg):msg.content}
              </div>
            </div>
          ))}
          {loading&&(
            <div className="flex justify-start">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center text-sm mr-2 flex-shrink-0 overflow-hidden" style={{background:K8.surface}}><img src="/kato8-icon.png" alt="" className="w-full h-full object-cover" style={{imageRendering:"pixelated"}}/></div>
              <div className="rounded-2xl px-4 py-3" style={{background:K8.card,border:`1px solid ${K8.border}`}}>
                <div className="flex gap-1 items-center h-5">{[0,150,300].map(d=><div key={d} className="w-2 h-2 rounded-full animate-bounce" style={{background:K8.purple,animationDelay:`${d}ms`}}/>)}</div>
              </div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>
        <div className="p-3 flex gap-2" style={{background:K8.card,borderTop:`1px solid ${K8.border}`}}>
          <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!loading&&send()}
            placeholder="Ask for content ideas, trend analysis, campaign strategy…" disabled={loading}
            className="flex-1 rounded-xl px-4 py-2.5 text-sm outline-none disabled:opacity-50"
            style={{background:K8.surface,border:`1px solid ${K8.border}`,color:K8.white}}/>
          <button onClick={()=>send()} disabled={loading||!input.trim()}
            className="px-5 py-2.5 text-xs font-semibold rounded-xl transition-opacity disabled:opacity-40"
            style={{background:K8.pink,color:"#fff"}}>Send</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────
function Analytics({ liveData, available }) {
  const [active, setActive] = useState("tiktok");
  const data   = liveData[active]||DUMMY[active];
  const isLive = available[active];
  const plat   = getPl(active);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map(p=>(
          <button key={p.id} onClick={()=>setActive(p.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border"
            style={active===p.id?{background:p.color,color:"#fff",borderColor:p.color}:{background:K8.surface,color:K8.mutedLight,borderColor:K8.border}}>
            {p.icon} {p.label}
            {available[p.id]&&<span className="w-1.5 h-1.5 rounded-full bg-emerald-400"/>}
          </button>
        ))}
      </div>

      {isLive
        ? <div className="rounded-xl p-4 flex items-center gap-3" style={{background:"#0D2A1A",border:"1px solid #1A5030"}}><span className="text-xl">{plat?.icon}</span><p className="text-sm text-emerald-400">Showing <strong>{data.source==="demo"?"demo data (fictional)":"live data"}</strong> for {plat?.label}.{data.source!=="demo"&&data.unavailable?.length>0&&<span style={{color:K8.muted}}> Not provided by the platform API: {data.unavailable.join(", ")} (shown as —).</span>}</p></div>
        : <div className="rounded-xl p-4 flex items-center gap-3" style={{background:K8.surface,border:`1px dashed ${K8.border}`}}><span className="text-xl">{plat?.icon}</span><p className="text-sm" style={{color:K8.muted}}>Showing <strong style={{color:K8.white}}>sample data</strong> for {plat?.label} — not connected. Add the API key to Vercel env vars to go live.</p></div>
      }

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[{l:"Followers",v:fmt(data.followers)},{l:"Growth",v:signedPct(data.growth),c:data.growth>0?"#22c55e":data.growth<0?"#E87055":K8.mutedLight},{l:"Impressions",v:fmt(data.impressions)},{l:"Eng. Rate",v:pct(data.engagement)},{l:"Reach",v:fmt(data.reach)},{l:"Clicks",v:fmt(data.clicks)}].map(k=>(
          <div key={k.l} className="rounded-xl p-4 border" style={{background:K8.card,borderColor:K8.border}}>
            <p className="text-xs font-medium uppercase tracking-wide mb-1" style={{color:K8.muted}}>{k.l}</p>
            <p className="text-xl font-bold" style={{color:k.c||K8.white}}>{k.v}</p>
          </div>
        ))}
      </div>
      <Card>
        <p className="text-sm font-semibold mb-4" style={{color:K8.white}}>Weekly Impressions — All Platforms (sample series)</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={WEEKLY}>
            <defs>{PLATFORMS.map(p=><linearGradient key={p.id} id={`g${p.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={p.color} stopOpacity={0.3}/><stop offset="95%" stopColor={p.color} stopOpacity={0}/></linearGradient>)}</defs>
            <XAxis dataKey="day" tick={{fontSize:11,fill:K8.muted}} axisLine={false} tickLine={false}/>
            <YAxis tick={{fontSize:11,fill:K8.muted}} axisLine={false} tickLine={false} tickFormatter={fmt}/>
            <Tooltip formatter={(v,n)=>[fmt(v),getPl(n)?.label||n]} contentStyle={{borderRadius:10,border:`1px solid ${K8.border}`,background:K8.card,color:K8.white,fontSize:12}}/>
            {PLATFORMS.map(p=><Area key={p.id} type="monotone" dataKey={p.id} stroke={p.color} fill={`url(#g${p.id})`} strokeWidth={active===p.id?2.5:1} strokeOpacity={active===p.id?1:0.35} dot={false}/>)}
          </AreaChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CMS
// ─────────────────────────────────────────────────────────────────────────────
function CMS() {
  const [items,   setItems]   = useState(CMS_SEED);
  const [view,    setView]    = useState("board");
  const [filter,  setFilter]  = useState("all");
  const [search,  setSearch]  = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({title:"",type:"Video",status:"needs_record",platforms:[],assignee:"",due:"",notes:"",tags:""});

  const filtered = items.filter(item=>{
    const matchStatus = filter==="all"||item.status===filter;
    const matchSearch = !search||item.title.toLowerCase().includes(search.toLowerCase())||item.tags.join(" ").includes(search.toLowerCase());
    return matchStatus&&matchSearch;
  });
  function addItem(){if(!newItem.title)return;setItems(p=>[...p,{...newItem,id:Date.now(),tags:typeof newItem.tags==="string"?newItem.tags.split(",").map(t=>t.trim()).filter(Boolean):newItem.tags}]);setNewItem({title:"",type:"Video",status:"needs_record",platforms:[],assignee:"",due:"",notes:"",tags:""});setShowAdd(false);}
  function updateStatus(id,status){setItems(p=>p.map(i=>i.id===id?{...i,status}:i));}
  function deleteItem(id){setItems(p=>p.filter(i=>i.id!==id));}
  function togglePlatform(platId){setNewItem(p=>({...p,platforms:p.platforms.includes(platId)?p.platforms.filter(x=>x!==platId):[...p.platforms,platId]}));}
  const counts = CMS_STATUSES.reduce((acc,s)=>({...acc,[s.id]:items.filter(i=>i.status===s.id).length}),{});

  const inputStyle = {background:K8.surface,border:`1px solid ${K8.border}`,color:K8.white,borderRadius:"8px",padding:"8px 12px",fontSize:"14px",outline:"none",width:"100%"};

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {CMS_STATUSES.map(s=>(
          <button key={s.id} onClick={()=>setFilter(filter===s.id?"all":s.id)}
            className="rounded-xl p-4 border text-left transition-all"
            style={{background:s.bg,borderColor:filter===s.id?s.color:s.border,boxShadow:filter===s.id?`0 0 0 2px ${s.color}44`:"none"}}>
            <div className="flex items-center justify-between mb-1"><span className="text-lg">{s.icon}</span><span className="text-2xl font-bold" style={{color:s.color}}>{counts[s.id]}</span></div>
            <p className="text-xs font-semibold" style={{color:s.color}}>{s.label}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search content…"
          style={{...inputStyle,width:"180px"}}/>
        <div className="flex gap-1 rounded-lg p-1" style={{background:K8.surface}}>
          {["board","list"].map(v=><button key={v} onClick={()=>setView(v)} className="px-3 py-1 rounded-md text-xs font-medium transition-all" style={view===v?{background:K8.purple,color:"#fff"}:{color:K8.muted}}>{v[0].toUpperCase()+v.slice(1)}</button>)}
        </div>
        <button onClick={()=>setShowAdd(!showAdd)} className="ml-auto px-3 py-1.5 text-xs font-semibold rounded-lg" style={{background:K8.pink,color:"#fff"}}>+ Add Content</button>
      </div>

      {showAdd&&(
        <div className="rounded-xl border p-5 space-y-4" style={{background:K8.card,borderColor:K8.border}}>
          <p className="text-sm font-semibold" style={{color:K8.white}}>New Content Piece</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2"><label className="text-xs font-medium block mb-1" style={{color:K8.muted}}>Title *</label><input value={newItem.title} onChange={e=>setNewItem(p=>({...p,title:e.target.value}))} placeholder="Content title" style={inputStyle}/></div>
            <div><label className="text-xs font-medium block mb-1" style={{color:K8.muted}}>Type</label><select value={newItem.type} onChange={e=>setNewItem(p=>({...p,type:e.target.value}))} style={inputStyle}>{["Video","Article","Carousel","Story","Thread","Reel","Update","Podcast"].map(t=><option key={t}>{t}</option>)}</select></div>
            <div><label className="text-xs font-medium block mb-1" style={{color:K8.muted}}>Status</label><select value={newItem.status} onChange={e=>setNewItem(p=>({...p,status:e.target.value}))} style={inputStyle}>{CMS_STATUSES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
            <div><label className="text-xs font-medium block mb-1" style={{color:K8.muted}}>Assignee</label><select value={newItem.assignee} onChange={e=>setNewItem(p=>({...p,assignee:e.target.value}))} style={inputStyle}><option value="">Unassigned</option>{TEAM_MEMBERS.map(m=><option key={m}>{m}</option>)}</select></div>
            <div><label className="text-xs font-medium block mb-1" style={{color:K8.muted}}>Due Date</label><input type="date" value={newItem.due} onChange={e=>setNewItem(p=>({...p,due:e.target.value}))} style={inputStyle}/></div>
            <div className="md:col-span-2"><label className="text-xs font-medium block mb-2" style={{color:K8.muted}}>Platforms</label><div className="flex flex-wrap gap-2">{PLATFORMS.map(p=><button key={p.id} onClick={()=>togglePlatform(p.id)} className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all" style={newItem.platforms.includes(p.id)?{background:p.color,color:"#fff",borderColor:p.color}:{background:K8.surface,color:K8.muted,borderColor:K8.border}}>{p.icon} {p.label}</button>)}</div></div>
            <div className="md:col-span-2"><label className="text-xs font-medium block mb-1" style={{color:K8.muted}}>Notes</label><textarea value={newItem.notes} onChange={e=>setNewItem(p=>({...p,notes:e.target.value}))} rows={2} placeholder="Production notes…" style={{...inputStyle,resize:"none"}}/></div>
            <div className="md:col-span-2"><label className="text-xs font-medium block mb-1" style={{color:K8.muted}}>Tags (comma separated)</label><input value={typeof newItem.tags==="string"?newItem.tags:newItem.tags.join(", ")} onChange={e=>setNewItem(p=>({...p,tags:e.target.value}))} placeholder="game, launch, trending" style={inputStyle}/></div>
          </div>
          <div className="flex gap-2">
            <button onClick={addItem} className="px-4 py-1.5 text-xs font-semibold rounded-lg" style={{background:K8.pink,color:"#fff"}}>Add to CMS</button>
            <button onClick={()=>setShowAdd(false)} className="px-4 py-1.5 text-xs font-medium rounded-lg" style={{color:K8.muted}}>Cancel</button>
          </div>
        </div>
      )}

      {view==="board"&&(
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {CMS_STATUSES.map(col=>{
            const colItems=filtered.filter(i=>i.status===col.id);
            return(
              <div key={col.id} className="rounded-xl border p-3 space-y-2 min-h-[200px]" style={{background:col.bg,borderColor:col.border}}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5"><span>{col.icon}</span><span className="text-xs font-bold" style={{color:col.color}}>{col.label}</span></div>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{background:col.color}}>{colItems.length}</span>
                </div>
                {colItems.map(item=>(
                  <div key={item.id} className="rounded-lg border p-3 hover:brightness-110 transition-all cursor-default" style={{background:K8.card,borderColor:K8.border}}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-xs font-semibold leading-tight flex-1" style={{color:K8.white}}>{item.title}</p>
                      <span className="text-xs px-1.5 py-0.5 rounded flex-shrink-0" style={{background:K8.surface,color:K8.muted}}>{item.type}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">{item.platforms.map(pid=>{const pl=getPl(pid);return<span key={pid} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{background:pl?.color+"22",color:pl?.color}}>{pl?.icon} {pl?.label}</span>;})}</div>
                    {item.notes&&<p className="text-[11px] mb-2 leading-tight" style={{color:K8.muted}}>{item.notes}</p>}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px]" style={{color:K8.muted}}>{item.assignee} · {item.due}</span>
                      <select value={item.status} onChange={e=>updateStatus(item.id,e.target.value)} className="text-[10px] rounded px-1 py-0.5 outline-none cursor-pointer" style={{background:K8.surface,border:`1px solid ${K8.border}`,color:col.color}}>
                        {CMS_STATUSES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
                {colItems.length===0&&<p className="text-xs text-center py-6 opacity-40" style={{color:col.color}}>No items</p>}
              </div>
            );
          })}
        </div>
      )}

      {view==="list"&&(
        <div className="rounded-xl border overflow-hidden" style={{background:K8.card,borderColor:K8.border}}>
          <table className="w-full text-sm">
            <thead><tr style={{borderBottom:`1px solid ${K8.border}`,background:K8.surface}}>
              {["Title","Type","Status","Platforms","Assignee","Due",""].map(h=><th key={h} className="text-left text-xs font-semibold px-4 py-3" style={{color:K8.muted}}>{h}</th>)}
            </tr></thead>
            <tbody>{filtered.map((item,i)=>(
              <tr key={item.id} style={{borderBottom:`1px solid ${K8.border}`,background:i%2===0?K8.card:K8.surface+"80"}}>
                <td className="px-4 py-3"><p className="font-medium text-xs" style={{color:K8.white}}>{item.title}</p>{item.notes&&<p className="text-[11px] mt-0.5 truncate max-w-[200px]" style={{color:K8.muted}}>{item.notes}</p>}</td>
                <td className="px-3 py-3"><span className="text-xs px-2 py-0.5 rounded-full" style={{background:K8.surface,color:K8.muted}}>{item.type}</span></td>
                <td className="px-3 py-3"><select value={item.status} onChange={e=>updateStatus(item.id,e.target.value)} className="text-xs rounded-lg px-2 py-1 outline-none cursor-pointer font-medium" style={{background:K8.surface,border:`1px solid ${K8.border}`,color:getSt(item.status)?.color}}>{CMS_STATUSES.map(s=><option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}</select></td>
                <td className="px-3 py-3"><div className="flex flex-wrap gap-1">{item.platforms.map(pid=>{const pl=getPl(pid);return<span key={pid} className="text-[10px] px-1 rounded" style={{background:pl?.color+"22",color:pl?.color}}>{pl?.icon}</span>;})}</div></td>
                <td className="px-3 py-3 text-xs" style={{color:K8.muted}}>{item.assignee}</td>
                <td className="px-3 py-3 text-xs" style={{color:K8.muted}}>{item.due}</td>
                <td className="px-3 py-3"><button onClick={()=>deleteItem(item.id)} className="text-xs transition-colors" style={{color:K8.border}} onMouseEnter={e=>e.target.style.color=K8.pink} onMouseLeave={e=>e.target.style.color=K8.border}>✕</button></td>
              </tr>
            ))}</tbody>
          </table>
          {filtered.length===0&&<div className="text-center py-12 text-sm" style={{color:K8.muted}}>No content matches your filter.</div>}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROJECTS — full PM tool
// ─────────────────────────────────────────────────────────────────────────────
const BLANK_TICKET = { title:"", description:"", assignee:"", due:"", priority:"med", platforms:[], status:"todo", tags:"" };

function TicketModal({ ticket, onSave, onClose }) {
  const [form, setForm] = useState(ticket||BLANK_TICKET);
  function togglePl(id){ setForm(f=>({...f,platforms:f.platforms.includes(id)?f.platforms.filter(x=>x!==id):[...f.platforms,id]})); }

  const inputStyle = {background:K8.surface,border:`1px solid ${K8.border}`,color:K8.white,borderRadius:"8px",padding:"8px 12px",fontSize:"14px",outline:"none",width:"100%"};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{background:"rgba(0,0,0,0.7)"}}>
      <div className="w-full max-w-lg rounded-2xl border p-6 space-y-4 max-h-[90vh] overflow-y-auto" style={{background:K8.card,borderColor:K8.border}}>
        <div className="flex items-center justify-between">
          <p className="text-base font-bold" style={{color:K8.white}}>{ticket?.id?"Edit Ticket":"New Ticket"}</p>
          <button onClick={onClose} className="text-sm" style={{color:K8.muted}}>✕</button>
        </div>

        <div><label className="text-xs font-medium block mb-1" style={{color:K8.muted}}>Title *</label>
          <input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="What needs to be done?" style={inputStyle}/></div>

        <div><label className="text-xs font-medium block mb-1" style={{color:K8.muted}}>Description</label>
          <textarea value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} rows={3} placeholder="More detail…" style={{...inputStyle,resize:"none"}}/></div>

        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs font-medium block mb-1" style={{color:K8.muted}}>Assignee</label>
            <select value={form.assignee} onChange={e=>setForm(f=>({...f,assignee:e.target.value}))} style={inputStyle}>
              <option value="">Unassigned</option>
              {TEAM_MEMBERS.map(m=><option key={m}>{m}</option>)}
            </select></div>
          <div><label className="text-xs font-medium block mb-1" style={{color:K8.muted}}>Due Date</label>
            <input type="date" value={form.due} onChange={e=>setForm(f=>({...f,due:e.target.value}))} style={inputStyle}/></div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs font-medium block mb-1" style={{color:K8.muted}}>Priority</label>
            <select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} style={{...inputStyle,color:getPr(form.priority)?.color||K8.white}}>
              {PRIORITY_LEVELS.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
            </select></div>
          <div><label className="text-xs font-medium block mb-1" style={{color:K8.muted}}>Status</label>
            <select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={{...inputStyle,color:getTkSt(form.status)?.color||K8.white}}>
              {TICKET_STATUSES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
            </select></div>
        </div>

        <div><label className="text-xs font-medium block mb-2" style={{color:K8.muted}}>Platforms (multi-select)</label>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map(p=>(
              <button key={p.id} onClick={()=>togglePl(p.id)} type="button"
                className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-all"
                style={form.platforms.includes(p.id)?{background:p.color,color:"#fff",borderColor:p.color}:{background:K8.surface,color:K8.muted,borderColor:K8.border}}>
                {p.icon} {p.label}
              </button>
            ))}
          </div>
        </div>

        <div><label className="text-xs font-medium block mb-1" style={{color:K8.muted}}>Tags (comma separated)</label>
          <input value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="video, launch, community" style={inputStyle}/></div>

        <div className="flex gap-2 pt-2">
          <button onClick={()=>form.title&&onSave(form)} className="flex-1 py-2 text-sm font-semibold rounded-lg" style={{background:K8.pink,color:"#fff"}}>
            {ticket?.id?"Save Changes":"Create Ticket"}
          </button>
          <button onClick={onClose} className="px-4 py-2 text-sm rounded-lg" style={{background:K8.surface,color:K8.muted}}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function Projects() {
  const [tickets,     setTickets]     = useState(TICKETS_SEED);
  const [view,        setView]        = useState("board");
  const [showModal,   setShowModal]   = useState(false);
  const [editTicket,  setEditTicket]  = useState(null);
  const [filterBy,    setFilterBy]    = useState({ assignee:"all", priority:"all", platform:"all" });
  const [search,      setSearch]      = useState("");

  function saveTicket(form) {
    const tags = typeof form.tags==="string"?form.tags.split(",").map(t=>t.trim()).filter(Boolean):form.tags;
    if(form.id) { setTickets(p=>p.map(t=>t.id===form.id?{...form,tags}:t)); }
    else { setTickets(p=>[...p,{...form,tags,id:Date.now()}]); }
    setShowModal(false); setEditTicket(null);
  }
  function deleteTicket(id){ setTickets(p=>p.filter(t=>t.id!==id)); }
  function moveTicket(id,status){ setTickets(p=>p.map(t=>t.id===id?{...t,status}:t)); }

  const filtered = tickets.filter(t=>{
    if(filterBy.assignee!=="all"&&t.assignee!==filterBy.assignee) return false;
    if(filterBy.priority!=="all"&&t.priority!==filterBy.priority) return false;
    if(filterBy.platform!=="all"&&!t.platforms.includes(filterBy.platform)) return false;
    if(search&&!t.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = { total:tickets.length, done:tickets.filter(t=>t.status==="done").length, inProgress:tickets.filter(t=>t.status==="in_progress").length };

  const inputStyle = {background:K8.surface,border:`1px solid ${K8.border}`,color:K8.white,borderRadius:"8px",padding:"6px 10px",fontSize:"13px",outline:"none"};

  function TicketCard({ t }) {
    const pr   = getPr(t.priority);
    const st   = getTkSt(t.status);
    return (
      <div className="rounded-xl border p-4 space-y-3 hover:brightness-110 transition-all" style={{background:K8.card,borderColor:K8.border}}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold leading-tight flex-1" style={{color:K8.white}}>{t.title}</p>
          <div className="flex gap-1 flex-shrink-0">
            <button onClick={()=>{setEditTicket(t);setShowModal(true);}} className="text-xs px-1.5 py-0.5 rounded transition-colors" style={{color:K8.muted}} title="Edit">✏️</button>
            <button onClick={()=>deleteTicket(t.id)} className="text-xs px-1.5 py-0.5 rounded transition-colors" style={{color:K8.muted}} title="Delete">✕</button>
          </div>
        </div>
        {t.description&&<p className="text-xs leading-relaxed line-clamp-2" style={{color:K8.muted}}>{t.description}</p>}
        <div className="flex flex-wrap gap-1">
          {t.platforms.map(pid=>{const pl=getPl(pid);return<span key={pid} className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{background:pl?.color+"22",color:pl?.color}}>{pl?.icon} {pl?.label}</span>;})}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{background:pr?.color+"22",color:pr?.color}}>{pr?.label}</span>
            {t.assignee&&<span className="text-[10px]" style={{color:K8.muted}}>{t.assignee.split(" ")[0]}</span>}
          </div>
          {t.due&&<span className="text-[10px]" style={{color:K8.muted}}>Due {t.due}</span>}
        </div>
        {view==="board"&&(
          <select value={t.status} onChange={e=>moveTicket(t.id,e.target.value)}
            className="w-full text-[11px] rounded-lg px-2 py-1 outline-none cursor-pointer font-medium"
            style={{background:K8.surface,border:`1px solid ${K8.border}`,color:st?.color}}>
            {TICKET_STATUSES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {showModal&&<TicketModal ticket={editTicket} onSave={saveTicket} onClose={()=>{setShowModal(false);setEditTicket(null);}}/>}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[{l:"Total",v:stats.total,i:"🎮"},{l:"In Progress",v:stats.inProgress,i:"⚡"},{l:"Done",v:stats.done,i:"✅"}].map(s=>(
          <div key={s.l} className="rounded-xl border p-4 text-center" style={{background:K8.card,borderColor:K8.border}}>
            <p className="text-2xl mb-1">{s.i}</p>
            <p className="text-2xl font-bold" style={{color:K8.white}}>{s.v}</p>
            <p className="text-xs" style={{color:K8.muted}}>{s.l}</p>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search tickets…" style={{...inputStyle,width:"160px"}}/>
        <select value={filterBy.assignee} onChange={e=>setFilterBy(f=>({...f,assignee:e.target.value}))} style={inputStyle}>
          <option value="all">All assignees</option>
          {TEAM_MEMBERS.map(m=><option key={m}>{m}</option>)}
        </select>
        <select value={filterBy.priority} onChange={e=>setFilterBy(f=>({...f,priority:e.target.value}))} style={inputStyle}>
          <option value="all">All priorities</option>
          {PRIORITY_LEVELS.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <select value={filterBy.platform} onChange={e=>setFilterBy(f=>({...f,platform:e.target.value}))} style={inputStyle}>
          <option value="all">All platforms</option>
          {PLATFORMS.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <div className="flex gap-1 rounded-lg p-1" style={{background:K8.surface}}>
          {["board","list"].map(v=><button key={v} onClick={()=>setView(v)} className="px-3 py-1 rounded-md text-xs font-medium transition-all" style={view===v?{background:K8.purple,color:"#fff"}:{color:K8.muted}}>{v[0].toUpperCase()+v.slice(1)}</button>)}
        </div>
        <button onClick={()=>{setEditTicket(null);setShowModal(true);}} className="ml-auto px-4 py-1.5 text-xs font-semibold rounded-lg" style={{background:K8.pink,color:"#fff"}}>+ New Ticket</button>
      </div>

      {/* Board view */}
      {view==="board"&&(
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {TICKET_STATUSES.map(col=>{
            const colItems=filtered.filter(t=>t.status===col.id);
            return(
              <div key={col.id} className="rounded-xl border p-3 space-y-2 min-h-[200px]" style={{background:col.bg,borderColor:col.border}}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold" style={{color:col.color}}>{col.label}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{background:col.color}}>{colItems.length}</span>
                </div>
                {colItems.map(t=><TicketCard key={t.id} t={t}/>)}
                {colItems.length===0&&<p className="text-xs text-center py-6 opacity-30" style={{color:col.color}}>Empty</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* List view */}
      {view==="list"&&(
        <div className="rounded-xl border overflow-hidden" style={{background:K8.card,borderColor:K8.border}}>
          <table className="w-full text-sm">
            <thead><tr style={{borderBottom:`1px solid ${K8.border}`,background:K8.surface}}>
              {["Title","Assignee","Priority","Status","Platforms","Due",""].map(h=><th key={h} className="text-left text-xs font-semibold px-4 py-3" style={{color:K8.muted}}>{h}</th>)}
            </tr></thead>
            <tbody>{filtered.map((t,i)=>{
              const pr=getPr(t.priority); const st=getTkSt(t.status);
              return(
                <tr key={t.id} style={{borderBottom:`1px solid ${K8.border}`,background:i%2===0?K8.card:K8.surface+"80"}}>
                  <td className="px-4 py-3"><p className="font-medium text-xs" style={{color:K8.white}}>{t.title}</p>{t.description&&<p className="text-[11px] mt-0.5 truncate max-w-[220px]" style={{color:K8.muted}}>{t.description}</p>}</td>
                  <td className="px-3 py-3 text-xs" style={{color:K8.muted}}>{t.assignee||"—"}</td>
                  <td className="px-3 py-3"><span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{background:pr?.color+"22",color:pr?.color}}>{pr?.label}</span></td>
                  <td className="px-3 py-3"><select value={t.status} onChange={e=>moveTicket(t.id,e.target.value)} className="text-xs rounded-lg px-2 py-1 outline-none cursor-pointer font-medium" style={{background:K8.surface,border:`1px solid ${K8.border}`,color:st?.color}}>{TICKET_STATUSES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></td>
                  <td className="px-3 py-3"><div className="flex flex-wrap gap-1">{t.platforms.map(pid=>{const pl=getPl(pid);return<span key={pid} className="text-[10px] px-1 rounded" style={{background:pl?.color+"22",color:pl?.color}}>{pl?.icon}</span>;})}</div></td>
                  <td className="px-3 py-3 text-xs" style={{color:K8.muted}}>{t.due||"—"}</td>
                  <td className="px-3 py-3"><button onClick={()=>{setEditTicket(t);setShowModal(true);}} className="text-xs mr-2" style={{color:K8.purple}}>Edit</button><button onClick={()=>deleteTicket(t.id)} className="text-xs" style={{color:K8.muted}}>✕</button></td>
                </tr>
              );
            })}</tbody>
          </table>
          {filtered.length===0&&<div className="text-center py-12 text-sm" style={{color:K8.muted}}>No tickets match your filter.</div>}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULER
// ─────────────────────────────────────────────────────────────────────────────
function Scheduler() {
  const inputStyle={background:K8.surface,border:`1px solid ${K8.border}`,color:K8.white,borderRadius:"8px",padding:"6px 10px",fontSize:"13px",outline:"none",width:"100%"};
  const [posts,setposts]=useState(SCHED_SEED);const[filter,setFilter]=useState("all");const[showForm,setShowForm]=useState(false);const[np,setNp]=useState({title:"",platform:"tiktok",date:"",time:"",type:"Post"});
  const filtered=filter==="all"?posts:posts.filter(p=>p.status===filter);
  function add(){if(!np.title||!np.date||!np.time)return;setposts(p=>[...p,{...np,id:Date.now(),status:"draft"}]);setNp({title:"",platform:"tiktok",date:"",time:"",type:"Post"});setShowForm(false);}
  return(
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 rounded-lg p-1" style={{background:K8.surface}}>{["all","scheduled","review","draft"].map(f=><button key={f} onClick={()=>setFilter(f)} className="px-3 py-1 rounded-md text-xs font-medium transition-all" style={filter===f?{background:K8.purple,color:"#fff"}:{color:K8.muted}}>{f[0].toUpperCase()+f.slice(1)}</button>)}</div>
        <button onClick={()=>setShowForm(!showForm)} className="ml-auto px-3 py-1.5 text-xs font-semibold rounded-lg" style={{background:K8.pink,color:"#fff"}}>+ Schedule Post</button>
      </div>
      {showForm&&<div className="rounded-xl border p-5 space-y-3" style={{background:K8.card,borderColor:K8.border}}><p className="text-sm font-semibold" style={{color:K8.white}}>New Post</p><input value={np.title} onChange={e=>setNp(p=>({...p,title:e.target.value}))} placeholder="Post title" style={{...inputStyle,width:"100%"}}/><div className="grid grid-cols-2 md:grid-cols-4 gap-3"><select value={np.platform} onChange={e=>setNp(p=>({...p,platform:e.target.value}))} style={inputStyle}>{PLATFORMS.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</select><select value={np.type} onChange={e=>setNp(p=>({...p,type:e.target.value}))} style={inputStyle}>{["Post","Video","Story","Reel","Thread","Article","Carousel","Update"].map(t=><option key={t}>{t}</option>)}</select><input type="date" value={np.date} onChange={e=>setNp(p=>({...p,date:e.target.value}))} style={inputStyle}/><input type="time" value={np.time} onChange={e=>setNp(p=>({...p,time:e.target.value}))} style={inputStyle}/></div><div className="flex gap-2"><button onClick={add} className="px-4 py-1.5 text-xs font-semibold rounded-lg" style={{background:K8.pink,color:"#fff"}}>Add</button><button onClick={()=>setShowForm(false)} className="px-4 py-1.5 text-xs rounded-lg" style={{color:K8.muted}}>Cancel</button></div></div>}
      <div className="space-y-2">{filtered.map(post=>{const pl=getPl(post.platform);return(<div key={post.id} className="rounded-xl border px-4 py-3 flex items-center gap-4 transition-colors" style={{background:K8.card,borderColor:K8.border}}><div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0" style={{background:pl?.color+"22"}}>{pl?.icon}</div><div className="flex-1 min-w-0"><p className="text-sm font-medium truncate" style={{color:K8.white}}>{post.title}</p><p className="text-xs" style={{color:K8.muted}}>{pl?.label} · {post.type}</p></div><div className="text-right flex-shrink-0"><p className="text-xs font-medium" style={{color:K8.white}}>{post.date}</p><p className="text-xs" style={{color:K8.muted}}>{post.time}</p></div><ScBadge status={post.status}/></div>);})}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMS
// ─────────────────────────────────────────────────────────────────────────────
function Comms(){
  const[msgs,setMsgs]=useState(MSGS_DATA);const[inp,setInp]=useState("");
  const send=()=>{if(!inp.trim())return;setMsgs(p=>[...p,{id:Date.now(),from:"You",time:"Now",text:inp}]);setInp("");};
  return(
    <div className="space-y-5">
      <div className="rounded-xl border overflow-hidden" style={{background:K8.card,borderColor:K8.border}}>
        <div className="px-5 py-3 flex items-center gap-3" style={{borderBottom:`1px solid ${K8.border}`}}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{background:K8.purple,color:"#fff"}}>K</div>
          <div><p className="text-sm font-semibold" style={{color:K8.white}}>Priya — Content Manager</p><p className="text-xs text-emerald-400 font-medium">● Online</p></div>
        </div>
        <div className="p-5 space-y-3 h-72 overflow-y-auto" style={{background:K8.dark}}>
          {msgs.map(m=><div key={m.id} className={`flex ${m.from==="You"?"justify-end":"justify-start"}`}><div className="max-w-xs px-4 py-2.5 rounded-2xl text-sm" style={m.from==="You"?{background:K8.pink,color:"#fff",borderRadius:"16px 16px 4px 16px"}:{background:K8.card,color:K8.white,borderRadius:"4px 16px 16px 16px"}}>{m.text}<p className="text-xs mt-1 opacity-40">{m.time}</p></div></div>)}
        </div>
        <div className="p-3 flex gap-2" style={{borderTop:`1px solid ${K8.border}`}}>
          <input value={inp} onChange={e=>setInp(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Message Priya…" className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" style={{background:K8.surface,border:`1px solid ${K8.border}`,color:K8.white}}/>
          <button onClick={send} className="px-4 py-2 text-xs font-medium rounded-lg" style={{background:K8.pink,color:"#fff"}}>Send</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMMUNITY
// ─────────────────────────────────────────────────────────────────────────────
function Community(){
  const[filter,setFilter]=useState("all");
  const filtered=filter==="all"?COMMENTS_DATA:COMMENTS_DATA.filter(c=>c.sentiment===filter);
  const ss={positive:{bg:"#0D2A1A",border:"#1A5030",color:"#4ade80"},neutral:{bg:K8.surface,border:K8.border,color:K8.muted},negative:{bg:"#2A1010",border:"#501818",color:"#f87171"}};
  return(
    <div className="space-y-5">
      <Card>
        <p className="text-sm font-semibold mb-4" style={{color:K8.white}}>Sentiment Breakdown</p>
        <div className="flex items-center gap-8 flex-wrap">
          <ResponsiveContainer width={140} height={140}><PieChart><Pie data={SENTIMENT} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>{SENTIMENT.map((s,i)=><Cell key={i} fill={s.color}/>)}</Pie><Tooltip formatter={v=>`${v}%`} contentStyle={{borderRadius:10,background:K8.card,border:`1px solid ${K8.border}`,fontSize:12,color:K8.white}}/></PieChart></ResponsiveContainer>
          <div className="space-y-2">{SENTIMENT.map(s=><div key={s.name} className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{background:s.color}}/><span className="text-sm" style={{color:K8.mutedLight}}>{s.name}</span><span className="ml-6 text-sm font-bold" style={{color:K8.white}}>{s.value}%</span></div>)}</div>
        </div>
      </Card>
      <div className="flex gap-1 rounded-lg p-1 w-fit" style={{background:K8.surface}}>
        {["all","positive","neutral","negative"].map(f=><button key={f} onClick={()=>setFilter(f)} className="px-3 py-1 rounded-md text-xs font-medium transition-all" style={filter===f?{background:K8.purple,color:"#fff"}:{color:K8.muted}}>{f[0].toUpperCase()+f.slice(1)}</button>)}
      </div>
      <div className="space-y-2">{filtered.map(c=>{const pl=getPl(c.platform);const s=ss[c.sentiment];return(<div key={c.id} className="rounded-xl border p-4 flex gap-3 transition-colors" style={{background:K8.card,borderColor:K8.border}}><div className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0" style={{background:pl?.color+"22"}}>{pl?.icon}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1 flex-wrap"><p className="text-xs font-semibold" style={{color:K8.white}}>{c.user}</p><span style={{color:K8.border}}>·</span><p className="text-xs" style={{color:K8.muted}}>{pl?.label}</p><span style={{color:K8.border}}>·</span><p className="text-xs" style={{color:K8.muted}}>{c.time} ago</p><span className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full border" style={{background:s.bg,borderColor:s.border,color:s.color}}>{c.sentiment}</span></div><p className="text-sm" style={{color:K8.mutedLight}}>{c.text}</p><div className="flex gap-3 mt-2"><span className="text-xs" style={{color:K8.muted}}>♥ {c.likes}</span><button className="text-xs" style={{color:K8.muted}}>Reply</button><button className="text-xs" style={{color:K8.muted}}>Flag</button></div></div></div>);})}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONNECT
// ─────────────────────────────────────────────────────────────────────────────
const SETUP_GUIDES={
  instagram:{steps:["Go to developers.facebook.com → My Apps → Create App","Add Instagram Basic Display product","Generate a long-lived User Access Token","Add INSTAGRAM_USER_TOKEN + INSTAGRAM_USER_ID to Vercel env vars"]},
  tiktok:   {steps:["Apply at business-api.tiktok.com","Create an app and get an Access Token","Add TIKTOK_ACCESS_TOKEN + TIKTOK_ADVERTISER_ID to Vercel env vars"]},
  youtube:  {steps:["Go to console.cloud.google.com → APIs & Services","Enable YouTube Data API v3 and create an API Key","Add YOUTUBE_API_KEY + YOUTUBE_CHANNEL_ID to Vercel env vars"]},
  twitter:  {steps:["Go to developer.twitter.com → Projects & Apps","Create a project, copy the Bearer Token","Add TWITTER_BEARER_TOKEN to Vercel — set TWITTER_USERNAME to the studio handle"]},
  bluesky:  {steps:["No key needed. Bluesky data comes from the public API","Set BLUESKY_HANDLE (for example studio.bsky.social) in Vercel"]},
  linkedin: {steps:["Go to developer.linkedin.com → My Apps → Create app","Request r_organization_social + r_organization_followers scopes","Add LINKEDIN_ACCESS_TOKEN + LINKEDIN_ORG_ID to Vercel env vars"]},
};

function Connect({available}){
  const[expanded,setExpanded]=useState(null);
  return(
    <div className="space-y-4">
      <div className="rounded-xl p-4 flex gap-3" style={{background:"#101E38",border:"1px solid #1A3A68"}}>
        <span className="text-xl flex-shrink-0">ℹ️</span>
        <div><p className="text-sm font-semibold" style={{color:"#93c5fd"}}>Server-side API keys</p><p className="text-xs mt-0.5" style={{color:"#60a5fa"}}>All credentials live in Vercel env vars — keys never reach the browser. Add them in Vercel → Settings → Environment Variables, then redeploy.</p></div>
      </div>
      {PLATFORMS.map(p=>{const isLive=available[p.id];const guide=SETUP_GUIDES[p.id];const isOpen=expanded===p.id;return(
        <div key={p.id} className="rounded-xl border p-4" style={{background:K8.card,borderColor:K8.border}}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{background:p.color+"22"}}>{p.icon}</div>
            <div className="flex-1"><p className="text-sm font-semibold" style={{color:K8.white}}>{p.label}</p>
              {p.manual?<p className="text-xs mt-0.5" style={{color:K8.muted}}>Manual data entry</p>
              :isLive?<p className="text-xs font-medium mt-0.5 text-emerald-400">✓ Live data active</p>
              :<p className="text-xs mt-0.5" style={{color:K8.muted}}>No API key — showing demo data</p>}
            </div>
            {isLive?<span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg" style={{background:"#0D2A1A",border:"1px solid #1A5030",color:"#4ade80"}}><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"/>Live</span>
            :<button onClick={()=>setExpanded(isOpen?null:p.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg text-white" style={{background:p.color}}>{isOpen?"Hide":"Setup →"}</button>}
          </div>
          {isOpen&&guide&&(<div className="mt-4 pt-4" style={{borderTop:`1px solid ${K8.border}`}}><p className="text-xs font-semibold mb-2" style={{color:K8.muted}}>Setup steps</p><ol className="space-y-1.5">{guide.steps.map((step,i)=><li key={i} className="flex gap-2 text-xs" style={{color:K8.mutedLight}}><span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5" style={{background:p.color}}>{i+1}</span>{step}</li>)}</ol></div>)}
        </div>
      );})}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
const NAV=[
  {id:"analytics",label:"Analytics",icon:"📈"},
  {id:"cms",      label:"CMS",      icon:"🗂️"},
  {id:"agent",    label:"AI Agent", icon:"🤖"},
  {id:"scheduler",label:"Scheduler",icon:"🗓️"},
  {id:"projects", label:"Projects", icon:"🎮"},
  {id:"comms",    label:"Comms",    icon:"💬"},
  {id:"community",label:"Community",icon:"🌐"},
  {id:"connect",  label:"Connect",  icon:"🔗"},
];

export default function Dashboard(){
  const session=useSession();const signOut=()=>window.Clerk?.signOut?.();const emailOrRole=session.demo?`demo · ${session.role}`:window.Clerk?.user?.primaryEmailAddress?.emailAddress;
  const{liveData,available}=useLiveData();
  const[tab,setTab]=useState("analytics");
  const[cmsItems]=useState(CMS_SEED);
  const liveCount=Object.keys(available).length;

  return(
    <div className="min-h-screen" style={{background:K8.dark,fontFamily:"'DM Sans','Helvetica Neue',sans-serif",color:K8.white}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:${K8.dark}}
        ::-webkit-scrollbar-thumb{background:${K8.border};border-radius:4px}
        select option{background:${K8.card};color:${K8.white}}
        input[type="date"]::-webkit-calendar-picker-indicator{filter:invert(0.7)}
      `}</style>

      {/* HEADER */}
      <header className="sticky top-0 z-20" style={{background:K8.card,borderBottom:`1px solid ${K8.border}`}}>
        <div className="max-w-7xl mx-auto px-5 py-3 flex items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <img src="/kato8-logo-circle.png" alt="Kato.8" className="w-8 h-8 rounded-full object-cover"/>
            <div className="hidden md:block">
              <p className="text-sm font-bold leading-none" style={{color:K8.white}}>Kato.8 Studios</p>
              <p className="text-[10px] leading-none mt-0.5" style={{color:K8.muted}}>Social Community Manager</p>
            </div>
          </div>

          {/* Status pills */}
          <div className="hidden lg:flex items-center gap-2 ml-3">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full border" style={liveCount>0?{background:"#0D2A1A",borderColor:"#1A5030",color:"#4ade80"}:{background:K8.surface,borderColor:K8.border,color:K8.muted}}>
              {liveCount>0?`${liveCount} live`:"Demo mode"}
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full border" style={{background:K8.surface,borderColor:K8.border,color:K8.muted}}>🗂️ {cmsItems.length} content pieces</span>
          </div>

          {/* User */}
          <div className="ml-auto flex items-center gap-3">
            {session&&<>
              <span className="text-xs hidden md:block" style={{color:K8.muted}}>{emailOrRole}</span>
              <a href={HUB_URL} target="_blank" rel="noopener noreferrer" className="text-xs px-2 py-1 rounded-lg transition-colors hidden sm:inline-flex items-center gap-1" style={{color:K8.muted,border:`1px solid ${K8.border}`,textDecoration:'none'}}>← Hub</a>
              {!session.demo&&<button onClick={()=>signOut()} className="text-xs px-2 py-1 rounded-lg transition-colors" style={{color:K8.muted,border:`1px solid ${K8.border}`}} onMouseEnter={e=>{e.target.style.color=K8.white;e.target.style.borderColor=K8.borderLight;}} onMouseLeave={e=>{e.target.style.color=K8.muted;e.target.style.borderColor=K8.border;}}>Sign out</button>}
            </>}
          </div>
        </div>

        {/* NAV TABS */}
        <div className="max-w-7xl mx-auto px-5 flex gap-0 overflow-x-auto" style={{borderTop:`1px solid ${K8.border}`}}>
          {NAV.map(n=>(
            <button key={n.id} onClick={()=>setTab(n.id)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap"
              style={tab===n.id?{borderBottomColor:K8.pink,color:K8.white}:{borderBottomColor:"transparent",color:K8.muted}}>
              {n.icon} {n.label}
              {n.id==="connect"&&liveCount>0&&<span className="w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{background:K8.pink}}>{liveCount}</span>}
              {n.id==="agent"&&<span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{background:K8.purple+"33",color:K8.purpleLight,border:`1px solid ${K8.purple}44`}}>AI</span>}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-5 py-6">
        {tab==="analytics"  && <Analytics liveData={liveData} available={available}/>}
        {tab==="cms"        && <CMS/>}
        {tab==="agent"      && <AIAgent cmsItems={cmsItems}/>}
        {tab==="scheduler"  && <Scheduler/>}
        {tab==="projects"   && <Projects/>}
        {tab==="comms"      && <Comms/>}
        {tab==="community"  && <Community/>}
        {tab==="connect"    && <Connect available={available}/>}
      </main>
    </div>
  );
}
