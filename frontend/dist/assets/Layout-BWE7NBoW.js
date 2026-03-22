import{u as C,a as L,d as z,r as i,j as e,N as m,R as A,O}from"./index-BSFPtNig.js";import{c as t}from"./createLucideIcon-GUZPsdgk.js";import{P as b}from"./package-5Evf_FTm.js";import{T as u}from"./trending-up-BNTAMel2.js";import{D as y}from"./dollar-sign-Dc8Y9a6B.js";import{B as x}from"./bar-chart-3-8cGuQ9ht.js";import{F as S}from"./file-text-DJIy23xa.js";import{G as D}from"./globe-BiRHLEVf.js";import{S as E}from"./sparkles-m0Q9Qlg0.js";import{Z as P}from"./zap-BqSaWQQP.js";/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const R=t("Calculator",[["rect",{width:"16",height:"20",x:"4",y:"2",rx:"2",key:"1nb95v"}],["line",{x1:"8",x2:"16",y1:"6",y2:"6",key:"x4nwl0"}],["line",{x1:"16",x2:"16",y1:"14",y2:"18",key:"wjye3r"}],["path",{d:"M16 10h.01",key:"1m94wz"}],["path",{d:"M12 10h.01",key:"1nrarc"}],["path",{d:"M8 10h.01",key:"19clt8"}],["path",{d:"M12 14h.01",key:"1etili"}],["path",{d:"M8 14h.01",key:"6423bh"}],["path",{d:"M12 18h.01",key:"mhygvu"}],["path",{d:"M8 18h.01",key:"lrp35t"}]]);/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const T=t("ChevronRight",[["path",{d:"m9 18 6-6-6-6",key:"mthhwq"}]]);/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $=t("LayoutDashboard",[["rect",{width:"7",height:"9",x:"3",y:"3",rx:"1",key:"10lvy0"}],["rect",{width:"7",height:"5",x:"14",y:"3",rx:"1",key:"16une8"}],["rect",{width:"7",height:"9",x:"14",y:"12",rx:"1",key:"1hutg5"}],["rect",{width:"7",height:"5",x:"3",y:"16",rx:"1",key:"ldoo1y"}]]);/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const B=t("LogOut",[["path",{d:"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",key:"1uf3rs"}],["polyline",{points:"16 17 21 12 16 7",key:"1gabdz"}],["line",{x1:"21",x2:"9",y1:"12",y2:"12",key:"1uyos4"}]]);/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const F=t("Menu",[["line",{x1:"4",x2:"20",y1:"12",y2:"12",key:"1e0a9i"}],["line",{x1:"4",x2:"20",y1:"6",y2:"6",key:"1owob3"}],["line",{x1:"4",x2:"20",y1:"18",y2:"18",key:"yk5zj1"}]]);/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const H=t("Users",[["path",{d:"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",key:"1yyitq"}],["circle",{cx:"9",cy:"7",r:"4",key:"nufk8"}],["path",{d:"M22 21v-2a4 4 0 0 0-3-3.87",key:"kshegd"}],["path",{d:"M16 3.13a4 4 0 0 1 0 7.75",key:"1da9ce"}]]);/**
 * @license lucide-react v0.309.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const U=t("X",[["path",{d:"M18 6 6 18",key:"1bl5f8"}],["path",{d:"m6 6 12 12",key:"d8bk6v"}]]),k=[{path:"/dashboard",label:"Dashboard",icon:$},{path:"/products",label:"Products",icon:b},{path:"/forecast",label:"Forecast",icon:u},{path:"/cashflow",label:"Cash Flow",icon:y},{path:"/partners",label:"Partners",icon:H},{path:"/analytics",label:"Analytics",icon:x},{path:"/reports",label:"Reports",icon:S},{path:"/currency",label:"Currency & Tax",icon:D}],g=[{path:"/beginner-wizard",label:"Start Here",icon:E,isNew:!0},{path:"/calculators/profit-per-order",label:"Profit/Order",icon:R},{path:"/calculators/startup-budget",label:"Startup Budget",icon:y},{path:"/calculators/ads",label:"Ads Math",icon:P},{path:"/calculators/cod",label:"COD & Returns",icon:u},{path:"/calculators/pricing",label:"Pricing Tool",icon:x},{path:"/calculators/goals",label:"Goal Planner",icon:b}],V=[...k,...g];function Y(){const{user:r,logout:j}=C(),f=L(),l=z(),[c,n]=i.useState(!1),[d,v]=i.useState(window.innerWidth<960);i.useEffect(()=>{const a=()=>v(window.innerWidth<960);return window.addEventListener("resize",a),()=>window.removeEventListener("resize",a)},[]),i.useEffect(()=>{d&&n(!1)},[l.pathname,d]);const N=i.useMemo(()=>{const a=V.find(s=>l.pathname.startsWith(s.path));return(a==null?void 0:a.label)||"Dashboard"},[l.pathname]),p=i.useMemo(()=>{const a=l.pathname.split("/").filter(Boolean);return a.length===0?["Dashboard"]:["Home",...a.map(s=>s.replace(/-/g," ").replace(/\b\w/g,o=>o.toUpperCase()))]},[l.pathname]),w=()=>{j(),f("/login")};return e.jsxs("div",{className:"app-shell",children:[d&&c&&e.jsx("div",{onClick:()=>n(!1),className:"app-overlay"}),e.jsxs("aside",{className:`app-sidebar ${d?"mobile":""} ${c?"open":""}`,children:[e.jsxs("div",{className:"sidebar-brand",children:[e.jsxs("div",{className:"sidebar-logo",children:[e.jsx("div",{className:"sidebar-logo-icon",children:"⚡"}),e.jsx("span",{children:"EcomPlanner"})]}),e.jsxs("div",{className:"sidebar-user",children:[e.jsx("span",{className:"sidebar-user-dot"}),(r==null?void 0:r.full_name)||(r==null?void 0:r.email)]})]}),e.jsxs("nav",{className:"sidebar-nav",children:[e.jsx("div",{className:"sidebar-section-label",children:"Main"}),k.map(({path:a,label:s,icon:o})=>e.jsxs(m,{to:a,onClick:()=>n(!1),className:({isActive:h})=>`sidebar-link ${h?"active":""}`,children:[e.jsx(o,{size:16}),s]},a)),e.jsx("div",{className:"sidebar-section-label",style:{marginTop:"0.5rem"},children:"Beginner Tools"}),g.map(({path:a,label:s,icon:o,isNew:h})=>e.jsxs(m,{to:a,onClick:()=>n(!1),className:({isActive:M})=>`sidebar-link ${M?"active":""}`,children:[e.jsx(o,{size:16}),s,h&&e.jsx("span",{className:"sidebar-badge",children:"NEW"})]},a))]}),e.jsx("div",{className:"sidebar-footer",children:e.jsxs("button",{onClick:w,className:"sidebar-link sidebar-logout",children:[e.jsx(B,{size:15})," Sign Out"]})})]}),e.jsxs("div",{className:"app-main",children:[e.jsxs("header",{className:"app-header",children:[e.jsx("button",{onClick:()=>n(!c),className:"menu-btn","aria-label":"Toggle menu",children:c?e.jsx(U,{size:18}):e.jsx(F,{size:18})}),e.jsxs("div",{style:{flex:1},children:[e.jsx("div",{className:"breadcrumb-row","aria-label":"Breadcrumb",children:p.map((a,s)=>e.jsxs(A.Fragment,{children:[s>0&&e.jsx(T,{size:12,className:"breadcrumb-sep"}),e.jsx("span",{className:`breadcrumb-item ${s===p.length-1?"active":""}`,children:a})]},`${a}-${s}`))}),e.jsx("h1",{className:"header-title",children:N})]})]}),e.jsx("main",{className:"app-content",children:e.jsx(O,{})})]})]})}export{Y as default};
