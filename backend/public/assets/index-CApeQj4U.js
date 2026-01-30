(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))n(a);new MutationObserver(a=>{for(const s of a)if(s.type==="childList")for(const i of s.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&n(i)}).observe(document,{childList:!0,subtree:!0});function o(a){const s={};return a.integrity&&(s.integrity=a.integrity),a.referrerPolicy&&(s.referrerPolicy=a.referrerPolicy),a.crossOrigin==="use-credentials"?s.credentials="include":a.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(a){if(a.ep)return;a.ep=!0;const s=o(a);fetch(a.href,s)}})();const ue="/api";class me extends Error{constructor(t,o,n){super(t),this.name="ApiError",this.status=o,this.data=n}}function pe(){return localStorage.getItem("voicecircle_token")}async function T(e,t={}){const o=`${ue}${e}`,n=pe(),a={headers:{"Content-Type":"application/json",...t.headers},...t};n&&(a.headers.Authorization=`Bearer ${n}`),t.body&&typeof t.body=="object"&&(a.body=JSON.stringify(t.body));const s=await fetch(o,a);let i;const r=s.headers.get("content-type");if(r&&r.includes("application/json")?i=await s.json():i=await s.text(),!s.ok)throw new me((i==null?void 0:i.error)||(i==null?void 0:i.message)||"An error occurred",s.status,i);return i}const m={get:(e,t={})=>T(e,{...t,method:"GET"}),post:(e,t,o={})=>T(e,{...o,method:"POST",body:t}),patch:(e,t,o={})=>T(e,{...o,method:"PATCH",body:t}),put:(e,t,o={})=>T(e,{...o,method:"PUT",body:t}),delete:(e,t={})=>T(e,{...t,method:"DELETE"})},j={register:e=>m.post("/auth/register",e),login:e=>m.post("/auth/login",e),logout:()=>m.post("/auth/logout"),getMe:()=>m.get("/auth/me"),refresh:()=>m.post("/auth/refresh")},L={getFeed:(e={})=>m.get(`/posts/feed?limit=${e.limit||20}&skip=${e.skip||0}`),getExplore:(e={})=>m.get(`/posts/explore?limit=${e.limit||20}&skip=${e.skip||0}`),getById:e=>m.get(`/posts/${e}`),getByUser:(e,t={})=>m.get(`/posts/user/${e}?limit=${t.limit||20}&skip=${t.skip||0}`),create:e=>m.post("/posts",e),like:e=>m.post(`/posts/${e}/like`),getComments:e=>m.get(`/posts/${e}/comments`),addComment:(e,t)=>m.post(`/posts/${e}/comments`,t),delete:e=>m.delete(`/posts/${e}`)},P={getById:e=>m.get(`/users/${e}`),getByUsername:e=>m.get(`/users/username/${e}`),search:(e,t=20)=>m.get(`/users?q=${encodeURIComponent(e)}&limit=${t}`),updateProfile:e=>m.patch("/users/me",e),follow:e=>m.post(`/users/${e}/follow`),unfollow:e=>m.delete(`/users/${e}/follow`),getFollowers:e=>m.get(`/users/${e}/followers`),getFollowing:e=>m.get(`/users/${e}/following`)},$={getAll:()=>m.get("/rooms"),getById:e=>m.get(`/rooms/${e}`),create:e=>m.post("/rooms",e),join:e=>m.post(`/rooms/${e}/join`),leave:e=>m.post(`/rooms/${e}/leave`),raiseHand:e=>m.post(`/rooms/${e}/raise-hand`),lowerHand:e=>m.post(`/rooms/${e}/lower-hand`),promoteSpeaker:(e,t)=>m.post(`/rooms/${e}/speakers/${t}`),demoteSpeaker:(e,t)=>m.delete(`/rooms/${e}/speakers/${t}`),end:e=>m.post(`/rooms/${e}/end`),getSignaling:e=>m.get(`/rooms/${e}/signaling`)},ve={uploadFile:async(e,t="audio")=>{const o=new FormData;o.append("file",e);let n;switch(t){case"audio":case"voice":n="/upload/voice";break;case"video":n="/upload/video";break;case"avatar":case"image":n="/upload/avatar";break;default:n="/upload/voice"}const a=pe(),s=await fetch(`${ue}${n}`,{method:"POST",headers:a?{Authorization:`Bearer ${a}`}:{},body:o});if(!s.ok){const i=await s.json().catch(()=>({error:"Upload failed"}));throw new me((i==null?void 0:i.error)||"Upload failed",s.status,i)}return s.json()}},z="voicecircle_token",O="voicecircle_user",D=new Set,h={user:null,token:null,isAuthenticated:!1,isLoading:!0};function x(e){Object.assign(h,e),D.forEach(t=>t(h))}function V(e){return D.add(e),()=>D.delete(e)}function Ce(){return localStorage.getItem(z)}function F(e){e?localStorage.setItem(z,e):localStorage.removeItem(z)}function Ee(){try{const e=localStorage.getItem(O);return e?JSON.parse(e):null}catch{return null}}function M(e){e?localStorage.setItem(O,JSON.stringify(e)):localStorage.removeItem(O)}async function Se(){const e=Ce(),t=Ee();if(!e){x({user:null,token:null,isAuthenticated:!1,isLoading:!1});return}try{const{user:o}=await j.getMe();M(o),x({user:o,token:e,isAuthenticated:!0,isLoading:!1})}catch(o){o.status===401?(F(null),M(null),x({user:null,token:null,isAuthenticated:!1,isLoading:!1})):x(t?{user:t,token:e,isAuthenticated:!0,isLoading:!1}:{user:null,token:null,isAuthenticated:!1,isLoading:!1})}}async function Me(e,t){const{user:o,token:n}=await j.login({email:e,password:t});return F(n),M(o),x({user:o,token:n,isAuthenticated:!0,isLoading:!1}),{user:o,token:n}}async function Be(e){const{user:t,token:o}=await j.register(e);return F(o),M(t),x({user:t,token:o,isAuthenticated:!0,isLoading:!1}),{user:t,token:o}}async function Te(){try{await j.logout()}catch{}F(null),M(null),x({user:null,token:null,isAuthenticated:!1,isLoading:!1})}function K(e){const t={...h.user,...e};M(t),x({user:t})}const N={};let _=null;function C(e,t){N[e]=t}function He(e){_=e}function y(e){window.location.hash=e.startsWith("#")?e:`#${e}`}function Pe(){return(window.location.hash||"#/").slice(1)||"/"}function Ae(e){if(N[e])return{route:N[e],params:{}};for(const[t,o]of Object.entries(N)){const n=[],a=t.replace(/:([^/]+)/g,(r,c)=>(n.push(c),"([^/]+)")),s=new RegExp(`^${a}$`),i=e.match(s);if(i){const r={};return n.forEach((c,d)=>{r[c]=i[d+1]}),{route:o,params:r}}}return null}async function Z(){const e=Pe(),t=Ae(e);if(!t){_&&await _();return}const{route:o,params:n}=t;if(o.auth&&!h.isAuthenticated){y("/login");return}if(o.guestOnly&&h.isAuthenticated){y("/");return}qe(e);const a=document.getElementById("mainContent");if(a&&o.page)try{const s=await o.page(n);a.innerHTML=s,o.attachEvents&&o.attachEvents(a,n)}catch(s){console.error("Error rendering page:",s),a.innerHTML=`
        <div class="empty-state">
          <h3>Something went wrong</h3>
          <p>${s.message}</p>
        </div>
      `}}function qe(e){document.querySelectorAll(".nav-link").forEach(n=>{var s;const a=((s=n.getAttribute("href"))==null?void 0:s.slice(1))||"/";n.classList.toggle("active",a===e||e.startsWith(a)&&a!=="/")}),document.querySelectorAll(".mobile-nav-item").forEach(n=>{var s;const a=((s=n.getAttribute("href"))==null?void 0:s.slice(1))||"/";n.classList.toggle("active",a===e||e.startsWith(a)&&a!=="/")})}function Re(){Z(),window.addEventListener("hashchange",Z),document.addEventListener("click",e=>{e.target.closest('a[href^="#"]')})}function k({user:e,size:t="default",showOnline:o=!1,clickable:n=!1}){const a=t==="sm"?"avatar-sm":t==="lg"?"avatar-lg":t==="xl"?"avatar-xl":"",s=((e==null?void 0:e.displayName)||(e==null?void 0:e.username)||"?")[0].toUpperCase(),i=n?`href="#/profile/${e==null?void 0:e._id}"`:"",r=e!=null&&e.avatarUrl?`<img src="${e.avatarUrl}" alt="${e.displayName||e.username}">`:s,c=o&&(e!=null&&e.online)?'<span class="online-indicator"></span>':"",d=n?"a":"span";return`
    <${d} ${i} class="avatar-wrapper">
      <div class="avatar ${a}">
        ${r}
      </div>
      ${c}
    </${d}>
  `}function Ne({users:e,max:t=3,size:o="sm"}){const n=e.slice(0,t),a=e.length-t;return`
    <div class="avatars">
      ${n.map(s=>k({user:s,size:o})).join("")}
      ${a>0?`<div class="avatar avatar-sm" style="background: var(--bg-tertiary)">+${a}</div>`:""}
    </div>
  `}const je={home:`<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
  </svg>`};function l(e,t=24){const o=je[e]||"";return t!==24?o.replace(/width="24"/,`width="${t}"`).replace(/height="24"/,`height="${t}"`):o}function Fe(e){return`
    <div class="user-menu">
      <button class="user-menu-trigger" id="userMenuTrigger">
        ${k({user:e,size:"sm"})}
        <span style="color: var(--text-primary)">${e.displayName||e.username}</span>
        ${l("chevronDown",16)}
      </button>
      <div class="user-menu-dropdown" id="userMenuDropdown">
        <a href="#/profile/${e._id}" class="user-menu-item">
          ${l("user",18)}
          <span>Profile</span>
        </a>
        <a href="#/settings" class="user-menu-item">
          ${l("settings",18)}
          <span>Settings</span>
        </a>
        <div class="user-menu-divider"></div>
        <button class="user-menu-item danger" id="logoutBtn">
          ${l("logOut",18)}
          <span>Log out</span>
        </button>
      </div>
    </div>
  `}function Ie(e){const t=e.querySelector("#userMenuTrigger"),o=e.querySelector("#userMenuDropdown"),n=e.querySelector("#logoutBtn");t&&o&&(t.addEventListener("click",a=>{a.stopPropagation(),o.classList.toggle("open")}),document.addEventListener("click",a=>{!o.contains(a.target)&&!t.contains(a.target)&&o.classList.remove("open")}),o.querySelectorAll("a").forEach(a=>{a.addEventListener("click",()=>{o.classList.remove("open")})})),n&&n.addEventListener("click",async()=>{await Te(),y("/login")})}function X(){const e=document.getElementById("navActions");if(e){if(h.isLoading){e.innerHTML="";return}h.isAuthenticated&&h.user?(e.innerHTML=Fe(h.user),Ie(e)):e.innerHTML=`
      <a href="#/login" class="btn btn-secondary">Log in</a>
      <a href="#/register" class="btn btn-primary">Sign up</a>
    `}}function Ue(){X(),V(X)}function Q(){const e=document.getElementById("mobileNav");if(!e)return;const t=e.querySelector('[data-page="profile"]');t&&(h.isAuthenticated&&h.user?t.href=`#/profile/${h.user._id}`:t.href="#/login")}function ze(){Q(),V(Q),window.addEventListener("hashchange",ee),ee()}function ee(){const e=window.location.hash.slice(1)||"/",t=document.getElementById("mobileNav");t&&t.querySelectorAll(".mobile-nav-item").forEach(o=>{var s;const n=((s=o.getAttribute("href"))==null?void 0:s.slice(1))||"/",a=n===e||e.startsWith(n)&&n!=="/";o.classList.toggle("active",a)})}function S({iconName:e="info",title:t,message:o,action:n}){return`
    <div class="empty-state">
      ${l(e,64)}
      <h3>${t}</h3>
      <p>${o}</p>
      ${n?`<div style="margin-top: 1rem">${n}</div>`:""}
    </div>
  `}function W(e){const t=new Date(e),n=new Date-t,a=Math.floor(n/1e3),s=Math.floor(a/60),i=Math.floor(s/60),r=Math.floor(i/24);return a<60?"just now":s<60?`${s}m ago`:i<24?`${i}h ago`:r<7?`${r}d ago`:t.toLocaleDateString("en-US",{month:"short",day:"numeric"})}function I(e){if(!isFinite(e)||e<0)return"0:00";const t=Math.floor(e/60),o=Math.floor(e%60);return`${t}:${o.toString().padStart(2,"0")}`}function he({src:e,postId:t}){return`
    <div class="audio-player" data-audio-player="${t}">
      <button class="audio-play-btn" data-play-btn="${t}">
        ${l("play",24)}
      </button>
      <div class="audio-waveform" data-waveform="${t}">
        <div class="audio-progress" style="width: 0%; height: 100%; background: var(--primary);"></div>
      </div>
      <span class="audio-time" data-time="${t}">0:00</span>
      <audio src="${e}" data-audio="${t}" preload="metadata"></audio>
    </div>
  `}function Oe(e){e.querySelectorAll("[data-audio-player]").forEach(o=>{const n=o.dataset.audioPlayer,a=o.querySelector(`[data-play-btn="${n}"]`),s=o.querySelector(`[data-audio="${n}"]`),i=o.querySelector(`[data-waveform="${n}"]`),r=o.querySelector(`[data-time="${n}"]`),c=i.querySelector(".audio-progress");!a||!s||(s.addEventListener("loadedmetadata",()=>{const d=s.duration;isFinite(d)&&d>0?r.textContent=I(d):r.textContent="0:00"}),s.addEventListener("error",d=>{r.textContent="0:00",console.warn("Failed to load audio:",s.src)}),a.addEventListener("click",()=>{s.paused?(document.querySelectorAll("audio").forEach(d=>{if(d!==s){d.pause();const u=d.closest("[data-audio-player]");if(u){const v=u.querySelector(".audio-play-btn");v&&(v.innerHTML=l("play",24))}}}),s.play(),a.innerHTML=l("pause",24)):(s.pause(),a.innerHTML=l("play",24))}),s.addEventListener("timeupdate",()=>{const d=s.currentTime/s.duration*100;c.style.width=`${d}%`,r.textContent=I(s.currentTime)}),s.addEventListener("ended",()=>{a.innerHTML=l("play",24),c.style.width="0%",r.textContent=I(s.duration)}),i.addEventListener("click",d=>{const u=i.getBoundingClientRect(),v=(d.clientX-u.left)/u.width;s.currentTime=v*s.duration}))})}let De=0;function fe({title:e,content:t,footer:o,size:n="default",onClose:a}){const s=++De;return`
    <div class="modal-overlay" id="modal-${s}" data-modal-id="${s}">
      <div class="modal ${n==="large"?"modal-lg":n==="small"?"modal-sm":""}">
        <div class="modal-header">
          <h2 class="modal-title">${e}</h2>
          <button class="modal-close" data-close-modal="${s}">
            ${l("x",20)}
          </button>
        </div>
        <div class="modal-body">
          ${t}
        </div>
        ${o?`<div class="modal-footer">${o}</div>`:""}
      </div>
    </div>
  `}function ge(e,t){const o=document.getElementById("modals");if(!o)return null;o.innerHTML=e;const n=o.querySelector(".modal-overlay");if(n){n.addEventListener("click",i=>{i.target===n&&(H(),t&&t())});const a=n.querySelector("[data-close-modal]");a&&a.addEventListener("click",()=>{H(),t&&t()});const s=i=>{i.key==="Escape"&&(H(),t&&t(),document.removeEventListener("keydown",s))};document.addEventListener("keydown",s)}return n}function H(){const e=document.getElementById("modals");e&&(e.innerHTML="")}function _e({title:e,message:t,confirmText:o="Confirm",cancelText:n="Cancel",danger:a=!1}){return fe({title:e,content:`<p style="color: var(--text-secondary)">${t}</p>`,footer:`
      <button class="btn btn-secondary" data-action="cancel">${n}</button>
      <button class="btn ${a?"btn-danger":"btn-primary"}" data-action="confirm">${o}</button>
    `})}function te({title:e,message:t,confirmText:o,cancelText:n,danger:a,onConfirm:s,onCancel:i}){const r=_e({title:e,message:t,confirmText:o,cancelText:n,danger:a}),c=ge(r);if(c){const d=c.querySelector('[data-action="confirm"]'),u=c.querySelector('[data-action="cancel"]');d&&d.addEventListener("click",()=>{H(),s&&s()}),u&&u.addEventListener("click",()=>{H(),i&&i()})}return c}let Ve=0;function ye(e,t="info",o=3e3){const n=document.getElementById("toastContainer");if(!n)return;const a=++Ve,s=document.createElement("div");return s.className=`toast ${t}`,s.id=`toast-${a}`,s.innerHTML=`
    <span>${e}</span>
    <button class="btn-icon" onclick="this.parentElement.remove()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `,n.appendChild(s),o>0&&setTimeout(()=>{s.style.animation="slideIn 0.3s ease reverse",setTimeout(()=>s.remove(),300)},o),a}function w(e){return ye(e,"success")}function p(e){return ye(e,"error",5e3)}function We(e){const t=fe({title:"Comments",content:`
      <div id="comments-container">
        <div class="loading-comments">
          <div class="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    `,size:"large",onClose:()=>{}});ge(t,()=>{}),be(e)}async function be(e){try{const t=document.getElementById("comments-container");if(!t)return;const{post:o}=await L.getById(e),{comments:n}=await L.getComments(e);t.innerHTML=`
      <div class="original-post">
        ${Ge(o)}
      </div>
      <div class="comments-section">
        <div class="comments-list" id="comments-list">
          ${n.length>0?n.map(Ye).join(""):'<p class="no-comments">No comments yet. Be the first!</p>'}
        </div>
        ${h.isAuthenticated?Je(e):'<p class="login-prompt">Please log in to comment.</p>'}
      </div>
    `,Ke(e)}catch(t){console.error("Failed to load comments:",t);const o=document.getElementById("comments-container");o&&(o.innerHTML='<p class="error">Failed to load comments. Please try again.</p>')}}function Ge(e){const{_id:t,author:o,content:n,type:a,mediaUrl:s,createdAt:i}=e,r=a==="voice"&&s?he({src:s,postId:t}):"";return`
    <div class="post-card modal-post">
      <div class="post-header">
        ${k({user:o,clickable:!1})}
        <div class="post-author">
          <span class="post-author-name">${(o==null?void 0:o.displayName)||(o==null?void 0:o.username)||"Unknown"}</span>
          <span class="post-author-username">@${(o==null?void 0:o.username)||"unknown"}</span>
        </div>
        <span class="post-time">${W(i)}</span>
      </div>
      ${n?`<div class="post-content">${we(n)}</div>`:""}
      ${r?`<div class="post-media">${r}</div>`:""}
    </div>
  `}function Ye(e){return`
    <div class="comment">
      <div class="comment-header">
        ${k({user:e,clickable:!1})}
        <div class="comment-author">
          <span class="comment-author-name">${e.displayName||e.username}</span>
          <span class="comment-time">${W(e.createdAt)}</span>
        </div>
      </div>
      <div class="comment-content">${we(e.content)}</div>
    </div>
  `}function Je(e){return`
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
            ${l("send",16)} Comment
          </button>
        </div>
      </div>
    </div>
  `}function Ke(e){const t=document.getElementById("comment-input"),o=document.getElementById("comment-char-count"),n=document.getElementById("submit-comment");t&&o&&t.addEventListener("input",()=>{o.textContent=t.value.length}),n&&n.addEventListener("click",async()=>{const a=t.value.trim();if(!a){p("Please write something");return}try{n.disabled=!0,n.innerHTML="Posting...",await L.addComment(e,{content:a}),w("Comment added!"),await be(e)}catch(s){p(s.message||"Failed to add comment"),n.disabled=!1,n.innerHTML=`${l("send",16)} Comment`}})}function we(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function Ze(e){const{_id:t,author:o,content:n,type:a,mediaUrl:s,likesCount:i,commentsCount:r,isLiked:c,createdAt:d}=e,u=a==="voice"&&s?he({src:s,postId:t}):a==="video"&&s?`<video src="${s}" controls class="post-video" style="width: 100%; border-radius: 8px;"></video>`:"",v=l(c?"heartFilled":"heart",20);return`
    <article class="post-card" data-post-id="${t}">
      <div class="post-header">
        ${k({user:o,clickable:!0,showOnline:!0})}
        <div class="post-author">
          <a href="#/profile/${o==null?void 0:o._id}" class="post-author-name">${(o==null?void 0:o.displayName)||(o==null?void 0:o.username)||"Unknown"}</a>
          <span class="post-author-username">@${(o==null?void 0:o.username)||"unknown"}</span>
        </div>
        <span class="post-time">${W(d)}</span>
      </div>
      ${n?`<div class="post-content">${Xe(n)}</div>`:""}
      ${u?`<div class="post-media">${u}</div>`:""}
      <div class="post-actions">
        <button class="post-action ${c?"liked":""}" data-like-btn="${t}">
          ${v}
          <span data-likes-count="${t}">${i||0}</span>
        </button>
        <button class="post-action" data-comment-btn="${t}">
          ${l("comment",20)}
          <span>${r||0}</span>
        </button>
        <button class="post-action" data-share-btn="${t}">
          ${l("share",20)}
          <span>Share</span>
        </button>
      </div>
    </article>
  `}function Xe(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function Qe(e){e.querySelectorAll("[data-like-btn]").forEach(t=>{t.addEventListener("click",async()=>{if(!h.isAuthenticated){p("Please log in to like posts");return}const o=t.dataset.likeBtn;e.querySelector(`[data-likes-count="${o}"]`);try{const{liked:n,likesCount:a}=await L.like(o);t.classList.toggle("liked",n),t.innerHTML=`${l(n?"heartFilled":"heart",20)}<span data-likes-count="${o}">${a}</span>`}catch(n){p(n.message||"Failed to like post")}})}),e.querySelectorAll("[data-comment-btn]").forEach(t=>{t.addEventListener("click",()=>{const o=t.dataset.commentBtn;We(o)})}),e.querySelectorAll("[data-share-btn]").forEach(t=>{t.addEventListener("click",()=>{const o=t.dataset.shareBtn,n=`${window.location.origin}/#/post/${o}`;navigator.share?navigator.share({url:n}).catch(()=>{}):navigator.clipboard&&navigator.clipboard.writeText(n).then(()=>{w("Link copied to clipboard")})})})}function A(e="default"){return`
    <div class="loading">
      <div class="spinner ${e==="small"?"spinner-sm":""}"></div>
    </div>
  `}function G(e,t="No posts yet"){return!e||e.length===0?S({iconName:"radio",title:"No posts",message:t}):`
    <div class="post-list">
      ${e.map(o=>Ze(o)).join("")}
    </div>
  `}function ke(){return A()}function Y(e){Qe(e),Oe(e)}function et(e,t="audio/webm"){const o={mimeType:t};let n=[],a;try{a=new MediaRecorder(e,o)}catch{a=new MediaRecorder(e)}return a.ondataavailable=s=>{s.data.size>0&&n.push(s.data)},{recorder:a,start:()=>{n=[],a.start(100)},stop:()=>new Promise(s=>{a.onstop=()=>{const i=new Blob(n,{type:a.mimeType});s(i)},a.stop()}),getChunks:()=>n}}async function tt(){try{return{stream:await navigator.mediaDevices.getUserMedia({audio:!0}),error:null}}catch(e){let t="Could not access microphone";return e.name==="NotAllowedError"?t="Microphone access was denied. Please allow microphone access in your browser settings.":e.name==="NotFoundError"&&(t="No microphone found. Please connect a microphone and try again."),{stream:null,error:t}}}function oe(e){e&&e.getTracks().forEach(t=>t.stop())}function ne(e){const t=Math.floor(e/60),o=Math.floor(e%60);return`${t}:${o.toString().padStart(2,"0")}`}function ot(){return`
    <div class="audio-recorder" id="audioRecorder">
      <button class="record-btn" id="recordBtn">
        ${l("mic",32)}
      </button>
      <span class="record-time" id="recordTime">0:00</span>
      <span class="record-status" id="recordStatus">Tap to record</span>
    </div>
    <div id="audioPreview" style="display: none; margin-top: 1rem;"></div>
  `}function nt(e,t){const o=e.querySelector("#recordBtn"),n=e.querySelector("#recordTime"),a=e.querySelector("#recordStatus"),s=e.querySelector("#audioPreview");let i=null,r=null,c=!1,d=null,u=0,v=null;o.addEventListener("click",async()=>{c?b():await f()});async function f(){const B=await tt();if(B.error){a.textContent=B.error;return}i=B.stream,r=et(i),c=!0,u=0,o.classList.add("recording"),o.innerHTML=l("mic",32),a.textContent="Recording...",r.start(),d=setInterval(()=>{u++,n.textContent=ne(u),u>=60&&b()},1e3)}async function b(){c=!1,o.classList.remove("recording"),o.innerHTML=l("mic",32),a.textContent="Tap to record again",clearInterval(d),r&&(v=await r.stop(),E(v),t&&t(v)),oe(i),i=null}function E(B){const J=URL.createObjectURL(B);s.style.display="block",s.innerHTML=`
      <div class="audio-player" style="background: var(--bg-secondary);">
        <button class="audio-play-btn" id="previewPlayBtn">
          ${l("play",24)}
        </button>
        <audio id="previewAudio" src="${J}"></audio>
        <span class="audio-time">${ne(u)}</span>
        <button class="btn btn-secondary btn-sm" id="discardBtn" style="margin-left: auto;">Discard</button>
      </div>
    `;const q=s.querySelector("#previewPlayBtn"),R=s.querySelector("#previewAudio"),Le=s.querySelector("#discardBtn");q.addEventListener("click",()=>{R.paused?(R.play(),q.innerHTML=l("pause",24)):(R.pause(),q.innerHTML=l("play",24))}),R.addEventListener("ended",()=>{q.innerHTML=l("play",24)}),Le.addEventListener("click",()=>{URL.revokeObjectURL(J),s.style.display="none",s.innerHTML="",v=null,u=0,n.textContent="0:00",a.textContent="Tap to record",t&&t(null)})}return()=>{i&&oe(i),d&&clearInterval(d)}}function at(){return`
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
            ${l("edit",16)} Text
          </button>
          <button class="btn btn-secondary btn-sm post-type-btn" data-type="voice">
            ${l("mic",16)} Voice
          </button>
        </div>

        <div id="voiceRecorderSection" style="display: none;">
          ${ot()}
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1rem;">
          <button class="btn btn-secondary" id="cancelPostBtn">Cancel</button>
          <button class="btn btn-primary" id="submitPostBtn">
            ${l("send",16)} Post
          </button>
        </div>
      </div>
    </div>
  `}function st(e,t){const o=e.querySelector("#postContent"),n=e.querySelector("#charCount"),a=e.querySelectorAll(".post-type-btn"),s=e.querySelector("#voiceRecorderSection"),i=e.querySelector("#cancelPostBtn"),r=e.querySelector("#submitPostBtn");let c="text",d=null,u=null;o.addEventListener("input",()=>{n.textContent=o.value.length}),a.forEach(v=>{v.addEventListener("click",()=>{a.forEach(f=>f.classList.remove("active")),v.classList.add("active"),c=v.dataset.type,c==="voice"?(s.style.display="block",u=nt(s,f=>{d=f})):(s.style.display="none",d=null,u&&(u(),u=null))})}),i.addEventListener("click",()=>{u&&u(),t&&t(null)}),r.addEventListener("click",async()=>{const v=o.value.trim();if(c==="text"&&!v){p("Please write something");return}if(c==="voice"&&!d&&!v){p("Please record audio or write something");return}try{r.disabled=!0,r.innerHTML="Posting...";let f=null;if(d){const b=new File([d],"recording.webm",{type:d.type});f=(await ve.uploadFile(b,"audio")).url}await L.create({type:c,content:v,mediaUrl:f}),w("Post created!"),u&&u(),t&&t(!0)}catch(f){p(f.message||"Failed to create post"),r.disabled=!1,r.innerHTML=`${l("send",16)} Post`}})}let ae=[];async function it(){return setTimeout($e,0),`
    <div class="home-page">
      <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h1>Home</h1>
          <p style="color: var(--text-muted)">Your personalized feed</p>
        </div>
        <button class="btn btn-primary" id="createPostBtn">
          ${l("plus",20)}
          <span>New Post</span>
        </button>
      </div>
      <div id="postComposerContainer"></div>
      <div id="feedContent">
        ${ke()}
      </div>
    </div>
  `}async function $e(){const e=document.getElementById("feedContent");if(e)try{ae=(await L.getFeed({limit:20})).posts||[];const o="Your feed is empty. Follow some users or explore to find content!";e.innerHTML=G(ae,o),Y(e)}catch(t){p(t.message||"Failed to load feed"),e.innerHTML=`
      <div class="empty-state">
        <h3>Failed to load feed</h3>
        <p>${t.message}</p>
        <button class="btn btn-primary" onclick="location.reload()">Try again</button>
      </div>
    `}}function rt(e){const t=e.querySelector("#createPostBtn"),o=e.querySelector("#postComposerContainer");t&&o&&t.addEventListener("click",()=>{o.innerHTML?o.innerHTML="":(o.innerHTML=at(),st(o,()=>{o.innerHTML="",$e()}))})}let se=[],xe=!0;async function lt(){return xe=!0,setTimeout(ct,0),`
    <div class="explore-page">
      <div class="page-header" style="margin-bottom: 1.5rem;">
        <h1>Explore</h1>
        <p style="color: var(--text-muted)">Discover voice posts from the community</p>
      </div>
      <div id="exploreContent">
        ${ke()}
      </div>
    </div>
  `}async function ct(){const e=document.getElementById("exploreContent");if(e)try{se=(await L.getExplore({limit:20})).posts||[],xe=!1,e.innerHTML=G(se,"No posts yet. Be the first to share your voice!"),Y(e)}catch(t){p(t.message||"Failed to load posts"),e.innerHTML=`
      <div class="empty-state">
        <h3>Failed to load posts</h3>
        <p>${t.message}</p>
        <button class="btn btn-primary" onclick="location.reload()">Try again</button>
      </div>
    `}}function dt(e){}function ut(e){const{_id:t,name:o,description:n,host:a,participants:s=[],participantCount:i=0,isLive:r}=e,c=s.slice(0,3).map(d=>d.user).filter(Boolean);return`
    <div class="room-card" data-room-id="${t}">
      <div class="room-header">
        <h3 class="room-title">${ie(o)}</h3>
        ${r?'<span class="room-live-badge">LIVE</span>':""}
      </div>
      ${n?`<p class="room-description">${ie(n)}</p>`:""}
      <div class="room-footer">
        <div class="room-participants">
          ${c.length>0?Ne({users:c,max:3,size:"sm"}):""}
          <span class="room-count">${i} listening</span>
        </div>
        <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-muted);">
          ${l("headphones",16)}
          <span style="font-size: 0.875rem;">Hosted by ${(a==null?void 0:a.displayName)||(a==null?void 0:a.username)||"Unknown"}</span>
        </div>
      </div>
    </div>
  `}function ie(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function mt(e){e.querySelectorAll("[data-room-id]").forEach(t=>{t.addEventListener("click",()=>{const o=t.dataset.roomId;window.location.hash=`#/rooms/${o}`})})}async function pt(){return`
    <div class="rooms-page">
      <div class="page-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <div>
          <h1>Live Rooms</h1>
          <p style="color: var(--text-muted)">Join live audio conversations</p>
        </div>
        ${h.isAuthenticated?`
          <button class="btn btn-primary" id="createRoomBtn">
            ${l("plus",20)}
            <span>Start Room</span>
          </button>
        `:""}
      </div>
      <div id="roomsContent">
        ${A()}
      </div>
    </div>
  `}function vt(e){ht(e);const t=e.querySelector("#createRoomBtn");t&&t.addEventListener("click",()=>{ft()})}async function ht(e){const t=e.querySelector("#roomsContent");if(t)try{const{rooms:o}=await $.getAll();if(!o||o.length===0){t.innerHTML=S({iconName:"users",title:"No live rooms",message:"Be the first to start a conversation!",action:h.isAuthenticated?`<button class="btn btn-primary" onclick="document.getElementById('createRoomBtn')?.click()">Start a Room</button>`:'<a href="#/login" class="btn btn-primary">Sign in to start a room</a>'});return}t.innerHTML=`
      <div class="rooms-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">
        ${o.map(n=>ut(n)).join("")}
      </div>
    `,mt(t)}catch(o){p(o.message||"Failed to load rooms"),t.innerHTML=S({iconName:"alert",title:"Failed to load rooms",message:o.message,action:'<button class="btn btn-primary" onclick="location.reload()">Try again</button>'})}}function ft(){const e=`
    <div class="modal-overlay" id="createRoomModal">
      <div class="modal">
        <div class="modal-header">
          <h2 class="modal-title">Start a Room</h2>
          <button class="modal-close" id="closeCreateRoom">
            ${l("x",20)}
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
            ${l("radio",16)} Go Live
          </button>
        </div>
      </div>
    </div>
  `,t=document.getElementById("modals");t.innerHTML=e;const o=t.querySelector("#createRoomModal"),n=t.querySelector("#closeCreateRoom"),a=t.querySelector("#cancelCreateRoom"),s=t.querySelector("#submitCreateRoom"),i=t.querySelector("#createRoomForm"),r=()=>{t.innerHTML=""};o.addEventListener("click",c=>{c.target===o&&r()}),n.addEventListener("click",r),a.addEventListener("click",r),s.addEventListener("click",async()=>{const c=i.roomName.value.trim(),d=i.roomDescription.value.trim();if(!c){p("Please enter a room name");return}try{s.disabled=!0,s.textContent="Creating...";const{room:u}=await $.create({name:c,description:d});r(),y(`/rooms/${u._id}`)}catch(u){p(u.message||"Failed to create room"),s.disabled=!1,s.innerHTML=`${l("radio",16)} Go Live`}})}function gt({participant:e,isMuted:t=!1,isSpeaking:o=!1}){const{user:n,role:a}=e,s=a==="host"?"Host":a==="speaker"?"Speaker":"Listener";return`
    <div class="speaker-tile ${o?"speaking":""}" data-participant-id="${n._id}">
      ${k({user:n,size:"lg"})}
      <span class="speaker-name">${n.displayName||n.username}</span>
      <span class="speaker-role">${s}</span>
      ${t?`<span class="speaker-muted">${l("micOff",16)}</span>`:""}
    </div>
  `}function yt(e){const t=e.filter(o=>o.role==="host"||o.role==="speaker");return t.length===0?'<p style="color: var(--text-muted); text-align: center;">No speakers yet</p>':t.map(o=>gt({participant:o})).join("")}function bt({isMuted:e=!0,role:t="listener",isHost:o=!1}){return`
    <div class="room-controls">
      ${t==="host"||t==="speaker"?`
        <button class="control-btn ${e?"muted":""}" id="muteBtn" title="${e?"Unmute":"Mute"}">
          ${l(e?"micOff":"mic",24)}
        </button>
      `:`
        <button class="control-btn" id="raiseHandBtn" title="Raise hand">
          ${l("hand",24)}
        </button>
      `}
      <button class="control-btn leave" id="leaveRoomBtn" title="Leave room">
        ${l("phoneOff",24)}
      </button>
      ${o?`
        <button class="control-btn" id="endRoomBtn" title="End room" style="background: var(--danger);">
          ${l("x",24)}
        </button>
      `:""}
    </div>
  `}function wt(e,t={}){const o=e.querySelector("#muteBtn"),n=e.querySelector("#raiseHandBtn"),a=e.querySelector("#leaveRoomBtn"),s=e.querySelector("#endRoomBtn");o&&t.onToggleMute&&o.addEventListener("click",()=>{const i=o.classList.contains("muted");t.onToggleMute(!i),o.classList.toggle("muted"),o.innerHTML=l(i?"mic":"micOff",24)}),n&&t.onRaiseHand&&n.addEventListener("click",()=>{t.onRaiseHand()}),a&&t.onLeave&&a.addEventListener("click",()=>{t.onLeave()}),s&&t.onEnd&&s.addEventListener("click",()=>{t.onEnd()})}function re({participants:e,isHost:t=!1,raisedHands:o=[]}){const n=e.filter(s=>s.role==="host"||s.role==="speaker"),a=e.filter(s=>s.role==="listener");return`
    <div class="participants-list">
      <h3>Speakers (${n.length})</h3>
      ${n.map(s=>U({participant:s,isHost:t})).join("")}

      ${o.length>0?`
        <h3 style="margin-top: 1rem;">Raised Hands (${o.length})</h3>
        ${o.map(s=>U({participant:s,isHost:t,hasRaisedHand:!0})).join("")}
      `:""}

      ${a.length>0?`
        <h3 style="margin-top: 1rem;">Listeners (${a.length})</h3>
        ${a.map(s=>U({participant:s,isHost:t})).join("")}
      `:""}
    </div>
  `}function U({participant:e,isHost:t=!1,hasRaisedHand:o=!1}){const{user:n,role:a}=e;return a==="host"?l("user",14):a==="speaker"?l("mic",14):o&&l("hand",14),`
    <div class="participant-item" data-participant-id="${n._id}">
      ${k({user:n,size:"sm",showOnline:!0})}
      <div class="participant-info">
        <span class="participant-name">${n.displayName||n.username}</span>
        <span class="participant-role">${a==="host"?"Host":a==="speaker"?"Speaker":""}</span>
      </div>
      ${o?`<span style="color: var(--warning)">${l("hand",16)}</span>`:""}
      ${t&&a==="listener"?`
        <button class="btn btn-sm btn-secondary" data-promote-user="${n._id}" title="Make speaker">
          ${l("mic",14)}
        </button>
      `:""}
    </div>
  `}function le(e,t={}){e.querySelectorAll("[data-promote-user]").forEach(o=>{o.addEventListener("click",()=>{const n=o.dataset.promoteUser;t.onPromote&&t.onPromote(n)})})}class kt{constructor(t,o,n){this.roomId=t,this.userId=o,this.role=n,this.peerConnection=null,this.localStream=null,this.remoteStreams=new Map,this.isMuted=!0,this.onParticipantUpdate=null,this.onSpeakingChange=null}async connect(t){const o={iceServers:(t==null?void 0:t.iceServers)||[{urls:"stun:stun.l.google.com:19302"}]};return this.peerConnection=new RTCPeerConnection(o),this.peerConnection.onicecandidate=n=>{n.candidate&&console.log("ICE candidate:",n.candidate)},this.peerConnection.ontrack=n=>{const a=n.streams[0];a&&(this.remoteStreams.set(a.id,a),this.onParticipantUpdate&&this.onParticipantUpdate())},(this.role==="host"||this.role==="speaker")&&await this.setupLocalAudio(),!0}async setupLocalAudio(){try{return this.localStream=await navigator.mediaDevices.getUserMedia({audio:!0,video:!1}),this.localStream.getAudioTracks().forEach(t=>{t.enabled=!1}),this.localStream.getTracks().forEach(t=>{var o;(o=this.peerConnection)==null||o.addTrack(t,this.localStream)}),this.setupAudioLevelDetection(),!0}catch(t){return console.error("Failed to get local audio:",t),!1}}setupAudioLevelDetection(){if(!this.localStream)return;const t=new AudioContext,o=t.createMediaStreamSource(this.localStream),n=t.createAnalyser();n.fftSize=256,o.connect(n);const a=new Uint8Array(n.frequencyBinCount),s=()=>{if(!this.localStream)return;n.getByteFrequencyData(a);const r=a.reduce((c,d)=>c+d)/a.length>30&&!this.isMuted;this.onSpeakingChange&&this.onSpeakingChange(this.userId,r),requestAnimationFrame(s)};s()}toggleMute(){return this.localStream?(this.isMuted=!this.isMuted,this.localStream.getAudioTracks().forEach(t=>{t.enabled=!this.isMuted}),this.isMuted):!1}setMuted(t){this.localStream&&(this.isMuted=t,this.localStream.getAudioTracks().forEach(o=>{o.enabled=!t}))}disconnect(){this.localStream&&(this.localStream.getTracks().forEach(t=>t.stop()),this.localStream=null),this.peerConnection&&(this.peerConnection.close(),this.peerConnection=null),this.remoteStreams.clear()}}function $t(e,t,o){return new kt(e,t,o)}let g=null;async function xt({id:e}){return`
    <div class="room-page">
      <div id="roomContent">
        ${A()}
      </div>
    </div>
  `}async function Lt(e,{id:t}){var n;const o=e.querySelector("#roomContent");if(o)try{const{room:a,role:s,signaling:i}=await $.join(t);if(!a.isLive){o.innerHTML=S({iconName:"radio",title:"Room has ended",message:"This room is no longer live.",action:'<a href="#/rooms" class="btn btn-primary">Browse Rooms</a>'});return}const{room:r}=await $.getById(t),c=r.participants||[],d=r.hostId===((n=h.user)==null?void 0:n._id),u=r.raisedHands||[];g=$t(t,h.user._id,s),await g.connect(i),o.innerHTML=`
      <div class="room-view">
        <div class="room-main">
          <div class="room-info" style="margin-bottom: 1rem;">
            <h1 style="font-size: 1.5rem; margin-bottom: 0.25rem;">${ce(r.name)}</h1>
            ${r.description?`<p style="color: var(--text-muted)">${ce(r.description)}</p>`:""}
          </div>
          <div class="room-stage" id="roomStage">
            ${yt(c)}
          </div>
          ${bt({isMuted:!0,role:s,isHost:d})}
        </div>
        <div class="room-sidebar">
          <div id="participantListContainer">
            ${re({participants:c,isHost:d,raisedHands:c.filter(f=>u.includes(f.userId))})}
          </div>
        </div>
      </div>
    `,wt(o,{onToggleMute:f=>{g&&g.setMuted(f)},onRaiseHand:async()=>{try{await $.raiseHand(t),w("Hand raised!")}catch(f){p(f.message)}},onLeave:async()=>{te({title:"Leave Room",message:"Are you sure you want to leave this room?",confirmText:"Leave",danger:!0,onConfirm:async()=>{await Ct(t)}})},onEnd:async()=>{te({title:"End Room",message:"Are you sure you want to end this room for everyone?",confirmText:"End Room",danger:!0,onConfirm:async()=>{await Et(t)}})}});const v=o.querySelector("#participantListContainer");v&&le(v,{onPromote:async f=>{try{await $.promoteSpeaker(t,f),w("User promoted to speaker");const{room:b}=await $.getById(t);v.innerHTML=re({participants:b.participants||[],isHost:d,raisedHands:(b.participants||[]).filter(E=>(b.raisedHands||[]).includes(E.userId))}),le(v,{onPromote})}catch(b){p(b.message)}}}),g&&(g.onSpeakingChange=(f,b)=>{const E=o.querySelector(`[data-participant-id="${f}"]`);E&&E.classList.toggle("speaking",b)})}catch(a){p(a.message||"Failed to join room"),o.innerHTML=S({iconName:"alert",title:"Failed to join room",message:a.message,action:'<a href="#/rooms" class="btn btn-primary">Browse Rooms</a>'})}}async function Ct(e){try{g&&(g.disconnect(),g=null),await $.leave(e),y("/rooms")}catch(t){p(t.message)}}async function Et(e){try{g&&(g.disconnect(),g=null),await $.end(e),y("/rooms"),w("Room ended")}catch(t){p(t.message)}}function ce(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}window.addEventListener("hashchange",()=>{g&&!window.location.hash.includes("/rooms/")&&(g.disconnect(),g=null)});function St({userId:e,isFollowing:t,size:o="default"}){const n=o==="sm"?"btn-sm":"";return t?`
      <button class="btn btn-secondary ${n}" data-follow-btn="${e}" data-following="true">
        ${l("userCheck",16)}
        <span>Following</span>
      </button>
    `:`
    <button class="btn btn-primary ${n}" data-follow-btn="${e}" data-following="false">
      ${l("userPlus",16)}
      <span>Follow</span>
    </button>
  `}function Mt(e){e.querySelectorAll("[data-follow-btn]").forEach(t=>{t.addEventListener("click",async()=>{if(!h.isAuthenticated){p("Please log in to follow users"),y("/login");return}const o=t.dataset.followBtn,n=t.dataset.following==="true";try{t.disabled=!0,n?(await P.unfollow(o),t.dataset.following="false",t.className=t.className.replace("btn-secondary","btn-primary"),t.innerHTML=`${l("userPlus",16)}<span>Follow</span>`,w("Unfollowed")):(await P.follow(o),t.dataset.following="true",t.className=t.className.replace("btn-primary","btn-secondary"),t.innerHTML=`${l("userCheck",16)}<span>Following</span>`,w("Following"))}catch(a){p(a.message||"Action failed")}finally{t.disabled=!1}})})}async function Bt({id:e}){return`
    <div class="profile-page">
      <div id="profileContent">
        ${A()}
      </div>
    </div>
  `}async function Tt(e,{id:t}){var n;const o=e.querySelector("#profileContent");if(o)try{const{user:a,isFollowing:s}=await P.getById(t),{posts:i}=await L.getByUser(t,{limit:20}),r=((n=h.user)==null?void 0:n._id)===a._id;o.innerHTML=`
      <div class="profile-header">
        <div class="profile-avatar">
          ${k({user:a,size:"xl",showOnline:!0})}
        </div>
        <div class="profile-info">
          <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 0.5rem;">
            <h1 class="profile-name">${a.displayName||a.username}</h1>
            ${r?`<a href="#/settings" class="btn btn-secondary btn-sm">${l("edit",16)} Edit Profile</a>`:St({userId:a._id,isFollowing:s})}
          </div>
          <p class="profile-username">@${a.username}</p>
          ${a.bio?`<p class="profile-bio">${Ht(a.bio)}</p>`:""}
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
        ${G(i,"No posts yet")}
      </div>
    `,Mt(o),Y(o);const c=o.querySelectorAll(".tab");c.forEach(d=>{d.addEventListener("click",()=>{c.forEach(u=>u.classList.remove("active")),d.classList.add("active")})})}catch(a){p(a.message||"Failed to load profile"),o.innerHTML=S({iconName:"user",title:"Profile not found",message:"This user may not exist or there was an error loading the profile.",action:'<a href="#/explore" class="btn btn-primary">Explore</a>'})}}function Ht(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}async function Pt(){return`
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
  `}function At(e){const t=e.querySelector("#loginForm");t&&t.addEventListener("submit",async o=>{o.preventDefault();const n=t.querySelector('button[type="submit"]'),a=t.email.value.trim(),s=t.password.value;if(!a||!s){p("Please fill in all fields");return}try{n.disabled=!0,n.textContent="Signing in...",await Me(a,s),y("/")}catch(i){p(i.message||"Login failed"),n.disabled=!1,n.textContent="Sign in"}})}async function qt(){return`
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
  `}function Rt(e){const t=e.querySelector("#registerForm");t&&t.addEventListener("submit",async o=>{o.preventDefault();const n=t.querySelector('button[type="submit"]'),a=t.username.value.trim(),s=t.displayName.value.trim(),i=t.email.value.trim(),r=t.password.value;if(!a||!i||!r){p("Please fill in all required fields");return}if(a.length<3){p("Username must be at least 3 characters");return}if(!/^[a-zA-Z0-9_]+$/.test(a)){p("Username can only contain letters, numbers, and underscores");return}if(r.length<6){p("Password must be at least 6 characters");return}try{n.disabled=!0,n.textContent="Creating account...",await Be({username:a,displayName:s||a,email:i,password:r}),y("/")}catch(c){p(c.message||"Registration failed"),n.disabled=!1,n.textContent="Create account"}})}async function Nt(){const e=h.user;return e?`
    <div class="settings-page">
      <div class="page-header">
        <h1>Edit Profile</h1>
      </div>

      <form id="settingsForm" class="settings-form">
        <div class="settings-avatar-section">
          <div class="settings-avatar">
            ${k({user:e,size:"xl"})}
          </div>
          <div class="settings-avatar-upload">
            <input type="file" id="avatarInput" accept="image/*" hidden>
            <button type="button" id="changeAvatarBtn" class="btn btn-secondary btn-sm">
              ${l("edit",16)} Change Avatar
            </button>
          </div>
        </div>

        <div class="form-group">
          <label for="displayName">Display Name</label>
          <input
            type="text"
            id="displayName"
            name="displayName"
            value="${de(e.displayName||"")}"
            placeholder="Your display name"
            maxlength="50"
          >
        </div>

        <div class="form-group">
          <label for="username">Username</label>
          <input
            type="text"
            id="username"
            value="@${de(e.username)}"
            disabled
          >
          <small class="form-hint">Username cannot be changed</small>
        </div>

        <div class="form-group">
          <label for="bio">Bio</label>
          <textarea
            id="bio"
            name="bio"
            rows="3"
            placeholder="Tell us about yourself"
            maxlength="200"
          >${Ft(e.bio||"")}</textarea>
          <small class="form-hint"><span id="bioCount">${(e.bio||"").length}</span>/200</small>
        </div>

        <div class="form-actions">
          <button type="button" id="cancelBtn" class="btn btn-secondary">Cancel</button>
          <button type="submit" class="btn btn-primary">
            ${l("check",16)} Save Changes
          </button>
        </div>
      </form>
    </div>
  `:`<div class="settings-page">${A()}</div>`}function jt(e){const t=e.querySelector("#settingsForm"),o=e.querySelector("#avatarInput"),n=e.querySelector("#changeAvatarBtn"),a=e.querySelector("#cancelBtn"),s=e.querySelector("#bio"),i=e.querySelector("#bioCount");t&&(s==null||s.addEventListener("input",()=>{i.textContent=s.value.length}),n==null||n.addEventListener("click",()=>{o.click()}),o==null||o.addEventListener("change",async r=>{const c=r.target.files[0];if(c){if(!c.type.startsWith("image/")){p("Please select an image file");return}if(c.size>5*1024*1024){p("Image must be less than 5MB");return}try{n.disabled=!0,n.innerHTML=`${l("loading",16)} Uploading...`;const{url:d}=await ve.uploadFile(c,"avatar"),{user:u}=await P.updateProfile({avatarUrl:d});K(u);const v=e.querySelector(".settings-avatar");v&&(v.innerHTML=k({user:u,size:"xl"})),w("Avatar updated")}catch(d){p(d.message||"Failed to upload avatar")}finally{n.disabled=!1,n.innerHTML=`${l("edit",16)} Change Avatar`}}}),a==null||a.addEventListener("click",()=>{var c;const r=(c=h.user)==null?void 0:c._id;y(r?`/profile/${r}`:"/")}),t.addEventListener("submit",async r=>{r.preventDefault();const c=t.querySelector('button[type="submit"]'),d=new FormData(t);try{c.disabled=!0,c.innerHTML=`${l("loading",16)} Saving...`;const u={displayName:d.get("displayName"),bio:d.get("bio")},{user:v}=await P.updateProfile(u);K(v),w("Profile updated"),y(`/profile/${v._id}`)}catch(u){p(u.message||"Failed to update profile"),c.disabled=!1,c.innerHTML=`${l("check",16)} Save Changes`}}))}function Ft(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function de(e){return e.replace(/"/g,"&quot;").replace(/'/g,"&#39;")}C("/",{page:it,attachEvents:rt,auth:!0});C("/explore",{page:lt,attachEvents:dt,auth:!1});C("/rooms",{page:pt,attachEvents:vt,auth:!1});C("/rooms/:id",{page:xt,attachEvents:Lt,auth:!0});C("/profile/:id",{page:Bt,attachEvents:Tt,auth:!1});C("/login",{page:Pt,attachEvents:At,guestOnly:!0});C("/register",{page:qt,attachEvents:Rt,guestOnly:!0});C("/settings",{page:Nt,attachEvents:jt,auth:!0});He(()=>{const e=document.getElementById("mainContent");e&&(e.innerHTML=S({iconName:"alert",title:"Page not found",message:"The page you are looking for does not exist.",action:'<a href="#/" class="btn btn-primary">Go Home</a>'}))});async function It(){await Se(),Ue(),ze(),Re(),V(e=>{const t=window.location.hash.slice(1)||"/";e.isAuthenticated&&(t==="/login"||t==="/register")&&y("/"),!e.isAuthenticated&&!e.isLoading&&(["/","/rooms/"].some(n=>t===n||n.endsWith("/")&&t.startsWith(n)),t.match(/^\/rooms\/[^\/]+$/)&&y("/login"))}),console.log("VoiceCircle initialized")}It().catch(console.error);
