(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))n(a);new MutationObserver(a=>{for(const s of a)if(s.type==="childList")for(const i of s.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&n(i)}).observe(document,{childList:!0,subtree:!0});function o(a){const s={};return a.integrity&&(s.integrity=a.integrity),a.referrerPolicy&&(s.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?s.credentials="include":a.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(a){if(a.ep)return;a.ep=!0;const s=o(a);fetch(a.href,s)}})();const he="/api";class ve extends Error{constructor(t,o,n){super(t),this.name="ApiError",this.status=o,this.data=n}}function fe(){return localStorage.getItem("voicecircle_token")}async function I(e,t={}){const o=`${he}${e}`,n=fe(),a={headers:{"Content-Type":"application/json",...t.headers},...t};n&&(a.headers.Authorization=`Bearer ${n}`),t.body&&typeof t.body=="object"&&(a.body=JSON.stringify(t.body));const s=await fetch(o,a);let i;const l=s.headers.get("content-type");if(l&&l.includes("application/json")?i=await s.json():i=await s.text(),!s.ok)throw new ve((i==null?void 0:i.error)||(i==null?void 0:i.message)||"An error occurred",s.status,i);return i}const m={get:(e,t={})=>I(e,{...t,method:"GET"}),post:(e,t,o={})=>I(e,{...o,method:"POST",body:t}),patch:(e,t,o={})=>I(e,{...o,method:"PATCH",body:t}),put:(e,t,o={})=>I(e,{...o,method:"PUT",body:t}),delete:(e,t={})=>I(e,{...t,method:"DELETE"})},O={register:e=>m.post("/auth/register",e),login:e=>m.post("/auth/login",e),logout:()=>m.post("/auth/logout"),getMe:()=>m.get("/auth/me"),refresh:()=>m.post("/auth/refresh")},S={getFeed:(e={})=>m.get(`/posts/feed?limit=${e.limit||20}&skip=${e.skip||0}`),getExplore:(e={})=>m.get(`/posts/explore?limit=${e.limit||20}&skip=${e.skip||0}`),getById:e=>m.get(`/posts/${e}`),getByUser:(e,t={})=>m.get(`/posts/user/${e}?limit=${t.limit||20}&skip=${t.skip||0}`),create:e=>m.post("/posts",e),like:e=>m.post(`/posts/${e}/like`),getComments:e=>m.get(`/posts/${e}/comments`),addComment:(e,t)=>m.post(`/posts/${e}/comments`,t),delete:e=>m.delete(`/posts/${e}`)},N={getById:e=>m.get(`/users/${e}`),getByUsername:e=>m.get(`/users/username/${e}`),search:(e,t=20)=>m.get(`/users?q=${encodeURIComponent(e)}&limit=${t}`),updateProfile:e=>m.patch("/users/me",e),follow:e=>m.post(`/users/${e}/follow`),unfollow:e=>m.delete(`/users/${e}/follow`),getFollowers:e=>m.get(`/users/${e}/followers`),getFollowing:e=>m.get(`/users/${e}/following`)},C={getAll:()=>m.get("/rooms"),getById:e=>m.get(`/rooms/${e}`),create:e=>m.post("/rooms",e),join:e=>m.post(`/rooms/${e}/join`),submitAnswer:(e,t)=>m.post(`/rooms/${e}/answer`,{sdpAnswer:t}),heartbeat:e=>m.post(`/rooms/${e}/heartbeat`),leave:e=>m.post(`/rooms/${e}/leave`),raiseHand:e=>m.post(`/rooms/${e}/raise-hand`),lowerHand:e=>m.post(`/rooms/${e}/lower-hand`),promoteSpeaker:(e,t)=>m.post(`/rooms/${e}/speakers/${t}`),demoteSpeaker:(e,t)=>m.delete(`/rooms/${e}/speakers/${t}`),end:e=>m.post(`/rooms/${e}/end`)},ge={uploadFile:async(e,t="audio")=>{const o=new FormData;o.append("file",e);let n;switch(t){case"audio":case"voice":n="/upload/voice";break;case"avatar":case"image":n="/upload/avatar";break;default:n="/upload/voice"}const a=fe(),s=await fetch(`${he}${n}`,{method:"POST",headers:a?{Authorization:`Bearer ${a}`}:{},body:o});if(!s.ok){const i=await s.json().catch(()=>({error:"Upload failed"}));throw new ve((i==null?void 0:i.error)||"Upload failed",s.status,i)}return s.json()}},V="voicecircle_token",W="voicecircle_user",K=new Set,f={user:null,token:null,isAuthenticated:!1,isLoading:!0};function E(e){Object.assign(f,e),K.forEach(t=>t(f))}function Y(e){return K.add(e),()=>K.delete(e)}function Se(){return localStorage.getItem(V)}function z(e){e?localStorage.setItem(V,e):localStorage.removeItem(V)}function Me(){try{const e=localStorage.getItem(W);return e?JSON.parse(e):null}catch{return null}}function H(e){e?localStorage.setItem(W,JSON.stringify(e)):localStorage.removeItem(W)}async function Be(){const e=Se(),t=Me();if(!e){E({user:null,token:null,isAuthenticated:!1,isLoading:!1});return}try{const{user:o}=await O.getMe();H(o),E({user:o,token:e,isAuthenticated:!0,isLoading:!1})}catch(o){o.status===401?(z(null),H(null),E({user:null,token:null,isAuthenticated:!1,isLoading:!1})):E(t?{user:t,token:e,isAuthenticated:!0,isLoading:!1}:{user:null,token:null,isAuthenticated:!1,isLoading:!1})}}async function Pe(e,t){const{user:o,token:n}=await O.login({email:e,password:t});return z(n),H(o),E({user:o,token:n,isAuthenticated:!0,isLoading:!1}),{user:o,token:n}}async function Ae(e){const{user:t,token:o}=await O.register(e);return z(o),H(t),E({user:t,token:o,isAuthenticated:!0,isLoading:!1}),{user:t,token:o}}async function He(){try{await O.logout()}catch{}z(null),H(null),E({user:null,token:null,isAuthenticated:!1,isLoading:!1})}function Q(e){const t={...f.user,...e};H(t),E({user:t})}const D={};let G=null;function M(e,t){D[e]=t}function Ie(e){G=e}function k(e){window.location.hash=e.startsWith("#")?e:`#${e}`}function Re(){return(window.location.hash||"#/").slice(1)||"/"}function qe(e){if(D[e])return{route:D[e],params:{}};for(const[t,o]of Object.entries(D)){const n=[],a=t.replace(/:([^/]+)/g,(l,r)=>(n.push(r),"([^/]+)")),s=new RegExp(`^${a}$`),i=e.match(s);if(i){const l={};return n.forEach((r,u)=>{l[r]=i[u+1]}),{route:o,params:l}}}return null}async function ee(){const e=Re(),t=qe(e);if(!t){G&&await G();return}const{route:o,params:n}=t;if(o.auth&&!f.isAuthenticated){k("/login");return}if(o.guestOnly&&f.isAuthenticated){k("/");return}Ne(e);const a=document.getElementById("mainContent");if(a&&o.page)try{const s=await o.page(n);a.innerHTML=s,o.attachEvents&&o.attachEvents(a,n)}catch(s){console.error("Error rendering page:",s),a.innerHTML=`
        <div class="empty-state">
          <h3>Something went wrong</h3>
          <p>${s.message}</p>
        </div>
      `}}function Ne(e){document.querySelectorAll(".nav-link").forEach(n=>{var s;const a=((s=n.getAttribute("href"))==null?void 0:s.slice(1))||"/";n.classList.toggle("active",a===e||e.startsWith(a)&&a!=="/")}),document.querySelectorAll(".mobile-nav-item").forEach(n=>{var s;const a=((s=n.getAttribute("href"))==null?void 0:s.slice(1))||"/";n.classList.toggle("active",a===e||e.startsWith(a)&&a!=="/")})}function je(){ee(),window.addEventListener("hashchange",ee),document.addEventListener("click",e=>{e.target.closest('a[href^="#"]')})}function T({user:e,size:t="default",showOnline:o=!1,clickable:n=!1}){const a=t==="sm"?"avatar-sm":t==="lg"?"avatar-lg":t==="xl"?"avatar-xl":"",s=((e==null?void 0:e.displayName)||(e==null?void 0:e.username)||"?")[0].toUpperCase(),i=n?`href="#/profile/${e==null?void 0:e._id}"`:"",l=e!=null&&e.avatarUrl?`<img src="${e.avatarUrl}" alt="${e.displayName||e.username}">`:s,r=o&&(e!=null&&e.online)?'<span class="online-indicator"></span>':"",u=n?"a":"span";return`
    <${u} ${i} class="avatar-wrapper">
      <div class="avatar ${a}">
        ${l}
      </div>
      ${r}
    </${u}>
  `}function Fe({users:e,max:t=3,size:o="sm"}){const n=e.slice(0,t),a=e.length-t;return`
    <div class="avatars">
      ${n.map(s=>T({user:s,size:o})).join("")}
      ${a>0?`<div class="avatar avatar-sm" style="background: var(--bg-tertiary)">+${a}</div>`:""}
    </div>
  `}const De={home:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>`,search:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>`,users:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 00-3-3.87"/>
    <path d="M16 3.13a4 4 0 010 7.75"/>
  </svg>`,user:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>`,heart:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>`,heartFilled:`<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
  </svg>`,comment:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
  </svg>`,share:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="18" cy="5" r="3"/>
    <circle cx="6" cy="12" r="3"/>
    <circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>`,play:`<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="5 3 19 12 5 21 5 3"/>
  </svg>`,pause:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="6" y="4" width="4" height="16"/>
    <rect x="14" y="4" width="4" height="16"/>
  </svg>`,mic:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z"/>
    <path d="M19 10v2a7 7 0 01-14 0v-2"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>`,micOff:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="1" y1="1" x2="23" y2="23"/>
    <path d="M9 9v3a3 3 0 005.12 2.12M15 9.34V4a3 3 0 00-5.94-.6"/>
    <path d="M17 16.95A7 7 0 015 12v-2m14 0v2a7 7 0 01-.11 1.23"/>
    <line x1="12" y1="19" x2="12" y2="23"/>
    <line x1="8" y1="23" x2="16" y2="23"/>
  </svg>`,video:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="23 7 16 12 23 17 23 7"/>
    <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
  </svg>`,videoOff:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16 16v1a2 2 0 01-2 2H3a2 2 0 01-2-2V7a2 2 0 012-2h2m5.66 0H14a2 2 0 012 2v3.34l1 1L23 7v10"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>`,phone:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
  </svg>`,phoneOff:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M10.68 13.31a16 16 0 003.41 2.6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7 2 2 0 011.72 2v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.42 19.42 0 01-3.33-2.67m-2.67-3.34a19.79 19.79 0 01-3.07-8.63A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91"/>
    <line x1="23" y1="1" x2="1" y2="23"/>
  </svg>`,plus:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>`,x:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>`,check:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>`,settings:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>`,logOut:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>`,chevronDown:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>`,moreHorizontal:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="1"/>
    <circle cx="19" cy="12" r="1"/>
    <circle cx="5" cy="12" r="1"/>
  </svg>`,hand:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M18 11V6a2 2 0 00-2-2v0a2 2 0 00-2 2v0"/>
    <path d="M14 10V4a2 2 0 00-2-2v0a2 2 0 00-2 2v2"/>
    <path d="M10 10.5V6a2 2 0 00-2-2v0a2 2 0 00-2 2v8"/>
    <path d="M18 8a2 2 0 012 2v7.21a4 4 0 01-.88 2.5L16.5 22H9.5a4 4 0 01-3-1.38L3.25 17.05a2 2 0 01-.25-.94v0c0-.63.29-1.22.78-1.61l.54-.43a2 2 0 012.5 0L8 15V6"/>
  </svg>`,volume2:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
    <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07"/>
  </svg>`,send:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>`,image:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>`,trash:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
  </svg>`,edit:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>`,clock:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>`,loader:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="2" x2="12" y2="6"/>
    <line x1="12" y1="18" x2="12" y2="22"/>
    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/>
    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/>
    <line x1="2" y1="12" x2="6" y2="12"/>
    <line x1="18" y1="12" x2="22" y2="12"/>
    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/>
    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/>
  </svg>`,alert:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>`,info:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>`,userPlus:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="8.5" cy="7" r="4"/>
    <line x1="20" y1="8" x2="20" y2="14"/>
    <line x1="23" y1="11" x2="17" y2="11"/>
  </svg>`,userCheck:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
    <circle cx="8.5" cy="7" r="4"/>
    <polyline points="17 11 19 13 23 9"/>
  </svg>`,radio:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="2"/>
    <path d="M16.24 7.76a6 6 0 010 8.49m-8.48-.01a6 6 0 010-8.49m11.31-2.82a10 10 0 010 14.14m-14.14 0a10 10 0 010-14.14"/>
  </svg>`,headphones:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M3 18v-6a9 9 0 0118 0v6"/>
    <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z"/>
  </svg>`};function c(e,t=24){const o=De[e]||"";return t!==24?o.replace(/width="24"/,`width="${t}"`).replace(/height="24"/,`height="${t}"`):o}function Ue(e){return`
    <div class="user-menu">
      <button class="user-menu-trigger" id="userMenuTrigger">
        ${T({user:e,size:"sm"})}
        <span style="color: var(--text-primary)">${e.displayName||e.username}</span>
        ${c("chevronDown",16)}
      </button>
      <div class="user-menu-dropdown" id="userMenuDropdown">
        <a href="#/profile/${e._id}" class="user-menu-item">
          ${c("user",18)}
          <span>Profile</span>
        </a>
        <a href="#/settings" class="user-menu-item">
          ${c("settings",18)}
          <span>Settings</span>
        </a>
        <div class="user-menu-divider"></div>
        <button class="user-menu-item danger" id="logoutBtn">
          ${c("logOut",18)}
          <span>Log out</span>
        </button>
      </div>
    </div>
  `}function Oe(e){const t=e.querySelector("#userMenuTrigger"),o=e.querySelector("#userMenuDropdown"),n=e.querySelector("#logoutBtn");t&&o&&(t.addEventListener("click",a=>{a.stopPropagation(),o.classList.toggle("open")}),document.addEventListener("click",a=>{!o.contains(a.target)&&!t.contains(a.target)&&o.classList.remove("open")}),o.querySelectorAll("a").forEach(a=>{a.addEventListener("click",()=>{o.classList.remove("open")})})),n&&n.addEventListener("click",async()=>{await He(),k("/login")})}function te(){const e=document.getElementById("navActions");if(e){if(f.isLoading){e.innerHTML="";return}f.isAuthenticated&&f.user?(e.innerHTML=Ue(f.user),Oe(e)):e.innerHTML=`
      <a href="#/login" class="btn btn-secondary">Log in</a>
      <a href="#/register" class="btn btn-primary">Sign up</a>
    `}}function ze(){te(),Y(te)}function oe(){const e=document.getElementById("mobileNav");if(!e)return;const t=e.querySelector('[data-page="profile"]');t&&(f.isAuthenticated&&f.user?t.href=`#/profile/${f.user._id}`:t.href="#/login")}function _e(){oe(),Y(oe),window.addEventListener("hashchange",ne),ne()}function ne(){const e=window.location.hash.slice(1)||"/",t=document.getElementById("mobileNav");t&&t.querySelectorAll(".mobile-nav-item").forEach(o=>{var s;const n=((s=o.getAttribute("href"))==null?void 0:s.slice(1))||"/",a=n===e||e.startsWith(n)&&n!=="/";o.classList.toggle("active",a)})}function A({iconName:e="info",title:t,message:o,action:n}){return`
    <div class="empty-state">
      ${c(e,64)}
      <h3>${t}</h3>
      <p>${o}</p>
      ${n?`<div style="margin-top: 1rem">${n}</div>`:""}
    </div>
  `}function J(e){const t=new Date(e),n=new Date-t,a=Math.floor(n/1e3),s=Math.floor(a/60),i=Math.floor(s/60),l=Math.floor(i/24);return a<60?"just now":s<60?`${s}m ago`:i<24?`${i}h ago`:l<7?`${l}d ago`:t.toLocaleDateString("en-US",{month:"short",day:"numeric"})}function R(e){if(!isFinite(e)||e<0)return"0:00";const t=Math.floor(e/60),o=Math.floor(e%60);return`${t}:${o.toString().padStart(2,"0")}`}function ye({src:e,postId:t,duration:o}){const n=o?R(o):"0:00";return`
    <div class="audio-player" data-audio-player="${t}" data-duration="${o||0}">
      <button class="audio-play-btn" data-play-btn="${t}">
        ${c("play",24)}
      </button>
      <div class="audio-waveform" data-waveform="${t}">
        <div class="audio-progress" style="width: 0%; height: 100%; background: var(--primary);"></div>
      </div>
      <span class="audio-time" data-time="${t}">${n}</span>
      <audio src="${e}" data-audio="${t}" preload="metadata"></audio>
    </div>
  `}function Ve(e){e.querySelectorAll("[data-audio-player]").forEach(o=>{const n=o.dataset.audioPlayer,a=o.querySelector(`[data-play-btn="${n}"]`),s=o.querySelector(`[data-audio="${n}"]`),i=o.querySelector(`[data-waveform="${n}"]`),l=o.querySelector(`[data-time="${n}"]`),r=i.querySelector(".audio-progress");if(!a||!s)return;let d=parseFloat(o.dataset.duration)||0,p=!1;const g=()=>{const v=s.duration;isFinite(v)&&v>0&&(d=v,p||(l.textContent=R(v)))};s.addEventListener("loadedmetadata",g),s.addEventListener("durationchange",g),s.addEventListener("canplay",g),s.addEventListener("error",v=>{l.textContent="0:00",console.warn("Failed to load audio:",s.src)}),a.addEventListener("click",()=>{s.paused?(document.querySelectorAll("audio").forEach(v=>{if(v!==s){v.pause();const $=v.closest("[data-audio-player]");if($){const w=$.querySelector(".audio-play-btn");w&&(w.innerHTML=c("play",24))}}}),p=!0,s.play(),a.innerHTML=c("pause",24)):(p=!1,s.pause(),a.innerHTML=c("play",24),d>0&&(l.textContent=R(d)))}),s.addEventListener("timeupdate",()=>{const v=s.currentTime/s.duration*100;r.style.width=`${v}%`,l.textContent=R(s.currentTime)}),s.addEventListener("ended",()=>{p=!1,a.innerHTML=c("play",24),r.style.width="0%",l.textContent=R(d||s.duration)}),i.addEventListener("click",v=>{const $=i.getBoundingClientRect(),w=(v.clientX-$.left)/$.width;s.currentTime=w*s.duration})})}let We=0;function be({title:e,content:t,footer:o,size:n="default",onClose:a}){const s=++We;return`
    <div class="modal-overlay" id="modal-${s}" data-modal-id="${s}">
      <div class="modal ${n==="large"?"modal-lg":n==="small"?"modal-sm":""}">
        <div class="modal-header">
          <h2 class="modal-title">${e}</h2>
          <button class="modal-close" data-close-modal="${s}">
            ${c("x",20)}
          </button>
        </div>
        <div class="modal-body">
          ${t}
        </div>
        ${o?`<div class="modal-footer">${o}</div>`:""}
      </div>
    </div>
  `}function we(e,t){const o=document.getElementById("modals");if(!o)return null;o.innerHTML=e;const n=o.querySelector(".modal-overlay");if(n){n.addEventListener("click",i=>{i.target===n&&(q(),t&&t())});const a=n.querySelector("[data-close-modal]");a&&a.addEventListener("click",()=>{q(),t&&t()});const s=i=>{i.key==="Escape"&&(q(),t&&t(),document.removeEventListener("keydown",s))};document.addEventListener("keydown",s)}return n}function q(){const e=document.getElementById("modals");e&&(e.innerHTML="")}function Ke({title:e,message:t,confirmText:o="Confirm",cancelText:n="Cancel",danger:a=!1}){return be({title:e,content:`<p style="color: var(--text-secondary)">${t}</p>`,footer:`
      <button class="btn btn-secondary" data-action="cancel">${n}</button>
      <button class="btn ${a?"btn-danger":"btn-primary"}" data-action="confirm">${o}</button>
    `})}function ae({title:e,message:t,confirmText:o,cancelText:n,danger:a,onConfirm:s,onCancel:i}){const l=Ke({title:e,message:t,confirmText:o,cancelText:n,danger:a}),r=we(l);if(r){const u=r.querySelector('[data-action="confirm"]'),d=r.querySelector('[data-action="cancel"]');u&&u.addEventListener("click",()=>{q(),s&&s()}),d&&d.addEventListener("click",()=>{q(),i&&i()})}return r}let Ge=0;function ke(e,t="info",o=3e3){const n=document.getElementById("toastContainer");if(!n)return;const a=++Ge,s=document.createElement("div");return s.className=`toast ${t}`,s.id=`toast-${a}`,s.innerHTML=`
    <span>${e}</span>
    <button class="btn-icon" onclick="this.parentElement.remove()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `,n.appendChild(s),o>0&&setTimeout(()=>{s.style.animation="slideIn 0.3s ease reverse",setTimeout(()=>s.remove(),300)},o),a}function L(e){return ke(e,"success")}function h(e){return ke(e,"error",5e3)}function Ye(e){const t=be({title:"Comments",content:`
      <div id="comments-container">
        <div class="loading-comments">
          <div class="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    `,size:"large",onClose:()=>{}});we(t,()=>{}),$e(e)}async function $e(e){try{const t=document.getElementById("comments-container");if(!t)return;const{post:o}=await S.getById(e),{comments:n}=await S.getComments(e);t.innerHTML=`
      <div class="original-post">
        ${Je(o)}
      </div>
      <div class="comments-section">
        <div class="comments-list" id="comments-list">
          ${n.length>0?n.map(Xe).join(""):'<p class="no-comments">No comments yet. Be the first!</p>'}
        </div>
        ${f.isAuthenticated?Ze(e):'<p class="login-prompt">Please log in to comment.</p>'}
      </div>
    `,Qe(e)}catch(t){console.error("Failed to load comments:",t);const o=document.getElementById("comments-container");o&&(o.innerHTML='<p class="error">Failed to load comments. Please try again.</p>')}}function Je(e){const{_id:t,author:o,content:n,type:a,mediaUrl:s,createdAt:i}=e,l=a==="voice"&&s?ye({src:s,postId:t}):"";return`
    <div class="post-card modal-post">
      <div class="post-header">
        ${T({user:o,clickable:!1})}
        <div class="post-author">
          <span class="post-author-name">${(o==null?void 0:o.displayName)||(o==null?void 0:o.username)||"Unknown"}</span>
          <span class="post-author-username">@${(o==null?void 0:o.username)||"unknown"}</span>
        </div>
        <span class="post-time">${J(i)}</span>
      </div>
      ${n?`<div class="post-content">${xe(n)}</div>`:""}
      ${l?`<div class="post-media">${l}</div>`:""}
    </div>
  `}function Xe(e){return`
    <div class="comment">
      <div class="comment-header">
        ${T({user:e,clickable:!1})}
        <div class="comment-author">
          <span class="comment-author-name">${e.displayName||e.username}</span>
          <span class="comment-time">${J(e.createdAt)}</span>
        </div>
      </div>
      <div class="comment-content">${xe(e.content)}</div>
    </div>
  `}function Ze(e){return`
    <div class="comment-form">
      <div class="form-group">
        <textarea
          class="form-input"
          id="comment-input"
          placeholder="Write a comment..."
          rows="3"
          maxlength="500"
        ></textarea>
        <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
          <span class="char-count" style="color: var(--text-muted); font-size: 0.75rem;">
            <span id="comment-char-count">0</span>/500
          </span>
          <button class="btn btn-primary btn-sm" id="submit-comment" data-post-id="${e}">
            ${c("send",16)} Comment
          </button>
        </div>
      </div>
    </div>
  `}function Qe(e){const t=document.getElementById("comment-input"),o=document.getElementById("comment-char-count"),n=document.getElementById("submit-comment");t&&o&&t.addEventListener("input",()=>{o.textContent=t.value.length}),n&&n.addEventListener("click",async()=>{const a=t.value.trim();if(!a){h("Please write something");return}try{n.disabled=!0,n.innerHTML="Posting...",await S.addComment(e,{content:a}),L("Comment added!"),await $e(e)}catch(s){h(s.message||"Failed to add comment"),n.disabled=!1,n.innerHTML=`${c("send",16)} Comment`}})}function xe(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function et(e){const{_id:t,author:o,content:n,type:a,mediaUrl:s,mediaDuration:i,likesCount:l,commentsCount:r,isLiked:u,createdAt:d}=e,p=a==="voice"&&s?ye({src:s,postId:t,duration:i}):"",g=c(u?"heartFilled":"heart",20);return`
    <article class="post-card" data-post-id="${t}">
      <div class="post-header">
        ${T({user:o,clickable:!0,showOnline:!0})}
        <div class="post-author">
          <a href="#/profile/${o==null?void 0:o._id}" class="post-author-name">${(o==null?void 0:o.displayName)||(o==null?void 0:o.username)||"Unknown"}</a>
          <span class="post-author-username">@${(o==null?void 0:o.username)||"unknown"}</span>
        </div>
        <span class="post-time">${J(d)}</span>
      </div>
      ${n?`<div class="post-content">${tt(n)}</div>`:""}
      ${p?`<div class="post-media">${p}</div>`:""}
      <div class="post-actions">
        <button class="post-action ${u?"liked":""}" data-like-btn="${t}">
          ${g}
          <span data-likes-count="${t}">${l||0}</span>
        </button>
        <button class="post-action" data-comment-btn="${t}">
          ${c("comment",20)}
          <span>${r||0}</span>
        </button>
        <button class="post-action" data-share-btn="${t}">
          ${c("share",20)}
          <span>Share</span>
        </button>
      </div>
    </article>
  `}function tt(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function ot(e){e.querySelectorAll("[data-like-btn]").forEach(t=>{t.addEventListener("click",async()=>{if(!f.isAuthenticated){h("Please log in to like posts");return}const o=t.dataset.likeBtn;e.querySelector(`[data-likes-count="${o}"]`);try{const{liked:n,likesCount:a}=await S.like(o);t.classList.toggle("liked",n),t.innerHTML=`${c(n?"heartFilled":"heart",20)}<span data-likes-count="${o}">${a}</span>`}catch(n){h(n.message||"Failed to like post")}})}),e.querySelectorAll("[data-comment-btn]").forEach(t=>{t.addEventListener("click",()=>{const o=t.dataset.commentBtn;Ye(o)})}),e.querySelectorAll("[data-share-btn]").forEach(t=>{t.addEventListener("click",()=>{const o=t.dataset.shareBtn,n=`${window.location.origin}/#/post/${o}`;navigator.share?navigator.share({url:n}).catch(()=>{}):navigator.clipboard&&navigator.clipboard.writeText(n).then(()=>{L("Link copied to clipboard")})})})}function j(e="default"){return`
    <div class="loading">
      <div class="spinner ${e==="small"?"spinner-sm":""}"></div>
    </div>
  `}function X(e,t="No posts yet"){return!e||e.length===0?A({iconName:"radio",title:"No posts",message:t}):`
    <div class="post-list">
      ${e.map(o=>et(o)).join("")}
    </div>
  `}function Le(){return j()}function Z(e){ot(e),Ve(e)}function nt(e,t="audio/webm"){const o={mimeType:t};let n=[],a;try{a=new MediaRecorder(e,o)}catch{a=new MediaRecorder(e)}return a.ondataavailable=s=>{s.data.size>0&&n.push(s.data)},{recorder:a,start:()=>{n=[],a.start(100)},stop:()=>new Promise(s=>{a.onstop=()=>{const i=new Blob(n,{type:a.mimeType});s(i)},a.stop()}),getChunks:()=>n}}async function at(){try{return{stream:await navigator.mediaDevices.getUserMedia({audio:!0}),error:null}}catch(e){let t="Could not access microphone";return e.name==="NotAllowedError"?t="Microphone access was denied. Please allow microphone access in your browser settings.":e.name==="NotFoundError"&&(t="No microphone found. Please connect a microphone and try again."),{stream:null,error:t}}}function se(e){e&&e.getTracks().forEach(t=>t.stop())}function ie(e){const t=Math.floor(e/60),o=Math.floor(e%60);return`${t}:${o.toString().padStart(2,"0")}`}function st(){return`
    <div class="audio-recorder" id="audioRecorder">
      <button class="record-btn" id="recordBtn">
        ${c("mic",32)}
      </button>
      <span class="record-time" id="recordTime">0:00</span>
      <span class="record-status" id="recordStatus">Tap to record</span>
    </div>
    <div id="audioPreview" style="display: none; margin-top: 1rem;"></div>
  `}function it(e,t){const o=e.querySelector("#recordBtn"),n=e.querySelector("#recordTime"),a=e.querySelector("#recordStatus"),s=e.querySelector("#audioPreview");let i=null,l=null,r=!1,u=null,d=0,p=null;o.addEventListener("click",async()=>{r?v():await g()});async function g(){const w=await at();if(w.error){a.textContent=w.error;return}i=w.stream,l=nt(i),r=!0,d=0,o.classList.add("recording"),o.innerHTML=c("mic",32),a.textContent="Recording...",l.start(),u=setInterval(()=>{d++,n.textContent=ie(d),d>=60&&v()},1e3)}async function v(){r=!1,o.classList.remove("recording"),o.innerHTML=c("mic",32),a.textContent="Tap to record again",clearInterval(u),l&&(p=await l.stop(),$(p),t&&t({blob:p,duration:d})),se(i),i=null}function $(w){const B=URL.createObjectURL(w);s.style.display="block",s.innerHTML=`
      <div class="audio-player" style="background: var(--bg-secondary);">
        <button class="audio-play-btn" id="previewPlayBtn">
          ${c("play",24)}
        </button>
        <audio id="previewAudio" src="${B}"></audio>
        <span class="audio-time">${ie(d)}</span>
        <button class="btn btn-secondary btn-sm" id="discardBtn" style="margin-left: auto;">Discard</button>
      </div>
    `;const b=s.querySelector("#previewPlayBtn"),x=s.querySelector("#previewAudio"),P=s.querySelector("#discardBtn");b.addEventListener("click",()=>{x.paused?(x.play(),b.innerHTML=c("pause",24)):(x.pause(),b.innerHTML=c("play",24))}),x.addEventListener("ended",()=>{b.innerHTML=c("play",24)}),P.addEventListener("click",()=>{URL.revokeObjectURL(B),s.style.display="none",s.innerHTML="",p=null,d=0,n.textContent="0:00",a.textContent="Tap to record",t&&t({blob:null,duration:0})})}return()=>{i&&se(i),u&&clearInterval(u)}}function rt(){return`
    <div class="card post-composer" style="margin-bottom: 1.5rem;">
      <div class="card-body">
        <div class="form-group">
          <textarea class="form-input" id="postContent" placeholder="What's on your mind?" rows="3" maxlength="500"></textarea>
          <div style="display: flex; justify-content: space-between; margin-top: 0.5rem;">
            <span class="char-count" style="color: var(--text-muted); font-size: 0.75rem;">
              <span id="charCount">0</span>/500
            </span>
          </div>
        </div>

        <div class="post-type-tabs" style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
          <button class="btn btn-secondary btn-sm post-type-btn active" data-type="text">
            ${c("edit",16)} Text
          </button>
          <button class="btn btn-secondary btn-sm post-type-btn" data-type="voice">
            ${c("mic",16)} Voice
          </button>
        </div>

        <div id="voiceRecorderSection" style="display: none;">
          ${st()}
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem;">
          <button class="btn btn-secondary" id="cancelPostBtn">Cancel</button>
          <button class="btn btn-primary" id="submitPostBtn">
            ${c("send",16)} Post
          </button>
        </div>
      </div>
    </div>
  `}function lt(e,t){const o=e.querySelector("#postContent"),n=e.querySelector("#charCount"),a=e.querySelectorAll(".post-type-btn"),s=e.querySelector("#voiceRecorderSection"),i=e.querySelector("#cancelPostBtn"),l=e.querySelector("#submitPostBtn");let r="text",u=null,d=0,p=null;o.addEventListener("input",()=>{n.textContent=o.value.length}),a.forEach(g=>{g.addEventListener("click",()=>{a.forEach(v=>v.classList.remove("active")),g.classList.add("active"),r=g.dataset.type,r==="voice"?(s.style.display="block",p=it(s,({blob:v,duration:$})=>{u=v,d=$})):(s.style.display="none",u=null,d=0,p&&(p(),p=null))})}),i.addEventListener("click",()=>{p&&p(),t&&t(null)}),l.addEventListener("click",async()=>{const g=o.value.trim();if(r==="text"&&!g){h("Please write something");return}if(r==="voice"&&!u&&!g){h("Please record audio or write something");return}try{l.disabled=!0,l.innerHTML="Posting...";let v=null;if(u){const $=new File([u],"recording.webm",{type:u.type});v=(await ge.uploadFile($,"audio")).url}await S.create({type:r,content:g,mediaUrl:v,mediaDuration:u?d:null}),L("Post created!"),p&&p(),t&&t(!0)}catch(v){h(v.message||"Failed to create post"),l.disabled=!1,l.innerHTML=`${c("send",16)} Post`}})}let re=[];async function ct(){return setTimeout(Ce,0),`
    <div class="home-page">
      <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h1>Home</h1>
          <p style="color: var(--text-muted)">Your personalized feed</p>
        </div>
        <button class="btn btn-primary" id="createPostBtn">
          ${c("plus",20)}
          <span>New Post</span>
        </button>
      </div>
      <div id="postComposerContainer"></div>
      <div id="feedContent">
        ${Le()}
      </div>
    </div>
  `}async function Ce(){const e=document.getElementById("feedContent");if(e)try{re=(await S.getFeed({limit:20})).posts||[];const o="Your feed is empty. Follow some users or explore to find content!";e.innerHTML=X(re,o),Z(e)}catch(t){h(t.message||"Failed to load feed"),e.innerHTML=`
      <div class="empty-state">
        <h3>Failed to load feed</h3>
        <p>${t.message}</p>
        <button class="btn btn-primary" onclick="location.reload()">Try again</button>
      </div>
    `}}function dt(e){const t=e.querySelector("#createPostBtn"),o=e.querySelector("#postComposerContainer");t&&o&&t.addEventListener("click",()=>{o.innerHTML?o.innerHTML="":(o.innerHTML=rt(),lt(o,()=>{o.innerHTML="",Ce()}))})}let le=[],Ee=!0;async function ut(){return Ee=!0,setTimeout(mt,0),`
    <div class="explore-page">
      <div class="page-header" style="margin-bottom: 1.5rem;">
        <h1>Explore</h1>
        <p style="color: var(--text-muted)">Discover voice posts from the community</p>
      </div>
      <div id="exploreContent">
        ${Le()}
      </div>
    </div>
  `}async function mt(){const e=document.getElementById("exploreContent");if(e)try{le=(await S.getExplore({limit:20})).posts||[],Ee=!1,e.innerHTML=X(le,"No posts yet. Be the first to share your voice!"),Z(e)}catch(t){h(t.message||"Failed to load posts"),e.innerHTML=`
      <div class="empty-state">
        <h3>Failed to load posts</h3>
        <p>${t.message}</p>
        <button class="btn btn-primary" onclick="location.reload()">Try again</button>
      </div>
    `}}function pt(e){}function ht(e){const{_id:t,name:o,description:n,host:a,participants:s=[],participantCount:i=0,isLive:l}=e,r=s.slice(0,3).map(u=>u.user).filter(Boolean);return`
    <div class="room-card" data-room-id="${t}">
      <div class="room-header">
        <h3 class="room-title">${ce(o)}</h3>
        ${l?'<span class="room-live-badge">LIVE</span>':""}
      </div>
      ${n?`<p class="room-description">${ce(n)}</p>`:""}
      <div class="room-footer">
        <div class="room-participants">
          ${r.length>0?Fe({users:r,max:3,size:"sm"}):""}
          <span class="room-count">${i} listening</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted);">
          ${c("headphones",16)}
          <span style="font-size: 0.875rem;">Hosted by ${(a==null?void 0:a.displayName)||(a==null?void 0:a.username)||"Unknown"}</span>
        </div>
      </div>
    </div>
  `}function ce(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function vt(e){e.querySelectorAll("[data-room-id]").forEach(t=>{t.addEventListener("click",()=>{const o=t.dataset.roomId;window.location.hash=`#/rooms/${o}`})})}async function ft(){return`
    <div class="rooms-page">
      <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h1>Live Rooms</h1>
          <p style="color: var(--text-muted)">Join live audio conversations</p>
        </div>
        ${f.isAuthenticated?`
          <button class="btn btn-primary" id="createRoomBtn">
            ${c("plus",20)}
            <span>Start Room</span>
          </button>
        `:""}
      </div>
      <div id="roomsContent">
        ${j()}
      </div>
    </div>
  `}function gt(e){yt(e);const t=e.querySelector("#createRoomBtn");t&&t.addEventListener("click",()=>{bt()})}async function yt(e){const t=e.querySelector("#roomsContent");if(t)try{const{rooms:o}=await C.getAll();if(!o||o.length===0){t.innerHTML=A({iconName:"users",title:"No live rooms",message:"Be the first to start a conversation!",action:f.isAuthenticated?`<button class="btn btn-primary" onclick="document.getElementById('createRoomBtn')?.click()">Start a Room</button>`:'<a href="#/login" class="btn btn-primary">Sign in to start a room</a>'});return}t.innerHTML=`
      <div class="rooms-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">
        ${o.map(n=>ht(n)).join("")}
      </div>
    `,vt(t)}catch(o){h(o.message||"Failed to load rooms"),t.innerHTML=A({iconName:"alert",title:"Failed to load rooms",message:o.message,action:'<button class="btn btn-primary" onclick="location.reload()">Try again</button>'})}}function bt(){const e=`
    <div class="modal-overlay" id="createRoomModal">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">Start an Audio Room</h2>
          <button class="modal-close" id="closeCreateRoom">
            ${c("x",20)}
          </button>
        </div>
        <div class="modal-body">
          <form id="createRoomForm">
            <div class="form-group">
              <label class="form-label" for="roomName">Room name</label>
              <input type="text" id="roomName" name="name" class="form-input" placeholder="What's your room about?" required maxlength="100">
            </div>
            <div class="form-group">
              <label class="form-label" for="roomDescription">Description (optional)</label>
              <textarea id="roomDescription" name="description" class="form-input" placeholder="Add more details about your room" rows="3" maxlength="500"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="cancelCreateRoom">Cancel</button>
          <button class="btn btn-primary" id="submitCreateRoom">
            ${c("mic",16)} Go Live
          </button>
        </div>
      </div>
    </div>
  `,t=document.getElementById("modals");t.innerHTML=e;const o=t.querySelector("#createRoomModal"),n=t.querySelector("#closeCreateRoom"),a=t.querySelector("#cancelCreateRoom"),s=t.querySelector("#submitCreateRoom"),i=t.querySelector("#createRoomForm"),l=()=>{t.innerHTML=""};o.addEventListener("click",r=>{r.target===o&&l()}),n.addEventListener("click",l),a.addEventListener("click",l),s.addEventListener("click",async()=>{const r=i.roomName.value.trim(),u=i.roomDescription.value.trim();if(!r){h("Please enter a room name");return}try{s.disabled=!0,s.textContent="Creating...";const{room:d}=await C.create({name:r,description:u});l(),k(`/rooms/${d._id}`)}catch(d){h(d.message||"Failed to create room"),s.disabled=!1,s.innerHTML=`${c("mic",16)} Go Live`}})}function wt({role:e="listener",isHost:t=!1}){return`
    <div class="room-controls">
      ${e==="host"||e==="speaker"?`
        <button class="control-btn ptt-btn" id="pttBtn" title="Hold to talk (or press T)">
          ${c("mic",24)}
          <span class="ptt-label">Hold to Talk</span>
        </button>
      `:`
        <button class="control-btn" id="raiseHandBtn" title="Raise hand to speak">
          ${c("hand",24)}
        </button>
      `}
      <button class="control-btn leave" id="leaveRoomBtn" title="Leave room">
        ${c("phoneOff",24)}
      </button>
      ${t?`
        <button class="control-btn danger" id="endRoomBtn" title="End room for everyone">
          ${c("x",24)}
        </button>
      `:""}
    </div>
  `}function kt(e,t={}){const o=e.querySelector("#pttBtn"),n=e.querySelector("#raiseHandBtn"),a=e.querySelector("#leaveRoomBtn"),s=e.querySelector("#endRoomBtn");if(o&&t.onPTTStart&&t.onPTTEnd&&(o.addEventListener("pointerdown",i=>{i.preventDefault(),i.stopPropagation(),o.classList.add("active"),t.onPTTStart()}),o.addEventListener("pointerup",i=>{i.preventDefault(),i.stopPropagation(),o.classList.remove("active"),t.onPTTEnd()}),o.addEventListener("pointerleave",i=>{o.classList.contains("active")&&(o.classList.remove("active"),t.onPTTEnd())}),o.addEventListener("pointercancel",i=>{o.classList.remove("active"),t.onPTTEnd()}),o.addEventListener("contextmenu",i=>{i.preventDefault()})),t.onPTTStart&&t.onPTTEnd){const i=r=>{r.target.tagName==="INPUT"||r.target.tagName==="TEXTAREA"||r.repeat||(r.key==="t"||r.key==="T")&&(r.preventDefault(),o&&o.classList.add("active"),t.onPTTStart())},l=r=>{(r.key==="t"||r.key==="T")&&(r.preventDefault(),o&&o.classList.remove("active"),t.onPTTEnd())};document.addEventListener("keydown",i),document.addEventListener("keyup",l),e._pttKeyboardCleanup=()=>{document.removeEventListener("keydown",i),document.removeEventListener("keyup",l)}}n&&t.onRaiseHand&&n.addEventListener("click",()=>{t.onRaiseHand()}),a&&t.onLeave&&a.addEventListener("click",()=>{t.onLeave()}),s&&t.onEnd&&s.addEventListener("click",()=>{t.onEnd()})}function $t(e,t){const o=e.querySelector("#pttBtn");o&&(t?(o.classList.add("talking"),o.querySelector(".ptt-label").textContent="Talking..."):(o.classList.remove("talking"),o.querySelector(".ptt-label").textContent="Hold to Talk"))}function Te(e){e._pttKeyboardCleanup&&(e._pttKeyboardCleanup(),delete e._pttKeyboardCleanup)}function de({participants:e,isHost:t=!1,raisedHands:o=[]}){const n=e.filter(s=>s.role==="host"||s.role==="speaker"),a=e.filter(s=>s.role==="listener");return`
    <div class="participants-list">
      <h3>Speakers (${n.length})</h3>
      ${n.map(s=>_({participant:s,isHost:t})).join("")}

      ${o.length>0?`
        <h3 style="margin-top: 1rem;">Raised Hands (${o.length})</h3>
        ${o.map(s=>_({participant:s,isHost:t,hasRaisedHand:!0})).join("")}
      `:""}

      ${a.length>0?`
        <h3 style="margin-top: 1rem;">Listeners (${a.length})</h3>
        ${a.map(s=>_({participant:s,isHost:t})).join("")}
      `:""}
    </div>
  `}function _({participant:e,isHost:t=!1,hasRaisedHand:o=!1}){const{user:n,role:a}=e;return a==="host"?c("user",14):a==="speaker"?c("mic",14):o&&c("hand",14),`
    <div class="participant-item" data-participant-id="${n._id}">
      ${T({user:n,size:"sm",showOnline:!0})}
      <div class="participant-info">
        <span class="participant-name">${n.displayName||n.username}</span>
        <span class="participant-role">${a==="host"?"Host":a==="speaker"?"Speaker":""}</span>
      </div>
      ${o?`<span style="color: var(--warning)">${c("hand",16)}</span>`:""}
      ${t&&a==="listener"?`
        <button class="btn btn-sm btn-secondary" data-promote-user="${n._id}" title="Make speaker">
          ${c("mic",14)}
        </button>
      `:""}
    </div>
  `}function ue(e,t={}){e.querySelectorAll("[data-promote-user]").forEach(o=>{o.addEventListener("click",()=>{const n=o.dataset.promoteUser;t.onPromote&&t.onPromote(n)})})}const xt=300;class Lt{constructor(t,o,n){this.roomId=t,this.userId=o,this.role=n,this.pc=null,this.localStream=null,this.remoteStreams=new Map,this.isMuted=!0,this.isTalking=!1,this.pttTimeout=null,this.onParticipantUpdate=null,this.onSpeakingChange=null,this.onTalkingStateChange=null,this.audioElements=new Map,this.heartbeatInterval=null,this.sessionId=null,this.audioContext=null,this.analyser=null}async connect(t){console.log("[CONNECT] Starting audio-only connection with PTT"),this.sessionId=t==null?void 0:t.sessionId;const o=(t==null?void 0:t.iceServers)||[{urls:"stun:stun.l.google.com:19302"},{urls:"stun:stun1.l.google.com:19302"}];if(console.log("[CONNECT] Using ICE servers:",o.map(s=>s.urls)),this.pc=new RTCPeerConnection({iceServers:o}),this.pc.ontrack=s=>{console.log("[TRACK] Received remote track:",s.track.kind),this.handleRemoteTrack(s)},this.pc.onconnectionstatechange=()=>{console.log("[CONNECTION] State changed:",this.pc.connectionState),(this.pc.connectionState==="failed"||this.pc.connectionState==="disconnected")&&console.warn("[CONNECTION] Connection lost")},this.pc.oniceconnectionstatechange=()=>{console.log("[ICE] Connection state:",this.pc.iceConnectionState)},(this.role==="host"||this.role==="speaker")&&await this.setupLocalMedia(),!(t!=null&&t.sdp))throw new Error("No SDP offer received from server");console.log("[SDP] Setting remote description (server offer)"),await this.pc.setRemoteDescription({type:"offer",sdp:t.sdp}),console.log("[SDP] Creating answer");const n=await this.pc.createAnswer();await this.pc.setLocalDescription(n),console.log("[ICE] Waiting for gathering to complete"),await this.waitForIceGathering(this.pc);const a=this.pc.localDescription;return console.log("[SDP] Submitting answer to backend"),await this.submitAnswer(a.sdp),this.startHeartbeat(),console.log("[CONNECT] Audio connection established successfully"),!0}async setupLocalMedia(){try{this.localStream=await navigator.mediaDevices.getUserMedia({audio:!0,video:!1}),this.localStream.getAudioTracks().forEach(t=>{t.enabled=!1}),this.isMuted=!0,this.localStream.getTracks().forEach(t=>{console.log("[MEDIA] Adding local track:",t.kind),this.pc.addTrack(t,this.localStream)}),this.setupAudioLevelDetection(),console.log("[MEDIA] Audio-only media setup complete (PTT mode)")}catch(t){throw console.error("[MEDIA] Failed to get user media:",t),t}}handleRemoteTrack(t){const o=t.track,n=t.streams[0];o.kind==="audio"&&n&&!this.remoteStreams.has(n.id)&&(this.remoteStreams.set(n.id,n),this.playRemoteAudio(n)),this.onParticipantUpdate&&this.onParticipantUpdate()}async submitAnswer(t){const o=localStorage.getItem("voicecircle_token"),n=await fetch(`/api/rooms/${this.roomId}/answer`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${o}`},body:JSON.stringify({sdpAnswer:t})});if(!n.ok){const a=await n.json().catch(()=>({}));throw new Error(`Failed to submit answer: ${n.status} - ${a.error||""}`)}console.log("[ANSWER] Successfully submitted to backend")}startHeartbeat(){this.heartbeatInterval&&clearInterval(this.heartbeatInterval),this.heartbeatInterval=setInterval(async()=>{try{const t=localStorage.getItem("voicecircle_token"),o=await fetch(`/api/rooms/${this.roomId}/heartbeat`,{method:"POST",headers:{Authorization:`Bearer ${t}`}});o.ok||console.warn("[HEARTBEAT] Failed:",o.status)}catch(t){console.error("[HEARTBEAT] Error:",t)}},1e4),console.log("[HEARTBEAT] Started")}waitForIceGathering(t){return new Promise(o=>{if(t.iceGatheringState==="complete"){o();return}const n=()=>{t.iceGatheringState==="complete"&&(t.removeEventListener("icegatheringstatechange",n),o())};t.addEventListener("icegatheringstatechange",n),setTimeout(()=>{t.removeEventListener("icegatheringstatechange",n),o()},5e3)})}playRemoteAudio(t){const o=document.createElement("audio");o.srcObject=t,o.autoplay=!0,o.playsInline=!0,o.style.display="none",document.body.appendChild(o),this.audioElements.set(t.id,o),o.play().catch(n=>{console.warn("[AUDIO] Autoplay blocked, will play on user interaction:",n);const a=()=>{o.play(),document.removeEventListener("click",a)};document.addEventListener("click",a)}),console.log("[AUDIO] Playing remote stream:",t.id)}setupAudioLevelDetection(){if(!this.localStream)return;this.audioContext=new AudioContext;const t=this.audioContext.createMediaStreamSource(this.localStream);this.analyser=this.audioContext.createAnalyser(),this.analyser.fftSize=256,t.connect(this.analyser);const o=new Uint8Array(this.analyser.frequencyBinCount),n=()=>{if(!this.localStream)return;this.analyser.getByteFrequencyData(o);const s=o.reduce((i,l)=>i+l)/o.length>30&&this.isTalking;this.onSpeakingChange&&this.onSpeakingChange(this.userId,s),requestAnimationFrame(n)};n()}startPTT(){!this.localStream||this.isTalking||(this.pttTimeout&&clearTimeout(this.pttTimeout),this.pttTimeout=setTimeout(()=>{this.enableAudio()},xt),console.log("[PTT] Starting (300ms hold required)"))}stopPTT(){this.pttTimeout&&(clearTimeout(this.pttTimeout),this.pttTimeout=null),this.isTalking&&this.disableAudio(),console.log("[PTT] Stopped")}enableAudio(){this.localStream&&(this.isTalking=!0,this.isMuted=!1,this.localStream.getAudioTracks().forEach(t=>{t.enabled=!0}),this.onTalkingStateChange&&this.onTalkingStateChange(!0),console.log("[PTT] Audio ENABLED - transmitting"))}disableAudio(){this.localStream&&(this.isTalking=!1,this.isMuted=!0,this.localStream.getAudioTracks().forEach(t=>{t.enabled=!1}),this.onTalkingStateChange&&this.onTalkingStateChange(!1),console.log("[PTT] Audio DISABLED"))}getTalkingState(){return this.isTalking}toggleMute(){return console.warn("[MUTE] Use PTT controls instead of toggleMute in PTT mode"),this.isMuted}setMuted(t){t?this.disableAudio():this.enableAudio()}async disconnect(){console.log("[DISCONNECT] Cleaning up connection"),this.stopPTT(),this.heartbeatInterval&&(clearInterval(this.heartbeatInterval),this.heartbeatInterval=null),this.audioContext&&(this.audioContext.close(),this.audioContext=null),this.localStream&&(this.localStream.getTracks().forEach(t=>t.stop()),this.localStream=null),this.audioElements.forEach(t=>{t.pause(),t.srcObject=null,t.remove()}),this.audioElements.clear(),this.pc&&(this.pc.close(),this.pc=null),this.remoteStreams.clear(),console.log("[DISCONNECT] Cleanup complete")}}function Ct(e,t,o){return new Lt(e,t,o)}let y=null;async function Et({id:e}){return`
    <div class="room-page">
      <div id="roomContent">
        ${j()}
      </div>
    </div>
  `}async function Tt(e,{id:t}){var n;const o=e.querySelector("#roomContent");if(o)try{const a=await C.join(t),{room:s,role:i,sdp:l,iceServers:r,sessionId:u}=a;if(!s.isLive){o.innerHTML=A({iconName:"radio",title:"Room has ended",message:"This room is no longer live.",action:'<a href="#/rooms" class="btn btn-primary">Browse Rooms</a>'});return}const{room:d}=await C.getById(t),p=d.participants||[],g=d.hostId===((n=f.user)==null?void 0:n._id),v=d.raisedHands||[],$={sdp:l,iceServers:r,sessionId:u},w=i==="host"||i==="speaker";y=Ct(t,f.user._id,i),await y.connect($),o.innerHTML=`
      <div class="room-view audio-room">
        <div class="room-main">
          <div class="room-header">
            <div class="room-info">
              <h1>${U(d.name)}</h1>
              ${d.description?`<p class="room-description">${U(d.description)}</p>`:""}
            </div>
            <div class="room-status">
              <span class="live-badge">${c("radio",16)} LIVE</span>
              <span class="participant-count">${p.length} ${p.length===1?"participant":"participants"}</span>
            </div>
          </div>

          <div class="audio-stage" id="audioStage">
            <div class="speakers-area">
              ${me(p.filter(b=>b.role==="host"||b.role==="speaker"))}
            </div>

            ${w?`
              <div class="ptt-status" id="pttStatus">
                <div class="ptt-indicator">
                  ${c("micOff",32)}
                </div>
                <p class="ptt-hint">Hold the button below or press <kbd>T</kbd> to talk</p>
              </div>
            `:`
              <div class="listener-status">
                <div class="listening-indicator">
                  ${c("headphones",32)}
                </div>
                <p>Listening to the conversation</p>
                <p class="listener-hint">Raise your hand if you'd like to speak</p>
              </div>
            `}
          </div>

          ${wt({role:i,isHost:g})}
        </div>
        <div class="room-sidebar">
          <div id="participantListContainer">
            ${de({participants:p,isHost:g,raisedHands:p.filter(b=>v.includes(b.userId))})}
          </div>
        </div>
      </div>
    `,y&&w&&(y.onTalkingStateChange=b=>{$t(o,b),St(o,b)}),kt(o,{onPTTStart:()=>{y&&y.startPTT()},onPTTEnd:()=>{y&&y.stopPTT()},onRaiseHand:async()=>{try{await C.raiseHand(t),L("Hand raised!")}catch(b){h(b.message)}},onLeave:async()=>{ae({title:"Leave Room",message:"Are you sure you want to leave this room?",confirmText:"Leave",danger:!0,onConfirm:async()=>{await Mt(t,o)}})},onEnd:async()=>{ae({title:"End Room",message:"Are you sure you want to end this room for everyone?",confirmText:"End Room",danger:!0,onConfirm:async()=>{await Bt(t,o)}})}});const B=o.querySelector("#participantListContainer");B&&ue(B,{onPromote:async b=>{try{await C.promoteSpeaker(t,b),L("User promoted to speaker");const{room:x}=await C.getById(t);B.innerHTML=de({participants:x.participants||[],isHost:g,raisedHands:(x.participants||[]).filter(F=>(x.raisedHands||[]).includes(F.userId))}),ue(B,{onPromote});const P=o.querySelector(".speakers-area");P&&(P.innerHTML=me((x.participants||[]).filter(F=>F.role==="host"||F.role==="speaker")))}catch(x){h(x.message)}}}),y&&(y.onSpeakingChange=(b,x)=>{const P=o.querySelector(`[data-speaker-id="${b}"]`);P&&P.classList.toggle("speaking",x)})}catch(a){h(a.message||"Failed to join room"),o.innerHTML=A({iconName:"alert",title:"Failed to join room",message:a.message,action:'<a href="#/rooms" class="btn btn-primary">Browse Rooms</a>'})}}function me(e){return!e||e.length===0?'<p class="no-speakers">No speakers yet</p>':e.map(t=>{var o,n,a,s;return`
    <div class="speaker-card" data-speaker-id="${t.userId}">
      <div class="speaker-avatar">
        ${(o=t.user)!=null&&o.avatar?`<img src="${t.user.avatar}" alt="${U(((n=t.user)==null?void 0:n.username)||"Speaker")}" />`:`<div class="avatar-placeholder">${(((a=t.user)==null?void 0:a.username)||"S")[0].toUpperCase()}</div>`}
        <div class="speaking-ring"></div>
      </div>
      <div class="speaker-info">
        <span class="speaker-name">${U(((s=t.user)==null?void 0:s.username)||"Unknown")}</span>
        ${t.role==="host"?`<span class="role-badge host">${c("crown",12)} Host</span>`:""}
      </div>
    </div>
  `}).join("")}function St(e,t){const o=e.querySelector("#pttStatus");if(o){const n=o.querySelector(".ptt-indicator"),a=o.querySelector(".ptt-hint");t?(o.classList.add("talking"),n.innerHTML=c("mic",32),a.textContent="You are transmitting..."):(o.classList.remove("talking"),n.innerHTML=c("micOff",32),a.innerHTML="Hold the button below or press <kbd>T</kbd> to talk")}}async function Mt(e,t){try{Te(t),y&&(await y.disconnect(),y=null),await C.leave(e),k("/rooms")}catch(o){h(o.message)}}async function Bt(e,t){try{Te(t),y&&(await y.disconnect(),y=null),await C.end(e),k("/rooms"),L("Room ended")}catch(o){h(o.message)}}function U(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}window.addEventListener("hashchange",()=>{y&&!window.location.hash.includes("/rooms/")&&(y.disconnect(),y=null)});function Pt({userId:e,isFollowing:t,size:o="default"}){const n=o==="sm"?"btn-sm":"";return t?`
      <button class="btn btn-secondary ${n}" data-follow-btn="${e}" data-following="true">
        ${c("userCheck",16)}
        <span>Following</span>
      </button>
    `:`
    <button class="btn btn-primary ${n}" data-follow-btn="${e}" data-following="false">
      ${c("userPlus",16)}
      <span>Follow</span>
    </button>
  `}function At(e){e.querySelectorAll("[data-follow-btn]").forEach(t=>{t.addEventListener("click",async()=>{if(!f.isAuthenticated){h("Please log in to follow users"),k("/login");return}const o=t.dataset.followBtn,n=t.dataset.following==="true";try{t.disabled=!0,n?(await N.unfollow(o),t.dataset.following="false",t.className=t.className.replace("btn-secondary","btn-primary"),t.innerHTML=`${c("userPlus",16)}<span>Follow</span>`,L("Unfollowed")):(await N.follow(o),t.dataset.following="true",t.className=t.className.replace("btn-primary","btn-secondary"),t.innerHTML=`${c("userCheck",16)}<span>Following</span>`,L("Following"))}catch(a){h(a.message||"Action failed")}finally{t.disabled=!1}})})}async function Ht({id:e}){return`
    <div class="profile-page">
      <div id="profileContent">
        ${j()}
      </div>
    </div>
  `}async function It(e,{id:t}){var n;const o=e.querySelector("#profileContent");if(o)try{const{user:a,isFollowing:s}=await N.getById(t),{posts:i}=await S.getByUser(t,{limit:20}),l=((n=f.user)==null?void 0:n._id)===a._id;o.innerHTML=`
      <div class="profile-header">
        <div class="profile-avatar">
          ${T({user:a,size:"xl",showOnline:!0})}
        </div>
        <div class="profile-info">
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
            <h1 class="profile-name">${a.displayName||a.username}</h1>
            ${l?`<a href="#/settings" class="btn btn-secondary btn-sm">${c("edit",16)} Edit Profile</a>`:Pt({userId:a._id,isFollowing:s})}
          </div>
          <p class="profile-username">@${a.username}</p>
          ${a.bio?`<p class="profile-bio">${Rt(a.bio)}</p>`:""}
          <div class="profile-stats">
            <div class="profile-stat">
              <div class="profile-stat-value">${a.postsCount||0}</div>
              <div class="profile-stat-label">Posts</div>
            </div>
            <div class="profile-stat">
              <div class="profile-stat-value">${a.followersCount||0}</div>
              <div class="profile-stat-label">Followers</div>
            </div>
            <div class="profile-stat">
              <div class="profile-stat-value">${a.followingCount||0}</div>
              <div class="profile-stat-label">Following</div>
            </div>
          </div>
        </div>
      </div>

      <div class="tabs">
        <button class="tab active" data-tab="posts">Posts</button>
        <button class="tab" data-tab="likes">Likes</button>
      </div>

      <div id="profilePosts">
        ${X(i,"No posts yet")}
      </div>
    `,At(o),Z(o);const r=o.querySelectorAll(".tab");r.forEach(u=>{u.addEventListener("click",()=>{r.forEach(d=>d.classList.remove("active")),u.classList.add("active")})})}catch(a){h(a.message||"Failed to load profile"),o.innerHTML=A({iconName:"user",title:"Profile not found",message:"This user may not exist or there was an error loading the profile.",action:'<a href="#/explore" class="btn btn-primary">Explore</a>'})}}function Rt(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}async function qt(){return`
    <div class="auth-page">
      <div class="auth-card card">
        <div class="card-body">
          <h1 style="text-align: center; margin-bottom: 0.5rem;">Welcome back</h1>
          <p style="text-align: center; color: var(--text-muted); margin-bottom: 1.5rem;">
            Sign in to your VoiceCircle account
          </p>
          <form id="loginForm">
            <div class="form-group">
              <label class="form-label" for="email">Email</label>
              <input type="email" id="email" name="email" class="form-input" placeholder="Enter your email" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="password">Password</label>
              <input type="password" id="password" name="password" class="form-input" placeholder="Enter your password" required>
            </div>
            <button type="submit" class="btn btn-primary btn-lg" style="width: 100%; margin-top: 0.5rem;">
              Sign in
            </button>
          </form>
          <p style="text-align: center; margin-top: 1.5rem; color: var(--text-secondary);">
            Don't have an account? <a href="#/register" style="color: var(--primary)">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  `}function Nt(e){const t=e.querySelector("#loginForm");t&&t.addEventListener("submit",async o=>{o.preventDefault();const n=t.querySelector('button[type="submit"]'),a=t.email.value.trim(),s=t.password.value;if(!a||!s){h("Please fill in all fields");return}try{n.disabled=!0,n.textContent="Signing in...",await Pe(a,s),k("/")}catch(i){h(i.message||"Login failed"),n.disabled=!1,n.textContent="Sign in"}})}async function jt(){return`
    <div class="auth-page">
      <div class="auth-card card">
        <div class="card-body">
          <h1 style="text-align: center; margin-bottom: 0.5rem;">Create account</h1>
          <p style="text-align: center; color: var(--text-muted); margin-bottom: 1.5rem;">
            Join VoiceCircle and start connecting
          </p>
          <form id="registerForm">
            <div class="form-group">
              <label class="form-label" for="username">Username</label>
              <input type="text" id="username" name="username" class="form-input" placeholder="Choose a username" required minlength="3" maxlength="30" pattern="[a-zA-Z0-9_]+">
              <small style="color: var(--text-muted); font-size: 0.75rem;">Letters, numbers, and underscores only</small>
            </div>
            <div class="form-group">
              <label class="form-label" for="displayName">Display name</label>
              <input type="text" id="displayName" name="displayName" class="form-input" placeholder="Your display name" maxlength="50">
            </div>
            <div class="form-group">
              <label class="form-label" for="email">Email</label>
              <input type="email" id="email" name="email" class="form-input" placeholder="Enter your email" required>
            </div>
            <div class="form-group">
              <label class="form-label" for="password">Password</label>
              <input type="password" id="password" name="password" class="form-input" placeholder="Choose a password" required minlength="6">
              <small style="color: var(--text-muted); font-size: 0.75rem;">At least 6 characters</small>
            </div>
            <button type="submit" class="btn btn-primary btn-lg" style="width: 100%; margin-top: 0.5rem;">
              Create account
            </button>
          </form>
          <p style="text-align: center; margin-top: 1.5rem; color: var(--text-secondary);">
            Already have an account? <a href="#/login" style="color: var(--primary)">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  `}function Ft(e){const t=e.querySelector("#registerForm");t&&t.addEventListener("submit",async o=>{o.preventDefault();const n=t.querySelector('button[type="submit"]'),a=t.username.value.trim(),s=t.displayName.value.trim(),i=t.email.value.trim(),l=t.password.value;if(!a||!i||!l){h("Please fill in all required fields");return}if(a.length<3){h("Username must be at least 3 characters");return}if(!/^[a-zA-Z0-9_]+$/.test(a)){h("Username can only contain letters, numbers, and underscores");return}if(l.length<6){h("Password must be at least 6 characters");return}try{n.disabled=!0,n.textContent="Creating account...",await Ae({username:a,displayName:s||a,email:i,password:l}),k("/")}catch(r){h(r.message||"Registration failed"),n.disabled=!1,n.textContent="Create account"}})}async function Dt(){const e=f.user;return e?`
    <div class="settings-page">
      <div class="page-header">
        <h1>Edit Profile</h1>
      </div>

      <form id="settingsForm" class="settings-form">
        <div class="settings-avatar-section">
          <div class="settings-avatar">
            ${T({user:e,size:"xl"})}
          </div>
          <div class="settings-avatar-upload">
            <input type="file" id="avatarInput" accept="image/*" hidden>
            <button type="button" id="changeAvatarBtn" class="btn btn-secondary btn-sm">
              ${c("edit",16)} Change Avatar
            </button>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="displayName">Display Name</label>
          <input
            type="text"
            id="displayName"
            name="displayName"
            class="form-input"
            value="${pe(e.displayName||"")}"
            placeholder="Your display name"
            maxlength="50"
          >
        </div>

        <div class="form-group">
          <label class="form-label" for="username">Username</label>
          <input
            type="text"
            id="username"
            class="form-input"
            value="@${pe(e.username)}"
            disabled
          >
          <small class="form-hint">Username cannot be changed</small>
        </div>

        <div class="form-group">
          <label class="form-label" for="bio">Bio</label>
          <textarea
            id="bio"
            name="bio"
            class="form-input"
            rows="3"
            placeholder="Tell us about yourself"
            maxlength="200"
          >${Ot(e.bio||"")}</textarea>
          <small class="form-hint"><span id="bioCount">${(e.bio||"").length}</span>/200</small>
        </div>

        <div class="form-actions">
          <button type="button" id="cancelBtn" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-primary">
            ${c("check",16)} Save Changes
          </button>
        </div>
      </form>
    </div>
  `:`<div class="settings-page">${j()}</div>`}function Ut(e){const t=e.querySelector("#settingsForm"),o=e.querySelector("#avatarInput"),n=e.querySelector("#changeAvatarBtn"),a=e.querySelector("#cancelBtn"),s=e.querySelector("#bio"),i=e.querySelector("#bioCount");t&&(s==null||s.addEventListener("input",()=>{i.textContent=s.value.length}),n==null||n.addEventListener("click",()=>{o.click()}),o==null||o.addEventListener("change",async l=>{const r=l.target.files[0];if(r){if(!r.type.startsWith("image/")){h("Please select an image file");return}if(r.size>5*1024*1024){h("Image must be less than 5MB");return}try{n.disabled=!0,n.innerHTML=`${c("loading",16)} Uploading...`;const{url:u}=await ge.uploadFile(r,"avatar"),{user:d}=await N.updateProfile({avatarUrl:u});Q(d);const p=e.querySelector(".settings-avatar");p&&(p.innerHTML=T({user:d,size:"xl"})),L("Avatar updated")}catch(u){h(u.message||"Failed to upload avatar")}finally{n.disabled=!1,n.innerHTML=`${c("edit",16)} Change Avatar`}}}),a==null||a.addEventListener("click",()=>{var r;const l=(r=f.user)==null?void 0:r._id;k(l?`/profile/${l}`:"/")}),t.addEventListener("submit",async l=>{l.preventDefault();const r=t.querySelector('button[type="submit"]'),u=new FormData(t);try{r.disabled=!0,r.innerHTML=`${c("loading",16)} Saving...`;const d={displayName:u.get("displayName"),bio:u.get("bio")},{user:p}=await N.updateProfile(d);Q(p),L("Profile updated"),k(`/profile/${p._id}`)}catch(d){h(d.message||"Failed to update profile"),r.disabled=!1,r.innerHTML=`${c("check",16)} Save Changes`}}))}function Ot(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function pe(e){return e.replace(/"/g,"&quot;").replace(/'/g,"&#39;")}M("/",{page:ct,attachEvents:dt,auth:!0});M("/explore",{page:ut,attachEvents:pt,auth:!1});M("/rooms",{page:ft,attachEvents:gt,auth:!1});M("/rooms/:id",{page:Et,attachEvents:Tt,auth:!0});M("/profile/:id",{page:Ht,attachEvents:It,auth:!1});M("/login",{page:qt,attachEvents:Nt,guestOnly:!0});M("/register",{page:jt,attachEvents:Ft,guestOnly:!0});M("/settings",{page:Dt,attachEvents:Ut,auth:!0});Ie(()=>{const e=document.getElementById("mainContent");e&&(e.innerHTML=A({iconName:"alert",title:"Page not found",message:"The page you are looking for does not exist.",action:'<a href="#/" class="btn btn-primary">Go Home</a>'}))});async function zt(){await Be(),ze(),_e(),je(),Y(e=>{const t=window.location.hash.slice(1)||"/";e.isAuthenticated&&(t==="/login"||t==="/register")&&k("/"),!e.isAuthenticated&&!e.isLoading&&(["/","/rooms/"].some(n=>t===n||n.endsWith("/")&&t.startsWith(n)),t.match(/^\/rooms\/[^\/]+$/)&&k("/login"))}),console.log("VoiceCircle initialized")}zt().catch(console.error);
