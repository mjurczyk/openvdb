var ml=Object.defineProperty;var yl=(i,A,t)=>A in i?ml(i,A,{enumerable:!0,configurable:!0,writable:!0,value:t}):i[A]=t;var cA=(i,A,t)=>(yl(i,typeof A!="symbol"?A+"":A,t),t);(function(){const A=document.createElement("link").relList;if(A&&A.supports&&A.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))e(n);new MutationObserver(n=>{for(const s of n)if(s.type==="childList")for(const o of s.addedNodes)o.tagName==="LINK"&&o.rel==="modulepreload"&&e(o)}).observe(document,{childList:!0,subtree:!0});function t(n){const s={};return n.integrity&&(s.integrity=n.integrity),n.referrerpolicy&&(s.referrerPolicy=n.referrerpolicy),n.crossorigin==="use-credentials"?s.credentials="include":n.crossorigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function e(n){if(n.ep)return;n.ep=!0;const s=t(n);fetch(n.href,s)}})();/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const hB="153",$n={LEFT:0,MIDDLE:1,RIGHT:2,ROTATE:0,DOLLY:1,PAN:2},As={ROTATE:0,PAN:1,DOLLY_PAN:2,DOLLY_ROTATE:3},Dl=0,WB=1,Sl=2,wQ=1,wl=2,Mi=3,vi=0,ie=1,ii=2,on=0,Js=1,VB=2,zB=3,XB=4,Ml=5,vs=100,Rl=101,Fl=102,ZB=103,jB=104,xl=200,Nl=201,_l=202,Gl=203,MQ=204,RQ=205,Ll=206,Ul=207,bl=208,vl=209,kl=210,Tl=0,Hl=1,ql=2,bI=3,Jl=4,Kl=5,Yl=6,Pl=7,QB=0,Ol=1,Wl=2,bi=0,Vl=1,zl=2,Xl=3,Zl=4,jl=5,FQ=300,Vs=301,zs=302,kn=303,Tn=304,zr=306,Bn=1e3,Yt=1001,Cn=1002,Ut=1003,vI=1004,pr=1005,Dt=1006,xQ=1007,En=1008,an=1009,$l=1010,Ad=1011,cB=1012,NQ=1013,en=1014,De=1015,_i=1016,_Q=1017,GQ=1018,Gn=1020,td=1021,me=1023,ed=1024,id=1025,Ln=1026,Xs=1027,nd=1028,LQ=1029,sd=1030,UQ=1031,bQ=1033,Ig=33776,Bg=33777,Cg=33778,Eg=33779,$B=35840,AC=35841,tC=35842,eC=35843,od=36196,iC=37492,nC=37496,sC=37808,oC=37809,aC=37810,rC=37811,gC=37812,IC=37813,BC=37814,CC=37815,EC=37816,hC=37817,QC=37818,cC=37819,lC=37820,dC=37821,hg=36492,ad=36283,uC=36284,fC=36285,pC=36286,Wo=2300,Zs=2301,Qg=2302,mC=2400,yC=2401,DC=2402,rd=2500,gd=0,vQ=1,kI=2,kQ=3e3,Pe=3001,Id=3200,Bd=3201,lB=0,Cd=1,Un="",kA="srgb",Xe="srgb-linear",TQ="display-p3",cg=7680,Ed=519,hd=512,Qd=513,cd=514,ld=515,dd=516,ud=517,fd=518,pd=519,TI=35044,SC="300 es",HI=1035,Gi=2e3,Ur=2001;class Vn{addEventListener(A,t){this._listeners===void 0&&(this._listeners={});const e=this._listeners;e[A]===void 0&&(e[A]=[]),e[A].indexOf(t)===-1&&e[A].push(t)}hasEventListener(A,t){if(this._listeners===void 0)return!1;const e=this._listeners;return e[A]!==void 0&&e[A].indexOf(t)!==-1}removeEventListener(A,t){if(this._listeners===void 0)return;const n=this._listeners[A];if(n!==void 0){const s=n.indexOf(t);s!==-1&&n.splice(s,1)}}dispatchEvent(A){if(this._listeners===void 0)return;const e=this._listeners[A.type];if(e!==void 0){A.target=this;const n=e.slice(0);for(let s=0,o=n.length;s<o;s++)n[s].call(this,A);A.target=null}}}const Ht=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];let wC=1234567;const qo=Math.PI/180,js=180/Math.PI;function Oe(){const i=Math.random()*4294967295|0,A=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0;return(Ht[i&255]+Ht[i>>8&255]+Ht[i>>16&255]+Ht[i>>24&255]+"-"+Ht[A&255]+Ht[A>>8&255]+"-"+Ht[A>>16&15|64]+Ht[A>>24&255]+"-"+Ht[t&63|128]+Ht[t>>8&255]+"-"+Ht[t>>16&255]+Ht[t>>24&255]+Ht[e&255]+Ht[e>>8&255]+Ht[e>>16&255]+Ht[e>>24&255]).toLowerCase()}function bt(i,A,t){return Math.max(A,Math.min(t,i))}function dB(i,A){return(i%A+A)%A}function md(i,A,t,e,n){return e+(i-A)*(n-e)/(t-A)}function yd(i,A,t){return i!==A?(t-i)/(A-i):0}function Jo(i,A,t){return(1-t)*i+t*A}function Dd(i,A,t,e){return Jo(i,A,1-Math.exp(-t*e))}function Sd(i,A=1){return A-Math.abs(dB(i,A*2)-A)}function wd(i,A,t){return i<=A?0:i>=t?1:(i=(i-A)/(t-A),i*i*(3-2*i))}function Md(i,A,t){return i<=A?0:i>=t?1:(i=(i-A)/(t-A),i*i*i*(i*(i*6-15)+10))}function Rd(i,A){return i+Math.floor(Math.random()*(A-i+1))}function Fd(i,A){return i+Math.random()*(A-i)}function xd(i){return i*(.5-Math.random())}function Nd(i){i!==void 0&&(wC=i);let A=wC+=1831565813;return A=Math.imul(A^A>>>15,A|1),A^=A+Math.imul(A^A>>>7,A|61),((A^A>>>14)>>>0)/4294967296}function _d(i){return i*qo}function Gd(i){return i*js}function qI(i){return(i&i-1)===0&&i!==0}function HQ(i){return Math.pow(2,Math.ceil(Math.log(i)/Math.LN2))}function br(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function Ld(i,A,t,e,n){const s=Math.cos,o=Math.sin,a=s(t/2),g=o(t/2),r=s((A+e)/2),I=o((A+e)/2),B=s((A-e)/2),C=o((A-e)/2),Q=s((e-A)/2),c=o((e-A)/2);switch(n){case"XYX":i.set(a*I,g*B,g*C,a*r);break;case"YZY":i.set(g*C,a*I,g*B,a*r);break;case"ZXZ":i.set(g*B,g*C,a*I,a*r);break;case"XZX":i.set(a*I,g*c,g*Q,a*r);break;case"YXY":i.set(g*Q,a*I,g*c,a*r);break;case"ZYZ":i.set(g*c,g*Q,a*I,a*r);break;default:console.warn("THREE.MathUtils: .setQuaternionFromProperEuler() encountered an unknown order: "+n)}}function Li(i,A){switch(A.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function rt(i,A){switch(A.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}const Ud={DEG2RAD:qo,RAD2DEG:js,generateUUID:Oe,clamp:bt,euclideanModulo:dB,mapLinear:md,inverseLerp:yd,lerp:Jo,damp:Dd,pingpong:Sd,smoothstep:wd,smootherstep:Md,randInt:Rd,randFloat:Fd,randFloatSpread:xd,seededRandom:Nd,degToRad:_d,radToDeg:Gd,isPowerOfTwo:qI,ceilPowerOfTwo:HQ,floorPowerOfTwo:br,setQuaternionFromProperEuler:Ld,normalize:rt,denormalize:Li};class TA{constructor(A=0,t=0){TA.prototype.isVector2=!0,this.x=A,this.y=t}get width(){return this.x}set width(A){this.x=A}get height(){return this.y}set height(A){this.y=A}set(A,t){return this.x=A,this.y=t,this}setScalar(A){return this.x=A,this.y=A,this}setX(A){return this.x=A,this}setY(A){return this.y=A,this}setComponent(A,t){switch(A){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+A)}return this}getComponent(A){switch(A){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+A)}}clone(){return new this.constructor(this.x,this.y)}copy(A){return this.x=A.x,this.y=A.y,this}add(A){return this.x+=A.x,this.y+=A.y,this}addScalar(A){return this.x+=A,this.y+=A,this}addVectors(A,t){return this.x=A.x+t.x,this.y=A.y+t.y,this}addScaledVector(A,t){return this.x+=A.x*t,this.y+=A.y*t,this}sub(A){return this.x-=A.x,this.y-=A.y,this}subScalar(A){return this.x-=A,this.y-=A,this}subVectors(A,t){return this.x=A.x-t.x,this.y=A.y-t.y,this}multiply(A){return this.x*=A.x,this.y*=A.y,this}multiplyScalar(A){return this.x*=A,this.y*=A,this}divide(A){return this.x/=A.x,this.y/=A.y,this}divideScalar(A){return this.multiplyScalar(1/A)}applyMatrix3(A){const t=this.x,e=this.y,n=A.elements;return this.x=n[0]*t+n[3]*e+n[6],this.y=n[1]*t+n[4]*e+n[7],this}min(A){return this.x=Math.min(this.x,A.x),this.y=Math.min(this.y,A.y),this}max(A){return this.x=Math.max(this.x,A.x),this.y=Math.max(this.y,A.y),this}clamp(A,t){return this.x=Math.max(A.x,Math.min(t.x,this.x)),this.y=Math.max(A.y,Math.min(t.y,this.y)),this}clampScalar(A,t){return this.x=Math.max(A,Math.min(t,this.x)),this.y=Math.max(A,Math.min(t,this.y)),this}clampLength(A,t){const e=this.length();return this.divideScalar(e||1).multiplyScalar(Math.max(A,Math.min(t,e)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(A){return this.x*A.x+this.y*A.y}cross(A){return this.x*A.y-this.y*A.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(A){const t=Math.sqrt(this.lengthSq()*A.lengthSq());if(t===0)return Math.PI/2;const e=this.dot(A)/t;return Math.acos(bt(e,-1,1))}distanceTo(A){return Math.sqrt(this.distanceToSquared(A))}distanceToSquared(A){const t=this.x-A.x,e=this.y-A.y;return t*t+e*e}manhattanDistanceTo(A){return Math.abs(this.x-A.x)+Math.abs(this.y-A.y)}setLength(A){return this.normalize().multiplyScalar(A)}lerp(A,t){return this.x+=(A.x-this.x)*t,this.y+=(A.y-this.y)*t,this}lerpVectors(A,t,e){return this.x=A.x+(t.x-A.x)*e,this.y=A.y+(t.y-A.y)*e,this}equals(A){return A.x===this.x&&A.y===this.y}fromArray(A,t=0){return this.x=A[t],this.y=A[t+1],this}toArray(A=[],t=0){return A[t]=this.x,A[t+1]=this.y,A}fromBufferAttribute(A,t){return this.x=A.getX(t),this.y=A.getY(t),this}rotateAround(A,t){const e=Math.cos(t),n=Math.sin(t),s=this.x-A.x,o=this.y-A.y;return this.x=s*e-o*n+A.x,this.y=s*n+o*e+A.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class VA{constructor(A,t,e,n,s,o,a,g,r){VA.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],A!==void 0&&this.set(A,t,e,n,s,o,a,g,r)}set(A,t,e,n,s,o,a,g,r){const I=this.elements;return I[0]=A,I[1]=n,I[2]=a,I[3]=t,I[4]=s,I[5]=g,I[6]=e,I[7]=o,I[8]=r,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(A){const t=this.elements,e=A.elements;return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t[4]=e[4],t[5]=e[5],t[6]=e[6],t[7]=e[7],t[8]=e[8],this}extractBasis(A,t,e){return A.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),e.setFromMatrix3Column(this,2),this}setFromMatrix4(A){const t=A.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(A){return this.multiplyMatrices(this,A)}premultiply(A){return this.multiplyMatrices(A,this)}multiplyMatrices(A,t){const e=A.elements,n=t.elements,s=this.elements,o=e[0],a=e[3],g=e[6],r=e[1],I=e[4],B=e[7],C=e[2],Q=e[5],c=e[8],l=n[0],h=n[3],E=n[6],f=n[1],d=n[4],u=n[7],m=n[2],y=n[5],p=n[8];return s[0]=o*l+a*f+g*m,s[3]=o*h+a*d+g*y,s[6]=o*E+a*u+g*p,s[1]=r*l+I*f+B*m,s[4]=r*h+I*d+B*y,s[7]=r*E+I*u+B*p,s[2]=C*l+Q*f+c*m,s[5]=C*h+Q*d+c*y,s[8]=C*E+Q*u+c*p,this}multiplyScalar(A){const t=this.elements;return t[0]*=A,t[3]*=A,t[6]*=A,t[1]*=A,t[4]*=A,t[7]*=A,t[2]*=A,t[5]*=A,t[8]*=A,this}determinant(){const A=this.elements,t=A[0],e=A[1],n=A[2],s=A[3],o=A[4],a=A[5],g=A[6],r=A[7],I=A[8];return t*o*I-t*a*r-e*s*I+e*a*g+n*s*r-n*o*g}invert(){const A=this.elements,t=A[0],e=A[1],n=A[2],s=A[3],o=A[4],a=A[5],g=A[6],r=A[7],I=A[8],B=I*o-a*r,C=a*g-I*s,Q=r*s-o*g,c=t*B+e*C+n*Q;if(c===0)return this.set(0,0,0,0,0,0,0,0,0);const l=1/c;return A[0]=B*l,A[1]=(n*r-I*e)*l,A[2]=(a*e-n*o)*l,A[3]=C*l,A[4]=(I*t-n*g)*l,A[5]=(n*s-a*t)*l,A[6]=Q*l,A[7]=(e*g-r*t)*l,A[8]=(o*t-e*s)*l,this}transpose(){let A;const t=this.elements;return A=t[1],t[1]=t[3],t[3]=A,A=t[2],t[2]=t[6],t[6]=A,A=t[5],t[5]=t[7],t[7]=A,this}getNormalMatrix(A){return this.setFromMatrix4(A).invert().transpose()}transposeIntoArray(A){const t=this.elements;return A[0]=t[0],A[1]=t[3],A[2]=t[6],A[3]=t[1],A[4]=t[4],A[5]=t[7],A[6]=t[2],A[7]=t[5],A[8]=t[8],this}setUvTransform(A,t,e,n,s,o,a){const g=Math.cos(s),r=Math.sin(s);return this.set(e*g,e*r,-e*(g*o+r*a)+o+A,-n*r,n*g,-n*(-r*o+g*a)+a+t,0,0,1),this}scale(A,t){return this.premultiply(lg.makeScale(A,t)),this}rotate(A){return this.premultiply(lg.makeRotation(-A)),this}translate(A,t){return this.premultiply(lg.makeTranslation(A,t)),this}makeTranslation(A,t){return A.isVector2?this.set(1,0,A.x,0,1,A.y,0,0,1):this.set(1,0,A,0,1,t,0,0,1),this}makeRotation(A){const t=Math.cos(A),e=Math.sin(A);return this.set(t,-e,0,e,t,0,0,0,1),this}makeScale(A,t){return this.set(A,0,0,0,t,0,0,0,1),this}equals(A){const t=this.elements,e=A.elements;for(let n=0;n<9;n++)if(t[n]!==e[n])return!1;return!0}fromArray(A,t=0){for(let e=0;e<9;e++)this.elements[e]=A[e+t];return this}toArray(A=[],t=0){const e=this.elements;return A[t]=e[0],A[t+1]=e[1],A[t+2]=e[2],A[t+3]=e[3],A[t+4]=e[4],A[t+5]=e[5],A[t+6]=e[6],A[t+7]=e[7],A[t+8]=e[8],A}clone(){return new this.constructor().fromArray(this.elements)}}const lg=new VA;function qQ(i){for(let A=i.length-1;A>=0;--A)if(i[A]>=65535)return!0;return!1}function Vo(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}const MC={};function Ko(i){i in MC||(MC[i]=!0,console.warn(i))}function Ks(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function dg(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}const bd=new VA().fromArray([.8224621,.0331941,.0170827,.177538,.9668058,.0723974,-1e-7,1e-7,.9105199]),vd=new VA().fromArray([1.2249401,-.0420569,-.0196376,-.2249404,1.0420571,-.0786361,1e-7,0,1.0982735]);function kd(i){return i.convertSRGBToLinear().applyMatrix3(vd)}function Td(i){return i.applyMatrix3(bd).convertLinearToSRGB()}const Hd={[Xe]:i=>i,[kA]:i=>i.convertSRGBToLinear(),[TQ]:kd},qd={[Xe]:i=>i,[kA]:i=>i.convertLinearToSRGB(),[TQ]:Td},_e={enabled:!0,get legacyMode(){return console.warn("THREE.ColorManagement: .legacyMode=false renamed to .enabled=true in r150."),!this.enabled},set legacyMode(i){console.warn("THREE.ColorManagement: .legacyMode=false renamed to .enabled=true in r150."),this.enabled=!i},get workingColorSpace(){return Xe},set workingColorSpace(i){console.warn("THREE.ColorManagement: .workingColorSpace is readonly.")},convert:function(i,A,t){if(this.enabled===!1||A===t||!A||!t)return i;const e=Hd[A],n=qd[t];if(e===void 0||n===void 0)throw new Error(`Unsupported color space conversion, "${A}" to "${t}".`);return n(e(i))},fromWorkingColorSpace:function(i,A){return this.convert(i,this.workingColorSpace,A)},toWorkingColorSpace:function(i,A){return this.convert(i,A,this.workingColorSpace)}};let ts;class JQ{static getDataURL(A){if(/^data:/i.test(A.src)||typeof HTMLCanvasElement>"u")return A.src;let t;if(A instanceof HTMLCanvasElement)t=A;else{ts===void 0&&(ts=Vo("canvas")),ts.width=A.width,ts.height=A.height;const e=ts.getContext("2d");A instanceof ImageData?e.putImageData(A,0,0):e.drawImage(A,0,0,A.width,A.height),t=ts}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",A),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(A){if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap){const t=Vo("canvas");t.width=A.width,t.height=A.height;const e=t.getContext("2d");e.drawImage(A,0,0,A.width,A.height);const n=e.getImageData(0,0,A.width,A.height),s=n.data;for(let o=0;o<s.length;o++)s[o]=Ks(s[o]/255)*255;return e.putImageData(n,0,0),t}else if(A.data){const t=A.data.slice(0);for(let e=0;e<t.length;e++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[e]=Math.floor(Ks(t[e]/255)*255):t[e]=Ks(t[e]);return{data:t,width:A.width,height:A.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),A}}let Jd=0;class KQ{constructor(A=null){this.isSource=!0,Object.defineProperty(this,"id",{value:Jd++}),this.uuid=Oe(),this.data=A,this.version=0}set needsUpdate(A){A===!0&&this.version++}toJSON(A){const t=A===void 0||typeof A=="string";if(!t&&A.images[this.uuid]!==void 0)return A.images[this.uuid];const e={uuid:this.uuid,url:""},n=this.data;if(n!==null){let s;if(Array.isArray(n)){s=[];for(let o=0,a=n.length;o<a;o++)n[o].isDataTexture?s.push(ug(n[o].image)):s.push(ug(n[o]))}else s=ug(n);e.url=s}return t||(A.images[this.uuid]=e),e}}function ug(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?JQ.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let Kd=0;class Tt extends Vn{constructor(A=Tt.DEFAULT_IMAGE,t=Tt.DEFAULT_MAPPING,e=Yt,n=Yt,s=Dt,o=En,a=me,g=an,r=Tt.DEFAULT_ANISOTROPY,I=Un){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:Kd++}),this.uuid=Oe(),this.name="",this.source=new KQ(A),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=e,this.wrapT=n,this.magFilter=s,this.minFilter=o,this.anisotropy=r,this.format=a,this.internalFormat=null,this.type=g,this.offset=new TA(0,0),this.repeat=new TA(1,1),this.center=new TA(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new VA,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,typeof I=="string"?this.colorSpace=I:(Ko("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=I===Pe?kA:Un),this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(A=null){this.source.data=A}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(A){return this.name=A.name,this.source=A.source,this.mipmaps=A.mipmaps.slice(0),this.mapping=A.mapping,this.channel=A.channel,this.wrapS=A.wrapS,this.wrapT=A.wrapT,this.magFilter=A.magFilter,this.minFilter=A.minFilter,this.anisotropy=A.anisotropy,this.format=A.format,this.internalFormat=A.internalFormat,this.type=A.type,this.offset.copy(A.offset),this.repeat.copy(A.repeat),this.center.copy(A.center),this.rotation=A.rotation,this.matrixAutoUpdate=A.matrixAutoUpdate,this.matrix.copy(A.matrix),this.generateMipmaps=A.generateMipmaps,this.premultiplyAlpha=A.premultiplyAlpha,this.flipY=A.flipY,this.unpackAlignment=A.unpackAlignment,this.colorSpace=A.colorSpace,this.userData=JSON.parse(JSON.stringify(A.userData)),this.needsUpdate=!0,this}toJSON(A){const t=A===void 0||typeof A=="string";if(!t&&A.textures[this.uuid]!==void 0)return A.textures[this.uuid];const e={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(A).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(e.userData=this.userData),t||(A.textures[this.uuid]=e),e}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(A){if(this.mapping!==FQ)return A;if(A.applyMatrix3(this.matrix),A.x<0||A.x>1)switch(this.wrapS){case Bn:A.x=A.x-Math.floor(A.x);break;case Yt:A.x=A.x<0?0:1;break;case Cn:Math.abs(Math.floor(A.x)%2)===1?A.x=Math.ceil(A.x)-A.x:A.x=A.x-Math.floor(A.x);break}if(A.y<0||A.y>1)switch(this.wrapT){case Bn:A.y=A.y-Math.floor(A.y);break;case Yt:A.y=A.y<0?0:1;break;case Cn:Math.abs(Math.floor(A.y)%2)===1?A.y=Math.ceil(A.y)-A.y:A.y=A.y-Math.floor(A.y);break}return this.flipY&&(A.y=1-A.y),A}set needsUpdate(A){A===!0&&(this.version++,this.source.needsUpdate=!0)}get encoding(){return Ko("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace===kA?Pe:kQ}set encoding(A){Ko("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=A===Pe?kA:Un}}Tt.DEFAULT_IMAGE=null;Tt.DEFAULT_MAPPING=FQ;Tt.DEFAULT_ANISOTROPY=1;class It{constructor(A=0,t=0,e=0,n=1){It.prototype.isVector4=!0,this.x=A,this.y=t,this.z=e,this.w=n}get width(){return this.z}set width(A){this.z=A}get height(){return this.w}set height(A){this.w=A}set(A,t,e,n){return this.x=A,this.y=t,this.z=e,this.w=n,this}setScalar(A){return this.x=A,this.y=A,this.z=A,this.w=A,this}setX(A){return this.x=A,this}setY(A){return this.y=A,this}setZ(A){return this.z=A,this}setW(A){return this.w=A,this}setComponent(A,t){switch(A){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+A)}return this}getComponent(A){switch(A){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+A)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(A){return this.x=A.x,this.y=A.y,this.z=A.z,this.w=A.w!==void 0?A.w:1,this}add(A){return this.x+=A.x,this.y+=A.y,this.z+=A.z,this.w+=A.w,this}addScalar(A){return this.x+=A,this.y+=A,this.z+=A,this.w+=A,this}addVectors(A,t){return this.x=A.x+t.x,this.y=A.y+t.y,this.z=A.z+t.z,this.w=A.w+t.w,this}addScaledVector(A,t){return this.x+=A.x*t,this.y+=A.y*t,this.z+=A.z*t,this.w+=A.w*t,this}sub(A){return this.x-=A.x,this.y-=A.y,this.z-=A.z,this.w-=A.w,this}subScalar(A){return this.x-=A,this.y-=A,this.z-=A,this.w-=A,this}subVectors(A,t){return this.x=A.x-t.x,this.y=A.y-t.y,this.z=A.z-t.z,this.w=A.w-t.w,this}multiply(A){return this.x*=A.x,this.y*=A.y,this.z*=A.z,this.w*=A.w,this}multiplyScalar(A){return this.x*=A,this.y*=A,this.z*=A,this.w*=A,this}applyMatrix4(A){const t=this.x,e=this.y,n=this.z,s=this.w,o=A.elements;return this.x=o[0]*t+o[4]*e+o[8]*n+o[12]*s,this.y=o[1]*t+o[5]*e+o[9]*n+o[13]*s,this.z=o[2]*t+o[6]*e+o[10]*n+o[14]*s,this.w=o[3]*t+o[7]*e+o[11]*n+o[15]*s,this}divideScalar(A){return this.multiplyScalar(1/A)}setAxisAngleFromQuaternion(A){this.w=2*Math.acos(A.w);const t=Math.sqrt(1-A.w*A.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=A.x/t,this.y=A.y/t,this.z=A.z/t),this}setAxisAngleFromRotationMatrix(A){let t,e,n,s;const g=A.elements,r=g[0],I=g[4],B=g[8],C=g[1],Q=g[5],c=g[9],l=g[2],h=g[6],E=g[10];if(Math.abs(I-C)<.01&&Math.abs(B-l)<.01&&Math.abs(c-h)<.01){if(Math.abs(I+C)<.1&&Math.abs(B+l)<.1&&Math.abs(c+h)<.1&&Math.abs(r+Q+E-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const d=(r+1)/2,u=(Q+1)/2,m=(E+1)/2,y=(I+C)/4,p=(B+l)/4,R=(c+h)/4;return d>u&&d>m?d<.01?(e=0,n=.707106781,s=.707106781):(e=Math.sqrt(d),n=y/e,s=p/e):u>m?u<.01?(e=.707106781,n=0,s=.707106781):(n=Math.sqrt(u),e=y/n,s=R/n):m<.01?(e=.707106781,n=.707106781,s=0):(s=Math.sqrt(m),e=p/s,n=R/s),this.set(e,n,s,t),this}let f=Math.sqrt((h-c)*(h-c)+(B-l)*(B-l)+(C-I)*(C-I));return Math.abs(f)<.001&&(f=1),this.x=(h-c)/f,this.y=(B-l)/f,this.z=(C-I)/f,this.w=Math.acos((r+Q+E-1)/2),this}min(A){return this.x=Math.min(this.x,A.x),this.y=Math.min(this.y,A.y),this.z=Math.min(this.z,A.z),this.w=Math.min(this.w,A.w),this}max(A){return this.x=Math.max(this.x,A.x),this.y=Math.max(this.y,A.y),this.z=Math.max(this.z,A.z),this.w=Math.max(this.w,A.w),this}clamp(A,t){return this.x=Math.max(A.x,Math.min(t.x,this.x)),this.y=Math.max(A.y,Math.min(t.y,this.y)),this.z=Math.max(A.z,Math.min(t.z,this.z)),this.w=Math.max(A.w,Math.min(t.w,this.w)),this}clampScalar(A,t){return this.x=Math.max(A,Math.min(t,this.x)),this.y=Math.max(A,Math.min(t,this.y)),this.z=Math.max(A,Math.min(t,this.z)),this.w=Math.max(A,Math.min(t,this.w)),this}clampLength(A,t){const e=this.length();return this.divideScalar(e||1).multiplyScalar(Math.max(A,Math.min(t,e)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this.z=this.z<0?Math.ceil(this.z):Math.floor(this.z),this.w=this.w<0?Math.ceil(this.w):Math.floor(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(A){return this.x*A.x+this.y*A.y+this.z*A.z+this.w*A.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(A){return this.normalize().multiplyScalar(A)}lerp(A,t){return this.x+=(A.x-this.x)*t,this.y+=(A.y-this.y)*t,this.z+=(A.z-this.z)*t,this.w+=(A.w-this.w)*t,this}lerpVectors(A,t,e){return this.x=A.x+(t.x-A.x)*e,this.y=A.y+(t.y-A.y)*e,this.z=A.z+(t.z-A.z)*e,this.w=A.w+(t.w-A.w)*e,this}equals(A){return A.x===this.x&&A.y===this.y&&A.z===this.z&&A.w===this.w}fromArray(A,t=0){return this.x=A[t],this.y=A[t+1],this.z=A[t+2],this.w=A[t+3],this}toArray(A=[],t=0){return A[t]=this.x,A[t+1]=this.y,A[t+2]=this.z,A[t+3]=this.w,A}fromBufferAttribute(A,t){return this.x=A.getX(t),this.y=A.getY(t),this.z=A.getZ(t),this.w=A.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class Hn extends Vn{constructor(A=1,t=1,e={}){super(),this.isWebGLRenderTarget=!0,this.width=A,this.height=t,this.depth=1,this.scissor=new It(0,0,A,t),this.scissorTest=!1,this.viewport=new It(0,0,A,t);const n={width:A,height:t,depth:1};e.encoding!==void 0&&(Ko("THREE.WebGLRenderTarget: option.encoding has been replaced by option.colorSpace."),e.colorSpace=e.encoding===Pe?kA:Un),this.texture=new Tt(n,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.internalFormat=e.internalFormat!==void 0?e.internalFormat:null,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:Dt,this.depthBuffer=e.depthBuffer!==void 0?e.depthBuffer:!0,this.stencilBuffer=e.stencilBuffer!==void 0?e.stencilBuffer:!1,this.depthTexture=e.depthTexture!==void 0?e.depthTexture:null,this.samples=e.samples!==void 0?e.samples:0}setSize(A,t,e=1){(this.width!==A||this.height!==t||this.depth!==e)&&(this.width=A,this.height=t,this.depth=e,this.texture.image.width=A,this.texture.image.height=t,this.texture.image.depth=e,this.dispose()),this.viewport.set(0,0,A,t),this.scissor.set(0,0,A,t)}clone(){return new this.constructor().copy(this)}copy(A){this.width=A.width,this.height=A.height,this.depth=A.depth,this.scissor.copy(A.scissor),this.scissorTest=A.scissorTest,this.viewport.copy(A.viewport),this.texture=A.texture.clone(),this.texture.isRenderTargetTexture=!0;const t=Object.assign({},A.texture.image);return this.texture.source=new KQ(t),this.depthBuffer=A.depthBuffer,this.stencilBuffer=A.stencilBuffer,A.depthTexture!==null&&(this.depthTexture=A.depthTexture.clone()),this.samples=A.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class YQ extends Tt{constructor(A=null,t=1,e=1,n=1){super(null),this.isDataArrayTexture=!0,this.image={data:A,width:t,height:e,depth:n},this.magFilter=Ut,this.minFilter=Ut,this.wrapR=Yt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class Yd extends Tt{constructor(A=null,t=1,e=1,n=1){super(null),this.isData3DTexture=!0,this.image={data:A,width:t,height:e,depth:n},this.magFilter=Ut,this.minFilter=Ut,this.wrapR=Yt,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class gi{constructor(A=0,t=0,e=0,n=1){this.isQuaternion=!0,this._x=A,this._y=t,this._z=e,this._w=n}static slerpFlat(A,t,e,n,s,o,a){let g=e[n+0],r=e[n+1],I=e[n+2],B=e[n+3];const C=s[o+0],Q=s[o+1],c=s[o+2],l=s[o+3];if(a===0){A[t+0]=g,A[t+1]=r,A[t+2]=I,A[t+3]=B;return}if(a===1){A[t+0]=C,A[t+1]=Q,A[t+2]=c,A[t+3]=l;return}if(B!==l||g!==C||r!==Q||I!==c){let h=1-a;const E=g*C+r*Q+I*c+B*l,f=E>=0?1:-1,d=1-E*E;if(d>Number.EPSILON){const m=Math.sqrt(d),y=Math.atan2(m,E*f);h=Math.sin(h*y)/m,a=Math.sin(a*y)/m}const u=a*f;if(g=g*h+C*u,r=r*h+Q*u,I=I*h+c*u,B=B*h+l*u,h===1-a){const m=1/Math.sqrt(g*g+r*r+I*I+B*B);g*=m,r*=m,I*=m,B*=m}}A[t]=g,A[t+1]=r,A[t+2]=I,A[t+3]=B}static multiplyQuaternionsFlat(A,t,e,n,s,o){const a=e[n],g=e[n+1],r=e[n+2],I=e[n+3],B=s[o],C=s[o+1],Q=s[o+2],c=s[o+3];return A[t]=a*c+I*B+g*Q-r*C,A[t+1]=g*c+I*C+r*B-a*Q,A[t+2]=r*c+I*Q+a*C-g*B,A[t+3]=I*c-a*B-g*C-r*Q,A}get x(){return this._x}set x(A){this._x=A,this._onChangeCallback()}get y(){return this._y}set y(A){this._y=A,this._onChangeCallback()}get z(){return this._z}set z(A){this._z=A,this._onChangeCallback()}get w(){return this._w}set w(A){this._w=A,this._onChangeCallback()}set(A,t,e,n){return this._x=A,this._y=t,this._z=e,this._w=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(A){return this._x=A.x,this._y=A.y,this._z=A.z,this._w=A.w,this._onChangeCallback(),this}setFromEuler(A,t){const e=A._x,n=A._y,s=A._z,o=A._order,a=Math.cos,g=Math.sin,r=a(e/2),I=a(n/2),B=a(s/2),C=g(e/2),Q=g(n/2),c=g(s/2);switch(o){case"XYZ":this._x=C*I*B+r*Q*c,this._y=r*Q*B-C*I*c,this._z=r*I*c+C*Q*B,this._w=r*I*B-C*Q*c;break;case"YXZ":this._x=C*I*B+r*Q*c,this._y=r*Q*B-C*I*c,this._z=r*I*c-C*Q*B,this._w=r*I*B+C*Q*c;break;case"ZXY":this._x=C*I*B-r*Q*c,this._y=r*Q*B+C*I*c,this._z=r*I*c+C*Q*B,this._w=r*I*B-C*Q*c;break;case"ZYX":this._x=C*I*B-r*Q*c,this._y=r*Q*B+C*I*c,this._z=r*I*c-C*Q*B,this._w=r*I*B+C*Q*c;break;case"YZX":this._x=C*I*B+r*Q*c,this._y=r*Q*B+C*I*c,this._z=r*I*c-C*Q*B,this._w=r*I*B-C*Q*c;break;case"XZY":this._x=C*I*B-r*Q*c,this._y=r*Q*B-C*I*c,this._z=r*I*c+C*Q*B,this._w=r*I*B+C*Q*c;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t!==!1&&this._onChangeCallback(),this}setFromAxisAngle(A,t){const e=t/2,n=Math.sin(e);return this._x=A.x*n,this._y=A.y*n,this._z=A.z*n,this._w=Math.cos(e),this._onChangeCallback(),this}setFromRotationMatrix(A){const t=A.elements,e=t[0],n=t[4],s=t[8],o=t[1],a=t[5],g=t[9],r=t[2],I=t[6],B=t[10],C=e+a+B;if(C>0){const Q=.5/Math.sqrt(C+1);this._w=.25/Q,this._x=(I-g)*Q,this._y=(s-r)*Q,this._z=(o-n)*Q}else if(e>a&&e>B){const Q=2*Math.sqrt(1+e-a-B);this._w=(I-g)/Q,this._x=.25*Q,this._y=(n+o)/Q,this._z=(s+r)/Q}else if(a>B){const Q=2*Math.sqrt(1+a-e-B);this._w=(s-r)/Q,this._x=(n+o)/Q,this._y=.25*Q,this._z=(g+I)/Q}else{const Q=2*Math.sqrt(1+B-e-a);this._w=(o-n)/Q,this._x=(s+r)/Q,this._y=(g+I)/Q,this._z=.25*Q}return this._onChangeCallback(),this}setFromUnitVectors(A,t){let e=A.dot(t)+1;return e<Number.EPSILON?(e=0,Math.abs(A.x)>Math.abs(A.z)?(this._x=-A.y,this._y=A.x,this._z=0,this._w=e):(this._x=0,this._y=-A.z,this._z=A.y,this._w=e)):(this._x=A.y*t.z-A.z*t.y,this._y=A.z*t.x-A.x*t.z,this._z=A.x*t.y-A.y*t.x,this._w=e),this.normalize()}angleTo(A){return 2*Math.acos(Math.abs(bt(this.dot(A),-1,1)))}rotateTowards(A,t){const e=this.angleTo(A);if(e===0)return this;const n=Math.min(1,t/e);return this.slerp(A,n),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(A){return this._x*A._x+this._y*A._y+this._z*A._z+this._w*A._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let A=this.length();return A===0?(this._x=0,this._y=0,this._z=0,this._w=1):(A=1/A,this._x=this._x*A,this._y=this._y*A,this._z=this._z*A,this._w=this._w*A),this._onChangeCallback(),this}multiply(A){return this.multiplyQuaternions(this,A)}premultiply(A){return this.multiplyQuaternions(A,this)}multiplyQuaternions(A,t){const e=A._x,n=A._y,s=A._z,o=A._w,a=t._x,g=t._y,r=t._z,I=t._w;return this._x=e*I+o*a+n*r-s*g,this._y=n*I+o*g+s*a-e*r,this._z=s*I+o*r+e*g-n*a,this._w=o*I-e*a-n*g-s*r,this._onChangeCallback(),this}slerp(A,t){if(t===0)return this;if(t===1)return this.copy(A);const e=this._x,n=this._y,s=this._z,o=this._w;let a=o*A._w+e*A._x+n*A._y+s*A._z;if(a<0?(this._w=-A._w,this._x=-A._x,this._y=-A._y,this._z=-A._z,a=-a):this.copy(A),a>=1)return this._w=o,this._x=e,this._y=n,this._z=s,this;const g=1-a*a;if(g<=Number.EPSILON){const Q=1-t;return this._w=Q*o+t*this._w,this._x=Q*e+t*this._x,this._y=Q*n+t*this._y,this._z=Q*s+t*this._z,this.normalize(),this._onChangeCallback(),this}const r=Math.sqrt(g),I=Math.atan2(r,a),B=Math.sin((1-t)*I)/r,C=Math.sin(t*I)/r;return this._w=o*B+this._w*C,this._x=e*B+this._x*C,this._y=n*B+this._y*C,this._z=s*B+this._z*C,this._onChangeCallback(),this}slerpQuaternions(A,t,e){return this.copy(A).slerp(t,e)}random(){const A=Math.random(),t=Math.sqrt(1-A),e=Math.sqrt(A),n=2*Math.PI*Math.random(),s=2*Math.PI*Math.random();return this.set(t*Math.cos(n),e*Math.sin(s),e*Math.cos(s),t*Math.sin(n))}equals(A){return A._x===this._x&&A._y===this._y&&A._z===this._z&&A._w===this._w}fromArray(A,t=0){return this._x=A[t],this._y=A[t+1],this._z=A[t+2],this._w=A[t+3],this._onChangeCallback(),this}toArray(A=[],t=0){return A[t]=this._x,A[t+1]=this._y,A[t+2]=this._z,A[t+3]=this._w,A}fromBufferAttribute(A,t){return this._x=A.getX(t),this._y=A.getY(t),this._z=A.getZ(t),this._w=A.getW(t),this}toJSON(){return this.toArray()}_onChange(A){return this._onChangeCallback=A,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class P{constructor(A=0,t=0,e=0){P.prototype.isVector3=!0,this.x=A,this.y=t,this.z=e}set(A,t,e){return e===void 0&&(e=this.z),this.x=A,this.y=t,this.z=e,this}setScalar(A){return this.x=A,this.y=A,this.z=A,this}setX(A){return this.x=A,this}setY(A){return this.y=A,this}setZ(A){return this.z=A,this}setComponent(A,t){switch(A){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+A)}return this}getComponent(A){switch(A){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+A)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(A){return this.x=A.x,this.y=A.y,this.z=A.z,this}add(A){return this.x+=A.x,this.y+=A.y,this.z+=A.z,this}addScalar(A){return this.x+=A,this.y+=A,this.z+=A,this}addVectors(A,t){return this.x=A.x+t.x,this.y=A.y+t.y,this.z=A.z+t.z,this}addScaledVector(A,t){return this.x+=A.x*t,this.y+=A.y*t,this.z+=A.z*t,this}sub(A){return this.x-=A.x,this.y-=A.y,this.z-=A.z,this}subScalar(A){return this.x-=A,this.y-=A,this.z-=A,this}subVectors(A,t){return this.x=A.x-t.x,this.y=A.y-t.y,this.z=A.z-t.z,this}multiply(A){return this.x*=A.x,this.y*=A.y,this.z*=A.z,this}multiplyScalar(A){return this.x*=A,this.y*=A,this.z*=A,this}multiplyVectors(A,t){return this.x=A.x*t.x,this.y=A.y*t.y,this.z=A.z*t.z,this}applyEuler(A){return this.applyQuaternion(RC.setFromEuler(A))}applyAxisAngle(A,t){return this.applyQuaternion(RC.setFromAxisAngle(A,t))}applyMatrix3(A){const t=this.x,e=this.y,n=this.z,s=A.elements;return this.x=s[0]*t+s[3]*e+s[6]*n,this.y=s[1]*t+s[4]*e+s[7]*n,this.z=s[2]*t+s[5]*e+s[8]*n,this}applyNormalMatrix(A){return this.applyMatrix3(A).normalize()}applyMatrix4(A){const t=this.x,e=this.y,n=this.z,s=A.elements,o=1/(s[3]*t+s[7]*e+s[11]*n+s[15]);return this.x=(s[0]*t+s[4]*e+s[8]*n+s[12])*o,this.y=(s[1]*t+s[5]*e+s[9]*n+s[13])*o,this.z=(s[2]*t+s[6]*e+s[10]*n+s[14])*o,this}applyQuaternion(A){const t=this.x,e=this.y,n=this.z,s=A.x,o=A.y,a=A.z,g=A.w,r=g*t+o*n-a*e,I=g*e+a*t-s*n,B=g*n+s*e-o*t,C=-s*t-o*e-a*n;return this.x=r*g+C*-s+I*-a-B*-o,this.y=I*g+C*-o+B*-s-r*-a,this.z=B*g+C*-a+r*-o-I*-s,this}project(A){return this.applyMatrix4(A.matrixWorldInverse).applyMatrix4(A.projectionMatrix)}unproject(A){return this.applyMatrix4(A.projectionMatrixInverse).applyMatrix4(A.matrixWorld)}transformDirection(A){const t=this.x,e=this.y,n=this.z,s=A.elements;return this.x=s[0]*t+s[4]*e+s[8]*n,this.y=s[1]*t+s[5]*e+s[9]*n,this.z=s[2]*t+s[6]*e+s[10]*n,this.normalize()}divide(A){return this.x/=A.x,this.y/=A.y,this.z/=A.z,this}divideScalar(A){return this.multiplyScalar(1/A)}min(A){return this.x=Math.min(this.x,A.x),this.y=Math.min(this.y,A.y),this.z=Math.min(this.z,A.z),this}max(A){return this.x=Math.max(this.x,A.x),this.y=Math.max(this.y,A.y),this.z=Math.max(this.z,A.z),this}clamp(A,t){return this.x=Math.max(A.x,Math.min(t.x,this.x)),this.y=Math.max(A.y,Math.min(t.y,this.y)),this.z=Math.max(A.z,Math.min(t.z,this.z)),this}clampScalar(A,t){return this.x=Math.max(A,Math.min(t,this.x)),this.y=Math.max(A,Math.min(t,this.y)),this.z=Math.max(A,Math.min(t,this.z)),this}clampLength(A,t){const e=this.length();return this.divideScalar(e||1).multiplyScalar(Math.max(A,Math.min(t,e)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this.z=this.z<0?Math.ceil(this.z):Math.floor(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(A){return this.x*A.x+this.y*A.y+this.z*A.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(A){return this.normalize().multiplyScalar(A)}lerp(A,t){return this.x+=(A.x-this.x)*t,this.y+=(A.y-this.y)*t,this.z+=(A.z-this.z)*t,this}lerpVectors(A,t,e){return this.x=A.x+(t.x-A.x)*e,this.y=A.y+(t.y-A.y)*e,this.z=A.z+(t.z-A.z)*e,this}cross(A){return this.crossVectors(this,A)}crossVectors(A,t){const e=A.x,n=A.y,s=A.z,o=t.x,a=t.y,g=t.z;return this.x=n*g-s*a,this.y=s*o-e*g,this.z=e*a-n*o,this}projectOnVector(A){const t=A.lengthSq();if(t===0)return this.set(0,0,0);const e=A.dot(this)/t;return this.copy(A).multiplyScalar(e)}projectOnPlane(A){return fg.copy(this).projectOnVector(A),this.sub(fg)}reflect(A){return this.sub(fg.copy(A).multiplyScalar(2*this.dot(A)))}angleTo(A){const t=Math.sqrt(this.lengthSq()*A.lengthSq());if(t===0)return Math.PI/2;const e=this.dot(A)/t;return Math.acos(bt(e,-1,1))}distanceTo(A){return Math.sqrt(this.distanceToSquared(A))}distanceToSquared(A){const t=this.x-A.x,e=this.y-A.y,n=this.z-A.z;return t*t+e*e+n*n}manhattanDistanceTo(A){return Math.abs(this.x-A.x)+Math.abs(this.y-A.y)+Math.abs(this.z-A.z)}setFromSpherical(A){return this.setFromSphericalCoords(A.radius,A.phi,A.theta)}setFromSphericalCoords(A,t,e){const n=Math.sin(t)*A;return this.x=n*Math.sin(e),this.y=Math.cos(t)*A,this.z=n*Math.cos(e),this}setFromCylindrical(A){return this.setFromCylindricalCoords(A.radius,A.theta,A.y)}setFromCylindricalCoords(A,t,e){return this.x=A*Math.sin(t),this.y=e,this.z=A*Math.cos(t),this}setFromMatrixPosition(A){const t=A.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(A){const t=this.setFromMatrixColumn(A,0).length(),e=this.setFromMatrixColumn(A,1).length(),n=this.setFromMatrixColumn(A,2).length();return this.x=t,this.y=e,this.z=n,this}setFromMatrixColumn(A,t){return this.fromArray(A.elements,t*4)}setFromMatrix3Column(A,t){return this.fromArray(A.elements,t*3)}setFromEuler(A){return this.x=A._x,this.y=A._y,this.z=A._z,this}setFromColor(A){return this.x=A.r,this.y=A.g,this.z=A.b,this}equals(A){return A.x===this.x&&A.y===this.y&&A.z===this.z}fromArray(A,t=0){return this.x=A[t],this.y=A[t+1],this.z=A[t+2],this}toArray(A=[],t=0){return A[t]=this.x,A[t+1]=this.y,A[t+2]=this.z,A}fromBufferAttribute(A,t){return this.x=A.getX(t),this.y=A.getY(t),this.z=A.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const A=(Math.random()-.5)*2,t=Math.random()*Math.PI*2,e=Math.sqrt(1-A**2);return this.x=e*Math.cos(t),this.y=e*Math.sin(t),this.z=A,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const fg=new P,RC=new gi;class xe{constructor(A=new P(1/0,1/0,1/0),t=new P(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=A,this.max=t}set(A,t){return this.min.copy(A),this.max.copy(t),this}setFromArray(A){this.makeEmpty();for(let t=0,e=A.length;t<e;t+=3)this.expandByPoint(hi.fromArray(A,t));return this}setFromBufferAttribute(A){this.makeEmpty();for(let t=0,e=A.count;t<e;t++)this.expandByPoint(hi.fromBufferAttribute(A,t));return this}setFromPoints(A){this.makeEmpty();for(let t=0,e=A.length;t<e;t++)this.expandByPoint(A[t]);return this}setFromCenterAndSize(A,t){const e=hi.copy(t).multiplyScalar(.5);return this.min.copy(A).sub(e),this.max.copy(A).add(e),this}setFromObject(A,t=!1){return this.makeEmpty(),this.expandByObject(A,t)}clone(){return new this.constructor().copy(this)}copy(A){return this.min.copy(A.min),this.max.copy(A.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(A){return this.isEmpty()?A.set(0,0,0):A.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(A){return this.isEmpty()?A.set(0,0,0):A.subVectors(this.max,this.min)}expandByPoint(A){return this.min.min(A),this.max.max(A),this}expandByVector(A){return this.min.sub(A),this.max.add(A),this}expandByScalar(A){return this.min.addScalar(-A),this.max.addScalar(A),this}expandByObject(A,t=!1){if(A.updateWorldMatrix(!1,!1),A.boundingBox!==void 0)A.boundingBox===null&&A.computeBoundingBox(),es.copy(A.boundingBox),es.applyMatrix4(A.matrixWorld),this.union(es);else{const n=A.geometry;if(n!==void 0)if(t&&n.attributes!==void 0&&n.attributes.position!==void 0){const s=n.attributes.position;for(let o=0,a=s.count;o<a;o++)hi.fromBufferAttribute(s,o).applyMatrix4(A.matrixWorld),this.expandByPoint(hi)}else n.boundingBox===null&&n.computeBoundingBox(),es.copy(n.boundingBox),es.applyMatrix4(A.matrixWorld),this.union(es)}const e=A.children;for(let n=0,s=e.length;n<s;n++)this.expandByObject(e[n],t);return this}containsPoint(A){return!(A.x<this.min.x||A.x>this.max.x||A.y<this.min.y||A.y>this.max.y||A.z<this.min.z||A.z>this.max.z)}containsBox(A){return this.min.x<=A.min.x&&A.max.x<=this.max.x&&this.min.y<=A.min.y&&A.max.y<=this.max.y&&this.min.z<=A.min.z&&A.max.z<=this.max.z}getParameter(A,t){return t.set((A.x-this.min.x)/(this.max.x-this.min.x),(A.y-this.min.y)/(this.max.y-this.min.y),(A.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(A){return!(A.max.x<this.min.x||A.min.x>this.max.x||A.max.y<this.min.y||A.min.y>this.max.y||A.max.z<this.min.z||A.min.z>this.max.z)}intersectsSphere(A){return this.clampPoint(A.center,hi),hi.distanceToSquared(A.center)<=A.radius*A.radius}intersectsPlane(A){let t,e;return A.normal.x>0?(t=A.normal.x*this.min.x,e=A.normal.x*this.max.x):(t=A.normal.x*this.max.x,e=A.normal.x*this.min.x),A.normal.y>0?(t+=A.normal.y*this.min.y,e+=A.normal.y*this.max.y):(t+=A.normal.y*this.max.y,e+=A.normal.y*this.min.y),A.normal.z>0?(t+=A.normal.z*this.min.z,e+=A.normal.z*this.max.z):(t+=A.normal.z*this.max.z,e+=A.normal.z*this.min.z),t<=-A.constant&&e>=-A.constant}intersectsTriangle(A){if(this.isEmpty())return!1;this.getCenter(co),fa.subVectors(this.max,co),is.subVectors(A.a,co),ns.subVectors(A.b,co),ss.subVectors(A.c,co),Hi.subVectors(ns,is),qi.subVectors(ss,ns),dn.subVectors(is,ss);let t=[0,-Hi.z,Hi.y,0,-qi.z,qi.y,0,-dn.z,dn.y,Hi.z,0,-Hi.x,qi.z,0,-qi.x,dn.z,0,-dn.x,-Hi.y,Hi.x,0,-qi.y,qi.x,0,-dn.y,dn.x,0];return!pg(t,is,ns,ss,fa)||(t=[1,0,0,0,1,0,0,0,1],!pg(t,is,ns,ss,fa))?!1:(pa.crossVectors(Hi,qi),t=[pa.x,pa.y,pa.z],pg(t,is,ns,ss,fa))}clampPoint(A,t){return t.copy(A).clamp(this.min,this.max)}distanceToPoint(A){return this.clampPoint(A,hi).distanceTo(A)}getBoundingSphere(A){return this.isEmpty()?A.makeEmpty():(this.getCenter(A.center),A.radius=this.getSize(hi).length()*.5),A}intersect(A){return this.min.max(A.min),this.max.min(A.max),this.isEmpty()&&this.makeEmpty(),this}union(A){return this.min.min(A.min),this.max.max(A.max),this}applyMatrix4(A){return this.isEmpty()?this:(Ei[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(A),Ei[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(A),Ei[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(A),Ei[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(A),Ei[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(A),Ei[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(A),Ei[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(A),Ei[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(A),this.setFromPoints(Ei),this)}translate(A){return this.min.add(A),this.max.add(A),this}equals(A){return A.min.equals(this.min)&&A.max.equals(this.max)}}const Ei=[new P,new P,new P,new P,new P,new P,new P,new P],hi=new P,es=new xe,is=new P,ns=new P,ss=new P,Hi=new P,qi=new P,dn=new P,co=new P,fa=new P,pa=new P,un=new P;function pg(i,A,t,e,n){for(let s=0,o=i.length-3;s<=o;s+=3){un.fromArray(i,s);const a=n.x*Math.abs(un.x)+n.y*Math.abs(un.y)+n.z*Math.abs(un.z),g=A.dot(un),r=t.dot(un),I=e.dot(un);if(Math.max(-Math.max(g,r,I),Math.min(g,r,I))>a)return!1}return!0}const Pd=new xe,lo=new P,mg=new P;class Ii{constructor(A=new P,t=-1){this.center=A,this.radius=t}set(A,t){return this.center.copy(A),this.radius=t,this}setFromPoints(A,t){const e=this.center;t!==void 0?e.copy(t):Pd.setFromPoints(A).getCenter(e);let n=0;for(let s=0,o=A.length;s<o;s++)n=Math.max(n,e.distanceToSquared(A[s]));return this.radius=Math.sqrt(n),this}copy(A){return this.center.copy(A.center),this.radius=A.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(A){return A.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(A){return A.distanceTo(this.center)-this.radius}intersectsSphere(A){const t=this.radius+A.radius;return A.center.distanceToSquared(this.center)<=t*t}intersectsBox(A){return A.intersectsSphere(this)}intersectsPlane(A){return Math.abs(A.distanceToPoint(this.center))<=this.radius}clampPoint(A,t){const e=this.center.distanceToSquared(A);return t.copy(A),e>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(A){return this.isEmpty()?(A.makeEmpty(),A):(A.set(this.center,this.center),A.expandByScalar(this.radius),A)}applyMatrix4(A){return this.center.applyMatrix4(A),this.radius=this.radius*A.getMaxScaleOnAxis(),this}translate(A){return this.center.add(A),this}expandByPoint(A){if(this.isEmpty())return this.center.copy(A),this.radius=0,this;lo.subVectors(A,this.center);const t=lo.lengthSq();if(t>this.radius*this.radius){const e=Math.sqrt(t),n=(e-this.radius)*.5;this.center.addScaledVector(lo,n/e),this.radius+=n}return this}union(A){return A.isEmpty()?this:this.isEmpty()?(this.copy(A),this):(this.center.equals(A.center)===!0?this.radius=Math.max(this.radius,A.radius):(mg.subVectors(A.center,this.center).setLength(A.radius),this.expandByPoint(lo.copy(A.center).add(mg)),this.expandByPoint(lo.copy(A.center).sub(mg))),this)}equals(A){return A.center.equals(this.center)&&A.radius===this.radius}clone(){return new this.constructor().copy(this)}}const Qi=new P,yg=new P,ma=new P,Ji=new P,Dg=new P,ya=new P,Sg=new P;class Xr{constructor(A=new P,t=new P(0,0,-1)){this.origin=A,this.direction=t}set(A,t){return this.origin.copy(A),this.direction.copy(t),this}copy(A){return this.origin.copy(A.origin),this.direction.copy(A.direction),this}at(A,t){return t.copy(this.origin).addScaledVector(this.direction,A)}lookAt(A){return this.direction.copy(A).sub(this.origin).normalize(),this}recast(A){return this.origin.copy(this.at(A,Qi)),this}closestPointToPoint(A,t){t.subVectors(A,this.origin);const e=t.dot(this.direction);return e<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,e)}distanceToPoint(A){return Math.sqrt(this.distanceSqToPoint(A))}distanceSqToPoint(A){const t=Qi.subVectors(A,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(A):(Qi.copy(this.origin).addScaledVector(this.direction,t),Qi.distanceToSquared(A))}distanceSqToSegment(A,t,e,n){yg.copy(A).add(t).multiplyScalar(.5),ma.copy(t).sub(A).normalize(),Ji.copy(this.origin).sub(yg);const s=A.distanceTo(t)*.5,o=-this.direction.dot(ma),a=Ji.dot(this.direction),g=-Ji.dot(ma),r=Ji.lengthSq(),I=Math.abs(1-o*o);let B,C,Q,c;if(I>0)if(B=o*g-a,C=o*a-g,c=s*I,B>=0)if(C>=-c)if(C<=c){const l=1/I;B*=l,C*=l,Q=B*(B+o*C+2*a)+C*(o*B+C+2*g)+r}else C=s,B=Math.max(0,-(o*C+a)),Q=-B*B+C*(C+2*g)+r;else C=-s,B=Math.max(0,-(o*C+a)),Q=-B*B+C*(C+2*g)+r;else C<=-c?(B=Math.max(0,-(-o*s+a)),C=B>0?-s:Math.min(Math.max(-s,-g),s),Q=-B*B+C*(C+2*g)+r):C<=c?(B=0,C=Math.min(Math.max(-s,-g),s),Q=C*(C+2*g)+r):(B=Math.max(0,-(o*s+a)),C=B>0?s:Math.min(Math.max(-s,-g),s),Q=-B*B+C*(C+2*g)+r);else C=o>0?-s:s,B=Math.max(0,-(o*C+a)),Q=-B*B+C*(C+2*g)+r;return e&&e.copy(this.origin).addScaledVector(this.direction,B),n&&n.copy(yg).addScaledVector(ma,C),Q}intersectSphere(A,t){Qi.subVectors(A.center,this.origin);const e=Qi.dot(this.direction),n=Qi.dot(Qi)-e*e,s=A.radius*A.radius;if(n>s)return null;const o=Math.sqrt(s-n),a=e-o,g=e+o;return g<0?null:a<0?this.at(g,t):this.at(a,t)}intersectsSphere(A){return this.distanceSqToPoint(A.center)<=A.radius*A.radius}distanceToPlane(A){const t=A.normal.dot(this.direction);if(t===0)return A.distanceToPoint(this.origin)===0?0:null;const e=-(this.origin.dot(A.normal)+A.constant)/t;return e>=0?e:null}intersectPlane(A,t){const e=this.distanceToPlane(A);return e===null?null:this.at(e,t)}intersectsPlane(A){const t=A.distanceToPoint(this.origin);return t===0||A.normal.dot(this.direction)*t<0}intersectBox(A,t){let e,n,s,o,a,g;const r=1/this.direction.x,I=1/this.direction.y,B=1/this.direction.z,C=this.origin;return r>=0?(e=(A.min.x-C.x)*r,n=(A.max.x-C.x)*r):(e=(A.max.x-C.x)*r,n=(A.min.x-C.x)*r),I>=0?(s=(A.min.y-C.y)*I,o=(A.max.y-C.y)*I):(s=(A.max.y-C.y)*I,o=(A.min.y-C.y)*I),e>o||s>n||((s>e||isNaN(e))&&(e=s),(o<n||isNaN(n))&&(n=o),B>=0?(a=(A.min.z-C.z)*B,g=(A.max.z-C.z)*B):(a=(A.max.z-C.z)*B,g=(A.min.z-C.z)*B),e>g||a>n)||((a>e||e!==e)&&(e=a),(g<n||n!==n)&&(n=g),n<0)?null:this.at(e>=0?e:n,t)}intersectsBox(A){return this.intersectBox(A,Qi)!==null}intersectTriangle(A,t,e,n,s){Dg.subVectors(t,A),ya.subVectors(e,A),Sg.crossVectors(Dg,ya);let o=this.direction.dot(Sg),a;if(o>0){if(n)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Ji.subVectors(this.origin,A);const g=a*this.direction.dot(ya.crossVectors(Ji,ya));if(g<0)return null;const r=a*this.direction.dot(Dg.cross(Ji));if(r<0||g+r>o)return null;const I=-a*Ji.dot(Sg);return I<0?null:this.at(I/o,s)}applyMatrix4(A){return this.origin.applyMatrix4(A),this.direction.transformDirection(A),this}equals(A){return A.origin.equals(this.origin)&&A.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class zA{constructor(A,t,e,n,s,o,a,g,r,I,B,C,Q,c,l,h){zA.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],A!==void 0&&this.set(A,t,e,n,s,o,a,g,r,I,B,C,Q,c,l,h)}set(A,t,e,n,s,o,a,g,r,I,B,C,Q,c,l,h){const E=this.elements;return E[0]=A,E[4]=t,E[8]=e,E[12]=n,E[1]=s,E[5]=o,E[9]=a,E[13]=g,E[2]=r,E[6]=I,E[10]=B,E[14]=C,E[3]=Q,E[7]=c,E[11]=l,E[15]=h,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new zA().fromArray(this.elements)}copy(A){const t=this.elements,e=A.elements;return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t[4]=e[4],t[5]=e[5],t[6]=e[6],t[7]=e[7],t[8]=e[8],t[9]=e[9],t[10]=e[10],t[11]=e[11],t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15],this}copyPosition(A){const t=this.elements,e=A.elements;return t[12]=e[12],t[13]=e[13],t[14]=e[14],this}setFromMatrix3(A){const t=A.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(A,t,e){return A.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),e.setFromMatrixColumn(this,2),this}makeBasis(A,t,e){return this.set(A.x,t.x,e.x,0,A.y,t.y,e.y,0,A.z,t.z,e.z,0,0,0,0,1),this}extractRotation(A){const t=this.elements,e=A.elements,n=1/os.setFromMatrixColumn(A,0).length(),s=1/os.setFromMatrixColumn(A,1).length(),o=1/os.setFromMatrixColumn(A,2).length();return t[0]=e[0]*n,t[1]=e[1]*n,t[2]=e[2]*n,t[3]=0,t[4]=e[4]*s,t[5]=e[5]*s,t[6]=e[6]*s,t[7]=0,t[8]=e[8]*o,t[9]=e[9]*o,t[10]=e[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(A){const t=this.elements,e=A.x,n=A.y,s=A.z,o=Math.cos(e),a=Math.sin(e),g=Math.cos(n),r=Math.sin(n),I=Math.cos(s),B=Math.sin(s);if(A.order==="XYZ"){const C=o*I,Q=o*B,c=a*I,l=a*B;t[0]=g*I,t[4]=-g*B,t[8]=r,t[1]=Q+c*r,t[5]=C-l*r,t[9]=-a*g,t[2]=l-C*r,t[6]=c+Q*r,t[10]=o*g}else if(A.order==="YXZ"){const C=g*I,Q=g*B,c=r*I,l=r*B;t[0]=C+l*a,t[4]=c*a-Q,t[8]=o*r,t[1]=o*B,t[5]=o*I,t[9]=-a,t[2]=Q*a-c,t[6]=l+C*a,t[10]=o*g}else if(A.order==="ZXY"){const C=g*I,Q=g*B,c=r*I,l=r*B;t[0]=C-l*a,t[4]=-o*B,t[8]=c+Q*a,t[1]=Q+c*a,t[5]=o*I,t[9]=l-C*a,t[2]=-o*r,t[6]=a,t[10]=o*g}else if(A.order==="ZYX"){const C=o*I,Q=o*B,c=a*I,l=a*B;t[0]=g*I,t[4]=c*r-Q,t[8]=C*r+l,t[1]=g*B,t[5]=l*r+C,t[9]=Q*r-c,t[2]=-r,t[6]=a*g,t[10]=o*g}else if(A.order==="YZX"){const C=o*g,Q=o*r,c=a*g,l=a*r;t[0]=g*I,t[4]=l-C*B,t[8]=c*B+Q,t[1]=B,t[5]=o*I,t[9]=-a*I,t[2]=-r*I,t[6]=Q*B+c,t[10]=C-l*B}else if(A.order==="XZY"){const C=o*g,Q=o*r,c=a*g,l=a*r;t[0]=g*I,t[4]=-B,t[8]=r*I,t[1]=C*B+l,t[5]=o*I,t[9]=Q*B-c,t[2]=c*B-Q,t[6]=a*I,t[10]=l*B+C}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(A){return this.compose(Od,A,Wd)}lookAt(A,t,e){const n=this.elements;return ae.subVectors(A,t),ae.lengthSq()===0&&(ae.z=1),ae.normalize(),Ki.crossVectors(e,ae),Ki.lengthSq()===0&&(Math.abs(e.z)===1?ae.x+=1e-4:ae.z+=1e-4,ae.normalize(),Ki.crossVectors(e,ae)),Ki.normalize(),Da.crossVectors(ae,Ki),n[0]=Ki.x,n[4]=Da.x,n[8]=ae.x,n[1]=Ki.y,n[5]=Da.y,n[9]=ae.y,n[2]=Ki.z,n[6]=Da.z,n[10]=ae.z,this}multiply(A){return this.multiplyMatrices(this,A)}premultiply(A){return this.multiplyMatrices(A,this)}multiplyMatrices(A,t){const e=A.elements,n=t.elements,s=this.elements,o=e[0],a=e[4],g=e[8],r=e[12],I=e[1],B=e[5],C=e[9],Q=e[13],c=e[2],l=e[6],h=e[10],E=e[14],f=e[3],d=e[7],u=e[11],m=e[15],y=n[0],p=n[4],R=n[8],D=n[12],S=n[1],F=n[5],G=n[9],L=n[13],T=n[2],b=n[6],V=n[10],K=n[14],tA=n[3],nA=n[7],Z=n[11],CA=n[15];return s[0]=o*y+a*S+g*T+r*tA,s[4]=o*p+a*F+g*b+r*nA,s[8]=o*R+a*G+g*V+r*Z,s[12]=o*D+a*L+g*K+r*CA,s[1]=I*y+B*S+C*T+Q*tA,s[5]=I*p+B*F+C*b+Q*nA,s[9]=I*R+B*G+C*V+Q*Z,s[13]=I*D+B*L+C*K+Q*CA,s[2]=c*y+l*S+h*T+E*tA,s[6]=c*p+l*F+h*b+E*nA,s[10]=c*R+l*G+h*V+E*Z,s[14]=c*D+l*L+h*K+E*CA,s[3]=f*y+d*S+u*T+m*tA,s[7]=f*p+d*F+u*b+m*nA,s[11]=f*R+d*G+u*V+m*Z,s[15]=f*D+d*L+u*K+m*CA,this}multiplyScalar(A){const t=this.elements;return t[0]*=A,t[4]*=A,t[8]*=A,t[12]*=A,t[1]*=A,t[5]*=A,t[9]*=A,t[13]*=A,t[2]*=A,t[6]*=A,t[10]*=A,t[14]*=A,t[3]*=A,t[7]*=A,t[11]*=A,t[15]*=A,this}determinant(){const A=this.elements,t=A[0],e=A[4],n=A[8],s=A[12],o=A[1],a=A[5],g=A[9],r=A[13],I=A[2],B=A[6],C=A[10],Q=A[14],c=A[3],l=A[7],h=A[11],E=A[15];return c*(+s*g*B-n*r*B-s*a*C+e*r*C+n*a*Q-e*g*Q)+l*(+t*g*Q-t*r*C+s*o*C-n*o*Q+n*r*I-s*g*I)+h*(+t*r*B-t*a*Q-s*o*B+e*o*Q+s*a*I-e*r*I)+E*(-n*a*I-t*g*B+t*a*C+n*o*B-e*o*C+e*g*I)}transpose(){const A=this.elements;let t;return t=A[1],A[1]=A[4],A[4]=t,t=A[2],A[2]=A[8],A[8]=t,t=A[6],A[6]=A[9],A[9]=t,t=A[3],A[3]=A[12],A[12]=t,t=A[7],A[7]=A[13],A[13]=t,t=A[11],A[11]=A[14],A[14]=t,this}setPosition(A,t,e){const n=this.elements;return A.isVector3?(n[12]=A.x,n[13]=A.y,n[14]=A.z):(n[12]=A,n[13]=t,n[14]=e),this}invert(){const A=this.elements,t=A[0],e=A[1],n=A[2],s=A[3],o=A[4],a=A[5],g=A[6],r=A[7],I=A[8],B=A[9],C=A[10],Q=A[11],c=A[12],l=A[13],h=A[14],E=A[15],f=B*h*r-l*C*r+l*g*Q-a*h*Q-B*g*E+a*C*E,d=c*C*r-I*h*r-c*g*Q+o*h*Q+I*g*E-o*C*E,u=I*l*r-c*B*r+c*a*Q-o*l*Q-I*a*E+o*B*E,m=c*B*g-I*l*g-c*a*C+o*l*C+I*a*h-o*B*h,y=t*f+e*d+n*u+s*m;if(y===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const p=1/y;return A[0]=f*p,A[1]=(l*C*s-B*h*s-l*n*Q+e*h*Q+B*n*E-e*C*E)*p,A[2]=(a*h*s-l*g*s+l*n*r-e*h*r-a*n*E+e*g*E)*p,A[3]=(B*g*s-a*C*s-B*n*r+e*C*r+a*n*Q-e*g*Q)*p,A[4]=d*p,A[5]=(I*h*s-c*C*s+c*n*Q-t*h*Q-I*n*E+t*C*E)*p,A[6]=(c*g*s-o*h*s-c*n*r+t*h*r+o*n*E-t*g*E)*p,A[7]=(o*C*s-I*g*s+I*n*r-t*C*r-o*n*Q+t*g*Q)*p,A[8]=u*p,A[9]=(c*B*s-I*l*s-c*e*Q+t*l*Q+I*e*E-t*B*E)*p,A[10]=(o*l*s-c*a*s+c*e*r-t*l*r-o*e*E+t*a*E)*p,A[11]=(I*a*s-o*B*s-I*e*r+t*B*r+o*e*Q-t*a*Q)*p,A[12]=m*p,A[13]=(I*l*n-c*B*n+c*e*C-t*l*C-I*e*h+t*B*h)*p,A[14]=(c*a*n-o*l*n-c*e*g+t*l*g+o*e*h-t*a*h)*p,A[15]=(o*B*n-I*a*n+I*e*g-t*B*g-o*e*C+t*a*C)*p,this}scale(A){const t=this.elements,e=A.x,n=A.y,s=A.z;return t[0]*=e,t[4]*=n,t[8]*=s,t[1]*=e,t[5]*=n,t[9]*=s,t[2]*=e,t[6]*=n,t[10]*=s,t[3]*=e,t[7]*=n,t[11]*=s,this}getMaxScaleOnAxis(){const A=this.elements,t=A[0]*A[0]+A[1]*A[1]+A[2]*A[2],e=A[4]*A[4]+A[5]*A[5]+A[6]*A[6],n=A[8]*A[8]+A[9]*A[9]+A[10]*A[10];return Math.sqrt(Math.max(t,e,n))}makeTranslation(A,t,e){return A.isVector3?this.set(1,0,0,A.x,0,1,0,A.y,0,0,1,A.z,0,0,0,1):this.set(1,0,0,A,0,1,0,t,0,0,1,e,0,0,0,1),this}makeRotationX(A){const t=Math.cos(A),e=Math.sin(A);return this.set(1,0,0,0,0,t,-e,0,0,e,t,0,0,0,0,1),this}makeRotationY(A){const t=Math.cos(A),e=Math.sin(A);return this.set(t,0,e,0,0,1,0,0,-e,0,t,0,0,0,0,1),this}makeRotationZ(A){const t=Math.cos(A),e=Math.sin(A);return this.set(t,-e,0,0,e,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(A,t){const e=Math.cos(t),n=Math.sin(t),s=1-e,o=A.x,a=A.y,g=A.z,r=s*o,I=s*a;return this.set(r*o+e,r*a-n*g,r*g+n*a,0,r*a+n*g,I*a+e,I*g-n*o,0,r*g-n*a,I*g+n*o,s*g*g+e,0,0,0,0,1),this}makeScale(A,t,e){return this.set(A,0,0,0,0,t,0,0,0,0,e,0,0,0,0,1),this}makeShear(A,t,e,n,s,o){return this.set(1,e,s,0,A,1,o,0,t,n,1,0,0,0,0,1),this}compose(A,t,e){const n=this.elements,s=t._x,o=t._y,a=t._z,g=t._w,r=s+s,I=o+o,B=a+a,C=s*r,Q=s*I,c=s*B,l=o*I,h=o*B,E=a*B,f=g*r,d=g*I,u=g*B,m=e.x,y=e.y,p=e.z;return n[0]=(1-(l+E))*m,n[1]=(Q+u)*m,n[2]=(c-d)*m,n[3]=0,n[4]=(Q-u)*y,n[5]=(1-(C+E))*y,n[6]=(h+f)*y,n[7]=0,n[8]=(c+d)*p,n[9]=(h-f)*p,n[10]=(1-(C+l))*p,n[11]=0,n[12]=A.x,n[13]=A.y,n[14]=A.z,n[15]=1,this}decompose(A,t,e){const n=this.elements;let s=os.set(n[0],n[1],n[2]).length();const o=os.set(n[4],n[5],n[6]).length(),a=os.set(n[8],n[9],n[10]).length();this.determinant()<0&&(s=-s),A.x=n[12],A.y=n[13],A.z=n[14],Ge.copy(this);const r=1/s,I=1/o,B=1/a;return Ge.elements[0]*=r,Ge.elements[1]*=r,Ge.elements[2]*=r,Ge.elements[4]*=I,Ge.elements[5]*=I,Ge.elements[6]*=I,Ge.elements[8]*=B,Ge.elements[9]*=B,Ge.elements[10]*=B,t.setFromRotationMatrix(Ge),e.x=s,e.y=o,e.z=a,this}makePerspective(A,t,e,n,s,o,a=Gi){const g=this.elements,r=2*s/(t-A),I=2*s/(e-n),B=(t+A)/(t-A),C=(e+n)/(e-n);let Q,c;if(a===Gi)Q=-(o+s)/(o-s),c=-2*o*s/(o-s);else if(a===Ur)Q=-o/(o-s),c=-o*s/(o-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return g[0]=r,g[4]=0,g[8]=B,g[12]=0,g[1]=0,g[5]=I,g[9]=C,g[13]=0,g[2]=0,g[6]=0,g[10]=Q,g[14]=c,g[3]=0,g[7]=0,g[11]=-1,g[15]=0,this}makeOrthographic(A,t,e,n,s,o,a=Gi){const g=this.elements,r=1/(t-A),I=1/(e-n),B=1/(o-s),C=(t+A)*r,Q=(e+n)*I;let c,l;if(a===Gi)c=(o+s)*B,l=-2*B;else if(a===Ur)c=s*B,l=-1*B;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return g[0]=2*r,g[4]=0,g[8]=0,g[12]=-C,g[1]=0,g[5]=2*I,g[9]=0,g[13]=-Q,g[2]=0,g[6]=0,g[10]=l,g[14]=-c,g[3]=0,g[7]=0,g[11]=0,g[15]=1,this}equals(A){const t=this.elements,e=A.elements;for(let n=0;n<16;n++)if(t[n]!==e[n])return!1;return!0}fromArray(A,t=0){for(let e=0;e<16;e++)this.elements[e]=A[e+t];return this}toArray(A=[],t=0){const e=this.elements;return A[t]=e[0],A[t+1]=e[1],A[t+2]=e[2],A[t+3]=e[3],A[t+4]=e[4],A[t+5]=e[5],A[t+6]=e[6],A[t+7]=e[7],A[t+8]=e[8],A[t+9]=e[9],A[t+10]=e[10],A[t+11]=e[11],A[t+12]=e[12],A[t+13]=e[13],A[t+14]=e[14],A[t+15]=e[15],A}}const os=new P,Ge=new zA,Od=new P(0,0,0),Wd=new P(1,1,1),Ki=new P,Da=new P,ae=new P,FC=new zA,xC=new gi;class Zr{constructor(A=0,t=0,e=0,n=Zr.DEFAULT_ORDER){this.isEuler=!0,this._x=A,this._y=t,this._z=e,this._order=n}get x(){return this._x}set x(A){this._x=A,this._onChangeCallback()}get y(){return this._y}set y(A){this._y=A,this._onChangeCallback()}get z(){return this._z}set z(A){this._z=A,this._onChangeCallback()}get order(){return this._order}set order(A){this._order=A,this._onChangeCallback()}set(A,t,e,n=this._order){return this._x=A,this._y=t,this._z=e,this._order=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(A){return this._x=A._x,this._y=A._y,this._z=A._z,this._order=A._order,this._onChangeCallback(),this}setFromRotationMatrix(A,t=this._order,e=!0){const n=A.elements,s=n[0],o=n[4],a=n[8],g=n[1],r=n[5],I=n[9],B=n[2],C=n[6],Q=n[10];switch(t){case"XYZ":this._y=Math.asin(bt(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-I,Q),this._z=Math.atan2(-o,s)):(this._x=Math.atan2(C,r),this._z=0);break;case"YXZ":this._x=Math.asin(-bt(I,-1,1)),Math.abs(I)<.9999999?(this._y=Math.atan2(a,Q),this._z=Math.atan2(g,r)):(this._y=Math.atan2(-B,s),this._z=0);break;case"ZXY":this._x=Math.asin(bt(C,-1,1)),Math.abs(C)<.9999999?(this._y=Math.atan2(-B,Q),this._z=Math.atan2(-o,r)):(this._y=0,this._z=Math.atan2(g,s));break;case"ZYX":this._y=Math.asin(-bt(B,-1,1)),Math.abs(B)<.9999999?(this._x=Math.atan2(C,Q),this._z=Math.atan2(g,s)):(this._x=0,this._z=Math.atan2(-o,r));break;case"YZX":this._z=Math.asin(bt(g,-1,1)),Math.abs(g)<.9999999?(this._x=Math.atan2(-I,r),this._y=Math.atan2(-B,s)):(this._x=0,this._y=Math.atan2(a,Q));break;case"XZY":this._z=Math.asin(-bt(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(C,r),this._y=Math.atan2(a,s)):(this._x=Math.atan2(-I,Q),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,e===!0&&this._onChangeCallback(),this}setFromQuaternion(A,t,e){return FC.makeRotationFromQuaternion(A),this.setFromRotationMatrix(FC,t,e)}setFromVector3(A,t=this._order){return this.set(A.x,A.y,A.z,t)}reorder(A){return xC.setFromEuler(this),this.setFromQuaternion(xC,A)}equals(A){return A._x===this._x&&A._y===this._y&&A._z===this._z&&A._order===this._order}fromArray(A){return this._x=A[0],this._y=A[1],this._z=A[2],A[3]!==void 0&&(this._order=A[3]),this._onChangeCallback(),this}toArray(A=[],t=0){return A[t]=this._x,A[t+1]=this._y,A[t+2]=this._z,A[t+3]=this._order,A}_onChange(A){return this._onChangeCallback=A,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}Zr.DEFAULT_ORDER="XYZ";class PQ{constructor(){this.mask=1}set(A){this.mask=(1<<A|0)>>>0}enable(A){this.mask|=1<<A|0}enableAll(){this.mask=-1}toggle(A){this.mask^=1<<A|0}disable(A){this.mask&=~(1<<A|0)}disableAll(){this.mask=0}test(A){return(this.mask&A.mask)!==0}isEnabled(A){return(this.mask&(1<<A|0))!==0}}let Vd=0;const NC=new P,as=new gi,ci=new zA,Sa=new P,uo=new P,zd=new P,Xd=new gi,_C=new P(1,0,0),GC=new P(0,1,0),LC=new P(0,0,1),Zd={type:"added"},UC={type:"removed"};class Qt extends Vn{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:Vd++}),this.uuid=Oe(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Qt.DEFAULT_UP.clone();const A=new P,t=new Zr,e=new gi,n=new P(1,1,1);function s(){e.setFromEuler(t,!1)}function o(){t.setFromQuaternion(e,void 0,!1)}t._onChange(s),e._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:A},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:e},scale:{configurable:!0,enumerable:!0,value:n},modelViewMatrix:{value:new zA},normalMatrix:{value:new VA}}),this.matrix=new zA,this.matrixWorld=new zA,this.matrixAutoUpdate=Qt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.matrixWorldAutoUpdate=Qt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.layers=new PQ,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeRender(){}onAfterRender(){}applyMatrix4(A){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(A),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(A){return this.quaternion.premultiply(A),this}setRotationFromAxisAngle(A,t){this.quaternion.setFromAxisAngle(A,t)}setRotationFromEuler(A){this.quaternion.setFromEuler(A,!0)}setRotationFromMatrix(A){this.quaternion.setFromRotationMatrix(A)}setRotationFromQuaternion(A){this.quaternion.copy(A)}rotateOnAxis(A,t){return as.setFromAxisAngle(A,t),this.quaternion.multiply(as),this}rotateOnWorldAxis(A,t){return as.setFromAxisAngle(A,t),this.quaternion.premultiply(as),this}rotateX(A){return this.rotateOnAxis(_C,A)}rotateY(A){return this.rotateOnAxis(GC,A)}rotateZ(A){return this.rotateOnAxis(LC,A)}translateOnAxis(A,t){return NC.copy(A).applyQuaternion(this.quaternion),this.position.add(NC.multiplyScalar(t)),this}translateX(A){return this.translateOnAxis(_C,A)}translateY(A){return this.translateOnAxis(GC,A)}translateZ(A){return this.translateOnAxis(LC,A)}localToWorld(A){return this.updateWorldMatrix(!0,!1),A.applyMatrix4(this.matrixWorld)}worldToLocal(A){return this.updateWorldMatrix(!0,!1),A.applyMatrix4(ci.copy(this.matrixWorld).invert())}lookAt(A,t,e){A.isVector3?Sa.copy(A):Sa.set(A,t,e);const n=this.parent;this.updateWorldMatrix(!0,!1),uo.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?ci.lookAt(uo,Sa,this.up):ci.lookAt(Sa,uo,this.up),this.quaternion.setFromRotationMatrix(ci),n&&(ci.extractRotation(n.matrixWorld),as.setFromRotationMatrix(ci),this.quaternion.premultiply(as.invert()))}add(A){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return A===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",A),this):(A&&A.isObject3D?(A.parent!==null&&A.parent.remove(A),A.parent=this,this.children.push(A),A.dispatchEvent(Zd)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",A),this)}remove(A){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.remove(arguments[e]);return this}const t=this.children.indexOf(A);return t!==-1&&(A.parent=null,this.children.splice(t,1),A.dispatchEvent(UC)),this}removeFromParent(){const A=this.parent;return A!==null&&A.remove(this),this}clear(){for(let A=0;A<this.children.length;A++){const t=this.children[A];t.parent=null,t.dispatchEvent(UC)}return this.children.length=0,this}attach(A){return this.updateWorldMatrix(!0,!1),ci.copy(this.matrixWorld).invert(),A.parent!==null&&(A.parent.updateWorldMatrix(!0,!1),ci.multiply(A.parent.matrixWorld)),A.applyMatrix4(ci),this.add(A),A.updateWorldMatrix(!1,!0),this}getObjectById(A){return this.getObjectByProperty("id",A)}getObjectByName(A){return this.getObjectByProperty("name",A)}getObjectByProperty(A,t){if(this[A]===t)return this;for(let e=0,n=this.children.length;e<n;e++){const o=this.children[e].getObjectByProperty(A,t);if(o!==void 0)return o}}getObjectsByProperty(A,t){let e=[];this[A]===t&&e.push(this);for(let n=0,s=this.children.length;n<s;n++){const o=this.children[n].getObjectsByProperty(A,t);o.length>0&&(e=e.concat(o))}return e}getWorldPosition(A){return this.updateWorldMatrix(!0,!1),A.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(A){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(uo,A,zd),A}getWorldScale(A){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(uo,Xd,A),A}getWorldDirection(A){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return A.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(A){A(this);const t=this.children;for(let e=0,n=t.length;e<n;e++)t[e].traverse(A)}traverseVisible(A){if(this.visible===!1)return;A(this);const t=this.children;for(let e=0,n=t.length;e<n;e++)t[e].traverseVisible(A)}traverseAncestors(A){const t=this.parent;t!==null&&(A(t),t.traverseAncestors(A))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(A){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||A)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,A=!0);const t=this.children;for(let e=0,n=t.length;e<n;e++){const s=t[e];(s.matrixWorldAutoUpdate===!0||A===!0)&&s.updateMatrixWorld(A)}}updateWorldMatrix(A,t){const e=this.parent;if(A===!0&&e!==null&&e.matrixWorldAutoUpdate===!0&&e.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),t===!0){const n=this.children;for(let s=0,o=n.length;s<o;s++){const a=n[s];a.matrixWorldAutoUpdate===!0&&a.updateWorldMatrix(!1,!0)}}}toJSON(A){const t=A===void 0||typeof A=="string",e={};t&&(A={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},e.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const n={};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.castShadow===!0&&(n.castShadow=!0),this.receiveShadow===!0&&(n.receiveShadow=!0),this.visible===!1&&(n.visible=!1),this.frustumCulled===!1&&(n.frustumCulled=!1),this.renderOrder!==0&&(n.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(n.userData=this.userData),n.layers=this.layers.mask,n.matrix=this.matrix.toArray(),n.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(n.matrixAutoUpdate=!1),this.isInstancedMesh&&(n.type="InstancedMesh",n.count=this.count,n.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(n.instanceColor=this.instanceColor.toJSON()));function s(a,g){return a[g.uuid]===void 0&&(a[g.uuid]=g.toJSON(A)),g.uuid}if(this.isScene)this.background&&(this.background.isColor?n.background=this.background.toJSON():this.background.isTexture&&(n.background=this.background.toJSON(A).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(n.environment=this.environment.toJSON(A).uuid);else if(this.isMesh||this.isLine||this.isPoints){n.geometry=s(A.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const g=a.shapes;if(Array.isArray(g))for(let r=0,I=g.length;r<I;r++){const B=g[r];s(A.shapes,B)}else s(A.shapes,g)}}if(this.isSkinnedMesh&&(n.bindMode=this.bindMode,n.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(A.skeletons,this.skeleton),n.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let g=0,r=this.material.length;g<r;g++)a.push(s(A.materials,this.material[g]));n.material=a}else n.material=s(A.materials,this.material);if(this.children.length>0){n.children=[];for(let a=0;a<this.children.length;a++)n.children.push(this.children[a].toJSON(A).object)}if(this.animations.length>0){n.animations=[];for(let a=0;a<this.animations.length;a++){const g=this.animations[a];n.animations.push(s(A.animations,g))}}if(t){const a=o(A.geometries),g=o(A.materials),r=o(A.textures),I=o(A.images),B=o(A.shapes),C=o(A.skeletons),Q=o(A.animations),c=o(A.nodes);a.length>0&&(e.geometries=a),g.length>0&&(e.materials=g),r.length>0&&(e.textures=r),I.length>0&&(e.images=I),B.length>0&&(e.shapes=B),C.length>0&&(e.skeletons=C),Q.length>0&&(e.animations=Q),c.length>0&&(e.nodes=c)}return e.object=n,e;function o(a){const g=[];for(const r in a){const I=a[r];delete I.metadata,g.push(I)}return g}}clone(A){return new this.constructor().copy(this,A)}copy(A,t=!0){if(this.name=A.name,this.up.copy(A.up),this.position.copy(A.position),this.rotation.order=A.rotation.order,this.quaternion.copy(A.quaternion),this.scale.copy(A.scale),this.matrix.copy(A.matrix),this.matrixWorld.copy(A.matrixWorld),this.matrixAutoUpdate=A.matrixAutoUpdate,this.matrixWorldNeedsUpdate=A.matrixWorldNeedsUpdate,this.matrixWorldAutoUpdate=A.matrixWorldAutoUpdate,this.layers.mask=A.layers.mask,this.visible=A.visible,this.castShadow=A.castShadow,this.receiveShadow=A.receiveShadow,this.frustumCulled=A.frustumCulled,this.renderOrder=A.renderOrder,this.animations=A.animations,this.userData=JSON.parse(JSON.stringify(A.userData)),t===!0)for(let e=0;e<A.children.length;e++){const n=A.children[e];this.add(n.clone())}return this}}Qt.DEFAULT_UP=new P(0,1,0);Qt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Qt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const Le=new P,li=new P,wg=new P,di=new P,rs=new P,gs=new P,bC=new P,Mg=new P,Rg=new P,Fg=new P;let wa=!1;class qe{constructor(A=new P,t=new P,e=new P){this.a=A,this.b=t,this.c=e}static getNormal(A,t,e,n){n.subVectors(e,t),Le.subVectors(A,t),n.cross(Le);const s=n.lengthSq();return s>0?n.multiplyScalar(1/Math.sqrt(s)):n.set(0,0,0)}static getBarycoord(A,t,e,n,s){Le.subVectors(n,t),li.subVectors(e,t),wg.subVectors(A,t);const o=Le.dot(Le),a=Le.dot(li),g=Le.dot(wg),r=li.dot(li),I=li.dot(wg),B=o*r-a*a;if(B===0)return s.set(-2,-1,-1);const C=1/B,Q=(r*g-a*I)*C,c=(o*I-a*g)*C;return s.set(1-Q-c,c,Q)}static containsPoint(A,t,e,n){return this.getBarycoord(A,t,e,n,di),di.x>=0&&di.y>=0&&di.x+di.y<=1}static getUV(A,t,e,n,s,o,a,g){return wa===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),wa=!0),this.getInterpolation(A,t,e,n,s,o,a,g)}static getInterpolation(A,t,e,n,s,o,a,g){return this.getBarycoord(A,t,e,n,di),g.setScalar(0),g.addScaledVector(s,di.x),g.addScaledVector(o,di.y),g.addScaledVector(a,di.z),g}static isFrontFacing(A,t,e,n){return Le.subVectors(e,t),li.subVectors(A,t),Le.cross(li).dot(n)<0}set(A,t,e){return this.a.copy(A),this.b.copy(t),this.c.copy(e),this}setFromPointsAndIndices(A,t,e,n){return this.a.copy(A[t]),this.b.copy(A[e]),this.c.copy(A[n]),this}setFromAttributeAndIndices(A,t,e,n){return this.a.fromBufferAttribute(A,t),this.b.fromBufferAttribute(A,e),this.c.fromBufferAttribute(A,n),this}clone(){return new this.constructor().copy(this)}copy(A){return this.a.copy(A.a),this.b.copy(A.b),this.c.copy(A.c),this}getArea(){return Le.subVectors(this.c,this.b),li.subVectors(this.a,this.b),Le.cross(li).length()*.5}getMidpoint(A){return A.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(A){return qe.getNormal(this.a,this.b,this.c,A)}getPlane(A){return A.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(A,t){return qe.getBarycoord(A,this.a,this.b,this.c,t)}getUV(A,t,e,n,s){return wa===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),wa=!0),qe.getInterpolation(A,this.a,this.b,this.c,t,e,n,s)}getInterpolation(A,t,e,n,s){return qe.getInterpolation(A,this.a,this.b,this.c,t,e,n,s)}containsPoint(A){return qe.containsPoint(A,this.a,this.b,this.c)}isFrontFacing(A){return qe.isFrontFacing(this.a,this.b,this.c,A)}intersectsBox(A){return A.intersectsTriangle(this)}closestPointToPoint(A,t){const e=this.a,n=this.b,s=this.c;let o,a;rs.subVectors(n,e),gs.subVectors(s,e),Mg.subVectors(A,e);const g=rs.dot(Mg),r=gs.dot(Mg);if(g<=0&&r<=0)return t.copy(e);Rg.subVectors(A,n);const I=rs.dot(Rg),B=gs.dot(Rg);if(I>=0&&B<=I)return t.copy(n);const C=g*B-I*r;if(C<=0&&g>=0&&I<=0)return o=g/(g-I),t.copy(e).addScaledVector(rs,o);Fg.subVectors(A,s);const Q=rs.dot(Fg),c=gs.dot(Fg);if(c>=0&&Q<=c)return t.copy(s);const l=Q*r-g*c;if(l<=0&&r>=0&&c<=0)return a=r/(r-c),t.copy(e).addScaledVector(gs,a);const h=I*c-Q*B;if(h<=0&&B-I>=0&&Q-c>=0)return bC.subVectors(s,n),a=(B-I)/(B-I+(Q-c)),t.copy(n).addScaledVector(bC,a);const E=1/(h+l+C);return o=l*E,a=C*E,t.copy(e).addScaledVector(rs,o).addScaledVector(gs,a)}equals(A){return A.a.equals(this.a)&&A.b.equals(this.b)&&A.c.equals(this.c)}}let jd=0;class We extends Vn{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:jd++}),this.uuid=Oe(),this.name="",this.type="Material",this.blending=Js,this.side=vi,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.blendSrc=MQ,this.blendDst=RQ,this.blendEquation=vs,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.depthFunc=bI,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Ed,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=cg,this.stencilZFail=cg,this.stencilZPass=cg,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(A){this._alphaTest>0!=A>0&&this.version++,this._alphaTest=A}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(A){if(A!==void 0)for(const t in A){const e=A[t];if(e===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}const n=this[t];if(n===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}n&&n.isColor?n.set(e):n&&n.isVector3&&e&&e.isVector3?n.copy(e):this[t]=e}}toJSON(A){const t=A===void 0||typeof A=="string";t&&(A={textures:{},images:{}});const e={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),this.color&&this.color.isColor&&(e.color=this.color.getHex()),this.roughness!==void 0&&(e.roughness=this.roughness),this.metalness!==void 0&&(e.metalness=this.metalness),this.sheen!==void 0&&(e.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(e.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(e.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(e.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(e.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(e.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(e.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(e.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(e.shininess=this.shininess),this.clearcoat!==void 0&&(e.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(e.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(e.clearcoatMap=this.clearcoatMap.toJSON(A).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(e.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(A).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(e.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(A).uuid,e.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(e.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(e.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(e.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(e.iridescenceMap=this.iridescenceMap.toJSON(A).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(e.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(A).uuid),this.anisotropy!==void 0&&(e.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(e.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(e.anisotropyMap=this.anisotropyMap.toJSON(A).uuid),this.map&&this.map.isTexture&&(e.map=this.map.toJSON(A).uuid),this.matcap&&this.matcap.isTexture&&(e.matcap=this.matcap.toJSON(A).uuid),this.alphaMap&&this.alphaMap.isTexture&&(e.alphaMap=this.alphaMap.toJSON(A).uuid),this.lightMap&&this.lightMap.isTexture&&(e.lightMap=this.lightMap.toJSON(A).uuid,e.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(e.aoMap=this.aoMap.toJSON(A).uuid,e.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(e.bumpMap=this.bumpMap.toJSON(A).uuid,e.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(e.normalMap=this.normalMap.toJSON(A).uuid,e.normalMapType=this.normalMapType,e.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(e.displacementMap=this.displacementMap.toJSON(A).uuid,e.displacementScale=this.displacementScale,e.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(e.roughnessMap=this.roughnessMap.toJSON(A).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(e.metalnessMap=this.metalnessMap.toJSON(A).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(e.emissiveMap=this.emissiveMap.toJSON(A).uuid),this.specularMap&&this.specularMap.isTexture&&(e.specularMap=this.specularMap.toJSON(A).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(e.specularIntensityMap=this.specularIntensityMap.toJSON(A).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(e.specularColorMap=this.specularColorMap.toJSON(A).uuid),this.envMap&&this.envMap.isTexture&&(e.envMap=this.envMap.toJSON(A).uuid,this.combine!==void 0&&(e.combine=this.combine)),this.envMapIntensity!==void 0&&(e.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(e.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(e.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(e.gradientMap=this.gradientMap.toJSON(A).uuid),this.transmission!==void 0&&(e.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(e.transmissionMap=this.transmissionMap.toJSON(A).uuid),this.thickness!==void 0&&(e.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(e.thicknessMap=this.thicknessMap.toJSON(A).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(e.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(e.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(e.size=this.size),this.shadowSide!==null&&(e.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(e.sizeAttenuation=this.sizeAttenuation),this.blending!==Js&&(e.blending=this.blending),this.side!==vi&&(e.side=this.side),this.vertexColors&&(e.vertexColors=!0),this.opacity<1&&(e.opacity=this.opacity),this.transparent===!0&&(e.transparent=this.transparent),e.depthFunc=this.depthFunc,e.depthTest=this.depthTest,e.depthWrite=this.depthWrite,e.colorWrite=this.colorWrite,e.stencilWrite=this.stencilWrite,e.stencilWriteMask=this.stencilWriteMask,e.stencilFunc=this.stencilFunc,e.stencilRef=this.stencilRef,e.stencilFuncMask=this.stencilFuncMask,e.stencilFail=this.stencilFail,e.stencilZFail=this.stencilZFail,e.stencilZPass=this.stencilZPass,this.rotation!==void 0&&this.rotation!==0&&(e.rotation=this.rotation),this.polygonOffset===!0&&(e.polygonOffset=!0),this.polygonOffsetFactor!==0&&(e.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(e.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(e.linewidth=this.linewidth),this.dashSize!==void 0&&(e.dashSize=this.dashSize),this.gapSize!==void 0&&(e.gapSize=this.gapSize),this.scale!==void 0&&(e.scale=this.scale),this.dithering===!0&&(e.dithering=!0),this.alphaTest>0&&(e.alphaTest=this.alphaTest),this.alphaToCoverage===!0&&(e.alphaToCoverage=this.alphaToCoverage),this.premultipliedAlpha===!0&&(e.premultipliedAlpha=this.premultipliedAlpha),this.forceSinglePass===!0&&(e.forceSinglePass=this.forceSinglePass),this.wireframe===!0&&(e.wireframe=this.wireframe),this.wireframeLinewidth>1&&(e.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(e.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(e.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(e.flatShading=this.flatShading),this.visible===!1&&(e.visible=!1),this.toneMapped===!1&&(e.toneMapped=!1),this.fog===!1&&(e.fog=!1),Object.keys(this.userData).length>0&&(e.userData=this.userData);function n(s){const o=[];for(const a in s){const g=s[a];delete g.metadata,o.push(g)}return o}if(t){const s=n(A.textures),o=n(A.images);s.length>0&&(e.textures=s),o.length>0&&(e.images=o)}return e}clone(){return new this.constructor().copy(this)}copy(A){this.name=A.name,this.blending=A.blending,this.side=A.side,this.vertexColors=A.vertexColors,this.opacity=A.opacity,this.transparent=A.transparent,this.blendSrc=A.blendSrc,this.blendDst=A.blendDst,this.blendEquation=A.blendEquation,this.blendSrcAlpha=A.blendSrcAlpha,this.blendDstAlpha=A.blendDstAlpha,this.blendEquationAlpha=A.blendEquationAlpha,this.depthFunc=A.depthFunc,this.depthTest=A.depthTest,this.depthWrite=A.depthWrite,this.stencilWriteMask=A.stencilWriteMask,this.stencilFunc=A.stencilFunc,this.stencilRef=A.stencilRef,this.stencilFuncMask=A.stencilFuncMask,this.stencilFail=A.stencilFail,this.stencilZFail=A.stencilZFail,this.stencilZPass=A.stencilZPass,this.stencilWrite=A.stencilWrite;const t=A.clippingPlanes;let e=null;if(t!==null){const n=t.length;e=new Array(n);for(let s=0;s!==n;++s)e[s]=t[s].clone()}return this.clippingPlanes=e,this.clipIntersection=A.clipIntersection,this.clipShadows=A.clipShadows,this.shadowSide=A.shadowSide,this.colorWrite=A.colorWrite,this.precision=A.precision,this.polygonOffset=A.polygonOffset,this.polygonOffsetFactor=A.polygonOffsetFactor,this.polygonOffsetUnits=A.polygonOffsetUnits,this.dithering=A.dithering,this.alphaTest=A.alphaTest,this.alphaToCoverage=A.alphaToCoverage,this.premultipliedAlpha=A.premultipliedAlpha,this.forceSinglePass=A.forceSinglePass,this.visible=A.visible,this.toneMapped=A.toneMapped,this.userData=JSON.parse(JSON.stringify(A.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(A){A===!0&&this.version++}}const OQ={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Ue={h:0,s:0,l:0},Ma={h:0,s:0,l:0};function xg(i,A,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(A-i)*6*t:t<1/2?A:t<2/3?i+(A-i)*6*(2/3-t):i}class HA{constructor(A,t,e){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(A,t,e)}set(A,t,e){if(t===void 0&&e===void 0){const n=A;n&&n.isColor?this.copy(n):typeof n=="number"?this.setHex(n):typeof n=="string"&&this.setStyle(n)}else this.setRGB(A,t,e);return this}setScalar(A){return this.r=A,this.g=A,this.b=A,this}setHex(A,t=kA){return A=Math.floor(A),this.r=(A>>16&255)/255,this.g=(A>>8&255)/255,this.b=(A&255)/255,_e.toWorkingColorSpace(this,t),this}setRGB(A,t,e,n=_e.workingColorSpace){return this.r=A,this.g=t,this.b=e,_e.toWorkingColorSpace(this,n),this}setHSL(A,t,e,n=_e.workingColorSpace){if(A=dB(A,1),t=bt(t,0,1),e=bt(e,0,1),t===0)this.r=this.g=this.b=e;else{const s=e<=.5?e*(1+t):e+t-e*t,o=2*e-s;this.r=xg(o,s,A+1/3),this.g=xg(o,s,A),this.b=xg(o,s,A-1/3)}return _e.toWorkingColorSpace(this,n),this}setStyle(A,t=kA){function e(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+A+" will be ignored.")}let n;if(n=/^(\w+)\(([^\)]*)\)/.exec(A)){let s;const o=n[1],a=n[2];switch(o){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return e(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return e(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return e(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+A)}}else if(n=/^\#([A-Fa-f\d]+)$/.exec(A)){const s=n[1],o=s.length;if(o===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(s,16),t);console.warn("THREE.Color: Invalid hex color "+A)}else if(A&&A.length>0)return this.setColorName(A,t);return this}setColorName(A,t=kA){const e=OQ[A.toLowerCase()];return e!==void 0?this.setHex(e,t):console.warn("THREE.Color: Unknown color "+A),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(A){return this.r=A.r,this.g=A.g,this.b=A.b,this}copySRGBToLinear(A){return this.r=Ks(A.r),this.g=Ks(A.g),this.b=Ks(A.b),this}copyLinearToSRGB(A){return this.r=dg(A.r),this.g=dg(A.g),this.b=dg(A.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(A=kA){return _e.fromWorkingColorSpace(qt.copy(this),A),Math.round(bt(qt.r*255,0,255))*65536+Math.round(bt(qt.g*255,0,255))*256+Math.round(bt(qt.b*255,0,255))}getHexString(A=kA){return("000000"+this.getHex(A).toString(16)).slice(-6)}getHSL(A,t=_e.workingColorSpace){_e.fromWorkingColorSpace(qt.copy(this),t);const e=qt.r,n=qt.g,s=qt.b,o=Math.max(e,n,s),a=Math.min(e,n,s);let g,r;const I=(a+o)/2;if(a===o)g=0,r=0;else{const B=o-a;switch(r=I<=.5?B/(o+a):B/(2-o-a),o){case e:g=(n-s)/B+(n<s?6:0);break;case n:g=(s-e)/B+2;break;case s:g=(e-n)/B+4;break}g/=6}return A.h=g,A.s=r,A.l=I,A}getRGB(A,t=_e.workingColorSpace){return _e.fromWorkingColorSpace(qt.copy(this),t),A.r=qt.r,A.g=qt.g,A.b=qt.b,A}getStyle(A=kA){_e.fromWorkingColorSpace(qt.copy(this),A);const t=qt.r,e=qt.g,n=qt.b;return A!==kA?`color(${A} ${t.toFixed(3)} ${e.toFixed(3)} ${n.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(e*255)},${Math.round(n*255)})`}offsetHSL(A,t,e){return this.getHSL(Ue),Ue.h+=A,Ue.s+=t,Ue.l+=e,this.setHSL(Ue.h,Ue.s,Ue.l),this}add(A){return this.r+=A.r,this.g+=A.g,this.b+=A.b,this}addColors(A,t){return this.r=A.r+t.r,this.g=A.g+t.g,this.b=A.b+t.b,this}addScalar(A){return this.r+=A,this.g+=A,this.b+=A,this}sub(A){return this.r=Math.max(0,this.r-A.r),this.g=Math.max(0,this.g-A.g),this.b=Math.max(0,this.b-A.b),this}multiply(A){return this.r*=A.r,this.g*=A.g,this.b*=A.b,this}multiplyScalar(A){return this.r*=A,this.g*=A,this.b*=A,this}lerp(A,t){return this.r+=(A.r-this.r)*t,this.g+=(A.g-this.g)*t,this.b+=(A.b-this.b)*t,this}lerpColors(A,t,e){return this.r=A.r+(t.r-A.r)*e,this.g=A.g+(t.g-A.g)*e,this.b=A.b+(t.b-A.b)*e,this}lerpHSL(A,t){this.getHSL(Ue),A.getHSL(Ma);const e=Jo(Ue.h,Ma.h,t),n=Jo(Ue.s,Ma.s,t),s=Jo(Ue.l,Ma.l,t);return this.setHSL(e,n,s),this}setFromVector3(A){return this.r=A.x,this.g=A.y,this.b=A.z,this}applyMatrix3(A){const t=this.r,e=this.g,n=this.b,s=A.elements;return this.r=s[0]*t+s[3]*e+s[6]*n,this.g=s[1]*t+s[4]*e+s[7]*n,this.b=s[2]*t+s[5]*e+s[8]*n,this}equals(A){return A.r===this.r&&A.g===this.g&&A.b===this.b}fromArray(A,t=0){return this.r=A[t],this.g=A[t+1],this.b=A[t+2],this}toArray(A=[],t=0){return A[t]=this.r,A[t+1]=this.g,A[t+2]=this.b,A}fromBufferAttribute(A,t){return this.r=A.getX(t),this.g=A.getY(t),this.b=A.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const qt=new HA;HA.NAMES=OQ;class Qe extends We{constructor(A){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new HA(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=QB,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(A)}copy(A){return super.copy(A),this.color.copy(A.color),this.map=A.map,this.lightMap=A.lightMap,this.lightMapIntensity=A.lightMapIntensity,this.aoMap=A.aoMap,this.aoMapIntensity=A.aoMapIntensity,this.specularMap=A.specularMap,this.alphaMap=A.alphaMap,this.envMap=A.envMap,this.combine=A.combine,this.reflectivity=A.reflectivity,this.refractionRatio=A.refractionRatio,this.wireframe=A.wireframe,this.wireframeLinewidth=A.wireframeLinewidth,this.wireframeLinecap=A.wireframeLinecap,this.wireframeLinejoin=A.wireframeLinejoin,this.fog=A.fog,this}}const Ni=$d();function $d(){const i=new ArrayBuffer(4),A=new Float32Array(i),t=new Uint32Array(i),e=new Uint32Array(512),n=new Uint32Array(512);for(let g=0;g<256;++g){const r=g-127;r<-27?(e[g]=0,e[g|256]=32768,n[g]=24,n[g|256]=24):r<-14?(e[g]=1024>>-r-14,e[g|256]=1024>>-r-14|32768,n[g]=-r-1,n[g|256]=-r-1):r<=15?(e[g]=r+15<<10,e[g|256]=r+15<<10|32768,n[g]=13,n[g|256]=13):r<128?(e[g]=31744,e[g|256]=64512,n[g]=24,n[g|256]=24):(e[g]=31744,e[g|256]=64512,n[g]=13,n[g|256]=13)}const s=new Uint32Array(2048),o=new Uint32Array(64),a=new Uint32Array(64);for(let g=1;g<1024;++g){let r=g<<13,I=0;for(;(r&8388608)===0;)r<<=1,I-=8388608;r&=-8388609,I+=947912704,s[g]=r|I}for(let g=1024;g<2048;++g)s[g]=939524096+(g-1024<<13);for(let g=1;g<31;++g)o[g]=g<<23;o[31]=1199570944,o[32]=2147483648;for(let g=33;g<63;++g)o[g]=2147483648+(g-32<<23);o[63]=3347054592;for(let g=1;g<64;++g)g!==32&&(a[g]=1024);return{floatView:A,uint32View:t,baseTable:e,shiftTable:n,mantissaTable:s,exponentTable:o,offsetTable:a}}function Au(i){Math.abs(i)>65504&&console.warn("THREE.DataUtils.toHalfFloat(): Value out of range."),i=bt(i,-65504,65504),Ni.floatView[0]=i;const A=Ni.uint32View[0],t=A>>23&511;return Ni.baseTable[t]+((A&8388607)>>Ni.shiftTable[t])}function tu(i){const A=i>>10;return Ni.uint32View[0]=Ni.mantissaTable[Ni.offsetTable[A]+(i&1023)]+Ni.exponentTable[A],Ni.floatView[0]}const Ra={toHalfFloat:Au,fromHalfFloat:tu},mt=new P,Fa=new TA;class Zt{constructor(A,t,e=!1){if(Array.isArray(A))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=A,this.itemSize=t,this.count=A!==void 0?A.length/t:0,this.normalized=e,this.usage=TI,this.updateRange={offset:0,count:-1},this.gpuType=De,this.version=0}onUploadCallback(){}set needsUpdate(A){A===!0&&this.version++}setUsage(A){return this.usage=A,this}copy(A){return this.name=A.name,this.array=new A.array.constructor(A.array),this.itemSize=A.itemSize,this.count=A.count,this.normalized=A.normalized,this.usage=A.usage,this.gpuType=A.gpuType,this}copyAt(A,t,e){A*=this.itemSize,e*=t.itemSize;for(let n=0,s=this.itemSize;n<s;n++)this.array[A+n]=t.array[e+n];return this}copyArray(A){return this.array.set(A),this}applyMatrix3(A){if(this.itemSize===2)for(let t=0,e=this.count;t<e;t++)Fa.fromBufferAttribute(this,t),Fa.applyMatrix3(A),this.setXY(t,Fa.x,Fa.y);else if(this.itemSize===3)for(let t=0,e=this.count;t<e;t++)mt.fromBufferAttribute(this,t),mt.applyMatrix3(A),this.setXYZ(t,mt.x,mt.y,mt.z);return this}applyMatrix4(A){for(let t=0,e=this.count;t<e;t++)mt.fromBufferAttribute(this,t),mt.applyMatrix4(A),this.setXYZ(t,mt.x,mt.y,mt.z);return this}applyNormalMatrix(A){for(let t=0,e=this.count;t<e;t++)mt.fromBufferAttribute(this,t),mt.applyNormalMatrix(A),this.setXYZ(t,mt.x,mt.y,mt.z);return this}transformDirection(A){for(let t=0,e=this.count;t<e;t++)mt.fromBufferAttribute(this,t),mt.transformDirection(A),this.setXYZ(t,mt.x,mt.y,mt.z);return this}set(A,t=0){return this.array.set(A,t),this}getX(A){let t=this.array[A*this.itemSize];return this.normalized&&(t=Li(t,this.array)),t}setX(A,t){return this.normalized&&(t=rt(t,this.array)),this.array[A*this.itemSize]=t,this}getY(A){let t=this.array[A*this.itemSize+1];return this.normalized&&(t=Li(t,this.array)),t}setY(A,t){return this.normalized&&(t=rt(t,this.array)),this.array[A*this.itemSize+1]=t,this}getZ(A){let t=this.array[A*this.itemSize+2];return this.normalized&&(t=Li(t,this.array)),t}setZ(A,t){return this.normalized&&(t=rt(t,this.array)),this.array[A*this.itemSize+2]=t,this}getW(A){let t=this.array[A*this.itemSize+3];return this.normalized&&(t=Li(t,this.array)),t}setW(A,t){return this.normalized&&(t=rt(t,this.array)),this.array[A*this.itemSize+3]=t,this}setXY(A,t,e){return A*=this.itemSize,this.normalized&&(t=rt(t,this.array),e=rt(e,this.array)),this.array[A+0]=t,this.array[A+1]=e,this}setXYZ(A,t,e,n){return A*=this.itemSize,this.normalized&&(t=rt(t,this.array),e=rt(e,this.array),n=rt(n,this.array)),this.array[A+0]=t,this.array[A+1]=e,this.array[A+2]=n,this}setXYZW(A,t,e,n,s){return A*=this.itemSize,this.normalized&&(t=rt(t,this.array),e=rt(e,this.array),n=rt(n,this.array),s=rt(s,this.array)),this.array[A+0]=t,this.array[A+1]=e,this.array[A+2]=n,this.array[A+3]=s,this}onUpload(A){return this.onUploadCallback=A,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const A={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(A.name=this.name),this.usage!==TI&&(A.usage=this.usage),(this.updateRange.offset!==0||this.updateRange.count!==-1)&&(A.updateRange=this.updateRange),A}copyColorsArray(){console.error("THREE.BufferAttribute: copyColorsArray() was removed in r144.")}copyVector2sArray(){console.error("THREE.BufferAttribute: copyVector2sArray() was removed in r144.")}copyVector3sArray(){console.error("THREE.BufferAttribute: copyVector3sArray() was removed in r144.")}copyVector4sArray(){console.error("THREE.BufferAttribute: copyVector4sArray() was removed in r144.")}}class WQ extends Zt{constructor(A,t,e){super(new Uint16Array(A),t,e)}}class VQ extends Zt{constructor(A,t,e){super(new Uint32Array(A),t,e)}}class we extends Zt{constructor(A,t,e){super(new Float32Array(A),t,e)}}let eu=0;const le=new zA,Ng=new Qt,Is=new P,re=new xe,fo=new xe,xt=new P;class Ze extends Vn{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:eu++}),this.uuid=Oe(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(A){return Array.isArray(A)?this.index=new(qQ(A)?VQ:WQ)(A,1):this.index=A,this}getAttribute(A){return this.attributes[A]}setAttribute(A,t){return this.attributes[A]=t,this}deleteAttribute(A){return delete this.attributes[A],this}hasAttribute(A){return this.attributes[A]!==void 0}addGroup(A,t,e=0){this.groups.push({start:A,count:t,materialIndex:e})}clearGroups(){this.groups=[]}setDrawRange(A,t){this.drawRange.start=A,this.drawRange.count=t}applyMatrix4(A){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(A),t.needsUpdate=!0);const e=this.attributes.normal;if(e!==void 0){const s=new VA().getNormalMatrix(A);e.applyNormalMatrix(s),e.needsUpdate=!0}const n=this.attributes.tangent;return n!==void 0&&(n.transformDirection(A),n.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(A){return le.makeRotationFromQuaternion(A),this.applyMatrix4(le),this}rotateX(A){return le.makeRotationX(A),this.applyMatrix4(le),this}rotateY(A){return le.makeRotationY(A),this.applyMatrix4(le),this}rotateZ(A){return le.makeRotationZ(A),this.applyMatrix4(le),this}translate(A,t,e){return le.makeTranslation(A,t,e),this.applyMatrix4(le),this}scale(A,t,e){return le.makeScale(A,t,e),this.applyMatrix4(le),this}lookAt(A){return Ng.lookAt(A),Ng.updateMatrix(),this.applyMatrix4(Ng.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Is).negate(),this.translate(Is.x,Is.y,Is.z),this}setFromPoints(A){const t=[];for(let e=0,n=A.length;e<n;e++){const s=A[e];t.push(s.x,s.y,s.z||0)}return this.setAttribute("position",new we(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new xe);const A=this.attributes.position,t=this.morphAttributes.position;if(A&&A.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingBox.set(new P(-1/0,-1/0,-1/0),new P(1/0,1/0,1/0));return}if(A!==void 0){if(this.boundingBox.setFromBufferAttribute(A),t)for(let e=0,n=t.length;e<n;e++){const s=t[e];re.setFromBufferAttribute(s),this.morphTargetsRelative?(xt.addVectors(this.boundingBox.min,re.min),this.boundingBox.expandByPoint(xt),xt.addVectors(this.boundingBox.max,re.max),this.boundingBox.expandByPoint(xt)):(this.boundingBox.expandByPoint(re.min),this.boundingBox.expandByPoint(re.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ii);const A=this.attributes.position,t=this.morphAttributes.position;if(A&&A.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingSphere.set(new P,1/0);return}if(A){const e=this.boundingSphere.center;if(re.setFromBufferAttribute(A),t)for(let s=0,o=t.length;s<o;s++){const a=t[s];fo.setFromBufferAttribute(a),this.morphTargetsRelative?(xt.addVectors(re.min,fo.min),re.expandByPoint(xt),xt.addVectors(re.max,fo.max),re.expandByPoint(xt)):(re.expandByPoint(fo.min),re.expandByPoint(fo.max))}re.getCenter(e);let n=0;for(let s=0,o=A.count;s<o;s++)xt.fromBufferAttribute(A,s),n=Math.max(n,e.distanceToSquared(xt));if(t)for(let s=0,o=t.length;s<o;s++){const a=t[s],g=this.morphTargetsRelative;for(let r=0,I=a.count;r<I;r++)xt.fromBufferAttribute(a,r),g&&(Is.fromBufferAttribute(A,r),xt.add(Is)),n=Math.max(n,e.distanceToSquared(xt))}this.boundingSphere.radius=Math.sqrt(n),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const A=this.index,t=this.attributes;if(A===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const e=A.array,n=t.position.array,s=t.normal.array,o=t.uv.array,a=n.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Zt(new Float32Array(4*a),4));const g=this.getAttribute("tangent").array,r=[],I=[];for(let S=0;S<a;S++)r[S]=new P,I[S]=new P;const B=new P,C=new P,Q=new P,c=new TA,l=new TA,h=new TA,E=new P,f=new P;function d(S,F,G){B.fromArray(n,S*3),C.fromArray(n,F*3),Q.fromArray(n,G*3),c.fromArray(o,S*2),l.fromArray(o,F*2),h.fromArray(o,G*2),C.sub(B),Q.sub(B),l.sub(c),h.sub(c);const L=1/(l.x*h.y-h.x*l.y);!isFinite(L)||(E.copy(C).multiplyScalar(h.y).addScaledVector(Q,-l.y).multiplyScalar(L),f.copy(Q).multiplyScalar(l.x).addScaledVector(C,-h.x).multiplyScalar(L),r[S].add(E),r[F].add(E),r[G].add(E),I[S].add(f),I[F].add(f),I[G].add(f))}let u=this.groups;u.length===0&&(u=[{start:0,count:e.length}]);for(let S=0,F=u.length;S<F;++S){const G=u[S],L=G.start,T=G.count;for(let b=L,V=L+T;b<V;b+=3)d(e[b+0],e[b+1],e[b+2])}const m=new P,y=new P,p=new P,R=new P;function D(S){p.fromArray(s,S*3),R.copy(p);const F=r[S];m.copy(F),m.sub(p.multiplyScalar(p.dot(F))).normalize(),y.crossVectors(R,F);const L=y.dot(I[S])<0?-1:1;g[S*4]=m.x,g[S*4+1]=m.y,g[S*4+2]=m.z,g[S*4+3]=L}for(let S=0,F=u.length;S<F;++S){const G=u[S],L=G.start,T=G.count;for(let b=L,V=L+T;b<V;b+=3)D(e[b+0]),D(e[b+1]),D(e[b+2])}}computeVertexNormals(){const A=this.index,t=this.getAttribute("position");if(t!==void 0){let e=this.getAttribute("normal");if(e===void 0)e=new Zt(new Float32Array(t.count*3),3),this.setAttribute("normal",e);else for(let C=0,Q=e.count;C<Q;C++)e.setXYZ(C,0,0,0);const n=new P,s=new P,o=new P,a=new P,g=new P,r=new P,I=new P,B=new P;if(A)for(let C=0,Q=A.count;C<Q;C+=3){const c=A.getX(C+0),l=A.getX(C+1),h=A.getX(C+2);n.fromBufferAttribute(t,c),s.fromBufferAttribute(t,l),o.fromBufferAttribute(t,h),I.subVectors(o,s),B.subVectors(n,s),I.cross(B),a.fromBufferAttribute(e,c),g.fromBufferAttribute(e,l),r.fromBufferAttribute(e,h),a.add(I),g.add(I),r.add(I),e.setXYZ(c,a.x,a.y,a.z),e.setXYZ(l,g.x,g.y,g.z),e.setXYZ(h,r.x,r.y,r.z)}else for(let C=0,Q=t.count;C<Q;C+=3)n.fromBufferAttribute(t,C+0),s.fromBufferAttribute(t,C+1),o.fromBufferAttribute(t,C+2),I.subVectors(o,s),B.subVectors(n,s),I.cross(B),e.setXYZ(C+0,I.x,I.y,I.z),e.setXYZ(C+1,I.x,I.y,I.z),e.setXYZ(C+2,I.x,I.y,I.z);this.normalizeNormals(),e.needsUpdate=!0}}merge(){return console.error("THREE.BufferGeometry.merge() has been removed. Use THREE.BufferGeometryUtils.mergeGeometries() instead."),this}normalizeNormals(){const A=this.attributes.normal;for(let t=0,e=A.count;t<e;t++)xt.fromBufferAttribute(A,t),xt.normalize(),A.setXYZ(t,xt.x,xt.y,xt.z)}toNonIndexed(){function A(a,g){const r=a.array,I=a.itemSize,B=a.normalized,C=new r.constructor(g.length*I);let Q=0,c=0;for(let l=0,h=g.length;l<h;l++){a.isInterleavedBufferAttribute?Q=g[l]*a.data.stride+a.offset:Q=g[l]*I;for(let E=0;E<I;E++)C[c++]=r[Q++]}return new Zt(C,I,B)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new Ze,e=this.index.array,n=this.attributes;for(const a in n){const g=n[a],r=A(g,e);t.setAttribute(a,r)}const s=this.morphAttributes;for(const a in s){const g=[],r=s[a];for(let I=0,B=r.length;I<B;I++){const C=r[I],Q=A(C,e);g.push(Q)}t.morphAttributes[a]=g}t.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,g=o.length;a<g;a++){const r=o[a];t.addGroup(r.start,r.count,r.materialIndex)}return t}toJSON(){const A={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(A.uuid=this.uuid,A.type=this.type,this.name!==""&&(A.name=this.name),Object.keys(this.userData).length>0&&(A.userData=this.userData),this.parameters!==void 0){const g=this.parameters;for(const r in g)g[r]!==void 0&&(A[r]=g[r]);return A}A.data={attributes:{}};const t=this.index;t!==null&&(A.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const e=this.attributes;for(const g in e){const r=e[g];A.data.attributes[g]=r.toJSON(A.data)}const n={};let s=!1;for(const g in this.morphAttributes){const r=this.morphAttributes[g],I=[];for(let B=0,C=r.length;B<C;B++){const Q=r[B];I.push(Q.toJSON(A.data))}I.length>0&&(n[g]=I,s=!0)}s&&(A.data.morphAttributes=n,A.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(A.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(A.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),A}clone(){return new this.constructor().copy(this)}copy(A){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=A.name;const e=A.index;e!==null&&this.setIndex(e.clone(t));const n=A.attributes;for(const r in n){const I=n[r];this.setAttribute(r,I.clone(t))}const s=A.morphAttributes;for(const r in s){const I=[],B=s[r];for(let C=0,Q=B.length;C<Q;C++)I.push(B[C].clone(t));this.morphAttributes[r]=I}this.morphTargetsRelative=A.morphTargetsRelative;const o=A.groups;for(let r=0,I=o.length;r<I;r++){const B=o[r];this.addGroup(B.start,B.count,B.materialIndex)}const a=A.boundingBox;a!==null&&(this.boundingBox=a.clone());const g=A.boundingSphere;return g!==null&&(this.boundingSphere=g.clone()),this.drawRange.start=A.drawRange.start,this.drawRange.count=A.drawRange.count,this.userData=A.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const vC=new zA,fn=new Xr,xa=new Ii,kC=new P,Bs=new P,Cs=new P,Es=new P,_g=new P,Na=new P,_a=new TA,Ga=new TA,La=new TA,TC=new P,HC=new P,qC=new P,Ua=new P,ba=new P;class dt extends Qt{constructor(A=new Ze,t=new Qe){super(),this.isMesh=!0,this.type="Mesh",this.geometry=A,this.material=t,this.updateMorphTargets()}copy(A,t){return super.copy(A,t),A.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=A.morphTargetInfluences.slice()),A.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},A.morphTargetDictionary)),this.material=A.material,this.geometry=A.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,e=Object.keys(t);if(e.length>0){const n=t[e[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=n.length;s<o;s++){const a=n[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}getVertexPosition(A,t){const e=this.geometry,n=e.attributes.position,s=e.morphAttributes.position,o=e.morphTargetsRelative;t.fromBufferAttribute(n,A);const a=this.morphTargetInfluences;if(s&&a){Na.set(0,0,0);for(let g=0,r=s.length;g<r;g++){const I=a[g],B=s[g];I!==0&&(_g.fromBufferAttribute(B,A),o?Na.addScaledVector(_g,I):Na.addScaledVector(_g.sub(t),I))}t.add(Na)}return t}raycast(A,t){const e=this.geometry,n=this.material,s=this.matrixWorld;n!==void 0&&(e.boundingSphere===null&&e.computeBoundingSphere(),xa.copy(e.boundingSphere),xa.applyMatrix4(s),fn.copy(A.ray).recast(A.near),!(xa.containsPoint(fn.origin)===!1&&(fn.intersectSphere(xa,kC)===null||fn.origin.distanceToSquared(kC)>(A.far-A.near)**2))&&(vC.copy(s).invert(),fn.copy(A.ray).applyMatrix4(vC),!(e.boundingBox!==null&&fn.intersectsBox(e.boundingBox)===!1)&&this._computeIntersections(A,t,fn)))}_computeIntersections(A,t,e){let n;const s=this.geometry,o=this.material,a=s.index,g=s.attributes.position,r=s.attributes.uv,I=s.attributes.uv1,B=s.attributes.normal,C=s.groups,Q=s.drawRange;if(a!==null)if(Array.isArray(o))for(let c=0,l=C.length;c<l;c++){const h=C[c],E=o[h.materialIndex],f=Math.max(h.start,Q.start),d=Math.min(a.count,Math.min(h.start+h.count,Q.start+Q.count));for(let u=f,m=d;u<m;u+=3){const y=a.getX(u),p=a.getX(u+1),R=a.getX(u+2);n=va(this,E,A,e,r,I,B,y,p,R),n&&(n.faceIndex=Math.floor(u/3),n.face.materialIndex=h.materialIndex,t.push(n))}}else{const c=Math.max(0,Q.start),l=Math.min(a.count,Q.start+Q.count);for(let h=c,E=l;h<E;h+=3){const f=a.getX(h),d=a.getX(h+1),u=a.getX(h+2);n=va(this,o,A,e,r,I,B,f,d,u),n&&(n.faceIndex=Math.floor(h/3),t.push(n))}}else if(g!==void 0)if(Array.isArray(o))for(let c=0,l=C.length;c<l;c++){const h=C[c],E=o[h.materialIndex],f=Math.max(h.start,Q.start),d=Math.min(g.count,Math.min(h.start+h.count,Q.start+Q.count));for(let u=f,m=d;u<m;u+=3){const y=u,p=u+1,R=u+2;n=va(this,E,A,e,r,I,B,y,p,R),n&&(n.faceIndex=Math.floor(u/3),n.face.materialIndex=h.materialIndex,t.push(n))}}else{const c=Math.max(0,Q.start),l=Math.min(g.count,Q.start+Q.count);for(let h=c,E=l;h<E;h+=3){const f=h,d=h+1,u=h+2;n=va(this,o,A,e,r,I,B,f,d,u),n&&(n.faceIndex=Math.floor(h/3),t.push(n))}}}}function iu(i,A,t,e,n,s,o,a){let g;if(A.side===ie?g=e.intersectTriangle(o,s,n,!0,a):g=e.intersectTriangle(n,s,o,A.side===vi,a),g===null)return null;ba.copy(a),ba.applyMatrix4(i.matrixWorld);const r=t.ray.origin.distanceTo(ba);return r<t.near||r>t.far?null:{distance:r,point:ba.clone(),object:i}}function va(i,A,t,e,n,s,o,a,g,r){i.getVertexPosition(a,Bs),i.getVertexPosition(g,Cs),i.getVertexPosition(r,Es);const I=iu(i,A,t,e,Bs,Cs,Es,Ua);if(I){n&&(_a.fromBufferAttribute(n,a),Ga.fromBufferAttribute(n,g),La.fromBufferAttribute(n,r),I.uv=qe.getInterpolation(Ua,Bs,Cs,Es,_a,Ga,La,new TA)),s&&(_a.fromBufferAttribute(s,a),Ga.fromBufferAttribute(s,g),La.fromBufferAttribute(s,r),I.uv1=qe.getInterpolation(Ua,Bs,Cs,Es,_a,Ga,La,new TA),I.uv2=I.uv1),o&&(TC.fromBufferAttribute(o,a),HC.fromBufferAttribute(o,g),qC.fromBufferAttribute(o,r),I.normal=qe.getInterpolation(Ua,Bs,Cs,Es,TC,HC,qC,new P),I.normal.dot(e.direction)>0&&I.normal.multiplyScalar(-1));const B={a,b:g,c:r,normal:new P,materialIndex:0};qe.getNormal(Bs,Cs,Es,B.normal),I.face=B}return I}class ra extends Ze{constructor(A=1,t=1,e=1,n=1,s=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:A,height:t,depth:e,widthSegments:n,heightSegments:s,depthSegments:o};const a=this;n=Math.floor(n),s=Math.floor(s),o=Math.floor(o);const g=[],r=[],I=[],B=[];let C=0,Q=0;c("z","y","x",-1,-1,e,t,A,o,s,0),c("z","y","x",1,-1,e,t,-A,o,s,1),c("x","z","y",1,1,A,e,t,n,o,2),c("x","z","y",1,-1,A,e,-t,n,o,3),c("x","y","z",1,-1,A,t,e,n,s,4),c("x","y","z",-1,-1,A,t,-e,n,s,5),this.setIndex(g),this.setAttribute("position",new we(r,3)),this.setAttribute("normal",new we(I,3)),this.setAttribute("uv",new we(B,2));function c(l,h,E,f,d,u,m,y,p,R,D){const S=u/p,F=m/R,G=u/2,L=m/2,T=y/2,b=p+1,V=R+1;let K=0,tA=0;const nA=new P;for(let Z=0;Z<V;Z++){const CA=Z*F-L;for(let q=0;q<b;q++){const eA=q*S-G;nA[l]=eA*f,nA[h]=CA*d,nA[E]=T,r.push(nA.x,nA.y,nA.z),nA[l]=0,nA[h]=0,nA[E]=y>0?1:-1,I.push(nA.x,nA.y,nA.z),B.push(q/p),B.push(1-Z/R),K+=1}}for(let Z=0;Z<R;Z++)for(let CA=0;CA<p;CA++){const q=C+CA+b*Z,eA=C+CA+b*(Z+1),oA=C+(CA+1)+b*(Z+1),aA=C+(CA+1)+b*Z;g.push(q,eA,aA),g.push(eA,oA,aA),tA+=6}a.addGroup(Q,tA,D),Q+=tA,C+=K}}copy(A){return super.copy(A),this.parameters=Object.assign({},A.parameters),this}static fromJSON(A){return new ra(A.width,A.height,A.depth,A.widthSegments,A.heightSegments,A.depthSegments)}}function $s(i){const A={};for(const t in i){A[t]={};for(const e in i[t]){const n=i[t][e];n&&(n.isColor||n.isMatrix3||n.isMatrix4||n.isVector2||n.isVector3||n.isVector4||n.isTexture||n.isQuaternion)?n.isRenderTargetTexture?(console.warn("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),A[t][e]=null):A[t][e]=n.clone():Array.isArray(n)?A[t][e]=n.slice():A[t][e]=n}}return A}function Vt(i){const A={};for(let t=0;t<i.length;t++){const e=$s(i[t]);for(const n in e)A[n]=e[n]}return A}function nu(i){const A=[];for(let t=0;t<i.length;t++)A.push(i[t].clone());return A}function zQ(i){return i.getRenderTarget()===null?i.outputColorSpace:Xe}const su={clone:$s,merge:Vt};var ou=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,au=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class qn extends We{constructor(A){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=ou,this.fragmentShader=au,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={derivatives:!1,fragDepth:!1,drawBuffers:!1,shaderTextureLOD:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,A!==void 0&&this.setValues(A)}copy(A){return super.copy(A),this.fragmentShader=A.fragmentShader,this.vertexShader=A.vertexShader,this.uniforms=$s(A.uniforms),this.uniformsGroups=nu(A.uniformsGroups),this.defines=Object.assign({},A.defines),this.wireframe=A.wireframe,this.wireframeLinewidth=A.wireframeLinewidth,this.fog=A.fog,this.lights=A.lights,this.clipping=A.clipping,this.extensions=Object.assign({},A.extensions),this.glslVersion=A.glslVersion,this}toJSON(A){const t=super.toJSON(A);t.glslVersion=this.glslVersion,t.uniforms={};for(const n in this.uniforms){const o=this.uniforms[n].value;o&&o.isTexture?t.uniforms[n]={type:"t",value:o.toJSON(A).uuid}:o&&o.isColor?t.uniforms[n]={type:"c",value:o.getHex()}:o&&o.isVector2?t.uniforms[n]={type:"v2",value:o.toArray()}:o&&o.isVector3?t.uniforms[n]={type:"v3",value:o.toArray()}:o&&o.isVector4?t.uniforms[n]={type:"v4",value:o.toArray()}:o&&o.isMatrix3?t.uniforms[n]={type:"m3",value:o.toArray()}:o&&o.isMatrix4?t.uniforms[n]={type:"m4",value:o.toArray()}:t.uniforms[n]={value:o}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const e={};for(const n in this.extensions)this.extensions[n]===!0&&(e[n]=!0);return Object.keys(e).length>0&&(t.extensions=e),t}}class XQ extends Qt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new zA,this.projectionMatrix=new zA,this.projectionMatrixInverse=new zA,this.coordinateSystem=Gi}copy(A,t){return super.copy(A,t),this.matrixWorldInverse.copy(A.matrixWorldInverse),this.projectionMatrix.copy(A.projectionMatrix),this.projectionMatrixInverse.copy(A.projectionMatrixInverse),this.coordinateSystem=A.coordinateSystem,this}getWorldDirection(A){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return A.set(-t[8],-t[9],-t[10]).normalize()}updateMatrixWorld(A){super.updateMatrixWorld(A),this.matrixWorldInverse.copy(this.matrixWorld).invert()}updateWorldMatrix(A,t){super.updateWorldMatrix(A,t),this.matrixWorldInverse.copy(this.matrixWorld).invert()}clone(){return new this.constructor().copy(this)}}class zt extends XQ{constructor(A=50,t=1,e=.1,n=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=A,this.zoom=1,this.near=e,this.far=n,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(A,t){return super.copy(A,t),this.fov=A.fov,this.zoom=A.zoom,this.near=A.near,this.far=A.far,this.focus=A.focus,this.aspect=A.aspect,this.view=A.view===null?null:Object.assign({},A.view),this.filmGauge=A.filmGauge,this.filmOffset=A.filmOffset,this}setFocalLength(A){const t=.5*this.getFilmHeight()/A;this.fov=js*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const A=Math.tan(qo*.5*this.fov);return .5*this.getFilmHeight()/A}getEffectiveFOV(){return js*2*Math.atan(Math.tan(qo*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}setViewOffset(A,t,e,n,s,o){this.aspect=A/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=A,this.view.fullHeight=t,this.view.offsetX=e,this.view.offsetY=n,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const A=this.near;let t=A*Math.tan(qo*.5*this.fov)/this.zoom,e=2*t,n=this.aspect*e,s=-.5*n;const o=this.view;if(this.view!==null&&this.view.enabled){const g=o.fullWidth,r=o.fullHeight;s+=o.offsetX*n/g,t-=o.offsetY*e/r,n*=o.width/g,e*=o.height/r}const a=this.filmOffset;a!==0&&(s+=A*a/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+n,t,t-e,A,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(A){const t=super.toJSON(A);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}const hs=-90,Qs=1;class ru extends Qt{constructor(A,t,e){super(),this.type="CubeCamera",this.renderTarget=e,this.coordinateSystem=null;const n=new zt(hs,Qs,A,t);n.layers=this.layers,this.add(n);const s=new zt(hs,Qs,A,t);s.layers=this.layers,this.add(s);const o=new zt(hs,Qs,A,t);o.layers=this.layers,this.add(o);const a=new zt(hs,Qs,A,t);a.layers=this.layers,this.add(a);const g=new zt(hs,Qs,A,t);g.layers=this.layers,this.add(g);const r=new zt(hs,Qs,A,t);r.layers=this.layers,this.add(r)}updateCoordinateSystem(){const A=this.coordinateSystem,t=this.children.concat(),[e,n,s,o,a,g]=t;for(const r of t)this.remove(r);if(A===Gi)e.up.set(0,1,0),e.lookAt(1,0,0),n.up.set(0,1,0),n.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),o.up.set(0,0,1),o.lookAt(0,-1,0),a.up.set(0,1,0),a.lookAt(0,0,1),g.up.set(0,1,0),g.lookAt(0,0,-1);else if(A===Ur)e.up.set(0,-1,0),e.lookAt(-1,0,0),n.up.set(0,-1,0),n.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),o.up.set(0,0,-1),o.lookAt(0,-1,0),a.up.set(0,-1,0),a.lookAt(0,0,1),g.up.set(0,-1,0),g.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+A);for(const r of t)this.add(r),r.updateMatrixWorld()}update(A,t){this.parent===null&&this.updateMatrixWorld();const e=this.renderTarget;this.coordinateSystem!==A.coordinateSystem&&(this.coordinateSystem=A.coordinateSystem,this.updateCoordinateSystem());const[n,s,o,a,g,r]=this.children,I=A.getRenderTarget(),B=A.toneMapping,C=A.xr.enabled;A.toneMapping=bi,A.xr.enabled=!1;const Q=e.texture.generateMipmaps;e.texture.generateMipmaps=!1,A.setRenderTarget(e,0),A.render(t,n),A.setRenderTarget(e,1),A.render(t,s),A.setRenderTarget(e,2),A.render(t,o),A.setRenderTarget(e,3),A.render(t,a),A.setRenderTarget(e,4),A.render(t,g),e.texture.generateMipmaps=Q,A.setRenderTarget(e,5),A.render(t,r),A.setRenderTarget(I),A.toneMapping=B,A.xr.enabled=C,e.texture.needsPMREMUpdate=!0}}class ZQ extends Tt{constructor(A,t,e,n,s,o,a,g,r,I){A=A!==void 0?A:[],t=t!==void 0?t:Vs,super(A,t,e,n,s,o,a,g,r,I),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(A){this.image=A}}class gu extends Hn{constructor(A=1,t={}){super(A,A,t),this.isWebGLCubeRenderTarget=!0;const e={width:A,height:A,depth:1},n=[e,e,e,e,e,e];t.encoding!==void 0&&(Ko("THREE.WebGLCubeRenderTarget: option.encoding has been replaced by option.colorSpace."),t.colorSpace=t.encoding===Pe?kA:Un),this.texture=new ZQ(n,t.mapping,t.wrapS,t.wrapT,t.magFilter,t.minFilter,t.format,t.type,t.anisotropy,t.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.generateMipmaps=t.generateMipmaps!==void 0?t.generateMipmaps:!1,this.texture.minFilter=t.minFilter!==void 0?t.minFilter:Dt}fromEquirectangularTexture(A,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const e={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},n=new ra(5,5,5),s=new qn({name:"CubemapFromEquirect",uniforms:$s(e.uniforms),vertexShader:e.vertexShader,fragmentShader:e.fragmentShader,side:ie,blending:on});s.uniforms.tEquirect.value=t;const o=new dt(n,s),a=t.minFilter;return t.minFilter===En&&(t.minFilter=Dt),new ru(1,10,this).update(A,o),t.minFilter=a,o.geometry.dispose(),o.material.dispose(),this}clear(A,t,e,n){const s=A.getRenderTarget();for(let o=0;o<6;o++)A.setRenderTarget(this,o),A.clear(t,e,n);A.setRenderTarget(s)}}const Gg=new P,Iu=new P,Bu=new VA;class Mn{constructor(A=new P(1,0,0),t=0){this.isPlane=!0,this.normal=A,this.constant=t}set(A,t){return this.normal.copy(A),this.constant=t,this}setComponents(A,t,e,n){return this.normal.set(A,t,e),this.constant=n,this}setFromNormalAndCoplanarPoint(A,t){return this.normal.copy(A),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(A,t,e){const n=Gg.subVectors(e,t).cross(Iu.subVectors(A,t)).normalize();return this.setFromNormalAndCoplanarPoint(n,A),this}copy(A){return this.normal.copy(A.normal),this.constant=A.constant,this}normalize(){const A=1/this.normal.length();return this.normal.multiplyScalar(A),this.constant*=A,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(A){return this.normal.dot(A)+this.constant}distanceToSphere(A){return this.distanceToPoint(A.center)-A.radius}projectPoint(A,t){return t.copy(A).addScaledVector(this.normal,-this.distanceToPoint(A))}intersectLine(A,t){const e=A.delta(Gg),n=this.normal.dot(e);if(n===0)return this.distanceToPoint(A.start)===0?t.copy(A.start):null;const s=-(A.start.dot(this.normal)+this.constant)/n;return s<0||s>1?null:t.copy(A.start).addScaledVector(e,s)}intersectsLine(A){const t=this.distanceToPoint(A.start),e=this.distanceToPoint(A.end);return t<0&&e>0||e<0&&t>0}intersectsBox(A){return A.intersectsPlane(this)}intersectsSphere(A){return A.intersectsPlane(this)}coplanarPoint(A){return A.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(A,t){const e=t||Bu.getNormalMatrix(A),n=this.coplanarPoint(Gg).applyMatrix4(A),s=this.normal.applyMatrix3(e).normalize();return this.constant=-n.dot(s),this}translate(A){return this.constant-=A.dot(this.normal),this}equals(A){return A.normal.equals(this.normal)&&A.constant===this.constant}clone(){return new this.constructor().copy(this)}}const pn=new Ii,ka=new P;class uB{constructor(A=new Mn,t=new Mn,e=new Mn,n=new Mn,s=new Mn,o=new Mn){this.planes=[A,t,e,n,s,o]}set(A,t,e,n,s,o){const a=this.planes;return a[0].copy(A),a[1].copy(t),a[2].copy(e),a[3].copy(n),a[4].copy(s),a[5].copy(o),this}copy(A){const t=this.planes;for(let e=0;e<6;e++)t[e].copy(A.planes[e]);return this}setFromProjectionMatrix(A,t=Gi){const e=this.planes,n=A.elements,s=n[0],o=n[1],a=n[2],g=n[3],r=n[4],I=n[5],B=n[6],C=n[7],Q=n[8],c=n[9],l=n[10],h=n[11],E=n[12],f=n[13],d=n[14],u=n[15];if(e[0].setComponents(g-s,C-r,h-Q,u-E).normalize(),e[1].setComponents(g+s,C+r,h+Q,u+E).normalize(),e[2].setComponents(g+o,C+I,h+c,u+f).normalize(),e[3].setComponents(g-o,C-I,h-c,u-f).normalize(),e[4].setComponents(g-a,C-B,h-l,u-d).normalize(),t===Gi)e[5].setComponents(g+a,C+B,h+l,u+d).normalize();else if(t===Ur)e[5].setComponents(a,B,l,d).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(A){if(A.boundingSphere!==void 0)A.boundingSphere===null&&A.computeBoundingSphere(),pn.copy(A.boundingSphere).applyMatrix4(A.matrixWorld);else{const t=A.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),pn.copy(t.boundingSphere).applyMatrix4(A.matrixWorld)}return this.intersectsSphere(pn)}intersectsSprite(A){return pn.center.set(0,0,0),pn.radius=.7071067811865476,pn.applyMatrix4(A.matrixWorld),this.intersectsSphere(pn)}intersectsSphere(A){const t=this.planes,e=A.center,n=-A.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(e)<n)return!1;return!0}intersectsBox(A){const t=this.planes;for(let e=0;e<6;e++){const n=t[e];if(ka.x=n.normal.x>0?A.max.x:A.min.x,ka.y=n.normal.y>0?A.max.y:A.min.y,ka.z=n.normal.z>0?A.max.z:A.min.z,n.distanceToPoint(ka)<0)return!1}return!0}containsPoint(A){const t=this.planes;for(let e=0;e<6;e++)if(t[e].distanceToPoint(A)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}function jQ(){let i=null,A=!1,t=null,e=null;function n(s,o){t(s,o),e=i.requestAnimationFrame(n)}return{start:function(){A!==!0&&t!==null&&(e=i.requestAnimationFrame(n),A=!0)},stop:function(){i.cancelAnimationFrame(e),A=!1},setAnimationLoop:function(s){t=s},setContext:function(s){i=s}}}function Cu(i,A){const t=A.isWebGL2,e=new WeakMap;function n(r,I){const B=r.array,C=r.usage,Q=i.createBuffer();i.bindBuffer(I,Q),i.bufferData(I,B,C),r.onUploadCallback();let c;if(B instanceof Float32Array)c=i.FLOAT;else if(B instanceof Uint16Array)if(r.isFloat16BufferAttribute)if(t)c=i.HALF_FLOAT;else throw new Error("THREE.WebGLAttributes: Usage of Float16BufferAttribute requires WebGL2.");else c=i.UNSIGNED_SHORT;else if(B instanceof Int16Array)c=i.SHORT;else if(B instanceof Uint32Array)c=i.UNSIGNED_INT;else if(B instanceof Int32Array)c=i.INT;else if(B instanceof Int8Array)c=i.BYTE;else if(B instanceof Uint8Array)c=i.UNSIGNED_BYTE;else if(B instanceof Uint8ClampedArray)c=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+B);return{buffer:Q,type:c,bytesPerElement:B.BYTES_PER_ELEMENT,version:r.version}}function s(r,I,B){const C=I.array,Q=I.updateRange;i.bindBuffer(B,r),Q.count===-1?i.bufferSubData(B,0,C):(t?i.bufferSubData(B,Q.offset*C.BYTES_PER_ELEMENT,C,Q.offset,Q.count):i.bufferSubData(B,Q.offset*C.BYTES_PER_ELEMENT,C.subarray(Q.offset,Q.offset+Q.count)),Q.count=-1),I.onUploadCallback()}function o(r){return r.isInterleavedBufferAttribute&&(r=r.data),e.get(r)}function a(r){r.isInterleavedBufferAttribute&&(r=r.data);const I=e.get(r);I&&(i.deleteBuffer(I.buffer),e.delete(r))}function g(r,I){if(r.isGLBufferAttribute){const C=e.get(r);(!C||C.version<r.version)&&e.set(r,{buffer:r.buffer,type:r.type,bytesPerElement:r.elementSize,version:r.version});return}r.isInterleavedBufferAttribute&&(r=r.data);const B=e.get(r);B===void 0?e.set(r,n(r,I)):B.version<r.version&&(s(B.buffer,r,I),B.version=r.version)}return{get:o,remove:a,update:g}}class fB extends Ze{constructor(A=1,t=1,e=1,n=1){super(),this.type="PlaneGeometry",this.parameters={width:A,height:t,widthSegments:e,heightSegments:n};const s=A/2,o=t/2,a=Math.floor(e),g=Math.floor(n),r=a+1,I=g+1,B=A/a,C=t/g,Q=[],c=[],l=[],h=[];for(let E=0;E<I;E++){const f=E*C-o;for(let d=0;d<r;d++){const u=d*B-s;c.push(u,-f,0),l.push(0,0,1),h.push(d/a),h.push(1-E/g)}}for(let E=0;E<g;E++)for(let f=0;f<a;f++){const d=f+r*E,u=f+r*(E+1),m=f+1+r*(E+1),y=f+1+r*E;Q.push(d,u,y),Q.push(u,m,y)}this.setIndex(Q),this.setAttribute("position",new we(c,3)),this.setAttribute("normal",new we(l,3)),this.setAttribute("uv",new we(h,2))}copy(A){return super.copy(A),this.parameters=Object.assign({},A.parameters),this}static fromJSON(A){return new fB(A.width,A.height,A.widthSegments,A.heightSegments)}}var Eu=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,hu=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,Qu=`#ifdef USE_ALPHATEST
	if ( diffuseColor.a < alphaTest ) discard;
#endif`,cu=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,lu=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometry.normal, geometry.viewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,du=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,uu="vec3 transformed = vec3( position );",fu=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,pu=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,mu=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			 return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float R21 = R12;
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,yu=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = dFdx( surf_pos.xyz );
		vec3 vSigmaY = dFdy( surf_pos.xyz );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,Du=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#pragma unroll_loop_start
	for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
		plane = clippingPlanes[ i ];
		if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
	}
	#pragma unroll_loop_end
	#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
		bool clipped = true;
		#pragma unroll_loop_start
		for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
		}
		#pragma unroll_loop_end
		if ( clipped ) discard;
	#endif
#endif`,Su=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,wu=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,Mu=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,Ru=`#if defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#elif defined( USE_COLOR )
	diffuseColor.rgb *= vColor;
#endif`,Fu=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR )
	varying vec3 vColor;
#endif`,xu=`#if defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	varying vec3 vColor;
#endif`,Nu=`#if defined( USE_COLOR_ALPHA )
	vColor = vec4( 1.0 );
#elif defined( USE_COLOR ) || defined( USE_INSTANCING_COLOR )
	vColor = vec3( 1.0 );
#endif
#ifdef USE_COLOR
	vColor *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.xyz *= instanceColor.xyz;
#endif`,_u=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
struct GeometricContext {
	vec3 position;
	vec3 normal;
	vec3 viewDir;
#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal;
#endif
};
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
vec3 inverseTransformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( vec4( dir, 0.0 ) * matrix ).xyz );
}
mat3 transposeMat3( const in mat3 m ) {
	mat3 tmp;
	tmp[ 0 ] = vec3( m[ 0 ].x, m[ 1 ].x, m[ 2 ].x );
	tmp[ 1 ] = vec3( m[ 0 ].y, m[ 1 ].y, m[ 2 ].y );
	tmp[ 2 ] = vec3( m[ 0 ].z, m[ 1 ].z, m[ 2 ].z );
	return tmp;
}
float luminance( const in vec3 rgb ) {
	const vec3 weights = vec3( 0.2126729, 0.7151522, 0.0721750 );
	return dot( weights, rgb );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Gu=`#ifdef ENVMAP_TYPE_CUBE_UV
	#define cubeUV_minMipLevel 4.0
	#define cubeUV_minTileSize 16.0
	float getFace( vec3 direction ) {
		vec3 absDirection = abs( direction );
		float face = - 1.0;
		if ( absDirection.x > absDirection.z ) {
			if ( absDirection.x > absDirection.y )
				face = direction.x > 0.0 ? 0.0 : 3.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		} else {
			if ( absDirection.z > absDirection.y )
				face = direction.z > 0.0 ? 2.0 : 5.0;
			else
				face = direction.y > 0.0 ? 1.0 : 4.0;
		}
		return face;
	}
	vec2 getUV( vec3 direction, float face ) {
		vec2 uv;
		if ( face == 0.0 ) {
			uv = vec2( direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 1.0 ) {
			uv = vec2( - direction.x, - direction.z ) / abs( direction.y );
		} else if ( face == 2.0 ) {
			uv = vec2( - direction.x, direction.y ) / abs( direction.z );
		} else if ( face == 3.0 ) {
			uv = vec2( - direction.z, direction.y ) / abs( direction.x );
		} else if ( face == 4.0 ) {
			uv = vec2( - direction.x, direction.z ) / abs( direction.y );
		} else {
			uv = vec2( direction.x, direction.y ) / abs( direction.z );
		}
		return 0.5 * ( uv + 1.0 );
	}
	vec3 bilinearCubeUV( sampler2D envMap, vec3 direction, float mipInt ) {
		float face = getFace( direction );
		float filterInt = max( cubeUV_minMipLevel - mipInt, 0.0 );
		mipInt = max( mipInt, cubeUV_minMipLevel );
		float faceSize = exp2( mipInt );
		highp vec2 uv = getUV( direction, face ) * ( faceSize - 2.0 ) + 1.0;
		if ( face > 2.0 ) {
			uv.y += faceSize;
			face -= 3.0;
		}
		uv.x += face * faceSize;
		uv.x += filterInt * 3.0 * cubeUV_minTileSize;
		uv.y += 4.0 * ( exp2( CUBEUV_MAX_MIP ) - faceSize );
		uv.x *= CUBEUV_TEXEL_WIDTH;
		uv.y *= CUBEUV_TEXEL_HEIGHT;
		#ifdef texture2DGradEXT
			return texture2DGradEXT( envMap, uv, vec2( 0.0 ), vec2( 0.0 ) ).rgb;
		#else
			return texture2D( envMap, uv ).rgb;
		#endif
	}
	#define cubeUV_r0 1.0
	#define cubeUV_v0 0.339
	#define cubeUV_m0 - 2.0
	#define cubeUV_r1 0.8
	#define cubeUV_v1 0.276
	#define cubeUV_m1 - 1.0
	#define cubeUV_r4 0.4
	#define cubeUV_v4 0.046
	#define cubeUV_m4 2.0
	#define cubeUV_r5 0.305
	#define cubeUV_v5 0.016
	#define cubeUV_m5 3.0
	#define cubeUV_r6 0.21
	#define cubeUV_v6 0.0038
	#define cubeUV_m6 4.0
	float roughnessToMip( float roughness ) {
		float mip = 0.0;
		if ( roughness >= cubeUV_r1 ) {
			mip = ( cubeUV_r0 - roughness ) * ( cubeUV_m1 - cubeUV_m0 ) / ( cubeUV_r0 - cubeUV_r1 ) + cubeUV_m0;
		} else if ( roughness >= cubeUV_r4 ) {
			mip = ( cubeUV_r1 - roughness ) * ( cubeUV_m4 - cubeUV_m1 ) / ( cubeUV_r1 - cubeUV_r4 ) + cubeUV_m1;
		} else if ( roughness >= cubeUV_r5 ) {
			mip = ( cubeUV_r4 - roughness ) * ( cubeUV_m5 - cubeUV_m4 ) / ( cubeUV_r4 - cubeUV_r5 ) + cubeUV_m4;
		} else if ( roughness >= cubeUV_r6 ) {
			mip = ( cubeUV_r5 - roughness ) * ( cubeUV_m6 - cubeUV_m5 ) / ( cubeUV_r5 - cubeUV_r6 ) + cubeUV_m5;
		} else {
			mip = - 2.0 * log2( 1.16 * roughness );		}
		return mip;
	}
	vec4 textureCubeUV( sampler2D envMap, vec3 sampleDir, float roughness ) {
		float mip = clamp( roughnessToMip( roughness ), cubeUV_m0, CUBEUV_MAX_MIP );
		float mipF = fract( mip );
		float mipInt = floor( mip );
		vec3 color0 = bilinearCubeUV( envMap, sampleDir, mipInt );
		if ( mipF == 0.0 ) {
			return vec4( color0, 1.0 );
		} else {
			vec3 color1 = bilinearCubeUV( envMap, sampleDir, mipInt + 1.0 );
			return vec4( mix( color0, color1, mipF ), 1.0 );
		}
	}
#endif`,Lu=`vec3 transformedNormal = objectNormal;
#ifdef USE_INSTANCING
	mat3 m = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( m[ 0 ], m[ 0 ] ), dot( m[ 1 ], m[ 1 ] ), dot( m[ 2 ], m[ 2 ] ) );
	transformedNormal = m * transformedNormal;
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	vec3 transformedTangent = ( modelViewMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#ifdef FLIP_SIDED
		transformedTangent = - transformedTangent;
	#endif
#endif`,Uu=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,bu=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,vu=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,ku=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Tu="gl_FragColor = linearToOutputTexel( gl_FragColor );",Hu=`vec4 LinearToLinear( in vec4 value ) {
	return value;
}
vec4 LinearTosRGB( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,qu=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, vec3( flipEnvMap * reflectVec.x, reflectVec.yz ) );
	#else
		vec4 envColor = vec4( 0.0 );
	#endif
	#ifdef ENVMAP_BLENDING_MULTIPLY
		outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_MIX )
		outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
	#elif defined( ENVMAP_BLENDING_ADD )
		outgoingLight += envColor.xyz * specularStrength * reflectivity;
	#endif
#endif`,Ju=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform float flipEnvMap;
	#ifdef ENVMAP_TYPE_CUBE
		uniform samplerCube envMap;
	#else
		uniform sampler2D envMap;
	#endif
	
#endif`,Ku=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Yu=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Pu=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Ou=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Wu=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Vu=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,zu=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Xu=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Zu=`#ifdef USE_LIGHTMAP
	vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
	vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
	reflectedLight.indirectDiffuse += lightMapIrradiance;
#endif`,ju=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,$u=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,Af=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in GeometricContext geometry, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometry.normal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in GeometricContext geometry, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,tf=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
uniform vec3 lightProbe[ 9 ];
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	#if defined ( LEGACY_LIGHTS )
		if ( cutoffDistance > 0.0 && decayExponent > 0.0 ) {
			return pow( saturate( - lightDistance / cutoffDistance + 1.0 ), decayExponent );
		}
		return 1.0;
	#else
		float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
		if ( cutoffDistance > 0.0 ) {
			distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
		}
		return distanceFalloff;
	#endif
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, const in GeometricContext geometry, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in GeometricContext geometry, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometry.position;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in GeometricContext geometry, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometry.position;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif`,ef=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_CUBE_UV
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );
			reflectVec = inverseTransformDirection( reflectVec, viewMatrix );
			vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_CUBE_UV
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
#endif`,nf=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,sf=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in GeometricContext geometry, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometry.normal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in GeometricContext geometry, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,of=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,af=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometry.normal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometry.viewDir, geometry.normal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in GeometricContext geometry, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,rf=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb * ( 1.0 - metalnessFactor );
vec3 dxy = max( abs( dFdx( geometryNormal ) ), abs( dFdy( geometryNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.0525 );material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = mix( min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = mix( vec3( 0.04 ), diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.0525 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.07, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	anisotropyV /= material.anisotropy;
	material.anisotropy = saturate( material.anisotropy );
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x - tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x + tbn[ 0 ] * anisotropyV.y;
#endif`,gf=`struct PhysicalMaterial {
	vec3 diffuseColor;
	float roughness;
	vec3 specularColor;
	float specularF90;
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecular = vec3( 0.0 );
vec3 sheenSpecular = vec3( 0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		float v = 0.5 / ( gv + gl );
		return saturate(v);
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = material.clearcoatRoughness;
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColor;
	float f90 = material.specularF90;
	float roughness = material.roughness;
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float V = V_GGX_SmithCorrelated_Anisotropic( material.alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( material.alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transposeMat3( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float a = roughness < 0.25 ? -339.2 * r2 + 161.4 * roughness - 25.9 : -8.48 * r2 + 14.3 * roughness - 9.95;
	float b = roughness < 0.25 ? 44.0 * r2 - 23.7 * roughness + 3.26 : 1.97 * r2 - 3.27 * roughness + 0.72;
	float DG = exp( a * dotNV + b ) + ( roughness < 0.25 ? 0.0 : 0.1 * ( roughness - 0.25 ) );
	return saturate( DG * RECIPROCAL_PI );
}
vec2 DFGApprox( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	const vec4 c0 = vec4( - 1, - 0.0275, - 0.572, 0.022 );
	const vec4 c1 = vec4( 1, 0.0425, 1.04, - 0.04 );
	vec4 r = roughness * c0 + c1;
	float a004 = min( r.x * r.x, exp2( - 9.28 * dotNV ) ) * r.x + r.y;
	vec2 fab = vec2( - 1.04, 1.04 ) * a004 + r.zw;
	return fab;
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	vec2 fab = DFGApprox( normal, viewDir, roughness );
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometry.normal;
		vec3 viewDir = geometry.viewDir;
		vec3 position = geometry.position;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColor * t2.x + ( vec3( 1.0 ) - material.specularColor ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometry.normal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometry.clearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecular += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometry.viewDir, geometry.clearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
		sheenSpecular += irradiance * BRDF_Sheen( directLight.direction, geometry.viewDir, geometry.normal, material.sheenColor, material.sheenRoughness );
	#endif
	reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometry.viewDir, geometry.normal, material );
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in GeometricContext geometry, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecular += clearcoatRadiance * EnvironmentBRDF( geometry.clearcoatNormal, geometry.viewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecular += irradiance * material.sheenColor * IBLSheenBRDF( geometry.normal, geometry.viewDir, material.sheenRoughness );
	#endif
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( geometry.normal, geometry.viewDir, material.specularColor, material.specularF90, material.iridescence, material.iridescenceFresnel, material.roughness, singleScattering, multiScattering );
	#else
		computeMultiscattering( geometry.normal, geometry.viewDir, material.specularColor, material.specularF90, material.roughness, singleScattering, multiScattering );
	#endif
	vec3 totalScattering = singleScattering + multiScattering;
	vec3 diffuse = material.diffuseColor * ( 1.0 - max( max( totalScattering.r, totalScattering.g ), totalScattering.b ) );
	reflectedLight.indirectSpecular += radiance * singleScattering;
	reflectedLight.indirectSpecular += multiScattering * cosineWeightedIrradiance;
	reflectedLight.indirectDiffuse += diffuse * cosineWeightedIrradiance;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,If=`
GeometricContext geometry;
geometry.position = - vViewPosition;
geometry.normal = normal;
geometry.viewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
#ifdef USE_CLEARCOAT
	geometry.clearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometry.viewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		material.iridescenceFresnel = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		material.iridescenceF0 = Schlick_to_F0( material.iridescenceFresnel, 1.0, dotNVi );
	}
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometry, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometry, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometry, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometry, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, geometry, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometry, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometry, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	irradiance += getLightProbeIrradiance( lightProbe, geometry.normal );
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry.normal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,Bf=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD ) && defined( ENVMAP_TYPE_CUBE_UV )
		iblIrradiance += getIBLIrradiance( geometry.normal );
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		radiance += getIBLAnisotropyRadiance( geometry.viewDir, geometry.normal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		radiance += getIBLRadiance( geometry.viewDir, geometry.normal, material.roughness );
	#endif
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometry.viewDir, geometry.clearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Cf=`#if defined( RE_IndirectDiffuse )
	RE_IndirectDiffuse( irradiance, geometry, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometry, material, reflectedLight );
#endif`,Ef=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	gl_FragDepthEXT = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,hf=`#if defined( USE_LOGDEPTHBUF ) && defined( USE_LOGDEPTHBUF_EXT )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,Qf=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		varying float vFragDepth;
		varying float vIsPerspective;
	#else
		uniform float logDepthBufFC;
	#endif
#endif`,cf=`#ifdef USE_LOGDEPTHBUF
	#ifdef USE_LOGDEPTHBUF_EXT
		vFragDepth = 1.0 + gl_Position.w;
		vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
	#else
		if ( isPerspectiveMatrix( projectionMatrix ) ) {
			gl_Position.z = log2( max( EPSILON, gl_Position.w + 1.0 ) ) * logDepthBufFC - 1.0;
			gl_Position.z *= gl_Position.w;
		}
	#endif
#endif`,lf=`#ifdef USE_MAP
	diffuseColor *= texture2D( map, vMapUv );
#endif`,df=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,uf=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,ff=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,pf=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,mf=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,yf=`#if defined( USE_MORPHCOLORS ) && defined( MORPHTARGETS_TEXTURE )
	vColor *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,Df=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		objectNormal += morphNormal0 * morphTargetInfluences[ 0 ];
		objectNormal += morphNormal1 * morphTargetInfluences[ 1 ];
		objectNormal += morphNormal2 * morphTargetInfluences[ 2 ];
		objectNormal += morphNormal3 * morphTargetInfluences[ 3 ];
	#endif
#endif`,Sf=`#ifdef USE_MORPHTARGETS
	uniform float morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
		uniform sampler2DArray morphTargetsTexture;
		uniform ivec2 morphTargetsTextureSize;
		vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
			int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
			int y = texelIndex / morphTargetsTextureSize.x;
			int x = texelIndex - y * morphTargetsTextureSize.x;
			ivec3 morphUV = ivec3( x, y, morphTargetIndex );
			return texelFetch( morphTargetsTexture, morphUV, 0 );
		}
	#else
		#ifndef USE_MORPHNORMALS
			uniform float morphTargetInfluences[ 8 ];
		#else
			uniform float morphTargetInfluences[ 4 ];
		#endif
	#endif
#endif`,wf=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	#ifdef MORPHTARGETS_TEXTURE
		for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
			if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
		}
	#else
		transformed += morphTarget0 * morphTargetInfluences[ 0 ];
		transformed += morphTarget1 * morphTargetInfluences[ 1 ];
		transformed += morphTarget2 * morphTargetInfluences[ 2 ];
		transformed += morphTarget3 * morphTargetInfluences[ 3 ];
		#ifndef USE_MORPHNORMALS
			transformed += morphTarget4 * morphTargetInfluences[ 4 ];
			transformed += morphTarget5 * morphTargetInfluences[ 5 ];
			transformed += morphTarget6 * morphTargetInfluences[ 6 ];
			transformed += morphTarget7 * morphTargetInfluences[ 7 ];
		#endif
	#endif
#endif`,Mf=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal, vNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#if defined( DOUBLE_SIDED ) && ! defined( FLAT_SHADED )
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 geometryNormal = normal;`,Rf=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,Ff=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,xf=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,Nf=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
	#endif
#endif`,_f=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,Gf=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = geometryNormal;
#endif`,Lf=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Uf=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,bf=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,vf=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,kf=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;
const vec3 PackFactors = vec3( 256. * 256. * 256., 256. * 256., 256. );
const vec4 UnpackFactors = UnpackDownscale / vec4( PackFactors, 1. );
const float ShiftRight8 = 1. / 256.;
vec4 packDepthToRGBA( const in float v ) {
	vec4 r = vec4( fract( v * PackFactors ), v );
	r.yzw -= r.xyz * ShiftRight8;	return r * PackUpscale;
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors );
}
vec2 packDepthToRG( in highp float v ) {
	return packDepthToRGBA( v ).yx;
}
float unpackRGToDepth( const in highp vec2 v ) {
	return unpackRGBAToDepth( vec4( v.xy, 0.0, 0.0 ) );
}
vec4 pack2HalfToRGBA( vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return depth * ( near - far ) - near;
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	return ( near * far ) / ( ( far - near ) * depth - far );
}`,Tf=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Hf=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,qf=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Jf=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Kf=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Yf=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Pf=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform sampler2D pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	float texture2DCompare( sampler2D depths, vec2 uv, float compare ) {
		return step( compare, unpackRGBAToDepth( texture2D( depths, uv ) ) );
	}
	vec2 texture2DDistribution( sampler2D shadow, vec2 uv ) {
		return unpackRGBATo2Half( texture2D( shadow, uv ) );
	}
	float VSMShadow (sampler2D shadow, vec2 uv, float compare ){
		float occlusion = 1.0;
		vec2 distribution = texture2DDistribution( shadow, uv );
		float hard_shadow = step( compare , distribution.x );
		if (hard_shadow != 1.0 ) {
			float distance = compare - distribution.x ;
			float variance = max( 0.00000, distribution.y * distribution.y );
			float softness_probability = variance / (variance + distance * distance );			softness_probability = clamp( ( softness_probability - 0.3 ) / ( 0.95 - 0.3 ), 0.0, 1.0 );			occlusion = clamp( max( hard_shadow, softness_probability ), 0.0, 1.0 );
		}
		return occlusion;
	}
	float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
		float shadow = 1.0;
		shadowCoord.xyz /= shadowCoord.w;
		shadowCoord.z += shadowBias;
		bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
		bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
		if ( frustumTest ) {
		#if defined( SHADOWMAP_TYPE_PCF )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx0 = - texelSize.x * shadowRadius;
			float dy0 = - texelSize.y * shadowRadius;
			float dx1 = + texelSize.x * shadowRadius;
			float dy1 = + texelSize.y * shadowRadius;
			float dx2 = dx0 / 2.0;
			float dy2 = dy0 / 2.0;
			float dx3 = dx1 / 2.0;
			float dy3 = dy1 / 2.0;
			shadow = (
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy2 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx2, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx3, dy3 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( 0.0, dy1 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, shadowCoord.xy + vec2( dx1, dy1 ), shadowCoord.z )
			) * ( 1.0 / 17.0 );
		#elif defined( SHADOWMAP_TYPE_PCF_SOFT )
			vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
			float dx = texelSize.x;
			float dy = texelSize.y;
			vec2 uv = shadowCoord.xy;
			vec2 f = fract( uv * shadowMapSize + 0.5 );
			uv -= f * texelSize;
			shadow = (
				texture2DCompare( shadowMap, uv, shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( dx, 0.0 ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + vec2( 0.0, dy ), shadowCoord.z ) +
				texture2DCompare( shadowMap, uv + texelSize, shadowCoord.z ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, 0.0 ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 0.0 ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( -dx, dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, dy ), shadowCoord.z ),
					 f.x ) +
				mix( texture2DCompare( shadowMap, uv + vec2( 0.0, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( 0.0, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( texture2DCompare( shadowMap, uv + vec2( dx, -dy ), shadowCoord.z ),
					 texture2DCompare( shadowMap, uv + vec2( dx, 2.0 * dy ), shadowCoord.z ),
					 f.y ) +
				mix( mix( texture2DCompare( shadowMap, uv + vec2( -dx, -dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, -dy ), shadowCoord.z ),
						  f.x ),
					 mix( texture2DCompare( shadowMap, uv + vec2( -dx, 2.0 * dy ), shadowCoord.z ),
						  texture2DCompare( shadowMap, uv + vec2( 2.0 * dx, 2.0 * dy ), shadowCoord.z ),
						  f.x ),
					 f.y )
			) * ( 1.0 / 9.0 );
		#elif defined( SHADOWMAP_TYPE_VSM )
			shadow = VSMShadow( shadowMap, shadowCoord.xy, shadowCoord.z );
		#else
			shadow = texture2DCompare( shadowMap, shadowCoord.xy, shadowCoord.z );
		#endif
		}
		return shadow;
	}
	vec2 cubeToUV( vec3 v, float texelSizeY ) {
		vec3 absV = abs( v );
		float scaleToCube = 1.0 / max( absV.x, max( absV.y, absV.z ) );
		absV *= scaleToCube;
		v *= scaleToCube * ( 1.0 - 2.0 * texelSizeY );
		vec2 planar = v.xy;
		float almostATexel = 1.5 * texelSizeY;
		float almostOne = 1.0 - almostATexel;
		if ( absV.z >= almostOne ) {
			if ( v.z > 0.0 )
				planar.x = 4.0 - v.x;
		} else if ( absV.x >= almostOne ) {
			float signX = sign( v.x );
			planar.x = v.z * signX + 2.0 * signX;
		} else if ( absV.y >= almostOne ) {
			float signY = sign( v.y );
			planar.x = v.x + 2.0 * signY + 2.0;
			planar.y = v.z * signY - 2.0;
		}
		return vec2( 0.125, 0.25 ) * planar + vec2( 0.375, 0.75 );
	}
	float getPointShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		vec2 texelSize = vec2( 1.0 ) / ( shadowMapSize * vec2( 4.0, 2.0 ) );
		vec3 lightToPosition = shadowCoord.xyz;
		float dp = ( length( lightToPosition ) - shadowCameraNear ) / ( shadowCameraFar - shadowCameraNear );		dp += shadowBias;
		vec3 bd3D = normalize( lightToPosition );
		#if defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_PCF_SOFT ) || defined( SHADOWMAP_TYPE_VSM )
			vec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y;
			return (
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxy, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.xxx, texelSize.y ), dp ) +
				texture2DCompare( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp )
			) * ( 1.0 / 9.0 );
		#else
			return texture2DCompare( shadowMap, cubeToUV( bd3D, texelSize.y ), dp );
		#endif
	}
#endif`,Of=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Wf=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	vec3 shadowWorldNormal = inverseTransformDirection( transformedNormal, viewMatrix );
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Vf=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,zf=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Xf=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	uniform int boneTextureSize;
	mat4 getBoneMatrix( const in float i ) {
		float j = i * 4.0;
		float x = mod( j, float( boneTextureSize ) );
		float y = floor( j / float( boneTextureSize ) );
		float dx = 1.0 / float( boneTextureSize );
		float dy = 1.0 / float( boneTextureSize );
		y = dy * ( y + 0.5 );
		vec4 v1 = texture2D( boneTexture, vec2( dx * ( x + 0.5 ), y ) );
		vec4 v2 = texture2D( boneTexture, vec2( dx * ( x + 1.5 ), y ) );
		vec4 v3 = texture2D( boneTexture, vec2( dx * ( x + 2.5 ), y ) );
		vec4 v4 = texture2D( boneTexture, vec2( dx * ( x + 3.5 ), y ) );
		mat4 bone = mat4( v1, v2, v3, v4 );
		return bone;
	}
#endif`,Zf=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,jf=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,$f=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,A0=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,t0=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,e0=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 OptimizedCineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,i0=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = inverseTransformDirection( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseColor, material.specularColor, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,n0=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
		vec3 refractedRayExit = position + transmissionRay;
		vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
		vec2 refractionCoords = ndcPos.xy / ndcPos.w;
		refractionCoords += 1.0;
		refractionCoords /= 2.0;
		vec4 transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
		vec3 transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,s0=`#ifdef USE_UV
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,o0=`#ifdef USE_UV
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,a0=`#ifdef USE_UV
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,r0=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const g0=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,I0=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <encodings_fragment>
}`,B0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,C0=`#ifdef ENVMAP_TYPE_CUBE
	uniform samplerCube envMap;
#elif defined( ENVMAP_TYPE_CUBE_UV )
	uniform sampler2D envMap;
#endif
uniform float flipEnvMap;
uniform float backgroundBlurriness;
uniform float backgroundIntensity;
varying vec3 vWorldDirection;
#include <cube_uv_reflection_fragment>
void main() {
	#ifdef ENVMAP_TYPE_CUBE
		vec4 texColor = textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) );
	#elif defined( ENVMAP_TYPE_CUBE_UV )
		vec4 texColor = textureCubeUV( envMap, vWorldDirection, backgroundBlurriness );
	#else
		vec4 texColor = vec4( 0.0, 0.0, 0.0, 1.0 );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <encodings_fragment>
}`,E0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,h0=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <encodings_fragment>
}`,Q0=`#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,c0=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <logdepthbuf_fragment>
	float fragCoordZ = 0.5 * vHighPrecisionZW[0] / vHighPrecisionZW[1] + 0.5;
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#endif
}`,l0=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <skinbase_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,d0=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <clipping_planes_pars_fragment>
void main () {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( 1.0 );
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = packDepthToRGBA( dist );
}`,u0=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,f0=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <encodings_fragment>
}`,p0=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,m0=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,y0=`#include <common>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,D0=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,S0=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,w0=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,M0=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,R0=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,F0=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,x0=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <packing>
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( packNormalToRGB( normal ), opacity );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,N0=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,_0=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,G0=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,L0=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <cube_uv_reflection_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
		float sheenEnergyComp = 1.0 - 0.157 * max3( material.sheenColor );
		outgoingLight = outgoingLight * sheenEnergyComp + sheenSpecular;
	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometry.clearcoatNormal, geometry.viewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + clearcoatSpecular * material.clearcoat;
	#endif
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,U0=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,b0=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec4 diffuseColor = vec4( diffuse, opacity );
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,v0=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,k0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,T0=`#include <common>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,H0=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <packing>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
}`,q0=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );
	vec2 scale;
	scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );
	scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,J0=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <output_fragment>
	#include <tonemapping_fragment>
	#include <encodings_fragment>
	#include <fog_fragment>
}`,OA={alphamap_fragment:Eu,alphamap_pars_fragment:hu,alphatest_fragment:Qu,alphatest_pars_fragment:cu,aomap_fragment:lu,aomap_pars_fragment:du,begin_vertex:uu,beginnormal_vertex:fu,bsdfs:pu,iridescence_fragment:mu,bumpmap_pars_fragment:yu,clipping_planes_fragment:Du,clipping_planes_pars_fragment:Su,clipping_planes_pars_vertex:wu,clipping_planes_vertex:Mu,color_fragment:Ru,color_pars_fragment:Fu,color_pars_vertex:xu,color_vertex:Nu,common:_u,cube_uv_reflection_fragment:Gu,defaultnormal_vertex:Lu,displacementmap_pars_vertex:Uu,displacementmap_vertex:bu,emissivemap_fragment:vu,emissivemap_pars_fragment:ku,encodings_fragment:Tu,encodings_pars_fragment:Hu,envmap_fragment:qu,envmap_common_pars_fragment:Ju,envmap_pars_fragment:Ku,envmap_pars_vertex:Yu,envmap_physical_pars_fragment:ef,envmap_vertex:Pu,fog_vertex:Ou,fog_pars_vertex:Wu,fog_fragment:Vu,fog_pars_fragment:zu,gradientmap_pars_fragment:Xu,lightmap_fragment:Zu,lightmap_pars_fragment:ju,lights_lambert_fragment:$u,lights_lambert_pars_fragment:Af,lights_pars_begin:tf,lights_toon_fragment:nf,lights_toon_pars_fragment:sf,lights_phong_fragment:of,lights_phong_pars_fragment:af,lights_physical_fragment:rf,lights_physical_pars_fragment:gf,lights_fragment_begin:If,lights_fragment_maps:Bf,lights_fragment_end:Cf,logdepthbuf_fragment:Ef,logdepthbuf_pars_fragment:hf,logdepthbuf_pars_vertex:Qf,logdepthbuf_vertex:cf,map_fragment:lf,map_pars_fragment:df,map_particle_fragment:uf,map_particle_pars_fragment:ff,metalnessmap_fragment:pf,metalnessmap_pars_fragment:mf,morphcolor_vertex:yf,morphnormal_vertex:Df,morphtarget_pars_vertex:Sf,morphtarget_vertex:wf,normal_fragment_begin:Mf,normal_fragment_maps:Rf,normal_pars_fragment:Ff,normal_pars_vertex:xf,normal_vertex:Nf,normalmap_pars_fragment:_f,clearcoat_normal_fragment_begin:Gf,clearcoat_normal_fragment_maps:Lf,clearcoat_pars_fragment:Uf,iridescence_pars_fragment:bf,output_fragment:vf,packing:kf,premultiplied_alpha_fragment:Tf,project_vertex:Hf,dithering_fragment:qf,dithering_pars_fragment:Jf,roughnessmap_fragment:Kf,roughnessmap_pars_fragment:Yf,shadowmap_pars_fragment:Pf,shadowmap_pars_vertex:Of,shadowmap_vertex:Wf,shadowmask_pars_fragment:Vf,skinbase_vertex:zf,skinning_pars_vertex:Xf,skinning_vertex:Zf,skinnormal_vertex:jf,specularmap_fragment:$f,specularmap_pars_fragment:A0,tonemapping_fragment:t0,tonemapping_pars_fragment:e0,transmission_fragment:i0,transmission_pars_fragment:n0,uv_pars_fragment:s0,uv_pars_vertex:o0,uv_vertex:a0,worldpos_vertex:r0,background_vert:g0,background_frag:I0,backgroundCube_vert:B0,backgroundCube_frag:C0,cube_vert:E0,cube_frag:h0,depth_vert:Q0,depth_frag:c0,distanceRGBA_vert:l0,distanceRGBA_frag:d0,equirect_vert:u0,equirect_frag:f0,linedashed_vert:p0,linedashed_frag:m0,meshbasic_vert:y0,meshbasic_frag:D0,meshlambert_vert:S0,meshlambert_frag:w0,meshmatcap_vert:M0,meshmatcap_frag:R0,meshnormal_vert:F0,meshnormal_frag:x0,meshphong_vert:N0,meshphong_frag:_0,meshphysical_vert:G0,meshphysical_frag:L0,meshtoon_vert:U0,meshtoon_frag:b0,points_vert:v0,points_frag:k0,shadow_vert:T0,shadow_frag:H0,sprite_vert:q0,sprite_frag:J0},uA={common:{diffuse:{value:new HA(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new VA},alphaMap:{value:null},alphaMapTransform:{value:new VA},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new VA}},envmap:{envMap:{value:null},flipEnvMap:{value:-1},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new VA}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new VA}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new VA},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new VA},normalScale:{value:new TA(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new VA},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new VA}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new VA}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new VA}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new HA(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMap:{value:[]},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotShadowMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMap:{value:[]},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null}},points:{diffuse:{value:new HA(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new VA},alphaTest:{value:0},uvTransform:{value:new VA}},sprite:{diffuse:{value:new HA(16777215)},opacity:{value:1},center:{value:new TA(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new VA},alphaMap:{value:null},alphaMapTransform:{value:new VA},alphaTest:{value:0}}},ei={basic:{uniforms:Vt([uA.common,uA.specularmap,uA.envmap,uA.aomap,uA.lightmap,uA.fog]),vertexShader:OA.meshbasic_vert,fragmentShader:OA.meshbasic_frag},lambert:{uniforms:Vt([uA.common,uA.specularmap,uA.envmap,uA.aomap,uA.lightmap,uA.emissivemap,uA.bumpmap,uA.normalmap,uA.displacementmap,uA.fog,uA.lights,{emissive:{value:new HA(0)}}]),vertexShader:OA.meshlambert_vert,fragmentShader:OA.meshlambert_frag},phong:{uniforms:Vt([uA.common,uA.specularmap,uA.envmap,uA.aomap,uA.lightmap,uA.emissivemap,uA.bumpmap,uA.normalmap,uA.displacementmap,uA.fog,uA.lights,{emissive:{value:new HA(0)},specular:{value:new HA(1118481)},shininess:{value:30}}]),vertexShader:OA.meshphong_vert,fragmentShader:OA.meshphong_frag},standard:{uniforms:Vt([uA.common,uA.envmap,uA.aomap,uA.lightmap,uA.emissivemap,uA.bumpmap,uA.normalmap,uA.displacementmap,uA.roughnessmap,uA.metalnessmap,uA.fog,uA.lights,{emissive:{value:new HA(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:OA.meshphysical_vert,fragmentShader:OA.meshphysical_frag},toon:{uniforms:Vt([uA.common,uA.aomap,uA.lightmap,uA.emissivemap,uA.bumpmap,uA.normalmap,uA.displacementmap,uA.gradientmap,uA.fog,uA.lights,{emissive:{value:new HA(0)}}]),vertexShader:OA.meshtoon_vert,fragmentShader:OA.meshtoon_frag},matcap:{uniforms:Vt([uA.common,uA.bumpmap,uA.normalmap,uA.displacementmap,uA.fog,{matcap:{value:null}}]),vertexShader:OA.meshmatcap_vert,fragmentShader:OA.meshmatcap_frag},points:{uniforms:Vt([uA.points,uA.fog]),vertexShader:OA.points_vert,fragmentShader:OA.points_frag},dashed:{uniforms:Vt([uA.common,uA.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:OA.linedashed_vert,fragmentShader:OA.linedashed_frag},depth:{uniforms:Vt([uA.common,uA.displacementmap]),vertexShader:OA.depth_vert,fragmentShader:OA.depth_frag},normal:{uniforms:Vt([uA.common,uA.bumpmap,uA.normalmap,uA.displacementmap,{opacity:{value:1}}]),vertexShader:OA.meshnormal_vert,fragmentShader:OA.meshnormal_frag},sprite:{uniforms:Vt([uA.sprite,uA.fog]),vertexShader:OA.sprite_vert,fragmentShader:OA.sprite_frag},background:{uniforms:{uvTransform:{value:new VA},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:OA.background_vert,fragmentShader:OA.background_frag},backgroundCube:{uniforms:{envMap:{value:null},flipEnvMap:{value:-1},backgroundBlurriness:{value:0},backgroundIntensity:{value:1}},vertexShader:OA.backgroundCube_vert,fragmentShader:OA.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:OA.cube_vert,fragmentShader:OA.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:OA.equirect_vert,fragmentShader:OA.equirect_frag},distanceRGBA:{uniforms:Vt([uA.common,uA.displacementmap,{referencePosition:{value:new P},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:OA.distanceRGBA_vert,fragmentShader:OA.distanceRGBA_frag},shadow:{uniforms:Vt([uA.lights,uA.fog,{color:{value:new HA(0)},opacity:{value:1}}]),vertexShader:OA.shadow_vert,fragmentShader:OA.shadow_frag}};ei.physical={uniforms:Vt([ei.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new VA},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new VA},clearcoatNormalScale:{value:new TA(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new VA},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new VA},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new VA},sheen:{value:0},sheenColor:{value:new HA(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new VA},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new VA},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new VA},transmissionSamplerSize:{value:new TA},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new VA},attenuationDistance:{value:0},attenuationColor:{value:new HA(0)},specularColor:{value:new HA(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new VA},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new VA},anisotropyVector:{value:new TA},anisotropyMap:{value:null},anisotropyMapTransform:{value:new VA}}]),vertexShader:OA.meshphysical_vert,fragmentShader:OA.meshphysical_frag};const Ta={r:0,b:0,g:0};function K0(i,A,t,e,n,s,o){const a=new HA(0);let g=s===!0?0:1,r,I,B=null,C=0,Q=null;function c(h,E){let f=!1,d=E.isScene===!0?E.background:null;switch(d&&d.isTexture&&(d=(E.backgroundBlurriness>0?t:A).get(d)),d===null?l(a,g):d&&d.isColor&&(l(d,1),f=!0),i.xr.getEnvironmentBlendMode()){case"opaque":f=!0;break;case"additive":e.buffers.color.setClear(0,0,0,1,o),f=!0;break;case"alpha-blend":e.buffers.color.setClear(0,0,0,0,o),f=!0;break}(i.autoClear||f)&&i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil),d&&(d.isCubeTexture||d.mapping===zr)?(I===void 0&&(I=new dt(new ra(1,1,1),new qn({name:"BackgroundCubeMaterial",uniforms:$s(ei.backgroundCube.uniforms),vertexShader:ei.backgroundCube.vertexShader,fragmentShader:ei.backgroundCube.fragmentShader,side:ie,depthTest:!1,depthWrite:!1,fog:!1})),I.geometry.deleteAttribute("normal"),I.geometry.deleteAttribute("uv"),I.onBeforeRender=function(y,p,R){this.matrixWorld.copyPosition(R.matrixWorld)},Object.defineProperty(I.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(I)),I.material.uniforms.envMap.value=d,I.material.uniforms.flipEnvMap.value=d.isCubeTexture&&d.isRenderTargetTexture===!1?-1:1,I.material.uniforms.backgroundBlurriness.value=E.backgroundBlurriness,I.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,I.material.toneMapped=d.colorSpace!==kA,(B!==d||C!==d.version||Q!==i.toneMapping)&&(I.material.needsUpdate=!0,B=d,C=d.version,Q=i.toneMapping),I.layers.enableAll(),h.unshift(I,I.geometry,I.material,0,0,null)):d&&d.isTexture&&(r===void 0&&(r=new dt(new fB(2,2),new qn({name:"BackgroundMaterial",uniforms:$s(ei.background.uniforms),vertexShader:ei.background.vertexShader,fragmentShader:ei.background.fragmentShader,side:vi,depthTest:!1,depthWrite:!1,fog:!1})),r.geometry.deleteAttribute("normal"),Object.defineProperty(r.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(r)),r.material.uniforms.t2D.value=d,r.material.uniforms.backgroundIntensity.value=E.backgroundIntensity,r.material.toneMapped=d.colorSpace!==kA,d.matrixAutoUpdate===!0&&d.updateMatrix(),r.material.uniforms.uvTransform.value.copy(d.matrix),(B!==d||C!==d.version||Q!==i.toneMapping)&&(r.material.needsUpdate=!0,B=d,C=d.version,Q=i.toneMapping),r.layers.enableAll(),h.unshift(r,r.geometry,r.material,0,0,null))}function l(h,E){h.getRGB(Ta,zQ(i)),e.buffers.color.setClear(Ta.r,Ta.g,Ta.b,E,o)}return{getClearColor:function(){return a},setClearColor:function(h,E=1){a.set(h),g=E,l(a,g)},getClearAlpha:function(){return g},setClearAlpha:function(h){g=h,l(a,g)},render:c}}function Y0(i,A,t,e){const n=i.getParameter(i.MAX_VERTEX_ATTRIBS),s=e.isWebGL2?null:A.get("OES_vertex_array_object"),o=e.isWebGL2||s!==null,a={},g=h(null);let r=g,I=!1;function B(T,b,V,K,tA){let nA=!1;if(o){const Z=l(K,V,b);r!==Z&&(r=Z,Q(r.object)),nA=E(T,K,V,tA),nA&&f(T,K,V,tA)}else{const Z=b.wireframe===!0;(r.geometry!==K.id||r.program!==V.id||r.wireframe!==Z)&&(r.geometry=K.id,r.program=V.id,r.wireframe=Z,nA=!0)}tA!==null&&t.update(tA,i.ELEMENT_ARRAY_BUFFER),(nA||I)&&(I=!1,R(T,b,V,K),tA!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,t.get(tA).buffer))}function C(){return e.isWebGL2?i.createVertexArray():s.createVertexArrayOES()}function Q(T){return e.isWebGL2?i.bindVertexArray(T):s.bindVertexArrayOES(T)}function c(T){return e.isWebGL2?i.deleteVertexArray(T):s.deleteVertexArrayOES(T)}function l(T,b,V){const K=V.wireframe===!0;let tA=a[T.id];tA===void 0&&(tA={},a[T.id]=tA);let nA=tA[b.id];nA===void 0&&(nA={},tA[b.id]=nA);let Z=nA[K];return Z===void 0&&(Z=h(C()),nA[K]=Z),Z}function h(T){const b=[],V=[],K=[];for(let tA=0;tA<n;tA++)b[tA]=0,V[tA]=0,K[tA]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:b,enabledAttributes:V,attributeDivisors:K,object:T,attributes:{},index:null}}function E(T,b,V,K){const tA=r.attributes,nA=b.attributes;let Z=0;const CA=V.getAttributes();for(const q in CA)if(CA[q].location>=0){const oA=tA[q];let aA=nA[q];if(aA===void 0&&(q==="instanceMatrix"&&T.instanceMatrix&&(aA=T.instanceMatrix),q==="instanceColor"&&T.instanceColor&&(aA=T.instanceColor)),oA===void 0||oA.attribute!==aA||aA&&oA.data!==aA.data)return!0;Z++}return r.attributesNum!==Z||r.index!==K}function f(T,b,V,K){const tA={},nA=b.attributes;let Z=0;const CA=V.getAttributes();for(const q in CA)if(CA[q].location>=0){let oA=nA[q];oA===void 0&&(q==="instanceMatrix"&&T.instanceMatrix&&(oA=T.instanceMatrix),q==="instanceColor"&&T.instanceColor&&(oA=T.instanceColor));const aA={};aA.attribute=oA,oA&&oA.data&&(aA.data=oA.data),tA[q]=aA,Z++}r.attributes=tA,r.attributesNum=Z,r.index=K}function d(){const T=r.newAttributes;for(let b=0,V=T.length;b<V;b++)T[b]=0}function u(T){m(T,0)}function m(T,b){const V=r.newAttributes,K=r.enabledAttributes,tA=r.attributeDivisors;V[T]=1,K[T]===0&&(i.enableVertexAttribArray(T),K[T]=1),tA[T]!==b&&((e.isWebGL2?i:A.get("ANGLE_instanced_arrays"))[e.isWebGL2?"vertexAttribDivisor":"vertexAttribDivisorANGLE"](T,b),tA[T]=b)}function y(){const T=r.newAttributes,b=r.enabledAttributes;for(let V=0,K=b.length;V<K;V++)b[V]!==T[V]&&(i.disableVertexAttribArray(V),b[V]=0)}function p(T,b,V,K,tA,nA,Z){Z===!0?i.vertexAttribIPointer(T,b,V,tA,nA):i.vertexAttribPointer(T,b,V,K,tA,nA)}function R(T,b,V,K){if(e.isWebGL2===!1&&(T.isInstancedMesh||K.isInstancedBufferGeometry)&&A.get("ANGLE_instanced_arrays")===null)return;d();const tA=K.attributes,nA=V.getAttributes(),Z=b.defaultAttributeValues;for(const CA in nA){const q=nA[CA];if(q.location>=0){let eA=tA[CA];if(eA===void 0&&(CA==="instanceMatrix"&&T.instanceMatrix&&(eA=T.instanceMatrix),CA==="instanceColor"&&T.instanceColor&&(eA=T.instanceColor)),eA!==void 0){const oA=eA.normalized,aA=eA.itemSize,QA=t.get(eA);if(QA===void 0)continue;const wA=QA.buffer,NA=QA.type,xA=QA.bytesPerElement,it=e.isWebGL2===!0&&(NA===i.INT||NA===i.UNSIGNED_INT||eA.gpuType===NQ);if(eA.isInterleavedBufferAttribute){const _A=eA.data,$=_A.stride,JA=eA.offset;if(_A.isInstancedInterleavedBuffer){for(let MA=0;MA<q.locationSize;MA++)m(q.location+MA,_A.meshPerAttribute);T.isInstancedMesh!==!0&&K._maxInstanceCount===void 0&&(K._maxInstanceCount=_A.meshPerAttribute*_A.count)}else for(let MA=0;MA<q.locationSize;MA++)u(q.location+MA);i.bindBuffer(i.ARRAY_BUFFER,wA);for(let MA=0;MA<q.locationSize;MA++)p(q.location+MA,aA/q.locationSize,NA,oA,$*xA,(JA+aA/q.locationSize*MA)*xA,it)}else{if(eA.isInstancedBufferAttribute){for(let _A=0;_A<q.locationSize;_A++)m(q.location+_A,eA.meshPerAttribute);T.isInstancedMesh!==!0&&K._maxInstanceCount===void 0&&(K._maxInstanceCount=eA.meshPerAttribute*eA.count)}else for(let _A=0;_A<q.locationSize;_A++)u(q.location+_A);i.bindBuffer(i.ARRAY_BUFFER,wA);for(let _A=0;_A<q.locationSize;_A++)p(q.location+_A,aA/q.locationSize,NA,oA,aA*xA,aA/q.locationSize*_A*xA,it)}}else if(Z!==void 0){const oA=Z[CA];if(oA!==void 0)switch(oA.length){case 2:i.vertexAttrib2fv(q.location,oA);break;case 3:i.vertexAttrib3fv(q.location,oA);break;case 4:i.vertexAttrib4fv(q.location,oA);break;default:i.vertexAttrib1fv(q.location,oA)}}}}y()}function D(){G();for(const T in a){const b=a[T];for(const V in b){const K=b[V];for(const tA in K)c(K[tA].object),delete K[tA];delete b[V]}delete a[T]}}function S(T){if(a[T.id]===void 0)return;const b=a[T.id];for(const V in b){const K=b[V];for(const tA in K)c(K[tA].object),delete K[tA];delete b[V]}delete a[T.id]}function F(T){for(const b in a){const V=a[b];if(V[T.id]===void 0)continue;const K=V[T.id];for(const tA in K)c(K[tA].object),delete K[tA];delete V[T.id]}}function G(){L(),I=!0,r!==g&&(r=g,Q(r.object))}function L(){g.geometry=null,g.program=null,g.wireframe=!1}return{setup:B,reset:G,resetDefaultState:L,dispose:D,releaseStatesOfGeometry:S,releaseStatesOfProgram:F,initAttributes:d,enableAttribute:u,disableUnusedAttributes:y}}function P0(i,A,t,e){const n=e.isWebGL2;let s;function o(r){s=r}function a(r,I){i.drawArrays(s,r,I),t.update(I,s,1)}function g(r,I,B){if(B===0)return;let C,Q;if(n)C=i,Q="drawArraysInstanced";else if(C=A.get("ANGLE_instanced_arrays"),Q="drawArraysInstancedANGLE",C===null){console.error("THREE.WebGLBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}C[Q](s,r,I,B),t.update(I,s,B)}this.setMode=o,this.render=a,this.renderInstances=g}function O0(i,A,t){let e;function n(){if(e!==void 0)return e;if(A.has("EXT_texture_filter_anisotropic")===!0){const p=A.get("EXT_texture_filter_anisotropic");e=i.getParameter(p.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else e=0;return e}function s(p){if(p==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";p="mediump"}return p==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}const o=typeof WebGL2RenderingContext<"u"&&i.constructor.name==="WebGL2RenderingContext";let a=t.precision!==void 0?t.precision:"highp";const g=s(a);g!==a&&(console.warn("THREE.WebGLRenderer:",a,"not supported, using",g,"instead."),a=g);const r=o||A.has("WEBGL_draw_buffers"),I=t.logarithmicDepthBuffer===!0,B=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),C=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),Q=i.getParameter(i.MAX_TEXTURE_SIZE),c=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),l=i.getParameter(i.MAX_VERTEX_ATTRIBS),h=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),E=i.getParameter(i.MAX_VARYING_VECTORS),f=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),d=C>0,u=o||A.has("OES_texture_float"),m=d&&u,y=o?i.getParameter(i.MAX_SAMPLES):0;return{isWebGL2:o,drawBuffers:r,getMaxAnisotropy:n,getMaxPrecision:s,precision:a,logarithmicDepthBuffer:I,maxTextures:B,maxVertexTextures:C,maxTextureSize:Q,maxCubemapSize:c,maxAttributes:l,maxVertexUniforms:h,maxVaryings:E,maxFragmentUniforms:f,vertexTextures:d,floatFragmentTextures:u,floatVertexTextures:m,maxSamples:y}}function W0(i){const A=this;let t=null,e=0,n=!1,s=!1;const o=new Mn,a=new VA,g={value:null,needsUpdate:!1};this.uniform=g,this.numPlanes=0,this.numIntersection=0,this.init=function(B,C){const Q=B.length!==0||C||e!==0||n;return n=C,e=B.length,Q},this.beginShadows=function(){s=!0,I(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(B,C){t=I(B,C,0)},this.setState=function(B,C,Q){const c=B.clippingPlanes,l=B.clipIntersection,h=B.clipShadows,E=i.get(B);if(!n||c===null||c.length===0||s&&!h)s?I(null):r();else{const f=s?0:e,d=f*4;let u=E.clippingState||null;g.value=u,u=I(c,C,d,Q);for(let m=0;m!==d;++m)u[m]=t[m];E.clippingState=u,this.numIntersection=l?this.numPlanes:0,this.numPlanes+=f}};function r(){g.value!==t&&(g.value=t,g.needsUpdate=e>0),A.numPlanes=e,A.numIntersection=0}function I(B,C,Q,c){const l=B!==null?B.length:0;let h=null;if(l!==0){if(h=g.value,c!==!0||h===null){const E=Q+l*4,f=C.matrixWorldInverse;a.getNormalMatrix(f),(h===null||h.length<E)&&(h=new Float32Array(E));for(let d=0,u=Q;d!==l;++d,u+=4)o.copy(B[d]).applyMatrix4(f,a),o.normal.toArray(h,u),h[u+3]=o.constant}g.value=h,g.needsUpdate=!0}return A.numPlanes=l,A.numIntersection=0,h}}function V0(i){let A=new WeakMap;function t(o,a){return a===kn?o.mapping=Vs:a===Tn&&(o.mapping=zs),o}function e(o){if(o&&o.isTexture&&o.isRenderTargetTexture===!1){const a=o.mapping;if(a===kn||a===Tn)if(A.has(o)){const g=A.get(o).texture;return t(g,o.mapping)}else{const g=o.image;if(g&&g.height>0){const r=new gu(g.height/2);return r.fromEquirectangularTexture(i,o),A.set(o,r),o.addEventListener("dispose",n),t(r.texture,o.mapping)}else return null}}return o}function n(o){const a=o.target;a.removeEventListener("dispose",n);const g=A.get(a);g!==void 0&&(A.delete(a),g.dispose())}function s(){A=new WeakMap}return{get:e,dispose:s}}class pB extends XQ{constructor(A=-1,t=1,e=1,n=-1,s=.1,o=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=A,this.right=t,this.top=e,this.bottom=n,this.near=s,this.far=o,this.updateProjectionMatrix()}copy(A,t){return super.copy(A,t),this.left=A.left,this.right=A.right,this.top=A.top,this.bottom=A.bottom,this.near=A.near,this.far=A.far,this.zoom=A.zoom,this.view=A.view===null?null:Object.assign({},A.view),this}setViewOffset(A,t,e,n,s,o){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=A,this.view.fullHeight=t,this.view.offsetX=e,this.view.offsetY=n,this.view.width=s,this.view.height=o,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const A=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),e=(this.right+this.left)/2,n=(this.top+this.bottom)/2;let s=e-A,o=e+A,a=n+t,g=n-t;if(this.view!==null&&this.view.enabled){const r=(this.right-this.left)/this.view.fullWidth/this.zoom,I=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=r*this.view.offsetX,o=s+r*this.view.width,a-=I*this.view.offsetY,g=a-I*this.view.height}this.projectionMatrix.makeOrthographic(s,o,a,g,this.near,this.far,this.coordinateSystem),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(A){const t=super.toJSON(A);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const Ts=4,JC=[.125,.215,.35,.446,.526,.582],xn=20,Lg=new pB,KC=new HA;let Ug=null;const Rn=(1+Math.sqrt(5))/2,cs=1/Rn,YC=[new P(1,1,1),new P(-1,1,1),new P(1,1,-1),new P(-1,1,-1),new P(0,Rn,cs),new P(0,Rn,-cs),new P(cs,0,Rn),new P(-cs,0,Rn),new P(Rn,cs,0),new P(-Rn,cs,0)];class PC{constructor(A){this._renderer=A,this._pingPongRenderTarget=null,this._lodMax=0,this._cubeSize=0,this._lodPlanes=[],this._sizeLods=[],this._sigmas=[],this._blurMaterial=null,this._cubemapMaterial=null,this._equirectMaterial=null,this._compileMaterial(this._blurMaterial)}fromScene(A,t=0,e=.1,n=100){Ug=this._renderer.getRenderTarget(),this._setSize(256);const s=this._allocateTargets();return s.depthBuffer=!0,this._sceneToCubeUV(A,e,n,s),t>0&&this._blur(s,0,0,t),this._applyPMREM(s),this._cleanup(s),s}fromEquirectangular(A,t=null){return this._fromTexture(A,t)}fromCubemap(A,t=null){return this._fromTexture(A,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=VC(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=WC(),this._compileMaterial(this._equirectMaterial))}dispose(){this._dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose()}_setSize(A){this._lodMax=Math.floor(Math.log2(A)),this._cubeSize=Math.pow(2,this._lodMax)}_dispose(){this._blurMaterial!==null&&this._blurMaterial.dispose(),this._pingPongRenderTarget!==null&&this._pingPongRenderTarget.dispose();for(let A=0;A<this._lodPlanes.length;A++)this._lodPlanes[A].dispose()}_cleanup(A){this._renderer.setRenderTarget(Ug),A.scissorTest=!1,Ha(A,0,0,A.width,A.height)}_fromTexture(A,t){A.mapping===Vs||A.mapping===zs?this._setSize(A.image.length===0?16:A.image[0].width||A.image[0].image.width):this._setSize(A.image.width/4),Ug=this._renderer.getRenderTarget();const e=t||this._allocateTargets();return this._textureToCubeUV(A,e),this._applyPMREM(e),this._cleanup(e),e}_allocateTargets(){const A=3*Math.max(this._cubeSize,112),t=4*this._cubeSize,e={magFilter:Dt,minFilter:Dt,generateMipmaps:!1,type:_i,format:me,colorSpace:Xe,depthBuffer:!1},n=OC(A,t,e);if(this._pingPongRenderTarget===null||this._pingPongRenderTarget.width!==A||this._pingPongRenderTarget.height!==t){this._pingPongRenderTarget!==null&&this._dispose(),this._pingPongRenderTarget=OC(A,t,e);const{_lodMax:s}=this;({sizeLods:this._sizeLods,lodPlanes:this._lodPlanes,sigmas:this._sigmas}=z0(s)),this._blurMaterial=X0(s,A,t)}return n}_compileMaterial(A){const t=new dt(this._lodPlanes[0],A);this._renderer.compile(t,Lg)}_sceneToCubeUV(A,t,e,n){const a=new zt(90,1,t,e),g=[1,-1,1,1,1,1],r=[1,1,1,-1,-1,-1],I=this._renderer,B=I.autoClear,C=I.toneMapping;I.getClearColor(KC),I.toneMapping=bi,I.autoClear=!1;const Q=new Qe({name:"PMREM.Background",side:ie,depthWrite:!1,depthTest:!1}),c=new dt(new ra,Q);let l=!1;const h=A.background;h?h.isColor&&(Q.color.copy(h),A.background=null,l=!0):(Q.color.copy(KC),l=!0);for(let E=0;E<6;E++){const f=E%3;f===0?(a.up.set(0,g[E],0),a.lookAt(r[E],0,0)):f===1?(a.up.set(0,0,g[E]),a.lookAt(0,r[E],0)):(a.up.set(0,g[E],0),a.lookAt(0,0,r[E]));const d=this._cubeSize;Ha(n,f*d,E>2?d:0,d,d),I.setRenderTarget(n),l&&I.render(c,a),I.render(A,a)}c.geometry.dispose(),c.material.dispose(),I.toneMapping=C,I.autoClear=B,A.background=h}_textureToCubeUV(A,t){const e=this._renderer,n=A.mapping===Vs||A.mapping===zs;n?(this._cubemapMaterial===null&&(this._cubemapMaterial=VC()),this._cubemapMaterial.uniforms.flipEnvMap.value=A.isRenderTargetTexture===!1?-1:1):this._equirectMaterial===null&&(this._equirectMaterial=WC());const s=n?this._cubemapMaterial:this._equirectMaterial,o=new dt(this._lodPlanes[0],s),a=s.uniforms;a.envMap.value=A;const g=this._cubeSize;Ha(t,0,0,3*g,2*g),e.setRenderTarget(t),e.render(o,Lg)}_applyPMREM(A){const t=this._renderer,e=t.autoClear;t.autoClear=!1;for(let n=1;n<this._lodPlanes.length;n++){const s=Math.sqrt(this._sigmas[n]*this._sigmas[n]-this._sigmas[n-1]*this._sigmas[n-1]),o=YC[(n-1)%YC.length];this._blur(A,n-1,n,s,o)}t.autoClear=e}_blur(A,t,e,n,s){const o=this._pingPongRenderTarget;this._halfBlur(A,o,t,e,n,"latitudinal",s),this._halfBlur(o,A,e,e,n,"longitudinal",s)}_halfBlur(A,t,e,n,s,o,a){const g=this._renderer,r=this._blurMaterial;o!=="latitudinal"&&o!=="longitudinal"&&console.error("blur direction must be either latitudinal or longitudinal!");const I=3,B=new dt(this._lodPlanes[n],r),C=r.uniforms,Q=this._sizeLods[e]-1,c=isFinite(s)?Math.PI/(2*Q):2*Math.PI/(2*xn-1),l=s/c,h=isFinite(s)?1+Math.floor(I*l):xn;h>xn&&console.warn(`sigmaRadians, ${s}, is too large and will clip, as it requested ${h} samples when the maximum is set to ${xn}`);const E=[];let f=0;for(let p=0;p<xn;++p){const R=p/l,D=Math.exp(-R*R/2);E.push(D),p===0?f+=D:p<h&&(f+=2*D)}for(let p=0;p<E.length;p++)E[p]=E[p]/f;C.envMap.value=A.texture,C.samples.value=h,C.weights.value=E,C.latitudinal.value=o==="latitudinal",a&&(C.poleAxis.value=a);const{_lodMax:d}=this;C.dTheta.value=c,C.mipInt.value=d-e;const u=this._sizeLods[n],m=3*u*(n>d-Ts?n-d+Ts:0),y=4*(this._cubeSize-u);Ha(t,m,y,3*u,2*u),g.setRenderTarget(t),g.render(B,Lg)}}function z0(i){const A=[],t=[],e=[];let n=i;const s=i-Ts+1+JC.length;for(let o=0;o<s;o++){const a=Math.pow(2,n);t.push(a);let g=1/a;o>i-Ts?g=JC[o-i+Ts-1]:o===0&&(g=0),e.push(g);const r=1/(a-2),I=-r,B=1+r,C=[I,I,B,I,B,B,I,I,B,B,I,B],Q=6,c=6,l=3,h=2,E=1,f=new Float32Array(l*c*Q),d=new Float32Array(h*c*Q),u=new Float32Array(E*c*Q);for(let y=0;y<Q;y++){const p=y%3*2/3-1,R=y>2?0:-1,D=[p,R,0,p+2/3,R,0,p+2/3,R+1,0,p,R,0,p+2/3,R+1,0,p,R+1,0];f.set(D,l*c*y),d.set(C,h*c*y);const S=[y,y,y,y,y,y];u.set(S,E*c*y)}const m=new Ze;m.setAttribute("position",new Zt(f,l)),m.setAttribute("uv",new Zt(d,h)),m.setAttribute("faceIndex",new Zt(u,E)),A.push(m),n>Ts&&n--}return{lodPlanes:A,sizeLods:t,sigmas:e}}function OC(i,A,t){const e=new Hn(i,A,t);return e.texture.mapping=zr,e.texture.name="PMREM.cubeUv",e.scissorTest=!0,e}function Ha(i,A,t,e,n){i.viewport.set(A,t,e,n),i.scissor.set(A,t,e,n)}function X0(i,A,t){const e=new Float32Array(xn),n=new P(0,1,0);return new qn({name:"SphericalGaussianBlur",defines:{n:xn,CUBEUV_TEXEL_WIDTH:1/A,CUBEUV_TEXEL_HEIGHT:1/t,CUBEUV_MAX_MIP:`${i}.0`},uniforms:{envMap:{value:null},samples:{value:1},weights:{value:e},latitudinal:{value:!1},dTheta:{value:0},mipInt:{value:0},poleAxis:{value:n}},vertexShader:mB(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;
			uniform int samples;
			uniform float weights[ n ];
			uniform bool latitudinal;
			uniform float dTheta;
			uniform float mipInt;
			uniform vec3 poleAxis;

			#define ENVMAP_TYPE_CUBE_UV
			#include <cube_uv_reflection_fragment>

			vec3 getSample( float theta, vec3 axis ) {

				float cosTheta = cos( theta );
				// Rodrigues' axis-angle rotation
				vec3 sampleDirection = vOutputDirection * cosTheta
					+ cross( axis, vOutputDirection ) * sin( theta )
					+ axis * dot( axis, vOutputDirection ) * ( 1.0 - cosTheta );

				return bilinearCubeUV( envMap, sampleDirection, mipInt );

			}

			void main() {

				vec3 axis = latitudinal ? poleAxis : cross( poleAxis, vOutputDirection );

				if ( all( equal( axis, vec3( 0.0 ) ) ) ) {

					axis = vec3( vOutputDirection.z, 0.0, - vOutputDirection.x );

				}

				axis = normalize( axis );

				gl_FragColor = vec4( 0.0, 0.0, 0.0, 1.0 );
				gl_FragColor.rgb += weights[ 0 ] * getSample( 0.0, axis );

				for ( int i = 1; i < n; i++ ) {

					if ( i >= samples ) {

						break;

					}

					float theta = dTheta * float( i );
					gl_FragColor.rgb += weights[ i ] * getSample( -1.0 * theta, axis );
					gl_FragColor.rgb += weights[ i ] * getSample( theta, axis );

				}

			}
		`,blending:on,depthTest:!1,depthWrite:!1})}function WC(){return new qn({name:"EquirectangularToCubeUV",uniforms:{envMap:{value:null}},vertexShader:mB(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			varying vec3 vOutputDirection;

			uniform sampler2D envMap;

			#include <common>

			void main() {

				vec3 outputDirection = normalize( vOutputDirection );
				vec2 uv = equirectUv( outputDirection );

				gl_FragColor = vec4( texture2D ( envMap, uv ).rgb, 1.0 );

			}
		`,blending:on,depthTest:!1,depthWrite:!1})}function VC(){return new qn({name:"CubemapToCubeUV",uniforms:{envMap:{value:null},flipEnvMap:{value:-1}},vertexShader:mB(),fragmentShader:`

			precision mediump float;
			precision mediump int;

			uniform float flipEnvMap;

			varying vec3 vOutputDirection;

			uniform samplerCube envMap;

			void main() {

				gl_FragColor = textureCube( envMap, vec3( flipEnvMap * vOutputDirection.x, vOutputDirection.yz ) );

			}
		`,blending:on,depthTest:!1,depthWrite:!1})}function mB(){return`

		precision mediump float;
		precision mediump int;

		attribute float faceIndex;

		varying vec3 vOutputDirection;

		// RH coordinate system; PMREM face-indexing convention
		vec3 getDirection( vec2 uv, float face ) {

			uv = 2.0 * uv - 1.0;

			vec3 direction = vec3( uv, 1.0 );

			if ( face == 0.0 ) {

				direction = direction.zyx; // ( 1, v, u ) pos x

			} else if ( face == 1.0 ) {

				direction = direction.xzy;
				direction.xz *= -1.0; // ( -u, 1, -v ) pos y

			} else if ( face == 2.0 ) {

				direction.x *= -1.0; // ( -u, v, 1 ) pos z

			} else if ( face == 3.0 ) {

				direction = direction.zyx;
				direction.xz *= -1.0; // ( -1, v, -u ) neg x

			} else if ( face == 4.0 ) {

				direction = direction.xzy;
				direction.xy *= -1.0; // ( -u, -1, v ) neg y

			} else if ( face == 5.0 ) {

				direction.z *= -1.0; // ( u, v, -1 ) neg z

			}

			return direction;

		}

		void main() {

			vOutputDirection = getDirection( uv, faceIndex );
			gl_Position = vec4( position, 1.0 );

		}
	`}function Z0(i){let A=new WeakMap,t=null;function e(a){if(a&&a.isTexture){const g=a.mapping,r=g===kn||g===Tn,I=g===Vs||g===zs;if(r||I)if(a.isRenderTargetTexture&&a.needsPMREMUpdate===!0){a.needsPMREMUpdate=!1;let B=A.get(a);return t===null&&(t=new PC(i)),B=r?t.fromEquirectangular(a,B):t.fromCubemap(a,B),A.set(a,B),B.texture}else{if(A.has(a))return A.get(a).texture;{const B=a.image;if(r&&B&&B.height>0||I&&B&&n(B)){t===null&&(t=new PC(i));const C=r?t.fromEquirectangular(a):t.fromCubemap(a);return A.set(a,C),a.addEventListener("dispose",s),C.texture}else return null}}}return a}function n(a){let g=0;const r=6;for(let I=0;I<r;I++)a[I]!==void 0&&g++;return g===r}function s(a){const g=a.target;g.removeEventListener("dispose",s);const r=A.get(g);r!==void 0&&(A.delete(g),r.dispose())}function o(){A=new WeakMap,t!==null&&(t.dispose(),t=null)}return{get:e,dispose:o}}function j0(i){const A={};function t(e){if(A[e]!==void 0)return A[e];let n;switch(e){case"WEBGL_depth_texture":n=i.getExtension("WEBGL_depth_texture")||i.getExtension("MOZ_WEBGL_depth_texture")||i.getExtension("WEBKIT_WEBGL_depth_texture");break;case"EXT_texture_filter_anisotropic":n=i.getExtension("EXT_texture_filter_anisotropic")||i.getExtension("MOZ_EXT_texture_filter_anisotropic")||i.getExtension("WEBKIT_EXT_texture_filter_anisotropic");break;case"WEBGL_compressed_texture_s3tc":n=i.getExtension("WEBGL_compressed_texture_s3tc")||i.getExtension("MOZ_WEBGL_compressed_texture_s3tc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_s3tc");break;case"WEBGL_compressed_texture_pvrtc":n=i.getExtension("WEBGL_compressed_texture_pvrtc")||i.getExtension("WEBKIT_WEBGL_compressed_texture_pvrtc");break;default:n=i.getExtension(e)}return A[e]=n,n}return{has:function(e){return t(e)!==null},init:function(e){e.isWebGL2?t("EXT_color_buffer_float"):(t("WEBGL_depth_texture"),t("OES_texture_float"),t("OES_texture_half_float"),t("OES_texture_half_float_linear"),t("OES_standard_derivatives"),t("OES_element_index_uint"),t("OES_vertex_array_object"),t("ANGLE_instanced_arrays")),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture")},get:function(e){const n=t(e);return n===null&&console.warn("THREE.WebGLRenderer: "+e+" extension not supported."),n}}}function $0(i,A,t,e){const n={},s=new WeakMap;function o(B){const C=B.target;C.index!==null&&A.remove(C.index);for(const c in C.attributes)A.remove(C.attributes[c]);for(const c in C.morphAttributes){const l=C.morphAttributes[c];for(let h=0,E=l.length;h<E;h++)A.remove(l[h])}C.removeEventListener("dispose",o),delete n[C.id];const Q=s.get(C);Q&&(A.remove(Q),s.delete(C)),e.releaseStatesOfGeometry(C),C.isInstancedBufferGeometry===!0&&delete C._maxInstanceCount,t.memory.geometries--}function a(B,C){return n[C.id]===!0||(C.addEventListener("dispose",o),n[C.id]=!0,t.memory.geometries++),C}function g(B){const C=B.attributes;for(const c in C)A.update(C[c],i.ARRAY_BUFFER);const Q=B.morphAttributes;for(const c in Q){const l=Q[c];for(let h=0,E=l.length;h<E;h++)A.update(l[h],i.ARRAY_BUFFER)}}function r(B){const C=[],Q=B.index,c=B.attributes.position;let l=0;if(Q!==null){const f=Q.array;l=Q.version;for(let d=0,u=f.length;d<u;d+=3){const m=f[d+0],y=f[d+1],p=f[d+2];C.push(m,y,y,p,p,m)}}else{const f=c.array;l=c.version;for(let d=0,u=f.length/3-1;d<u;d+=3){const m=d+0,y=d+1,p=d+2;C.push(m,y,y,p,p,m)}}const h=new(qQ(C)?VQ:WQ)(C,1);h.version=l;const E=s.get(B);E&&A.remove(E),s.set(B,h)}function I(B){const C=s.get(B);if(C){const Q=B.index;Q!==null&&C.version<Q.version&&r(B)}else r(B);return s.get(B)}return{get:a,update:g,getWireframeAttribute:I}}function Ap(i,A,t,e){const n=e.isWebGL2;let s;function o(C){s=C}let a,g;function r(C){a=C.type,g=C.bytesPerElement}function I(C,Q){i.drawElements(s,Q,a,C*g),t.update(Q,s,1)}function B(C,Q,c){if(c===0)return;let l,h;if(n)l=i,h="drawElementsInstanced";else if(l=A.get("ANGLE_instanced_arrays"),h="drawElementsInstancedANGLE",l===null){console.error("THREE.WebGLIndexedBufferRenderer: using THREE.InstancedBufferGeometry but hardware does not support extension ANGLE_instanced_arrays.");return}l[h](s,Q,a,C*g,c),t.update(Q,s,c)}this.setMode=o,this.setIndex=r,this.render=I,this.renderInstances=B}function tp(i){const A={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function e(s,o,a){switch(t.calls++,o){case i.TRIANGLES:t.triangles+=a*(s/3);break;case i.LINES:t.lines+=a*(s/2);break;case i.LINE_STRIP:t.lines+=a*(s-1);break;case i.LINE_LOOP:t.lines+=a*s;break;case i.POINTS:t.points+=a*s;break;default:console.error("THREE.WebGLInfo: Unknown draw mode:",o);break}}function n(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:A,render:t,programs:null,autoReset:!0,reset:n,update:e}}function ep(i,A){return i[0]-A[0]}function ip(i,A){return Math.abs(A[1])-Math.abs(i[1])}function np(i,A,t){const e={},n=new Float32Array(8),s=new WeakMap,o=new It,a=[];for(let r=0;r<8;r++)a[r]=[r,0];function g(r,I,B){const C=r.morphTargetInfluences;if(A.isWebGL2===!0){const c=I.morphAttributes.position||I.morphAttributes.normal||I.morphAttributes.color,l=c!==void 0?c.length:0;let h=s.get(I);if(h===void 0||h.count!==l){let b=function(){L.dispose(),s.delete(I),I.removeEventListener("dispose",b)};var Q=b;h!==void 0&&h.texture.dispose();const d=I.morphAttributes.position!==void 0,u=I.morphAttributes.normal!==void 0,m=I.morphAttributes.color!==void 0,y=I.morphAttributes.position||[],p=I.morphAttributes.normal||[],R=I.morphAttributes.color||[];let D=0;d===!0&&(D=1),u===!0&&(D=2),m===!0&&(D=3);let S=I.attributes.position.count*D,F=1;S>A.maxTextureSize&&(F=Math.ceil(S/A.maxTextureSize),S=A.maxTextureSize);const G=new Float32Array(S*F*4*l),L=new YQ(G,S,F,l);L.type=De,L.needsUpdate=!0;const T=D*4;for(let V=0;V<l;V++){const K=y[V],tA=p[V],nA=R[V],Z=S*F*4*V;for(let CA=0;CA<K.count;CA++){const q=CA*T;d===!0&&(o.fromBufferAttribute(K,CA),G[Z+q+0]=o.x,G[Z+q+1]=o.y,G[Z+q+2]=o.z,G[Z+q+3]=0),u===!0&&(o.fromBufferAttribute(tA,CA),G[Z+q+4]=o.x,G[Z+q+5]=o.y,G[Z+q+6]=o.z,G[Z+q+7]=0),m===!0&&(o.fromBufferAttribute(nA,CA),G[Z+q+8]=o.x,G[Z+q+9]=o.y,G[Z+q+10]=o.z,G[Z+q+11]=nA.itemSize===4?o.w:1)}}h={count:l,texture:L,size:new TA(S,F)},s.set(I,h),I.addEventListener("dispose",b)}let E=0;for(let d=0;d<C.length;d++)E+=C[d];const f=I.morphTargetsRelative?1:1-E;B.getUniforms().setValue(i,"morphTargetBaseInfluence",f),B.getUniforms().setValue(i,"morphTargetInfluences",C),B.getUniforms().setValue(i,"morphTargetsTexture",h.texture,t),B.getUniforms().setValue(i,"morphTargetsTextureSize",h.size)}else{const c=C===void 0?0:C.length;let l=e[I.id];if(l===void 0||l.length!==c){l=[];for(let u=0;u<c;u++)l[u]=[u,0];e[I.id]=l}for(let u=0;u<c;u++){const m=l[u];m[0]=u,m[1]=C[u]}l.sort(ip);for(let u=0;u<8;u++)u<c&&l[u][1]?(a[u][0]=l[u][0],a[u][1]=l[u][1]):(a[u][0]=Number.MAX_SAFE_INTEGER,a[u][1]=0);a.sort(ep);const h=I.morphAttributes.position,E=I.morphAttributes.normal;let f=0;for(let u=0;u<8;u++){const m=a[u],y=m[0],p=m[1];y!==Number.MAX_SAFE_INTEGER&&p?(h&&I.getAttribute("morphTarget"+u)!==h[y]&&I.setAttribute("morphTarget"+u,h[y]),E&&I.getAttribute("morphNormal"+u)!==E[y]&&I.setAttribute("morphNormal"+u,E[y]),n[u]=p,f+=p):(h&&I.hasAttribute("morphTarget"+u)===!0&&I.deleteAttribute("morphTarget"+u),E&&I.hasAttribute("morphNormal"+u)===!0&&I.deleteAttribute("morphNormal"+u),n[u]=0)}const d=I.morphTargetsRelative?1:1-f;B.getUniforms().setValue(i,"morphTargetBaseInfluence",d),B.getUniforms().setValue(i,"morphTargetInfluences",n)}}return{update:g}}function sp(i,A,t,e){let n=new WeakMap;function s(g){const r=e.render.frame,I=g.geometry,B=A.get(g,I);return n.get(B)!==r&&(A.update(B),n.set(B,r)),g.isInstancedMesh&&(g.hasEventListener("dispose",a)===!1&&g.addEventListener("dispose",a),t.update(g.instanceMatrix,i.ARRAY_BUFFER),g.instanceColor!==null&&t.update(g.instanceColor,i.ARRAY_BUFFER)),B}function o(){n=new WeakMap}function a(g){const r=g.target;r.removeEventListener("dispose",a),t.remove(r.instanceMatrix),r.instanceColor!==null&&t.remove(r.instanceColor)}return{update:s,dispose:o}}const $Q=new Tt,Ac=new YQ,tc=new Yd,ec=new ZQ,zC=[],XC=[],ZC=new Float32Array(16),jC=new Float32Array(9),$C=new Float32Array(4);function io(i,A,t){const e=i[0];if(e<=0||e>0)return i;const n=A*t;let s=zC[n];if(s===void 0&&(s=new Float32Array(n),zC[n]=s),A!==0){e.toArray(s,0);for(let o=1,a=0;o!==A;++o)a+=t,i[o].toArray(s,a)}return s}function wt(i,A){if(i.length!==A.length)return!1;for(let t=0,e=i.length;t<e;t++)if(i[t]!==A[t])return!1;return!0}function Mt(i,A){for(let t=0,e=A.length;t<e;t++)i[t]=A[t]}function jr(i,A){let t=XC[A];t===void 0&&(t=new Int32Array(A),XC[A]=t);for(let e=0;e!==A;++e)t[e]=i.allocateTextureUnit();return t}function op(i,A){const t=this.cache;t[0]!==A&&(i.uniform1f(this.addr,A),t[0]=A)}function ap(i,A){const t=this.cache;if(A.x!==void 0)(t[0]!==A.x||t[1]!==A.y)&&(i.uniform2f(this.addr,A.x,A.y),t[0]=A.x,t[1]=A.y);else{if(wt(t,A))return;i.uniform2fv(this.addr,A),Mt(t,A)}}function rp(i,A){const t=this.cache;if(A.x!==void 0)(t[0]!==A.x||t[1]!==A.y||t[2]!==A.z)&&(i.uniform3f(this.addr,A.x,A.y,A.z),t[0]=A.x,t[1]=A.y,t[2]=A.z);else if(A.r!==void 0)(t[0]!==A.r||t[1]!==A.g||t[2]!==A.b)&&(i.uniform3f(this.addr,A.r,A.g,A.b),t[0]=A.r,t[1]=A.g,t[2]=A.b);else{if(wt(t,A))return;i.uniform3fv(this.addr,A),Mt(t,A)}}function gp(i,A){const t=this.cache;if(A.x!==void 0)(t[0]!==A.x||t[1]!==A.y||t[2]!==A.z||t[3]!==A.w)&&(i.uniform4f(this.addr,A.x,A.y,A.z,A.w),t[0]=A.x,t[1]=A.y,t[2]=A.z,t[3]=A.w);else{if(wt(t,A))return;i.uniform4fv(this.addr,A),Mt(t,A)}}function Ip(i,A){const t=this.cache,e=A.elements;if(e===void 0){if(wt(t,A))return;i.uniformMatrix2fv(this.addr,!1,A),Mt(t,A)}else{if(wt(t,e))return;$C.set(e),i.uniformMatrix2fv(this.addr,!1,$C),Mt(t,e)}}function Bp(i,A){const t=this.cache,e=A.elements;if(e===void 0){if(wt(t,A))return;i.uniformMatrix3fv(this.addr,!1,A),Mt(t,A)}else{if(wt(t,e))return;jC.set(e),i.uniformMatrix3fv(this.addr,!1,jC),Mt(t,e)}}function Cp(i,A){const t=this.cache,e=A.elements;if(e===void 0){if(wt(t,A))return;i.uniformMatrix4fv(this.addr,!1,A),Mt(t,A)}else{if(wt(t,e))return;ZC.set(e),i.uniformMatrix4fv(this.addr,!1,ZC),Mt(t,e)}}function Ep(i,A){const t=this.cache;t[0]!==A&&(i.uniform1i(this.addr,A),t[0]=A)}function hp(i,A){const t=this.cache;if(A.x!==void 0)(t[0]!==A.x||t[1]!==A.y)&&(i.uniform2i(this.addr,A.x,A.y),t[0]=A.x,t[1]=A.y);else{if(wt(t,A))return;i.uniform2iv(this.addr,A),Mt(t,A)}}function Qp(i,A){const t=this.cache;if(A.x!==void 0)(t[0]!==A.x||t[1]!==A.y||t[2]!==A.z)&&(i.uniform3i(this.addr,A.x,A.y,A.z),t[0]=A.x,t[1]=A.y,t[2]=A.z);else{if(wt(t,A))return;i.uniform3iv(this.addr,A),Mt(t,A)}}function cp(i,A){const t=this.cache;if(A.x!==void 0)(t[0]!==A.x||t[1]!==A.y||t[2]!==A.z||t[3]!==A.w)&&(i.uniform4i(this.addr,A.x,A.y,A.z,A.w),t[0]=A.x,t[1]=A.y,t[2]=A.z,t[3]=A.w);else{if(wt(t,A))return;i.uniform4iv(this.addr,A),Mt(t,A)}}function lp(i,A){const t=this.cache;t[0]!==A&&(i.uniform1ui(this.addr,A),t[0]=A)}function dp(i,A){const t=this.cache;if(A.x!==void 0)(t[0]!==A.x||t[1]!==A.y)&&(i.uniform2ui(this.addr,A.x,A.y),t[0]=A.x,t[1]=A.y);else{if(wt(t,A))return;i.uniform2uiv(this.addr,A),Mt(t,A)}}function up(i,A){const t=this.cache;if(A.x!==void 0)(t[0]!==A.x||t[1]!==A.y||t[2]!==A.z)&&(i.uniform3ui(this.addr,A.x,A.y,A.z),t[0]=A.x,t[1]=A.y,t[2]=A.z);else{if(wt(t,A))return;i.uniform3uiv(this.addr,A),Mt(t,A)}}function fp(i,A){const t=this.cache;if(A.x!==void 0)(t[0]!==A.x||t[1]!==A.y||t[2]!==A.z||t[3]!==A.w)&&(i.uniform4ui(this.addr,A.x,A.y,A.z,A.w),t[0]=A.x,t[1]=A.y,t[2]=A.z,t[3]=A.w);else{if(wt(t,A))return;i.uniform4uiv(this.addr,A),Mt(t,A)}}function pp(i,A,t){const e=this.cache,n=t.allocateTextureUnit();e[0]!==n&&(i.uniform1i(this.addr,n),e[0]=n),t.setTexture2D(A||$Q,n)}function mp(i,A,t){const e=this.cache,n=t.allocateTextureUnit();e[0]!==n&&(i.uniform1i(this.addr,n),e[0]=n),t.setTexture3D(A||tc,n)}function yp(i,A,t){const e=this.cache,n=t.allocateTextureUnit();e[0]!==n&&(i.uniform1i(this.addr,n),e[0]=n),t.setTextureCube(A||ec,n)}function Dp(i,A,t){const e=this.cache,n=t.allocateTextureUnit();e[0]!==n&&(i.uniform1i(this.addr,n),e[0]=n),t.setTexture2DArray(A||Ac,n)}function Sp(i){switch(i){case 5126:return op;case 35664:return ap;case 35665:return rp;case 35666:return gp;case 35674:return Ip;case 35675:return Bp;case 35676:return Cp;case 5124:case 35670:return Ep;case 35667:case 35671:return hp;case 35668:case 35672:return Qp;case 35669:case 35673:return cp;case 5125:return lp;case 36294:return dp;case 36295:return up;case 36296:return fp;case 35678:case 36198:case 36298:case 36306:case 35682:return pp;case 35679:case 36299:case 36307:return mp;case 35680:case 36300:case 36308:case 36293:return yp;case 36289:case 36303:case 36311:case 36292:return Dp}}function wp(i,A){i.uniform1fv(this.addr,A)}function Mp(i,A){const t=io(A,this.size,2);i.uniform2fv(this.addr,t)}function Rp(i,A){const t=io(A,this.size,3);i.uniform3fv(this.addr,t)}function Fp(i,A){const t=io(A,this.size,4);i.uniform4fv(this.addr,t)}function xp(i,A){const t=io(A,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function Np(i,A){const t=io(A,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function _p(i,A){const t=io(A,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function Gp(i,A){i.uniform1iv(this.addr,A)}function Lp(i,A){i.uniform2iv(this.addr,A)}function Up(i,A){i.uniform3iv(this.addr,A)}function bp(i,A){i.uniform4iv(this.addr,A)}function vp(i,A){i.uniform1uiv(this.addr,A)}function kp(i,A){i.uniform2uiv(this.addr,A)}function Tp(i,A){i.uniform3uiv(this.addr,A)}function Hp(i,A){i.uniform4uiv(this.addr,A)}function qp(i,A,t){const e=this.cache,n=A.length,s=jr(t,n);wt(e,s)||(i.uniform1iv(this.addr,s),Mt(e,s));for(let o=0;o!==n;++o)t.setTexture2D(A[o]||$Q,s[o])}function Jp(i,A,t){const e=this.cache,n=A.length,s=jr(t,n);wt(e,s)||(i.uniform1iv(this.addr,s),Mt(e,s));for(let o=0;o!==n;++o)t.setTexture3D(A[o]||tc,s[o])}function Kp(i,A,t){const e=this.cache,n=A.length,s=jr(t,n);wt(e,s)||(i.uniform1iv(this.addr,s),Mt(e,s));for(let o=0;o!==n;++o)t.setTextureCube(A[o]||ec,s[o])}function Yp(i,A,t){const e=this.cache,n=A.length,s=jr(t,n);wt(e,s)||(i.uniform1iv(this.addr,s),Mt(e,s));for(let o=0;o!==n;++o)t.setTexture2DArray(A[o]||Ac,s[o])}function Pp(i){switch(i){case 5126:return wp;case 35664:return Mp;case 35665:return Rp;case 35666:return Fp;case 35674:return xp;case 35675:return Np;case 35676:return _p;case 5124:case 35670:return Gp;case 35667:case 35671:return Lp;case 35668:case 35672:return Up;case 35669:case 35673:return bp;case 5125:return vp;case 36294:return kp;case 36295:return Tp;case 36296:return Hp;case 35678:case 36198:case 36298:case 36306:case 35682:return qp;case 35679:case 36299:case 36307:return Jp;case 35680:case 36300:case 36308:case 36293:return Kp;case 36289:case 36303:case 36311:case 36292:return Yp}}class Op{constructor(A,t,e){this.id=A,this.addr=e,this.cache=[],this.setValue=Sp(t.type)}}class Wp{constructor(A,t,e){this.id=A,this.addr=e,this.cache=[],this.size=t.size,this.setValue=Pp(t.type)}}class Vp{constructor(A){this.id=A,this.seq=[],this.map={}}setValue(A,t,e){const n=this.seq;for(let s=0,o=n.length;s!==o;++s){const a=n[s];a.setValue(A,t[a.id],e)}}}const bg=/(\w+)(\])?(\[|\.)?/g;function AE(i,A){i.seq.push(A),i.map[A.id]=A}function zp(i,A,t){const e=i.name,n=e.length;for(bg.lastIndex=0;;){const s=bg.exec(e),o=bg.lastIndex;let a=s[1];const g=s[2]==="]",r=s[3];if(g&&(a=a|0),r===void 0||r==="["&&o+2===n){AE(t,r===void 0?new Op(a,i,A):new Wp(a,i,A));break}else{let B=t.map[a];B===void 0&&(B=new Vp(a),AE(t,B)),t=B}}}class mr{constructor(A,t){this.seq=[],this.map={};const e=A.getProgramParameter(t,A.ACTIVE_UNIFORMS);for(let n=0;n<e;++n){const s=A.getActiveUniform(t,n),o=A.getUniformLocation(t,s.name);zp(s,o,this)}}setValue(A,t,e,n){const s=this.map[t];s!==void 0&&s.setValue(A,e,n)}setOptional(A,t,e){const n=t[e];n!==void 0&&this.setValue(A,e,n)}static upload(A,t,e,n){for(let s=0,o=t.length;s!==o;++s){const a=t[s],g=e[a.id];g.needsUpdate!==!1&&a.setValue(A,g.value,n)}}static seqWithValue(A,t){const e=[];for(let n=0,s=A.length;n!==s;++n){const o=A[n];o.id in t&&e.push(o)}return e}}function tE(i,A,t){const e=i.createShader(A);return i.shaderSource(e,t),i.compileShader(e),e}let Xp=0;function Zp(i,A){const t=i.split(`
`),e=[],n=Math.max(A-6,0),s=Math.min(A+6,t.length);for(let o=n;o<s;o++){const a=o+1;e.push(`${a===A?">":" "} ${a}: ${t[o]}`)}return e.join(`
`)}function jp(i){switch(i){case Xe:return["Linear","( value )"];case kA:return["sRGB","( value )"];default:return console.warn("THREE.WebGLProgram: Unsupported color space:",i),["Linear","( value )"]}}function eE(i,A,t){const e=i.getShaderParameter(A,i.COMPILE_STATUS),n=i.getShaderInfoLog(A).trim();if(e&&n==="")return"";const s=/ERROR: 0:(\d+)/.exec(n);if(s){const o=parseInt(s[1]);return t.toUpperCase()+`

`+n+`

`+Zp(i.getShaderSource(A),o)}else return n}function $p(i,A){const t=jp(A);return"vec4 "+i+"( vec4 value ) { return LinearTo"+t[0]+t[1]+"; }"}function Am(i,A){let t;switch(A){case Vl:t="Linear";break;case zl:t="Reinhard";break;case Xl:t="OptimizedCineon";break;case Zl:t="ACESFilmic";break;case jl:t="Custom";break;default:console.warn("THREE.WebGLProgram: Unsupported toneMapping:",A),t="Linear"}return"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}function tm(i){return[i.extensionDerivatives||!!i.envMapCubeUVHeight||i.bumpMap||i.normalMapTangentSpace||i.clearcoatNormalMap||i.flatShading||i.shaderID==="physical"?"#extension GL_OES_standard_derivatives : enable":"",(i.extensionFragDepth||i.logarithmicDepthBuffer)&&i.rendererExtensionFragDepth?"#extension GL_EXT_frag_depth : enable":"",i.extensionDrawBuffers&&i.rendererExtensionDrawBuffers?"#extension GL_EXT_draw_buffers : require":"",(i.extensionShaderTextureLOD||i.envMap||i.transmission)&&i.rendererExtensionShaderTextureLod?"#extension GL_EXT_shader_texture_lod : enable":""].filter(Uo).join(`
`)}function em(i){const A=[];for(const t in i){const e=i[t];e!==!1&&A.push("#define "+t+" "+e)}return A.join(`
`)}function im(i,A){const t={},e=i.getProgramParameter(A,i.ACTIVE_ATTRIBUTES);for(let n=0;n<e;n++){const s=i.getActiveAttrib(A,n),o=s.name;let a=1;s.type===i.FLOAT_MAT2&&(a=2),s.type===i.FLOAT_MAT3&&(a=3),s.type===i.FLOAT_MAT4&&(a=4),t[o]={type:s.type,location:i.getAttribLocation(A,o),locationSize:a}}return t}function Uo(i){return i!==""}function iE(i,A){const t=A.numSpotLightShadows+A.numSpotLightMaps-A.numSpotLightShadowsWithMaps;return i.replace(/NUM_DIR_LIGHTS/g,A.numDirLights).replace(/NUM_SPOT_LIGHTS/g,A.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,A.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,A.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,A.numPointLights).replace(/NUM_HEMI_LIGHTS/g,A.numHemiLights).replace(/NUM_DIR_LIGHT_SHADOWS/g,A.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,A.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,A.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,A.numPointLightShadows)}function nE(i,A){return i.replace(/NUM_CLIPPING_PLANES/g,A.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,A.numClippingPlanes-A.numClipIntersection)}const nm=/^[ \t]*#include +<([\w\d./]+)>/gm;function JI(i){return i.replace(nm,sm)}function sm(i,A){const t=OA[A];if(t===void 0)throw new Error("Can not resolve #include <"+A+">");return JI(t)}const om=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function sE(i){return i.replace(om,am)}function am(i,A,t,e){let n="";for(let s=parseInt(A);s<parseInt(t);s++)n+=e.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return n}function oE(i){let A="precision "+i.precision+` float;
precision `+i.precision+" int;";return i.precision==="highp"?A+=`
#define HIGH_PRECISION`:i.precision==="mediump"?A+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(A+=`
#define LOW_PRECISION`),A}function rm(i){let A="SHADOWMAP_TYPE_BASIC";return i.shadowMapType===wQ?A="SHADOWMAP_TYPE_PCF":i.shadowMapType===wl?A="SHADOWMAP_TYPE_PCF_SOFT":i.shadowMapType===Mi&&(A="SHADOWMAP_TYPE_VSM"),A}function gm(i){let A="ENVMAP_TYPE_CUBE";if(i.envMap)switch(i.envMapMode){case Vs:case zs:A="ENVMAP_TYPE_CUBE";break;case zr:A="ENVMAP_TYPE_CUBE_UV";break}return A}function Im(i){let A="ENVMAP_MODE_REFLECTION";if(i.envMap)switch(i.envMapMode){case zs:A="ENVMAP_MODE_REFRACTION";break}return A}function Bm(i){let A="ENVMAP_BLENDING_NONE";if(i.envMap)switch(i.combine){case QB:A="ENVMAP_BLENDING_MULTIPLY";break;case Ol:A="ENVMAP_BLENDING_MIX";break;case Wl:A="ENVMAP_BLENDING_ADD";break}return A}function Cm(i){const A=i.envMapCubeUVHeight;if(A===null)return null;const t=Math.log2(A)-2,e=1/A;return{texelWidth:1/(3*Math.max(Math.pow(2,t),7*16)),texelHeight:e,maxMip:t}}function Em(i,A,t,e){const n=i.getContext(),s=t.defines;let o=t.vertexShader,a=t.fragmentShader;const g=rm(t),r=gm(t),I=Im(t),B=Bm(t),C=Cm(t),Q=t.isWebGL2?"":tm(t),c=em(s),l=n.createProgram();let h,E,f=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(h=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,c].filter(Uo).join(`
`),h.length>0&&(h+=`
`),E=[Q,"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,c].filter(Uo).join(`
`),E.length>0&&(E+=`
`)):(h=[oE(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,c,t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+I:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents?"#define USE_TANGENT":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors&&t.isWebGL2?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE":"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0&&t.isWebGL2?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+g:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#if ( defined( USE_MORPHTARGETS ) && ! defined( MORPHTARGETS_TEXTURE ) )","	attribute vec3 morphTarget0;","	attribute vec3 morphTarget1;","	attribute vec3 morphTarget2;","	attribute vec3 morphTarget3;","	#ifdef USE_MORPHNORMALS","		attribute vec3 morphNormal0;","		attribute vec3 morphNormal1;","		attribute vec3 morphNormal2;","		attribute vec3 morphNormal3;","	#else","		attribute vec3 morphTarget4;","		attribute vec3 morphTarget5;","		attribute vec3 morphTarget6;","		attribute vec3 morphTarget7;","	#endif","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Uo).join(`
`),E=[Q,oE(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,c,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+r:"",t.envMap?"#define "+I:"",t.envMap?"#define "+B:"",C?"#define CUBEUV_TEXEL_WIDTH "+C.texelWidth:"",C?"#define CUBEUV_TEXEL_HEIGHT "+C.texelHeight:"",C?"#define CUBEUV_MAX_MIP "+C.maxMip+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+g:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.useLegacyLights?"#define LEGACY_LIGHTS":"",t.logarithmicDepthBuffer?"#define USE_LOGDEPTHBUF":"",t.logarithmicDepthBuffer&&t.rendererExtensionFragDepth?"#define USE_LOGDEPTHBUF_EXT":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==bi?"#define TONE_MAPPING":"",t.toneMapping!==bi?OA.tonemapping_pars_fragment:"",t.toneMapping!==bi?Am("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",OA.encodings_pars_fragment,$p("linearToOutputTexel",t.outputColorSpace),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Uo).join(`
`)),o=JI(o),o=iE(o,t),o=nE(o,t),a=JI(a),a=iE(a,t),a=nE(a,t),o=sE(o),a=sE(a),t.isWebGL2&&t.isRawShaderMaterial!==!0&&(f=`#version 300 es
`,h=["precision mediump sampler2DArray;","#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+h,E=["#define varying in",t.glslVersion===SC?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===SC?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+E);const d=f+h+o,u=f+E+a,m=tE(n,n.VERTEX_SHADER,d),y=tE(n,n.FRAGMENT_SHADER,u);if(n.attachShader(l,m),n.attachShader(l,y),t.index0AttributeName!==void 0?n.bindAttribLocation(l,0,t.index0AttributeName):t.morphTargets===!0&&n.bindAttribLocation(l,0,"position"),n.linkProgram(l),i.debug.checkShaderErrors){const D=n.getProgramInfoLog(l).trim(),S=n.getShaderInfoLog(m).trim(),F=n.getShaderInfoLog(y).trim();let G=!0,L=!0;if(n.getProgramParameter(l,n.LINK_STATUS)===!1)if(G=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(n,l,m,y);else{const T=eE(n,m,"vertex"),b=eE(n,y,"fragment");console.error("THREE.WebGLProgram: Shader Error "+n.getError()+" - VALIDATE_STATUS "+n.getProgramParameter(l,n.VALIDATE_STATUS)+`

Program Info Log: `+D+`
`+T+`
`+b)}else D!==""?console.warn("THREE.WebGLProgram: Program Info Log:",D):(S===""||F==="")&&(L=!1);L&&(this.diagnostics={runnable:G,programLog:D,vertexShader:{log:S,prefix:h},fragmentShader:{log:F,prefix:E}})}n.deleteShader(m),n.deleteShader(y);let p;this.getUniforms=function(){return p===void 0&&(p=new mr(n,l)),p};let R;return this.getAttributes=function(){return R===void 0&&(R=im(n,l)),R},this.destroy=function(){e.releaseStatesOfProgram(this),n.deleteProgram(l),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Xp++,this.cacheKey=A,this.usedTimes=1,this.program=l,this.vertexShader=m,this.fragmentShader=y,this}let hm=0;class Qm{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(A){const t=A.vertexShader,e=A.fragmentShader,n=this._getShaderStage(t),s=this._getShaderStage(e),o=this._getShaderCacheForMaterial(A);return o.has(n)===!1&&(o.add(n),n.usedTimes++),o.has(s)===!1&&(o.add(s),s.usedTimes++),this}remove(A){const t=this.materialCache.get(A);for(const e of t)e.usedTimes--,e.usedTimes===0&&this.shaderCache.delete(e.code);return this.materialCache.delete(A),this}getVertexShaderID(A){return this._getShaderStage(A.vertexShader).id}getFragmentShaderID(A){return this._getShaderStage(A.fragmentShader).id}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(A){const t=this.materialCache;let e=t.get(A);return e===void 0&&(e=new Set,t.set(A,e)),e}_getShaderStage(A){const t=this.shaderCache;let e=t.get(A);return e===void 0&&(e=new cm(A),t.set(A,e)),e}}class cm{constructor(A){this.id=hm++,this.code=A,this.usedTimes=0}}function lm(i,A,t,e,n,s,o){const a=new PQ,g=new Qm,r=[],I=n.isWebGL2,B=n.logarithmicDepthBuffer,C=n.vertexTextures;let Q=n.precision;const c={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distanceRGBA",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function l(D){return D===0?"uv":`uv${D}`}function h(D,S,F,G,L){const T=G.fog,b=L.geometry,V=D.isMeshStandardMaterial?G.environment:null,K=(D.isMeshStandardMaterial?t:A).get(D.envMap||V),tA=!!K&&K.mapping===zr?K.image.height:null,nA=c[D.type];D.precision!==null&&(Q=n.getMaxPrecision(D.precision),Q!==D.precision&&console.warn("THREE.WebGLProgram.getParameters:",D.precision,"not supported, using",Q,"instead."));const Z=b.morphAttributes.position||b.morphAttributes.normal||b.morphAttributes.color,CA=Z!==void 0?Z.length:0;let q=0;b.morphAttributes.position!==void 0&&(q=1),b.morphAttributes.normal!==void 0&&(q=2),b.morphAttributes.color!==void 0&&(q=3);let eA,oA,aA,QA;if(nA){const ct=ei[nA];eA=ct.vertexShader,oA=ct.fragmentShader}else eA=D.vertexShader,oA=D.fragmentShader,g.update(D),aA=g.getVertexShaderID(D),QA=g.getFragmentShaderID(D);const wA=i.getRenderTarget(),NA=L.isInstancedMesh===!0,xA=!!D.map,it=!!D.matcap,_A=!!K,$=!!D.aoMap,JA=!!D.lightMap,MA=!!D.bumpMap,FA=!!D.normalMap,SA=!!D.displacementMap,qA=!!D.emissiveMap,bA=!!D.metalnessMap,LA=!!D.roughnessMap,PA=D.anisotropy>0,YA=D.clearcoat>0,$A=D.iridescence>0,N=D.sheen>0,M=D.transmission>0,k=PA&&!!D.anisotropyMap,X=YA&&!!D.clearcoatMap,j=YA&&!!D.clearcoatNormalMap,x=YA&&!!D.clearcoatRoughnessMap,AA=$A&&!!D.iridescenceMap,sA=$A&&!!D.iridescenceThicknessMap,z=N&&!!D.sheenColorMap,IA=N&&!!D.sheenRoughnessMap,lA=!!D.specularMap,EA=!!D.specularColorMap,DA=!!D.specularIntensityMap,RA=M&&!!D.transmissionMap,UA=M&&!!D.thicknessMap,WA=!!D.gradientMap,Y=!!D.alphaMap,fA=D.alphaTest>0,iA=!!D.extensions,hA=!!b.attributes.uv1,mA=!!b.attributes.uv2,At=!!b.attributes.uv3;return{isWebGL2:I,shaderID:nA,shaderType:D.type,shaderName:D.name,vertexShader:eA,fragmentShader:oA,defines:D.defines,customVertexShaderID:aA,customFragmentShaderID:QA,isRawShaderMaterial:D.isRawShaderMaterial===!0,glslVersion:D.glslVersion,precision:Q,instancing:NA,instancingColor:NA&&L.instanceColor!==null,supportsVertexTextures:C,outputColorSpace:wA===null?i.outputColorSpace:wA.isXRRenderTarget===!0?wA.texture.colorSpace:Xe,map:xA,matcap:it,envMap:_A,envMapMode:_A&&K.mapping,envMapCubeUVHeight:tA,aoMap:$,lightMap:JA,bumpMap:MA,normalMap:FA,displacementMap:C&&SA,emissiveMap:qA,normalMapObjectSpace:FA&&D.normalMapType===Cd,normalMapTangentSpace:FA&&D.normalMapType===lB,metalnessMap:bA,roughnessMap:LA,anisotropy:PA,anisotropyMap:k,clearcoat:YA,clearcoatMap:X,clearcoatNormalMap:j,clearcoatRoughnessMap:x,iridescence:$A,iridescenceMap:AA,iridescenceThicknessMap:sA,sheen:N,sheenColorMap:z,sheenRoughnessMap:IA,specularMap:lA,specularColorMap:EA,specularIntensityMap:DA,transmission:M,transmissionMap:RA,thicknessMap:UA,gradientMap:WA,opaque:D.transparent===!1&&D.blending===Js,alphaMap:Y,alphaTest:fA,combine:D.combine,mapUv:xA&&l(D.map.channel),aoMapUv:$&&l(D.aoMap.channel),lightMapUv:JA&&l(D.lightMap.channel),bumpMapUv:MA&&l(D.bumpMap.channel),normalMapUv:FA&&l(D.normalMap.channel),displacementMapUv:SA&&l(D.displacementMap.channel),emissiveMapUv:qA&&l(D.emissiveMap.channel),metalnessMapUv:bA&&l(D.metalnessMap.channel),roughnessMapUv:LA&&l(D.roughnessMap.channel),anisotropyMapUv:k&&l(D.anisotropyMap.channel),clearcoatMapUv:X&&l(D.clearcoatMap.channel),clearcoatNormalMapUv:j&&l(D.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:x&&l(D.clearcoatRoughnessMap.channel),iridescenceMapUv:AA&&l(D.iridescenceMap.channel),iridescenceThicknessMapUv:sA&&l(D.iridescenceThicknessMap.channel),sheenColorMapUv:z&&l(D.sheenColorMap.channel),sheenRoughnessMapUv:IA&&l(D.sheenRoughnessMap.channel),specularMapUv:lA&&l(D.specularMap.channel),specularColorMapUv:EA&&l(D.specularColorMap.channel),specularIntensityMapUv:DA&&l(D.specularIntensityMap.channel),transmissionMapUv:RA&&l(D.transmissionMap.channel),thicknessMapUv:UA&&l(D.thicknessMap.channel),alphaMapUv:Y&&l(D.alphaMap.channel),vertexTangents:!!b.attributes.tangent&&(FA||PA),vertexColors:D.vertexColors,vertexAlphas:D.vertexColors===!0&&!!b.attributes.color&&b.attributes.color.itemSize===4,vertexUv1s:hA,vertexUv2s:mA,vertexUv3s:At,pointsUvs:L.isPoints===!0&&!!b.attributes.uv&&(xA||Y),fog:!!T,useFog:D.fog===!0,fogExp2:T&&T.isFogExp2,flatShading:D.flatShading===!0,sizeAttenuation:D.sizeAttenuation===!0,logarithmicDepthBuffer:B,skinning:L.isSkinnedMesh===!0,morphTargets:b.morphAttributes.position!==void 0,morphNormals:b.morphAttributes.normal!==void 0,morphColors:b.morphAttributes.color!==void 0,morphTargetsCount:CA,morphTextureStride:q,numDirLights:S.directional.length,numPointLights:S.point.length,numSpotLights:S.spot.length,numSpotLightMaps:S.spotLightMap.length,numRectAreaLights:S.rectArea.length,numHemiLights:S.hemi.length,numDirLightShadows:S.directionalShadowMap.length,numPointLightShadows:S.pointShadowMap.length,numSpotLightShadows:S.spotShadowMap.length,numSpotLightShadowsWithMaps:S.numSpotLightShadowsWithMaps,numClippingPlanes:o.numPlanes,numClipIntersection:o.numIntersection,dithering:D.dithering,shadowMapEnabled:i.shadowMap.enabled&&F.length>0,shadowMapType:i.shadowMap.type,toneMapping:D.toneMapped?i.toneMapping:bi,useLegacyLights:i.useLegacyLights,premultipliedAlpha:D.premultipliedAlpha,doubleSided:D.side===ii,flipSided:D.side===ie,useDepthPacking:D.depthPacking>=0,depthPacking:D.depthPacking||0,index0AttributeName:D.index0AttributeName,extensionDerivatives:iA&&D.extensions.derivatives===!0,extensionFragDepth:iA&&D.extensions.fragDepth===!0,extensionDrawBuffers:iA&&D.extensions.drawBuffers===!0,extensionShaderTextureLOD:iA&&D.extensions.shaderTextureLOD===!0,rendererExtensionFragDepth:I||e.has("EXT_frag_depth"),rendererExtensionDrawBuffers:I||e.has("WEBGL_draw_buffers"),rendererExtensionShaderTextureLod:I||e.has("EXT_shader_texture_lod"),customProgramCacheKey:D.customProgramCacheKey()}}function E(D){const S=[];if(D.shaderID?S.push(D.shaderID):(S.push(D.customVertexShaderID),S.push(D.customFragmentShaderID)),D.defines!==void 0)for(const F in D.defines)S.push(F),S.push(D.defines[F]);return D.isRawShaderMaterial===!1&&(f(S,D),d(S,D),S.push(i.outputColorSpace)),S.push(D.customProgramCacheKey),S.join()}function f(D,S){D.push(S.precision),D.push(S.outputColorSpace),D.push(S.envMapMode),D.push(S.envMapCubeUVHeight),D.push(S.mapUv),D.push(S.alphaMapUv),D.push(S.lightMapUv),D.push(S.aoMapUv),D.push(S.bumpMapUv),D.push(S.normalMapUv),D.push(S.displacementMapUv),D.push(S.emissiveMapUv),D.push(S.metalnessMapUv),D.push(S.roughnessMapUv),D.push(S.anisotropyMapUv),D.push(S.clearcoatMapUv),D.push(S.clearcoatNormalMapUv),D.push(S.clearcoatRoughnessMapUv),D.push(S.iridescenceMapUv),D.push(S.iridescenceThicknessMapUv),D.push(S.sheenColorMapUv),D.push(S.sheenRoughnessMapUv),D.push(S.specularMapUv),D.push(S.specularColorMapUv),D.push(S.specularIntensityMapUv),D.push(S.transmissionMapUv),D.push(S.thicknessMapUv),D.push(S.combine),D.push(S.fogExp2),D.push(S.sizeAttenuation),D.push(S.morphTargetsCount),D.push(S.morphAttributeCount),D.push(S.numDirLights),D.push(S.numPointLights),D.push(S.numSpotLights),D.push(S.numSpotLightMaps),D.push(S.numHemiLights),D.push(S.numRectAreaLights),D.push(S.numDirLightShadows),D.push(S.numPointLightShadows),D.push(S.numSpotLightShadows),D.push(S.numSpotLightShadowsWithMaps),D.push(S.shadowMapType),D.push(S.toneMapping),D.push(S.numClippingPlanes),D.push(S.numClipIntersection),D.push(S.depthPacking)}function d(D,S){a.disableAll(),S.isWebGL2&&a.enable(0),S.supportsVertexTextures&&a.enable(1),S.instancing&&a.enable(2),S.instancingColor&&a.enable(3),S.matcap&&a.enable(4),S.envMap&&a.enable(5),S.normalMapObjectSpace&&a.enable(6),S.normalMapTangentSpace&&a.enable(7),S.clearcoat&&a.enable(8),S.iridescence&&a.enable(9),S.alphaTest&&a.enable(10),S.vertexColors&&a.enable(11),S.vertexAlphas&&a.enable(12),S.vertexUv1s&&a.enable(13),S.vertexUv2s&&a.enable(14),S.vertexUv3s&&a.enable(15),S.vertexTangents&&a.enable(16),S.anisotropy&&a.enable(17),D.push(a.mask),a.disableAll(),S.fog&&a.enable(0),S.useFog&&a.enable(1),S.flatShading&&a.enable(2),S.logarithmicDepthBuffer&&a.enable(3),S.skinning&&a.enable(4),S.morphTargets&&a.enable(5),S.morphNormals&&a.enable(6),S.morphColors&&a.enable(7),S.premultipliedAlpha&&a.enable(8),S.shadowMapEnabled&&a.enable(9),S.useLegacyLights&&a.enable(10),S.doubleSided&&a.enable(11),S.flipSided&&a.enable(12),S.useDepthPacking&&a.enable(13),S.dithering&&a.enable(14),S.transmission&&a.enable(15),S.sheen&&a.enable(16),S.opaque&&a.enable(17),S.pointsUvs&&a.enable(18),D.push(a.mask)}function u(D){const S=c[D.type];let F;if(S){const G=ei[S];F=su.clone(G.uniforms)}else F=D.uniforms;return F}function m(D,S){let F;for(let G=0,L=r.length;G<L;G++){const T=r[G];if(T.cacheKey===S){F=T,++F.usedTimes;break}}return F===void 0&&(F=new Em(i,S,D,s),r.push(F)),F}function y(D){if(--D.usedTimes===0){const S=r.indexOf(D);r[S]=r[r.length-1],r.pop(),D.destroy()}}function p(D){g.remove(D)}function R(){g.dispose()}return{getParameters:h,getProgramCacheKey:E,getUniforms:u,acquireProgram:m,releaseProgram:y,releaseShaderCache:p,programs:r,dispose:R}}function dm(){let i=new WeakMap;function A(s){let o=i.get(s);return o===void 0&&(o={},i.set(s,o)),o}function t(s){i.delete(s)}function e(s,o,a){i.get(s)[o]=a}function n(){i=new WeakMap}return{get:A,remove:t,update:e,dispose:n}}function um(i,A){return i.groupOrder!==A.groupOrder?i.groupOrder-A.groupOrder:i.renderOrder!==A.renderOrder?i.renderOrder-A.renderOrder:i.material.id!==A.material.id?i.material.id-A.material.id:i.z!==A.z?i.z-A.z:i.id-A.id}function aE(i,A){return i.groupOrder!==A.groupOrder?i.groupOrder-A.groupOrder:i.renderOrder!==A.renderOrder?i.renderOrder-A.renderOrder:i.z!==A.z?A.z-i.z:i.id-A.id}function rE(){const i=[];let A=0;const t=[],e=[],n=[];function s(){A=0,t.length=0,e.length=0,n.length=0}function o(B,C,Q,c,l,h){let E=i[A];return E===void 0?(E={id:B.id,object:B,geometry:C,material:Q,groupOrder:c,renderOrder:B.renderOrder,z:l,group:h},i[A]=E):(E.id=B.id,E.object=B,E.geometry=C,E.material=Q,E.groupOrder=c,E.renderOrder=B.renderOrder,E.z=l,E.group=h),A++,E}function a(B,C,Q,c,l,h){const E=o(B,C,Q,c,l,h);Q.transmission>0?e.push(E):Q.transparent===!0?n.push(E):t.push(E)}function g(B,C,Q,c,l,h){const E=o(B,C,Q,c,l,h);Q.transmission>0?e.unshift(E):Q.transparent===!0?n.unshift(E):t.unshift(E)}function r(B,C){t.length>1&&t.sort(B||um),e.length>1&&e.sort(C||aE),n.length>1&&n.sort(C||aE)}function I(){for(let B=A,C=i.length;B<C;B++){const Q=i[B];if(Q.id===null)break;Q.id=null,Q.object=null,Q.geometry=null,Q.material=null,Q.group=null}}return{opaque:t,transmissive:e,transparent:n,init:s,push:a,unshift:g,finish:I,sort:r}}function fm(){let i=new WeakMap;function A(e,n){const s=i.get(e);let o;return s===void 0?(o=new rE,i.set(e,[o])):n>=s.length?(o=new rE,s.push(o)):o=s[n],o}function t(){i=new WeakMap}return{get:A,dispose:t}}function pm(){const i={};return{get:function(A){if(i[A.id]!==void 0)return i[A.id];let t;switch(A.type){case"DirectionalLight":t={direction:new P,color:new HA};break;case"SpotLight":t={position:new P,direction:new P,color:new HA,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new P,color:new HA,distance:0,decay:0};break;case"HemisphereLight":t={direction:new P,skyColor:new HA,groundColor:new HA};break;case"RectAreaLight":t={color:new HA,position:new P,halfWidth:new P,halfHeight:new P};break}return i[A.id]=t,t}}}function mm(){const i={};return{get:function(A){if(i[A.id]!==void 0)return i[A.id];let t;switch(A.type){case"DirectionalLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new TA};break;case"SpotLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new TA};break;case"PointLight":t={shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new TA,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[A.id]=t,t}}}let ym=0;function Dm(i,A){return(A.castShadow?2:0)-(i.castShadow?2:0)+(A.map?1:0)-(i.map?1:0)}function Sm(i,A){const t=new pm,e=mm(),n={version:0,hash:{directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1},ambient:[0,0,0],probe:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0};for(let I=0;I<9;I++)n.probe.push(new P);const s=new P,o=new zA,a=new zA;function g(I,B){let C=0,Q=0,c=0;for(let F=0;F<9;F++)n.probe[F].set(0,0,0);let l=0,h=0,E=0,f=0,d=0,u=0,m=0,y=0,p=0,R=0;I.sort(Dm);const D=B===!0?Math.PI:1;for(let F=0,G=I.length;F<G;F++){const L=I[F],T=L.color,b=L.intensity,V=L.distance,K=L.shadow&&L.shadow.map?L.shadow.map.texture:null;if(L.isAmbientLight)C+=T.r*b*D,Q+=T.g*b*D,c+=T.b*b*D;else if(L.isLightProbe)for(let tA=0;tA<9;tA++)n.probe[tA].addScaledVector(L.sh.coefficients[tA],b);else if(L.isDirectionalLight){const tA=t.get(L);if(tA.color.copy(L.color).multiplyScalar(L.intensity*D),L.castShadow){const nA=L.shadow,Z=e.get(L);Z.shadowBias=nA.bias,Z.shadowNormalBias=nA.normalBias,Z.shadowRadius=nA.radius,Z.shadowMapSize=nA.mapSize,n.directionalShadow[l]=Z,n.directionalShadowMap[l]=K,n.directionalShadowMatrix[l]=L.shadow.matrix,u++}n.directional[l]=tA,l++}else if(L.isSpotLight){const tA=t.get(L);tA.position.setFromMatrixPosition(L.matrixWorld),tA.color.copy(T).multiplyScalar(b*D),tA.distance=V,tA.coneCos=Math.cos(L.angle),tA.penumbraCos=Math.cos(L.angle*(1-L.penumbra)),tA.decay=L.decay,n.spot[E]=tA;const nA=L.shadow;if(L.map&&(n.spotLightMap[p]=L.map,p++,nA.updateMatrices(L),L.castShadow&&R++),n.spotLightMatrix[E]=nA.matrix,L.castShadow){const Z=e.get(L);Z.shadowBias=nA.bias,Z.shadowNormalBias=nA.normalBias,Z.shadowRadius=nA.radius,Z.shadowMapSize=nA.mapSize,n.spotShadow[E]=Z,n.spotShadowMap[E]=K,y++}E++}else if(L.isRectAreaLight){const tA=t.get(L);tA.color.copy(T).multiplyScalar(b),tA.halfWidth.set(L.width*.5,0,0),tA.halfHeight.set(0,L.height*.5,0),n.rectArea[f]=tA,f++}else if(L.isPointLight){const tA=t.get(L);if(tA.color.copy(L.color).multiplyScalar(L.intensity*D),tA.distance=L.distance,tA.decay=L.decay,L.castShadow){const nA=L.shadow,Z=e.get(L);Z.shadowBias=nA.bias,Z.shadowNormalBias=nA.normalBias,Z.shadowRadius=nA.radius,Z.shadowMapSize=nA.mapSize,Z.shadowCameraNear=nA.camera.near,Z.shadowCameraFar=nA.camera.far,n.pointShadow[h]=Z,n.pointShadowMap[h]=K,n.pointShadowMatrix[h]=L.shadow.matrix,m++}n.point[h]=tA,h++}else if(L.isHemisphereLight){const tA=t.get(L);tA.skyColor.copy(L.color).multiplyScalar(b*D),tA.groundColor.copy(L.groundColor).multiplyScalar(b*D),n.hemi[d]=tA,d++}}f>0&&(A.isWebGL2||i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=uA.LTC_FLOAT_1,n.rectAreaLTC2=uA.LTC_FLOAT_2):i.has("OES_texture_half_float_linear")===!0?(n.rectAreaLTC1=uA.LTC_HALF_1,n.rectAreaLTC2=uA.LTC_HALF_2):console.error("THREE.WebGLRenderer: Unable to use RectAreaLight. Missing WebGL extensions.")),n.ambient[0]=C,n.ambient[1]=Q,n.ambient[2]=c;const S=n.hash;(S.directionalLength!==l||S.pointLength!==h||S.spotLength!==E||S.rectAreaLength!==f||S.hemiLength!==d||S.numDirectionalShadows!==u||S.numPointShadows!==m||S.numSpotShadows!==y||S.numSpotMaps!==p)&&(n.directional.length=l,n.spot.length=E,n.rectArea.length=f,n.point.length=h,n.hemi.length=d,n.directionalShadow.length=u,n.directionalShadowMap.length=u,n.pointShadow.length=m,n.pointShadowMap.length=m,n.spotShadow.length=y,n.spotShadowMap.length=y,n.directionalShadowMatrix.length=u,n.pointShadowMatrix.length=m,n.spotLightMatrix.length=y+p-R,n.spotLightMap.length=p,n.numSpotLightShadowsWithMaps=R,S.directionalLength=l,S.pointLength=h,S.spotLength=E,S.rectAreaLength=f,S.hemiLength=d,S.numDirectionalShadows=u,S.numPointShadows=m,S.numSpotShadows=y,S.numSpotMaps=p,n.version=ym++)}function r(I,B){let C=0,Q=0,c=0,l=0,h=0;const E=B.matrixWorldInverse;for(let f=0,d=I.length;f<d;f++){const u=I[f];if(u.isDirectionalLight){const m=n.directional[C];m.direction.setFromMatrixPosition(u.matrixWorld),s.setFromMatrixPosition(u.target.matrixWorld),m.direction.sub(s),m.direction.transformDirection(E),C++}else if(u.isSpotLight){const m=n.spot[c];m.position.setFromMatrixPosition(u.matrixWorld),m.position.applyMatrix4(E),m.direction.setFromMatrixPosition(u.matrixWorld),s.setFromMatrixPosition(u.target.matrixWorld),m.direction.sub(s),m.direction.transformDirection(E),c++}else if(u.isRectAreaLight){const m=n.rectArea[l];m.position.setFromMatrixPosition(u.matrixWorld),m.position.applyMatrix4(E),a.identity(),o.copy(u.matrixWorld),o.premultiply(E),a.extractRotation(o),m.halfWidth.set(u.width*.5,0,0),m.halfHeight.set(0,u.height*.5,0),m.halfWidth.applyMatrix4(a),m.halfHeight.applyMatrix4(a),l++}else if(u.isPointLight){const m=n.point[Q];m.position.setFromMatrixPosition(u.matrixWorld),m.position.applyMatrix4(E),Q++}else if(u.isHemisphereLight){const m=n.hemi[h];m.direction.setFromMatrixPosition(u.matrixWorld),m.direction.transformDirection(E),h++}}}return{setup:g,setupView:r,state:n}}function gE(i,A){const t=new Sm(i,A),e=[],n=[];function s(){e.length=0,n.length=0}function o(B){e.push(B)}function a(B){n.push(B)}function g(B){t.setup(e,B)}function r(B){t.setupView(e,B)}return{init:s,state:{lightsArray:e,shadowsArray:n,lights:t},setupLights:g,setupLightsView:r,pushLight:o,pushShadow:a}}function wm(i,A){let t=new WeakMap;function e(s,o=0){const a=t.get(s);let g;return a===void 0?(g=new gE(i,A),t.set(s,[g])):o>=a.length?(g=new gE(i,A),a.push(g)):g=a[o],g}function n(){t=new WeakMap}return{get:e,dispose:n}}class Mm extends We{constructor(A){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Id,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(A)}copy(A){return super.copy(A),this.depthPacking=A.depthPacking,this.map=A.map,this.alphaMap=A.alphaMap,this.displacementMap=A.displacementMap,this.displacementScale=A.displacementScale,this.displacementBias=A.displacementBias,this.wireframe=A.wireframe,this.wireframeLinewidth=A.wireframeLinewidth,this}}class Rm extends We{constructor(A){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(A)}copy(A){return super.copy(A),this.map=A.map,this.alphaMap=A.alphaMap,this.displacementMap=A.displacementMap,this.displacementScale=A.displacementScale,this.displacementBias=A.displacementBias,this}}const Fm=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,xm=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
#include <packing>
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = unpackRGBATo2Half( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ) );
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = unpackRGBAToDepth( texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ) );
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( squared_mean - mean * mean );
	gl_FragColor = pack2HalfToRGBA( vec2( mean, std_dev ) );
}`;function Nm(i,A,t){let e=new uB;const n=new TA,s=new TA,o=new It,a=new Mm({depthPacking:Bd}),g=new Rm,r={},I=t.maxTextureSize,B={[vi]:ie,[ie]:vi,[ii]:ii},C=new qn({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new TA},radius:{value:4}},vertexShader:Fm,fragmentShader:xm}),Q=C.clone();Q.defines.HORIZONTAL_PASS=1;const c=new Ze;c.setAttribute("position",new Zt(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const l=new dt(c,C),h=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=wQ;let E=this.type;this.render=function(m,y,p){if(h.enabled===!1||h.autoUpdate===!1&&h.needsUpdate===!1||m.length===0)return;const R=i.getRenderTarget(),D=i.getActiveCubeFace(),S=i.getActiveMipmapLevel(),F=i.state;F.setBlending(on),F.buffers.color.setClear(1,1,1,1),F.buffers.depth.setTest(!0),F.setScissorTest(!1);const G=E!==Mi&&this.type===Mi,L=E===Mi&&this.type!==Mi;for(let T=0,b=m.length;T<b;T++){const V=m[T],K=V.shadow;if(K===void 0){console.warn("THREE.WebGLShadowMap:",V,"has no shadow.");continue}if(K.autoUpdate===!1&&K.needsUpdate===!1)continue;n.copy(K.mapSize);const tA=K.getFrameExtents();if(n.multiply(tA),s.copy(K.mapSize),(n.x>I||n.y>I)&&(n.x>I&&(s.x=Math.floor(I/tA.x),n.x=s.x*tA.x,K.mapSize.x=s.x),n.y>I&&(s.y=Math.floor(I/tA.y),n.y=s.y*tA.y,K.mapSize.y=s.y)),K.map===null||G===!0||L===!0){const Z=this.type!==Mi?{minFilter:Ut,magFilter:Ut}:{};K.map!==null&&K.map.dispose(),K.map=new Hn(n.x,n.y,Z),K.map.texture.name=V.name+".shadowMap",K.camera.updateProjectionMatrix()}i.setRenderTarget(K.map),i.clear();const nA=K.getViewportCount();for(let Z=0;Z<nA;Z++){const CA=K.getViewport(Z);o.set(s.x*CA.x,s.y*CA.y,s.x*CA.z,s.y*CA.w),F.viewport(o),K.updateMatrices(V,Z),e=K.getFrustum(),u(y,p,K.camera,V,this.type)}K.isPointLightShadow!==!0&&this.type===Mi&&f(K,p),K.needsUpdate=!1}E=this.type,h.needsUpdate=!1,i.setRenderTarget(R,D,S)};function f(m,y){const p=A.update(l);C.defines.VSM_SAMPLES!==m.blurSamples&&(C.defines.VSM_SAMPLES=m.blurSamples,Q.defines.VSM_SAMPLES=m.blurSamples,C.needsUpdate=!0,Q.needsUpdate=!0),m.mapPass===null&&(m.mapPass=new Hn(n.x,n.y)),C.uniforms.shadow_pass.value=m.map.texture,C.uniforms.resolution.value=m.mapSize,C.uniforms.radius.value=m.radius,i.setRenderTarget(m.mapPass),i.clear(),i.renderBufferDirect(y,null,p,C,l,null),Q.uniforms.shadow_pass.value=m.mapPass.texture,Q.uniforms.resolution.value=m.mapSize,Q.uniforms.radius.value=m.radius,i.setRenderTarget(m.map),i.clear(),i.renderBufferDirect(y,null,p,Q,l,null)}function d(m,y,p,R){let D=null;const S=p.isPointLight===!0?m.customDistanceMaterial:m.customDepthMaterial;if(S!==void 0)D=S;else if(D=p.isPointLight===!0?g:a,i.localClippingEnabled&&y.clipShadows===!0&&Array.isArray(y.clippingPlanes)&&y.clippingPlanes.length!==0||y.displacementMap&&y.displacementScale!==0||y.alphaMap&&y.alphaTest>0||y.map&&y.alphaTest>0){const F=D.uuid,G=y.uuid;let L=r[F];L===void 0&&(L={},r[F]=L);let T=L[G];T===void 0&&(T=D.clone(),L[G]=T),D=T}if(D.visible=y.visible,D.wireframe=y.wireframe,R===Mi?D.side=y.shadowSide!==null?y.shadowSide:y.side:D.side=y.shadowSide!==null?y.shadowSide:B[y.side],D.alphaMap=y.alphaMap,D.alphaTest=y.alphaTest,D.map=y.map,D.clipShadows=y.clipShadows,D.clippingPlanes=y.clippingPlanes,D.clipIntersection=y.clipIntersection,D.displacementMap=y.displacementMap,D.displacementScale=y.displacementScale,D.displacementBias=y.displacementBias,D.wireframeLinewidth=y.wireframeLinewidth,D.linewidth=y.linewidth,p.isPointLight===!0&&D.isMeshDistanceMaterial===!0){const F=i.properties.get(D);F.light=p}return D}function u(m,y,p,R,D){if(m.visible===!1)return;if(m.layers.test(y.layers)&&(m.isMesh||m.isLine||m.isPoints)&&(m.castShadow||m.receiveShadow&&D===Mi)&&(!m.frustumCulled||e.intersectsObject(m))){m.modelViewMatrix.multiplyMatrices(p.matrixWorldInverse,m.matrixWorld);const G=A.update(m),L=m.material;if(Array.isArray(L)){const T=G.groups;for(let b=0,V=T.length;b<V;b++){const K=T[b],tA=L[K.materialIndex];if(tA&&tA.visible){const nA=d(m,tA,R,D);i.renderBufferDirect(p,null,G,nA,m,K)}}}else if(L.visible){const T=d(m,L,R,D);i.renderBufferDirect(p,null,G,T,m,null)}}const F=m.children;for(let G=0,L=F.length;G<L;G++)u(F[G],y,p,R,D)}}function _m(i,A,t){const e=t.isWebGL2;function n(){let Y=!1;const fA=new It;let iA=null;const hA=new It(0,0,0,0);return{setMask:function(mA){iA!==mA&&!Y&&(i.colorMask(mA,mA,mA,mA),iA=mA)},setLocked:function(mA){Y=mA},setClear:function(mA,At,Bt,ct,Ne){Ne===!0&&(mA*=ct,At*=ct,Bt*=ct),fA.set(mA,At,Bt,ct),hA.equals(fA)===!1&&(i.clearColor(mA,At,Bt,ct),hA.copy(fA))},reset:function(){Y=!1,iA=null,hA.set(-1,0,0,0)}}}function s(){let Y=!1,fA=null,iA=null,hA=null;return{setTest:function(mA){mA?wA(i.DEPTH_TEST):NA(i.DEPTH_TEST)},setMask:function(mA){fA!==mA&&!Y&&(i.depthMask(mA),fA=mA)},setFunc:function(mA){if(iA!==mA){switch(mA){case Tl:i.depthFunc(i.NEVER);break;case Hl:i.depthFunc(i.ALWAYS);break;case ql:i.depthFunc(i.LESS);break;case bI:i.depthFunc(i.LEQUAL);break;case Jl:i.depthFunc(i.EQUAL);break;case Kl:i.depthFunc(i.GEQUAL);break;case Yl:i.depthFunc(i.GREATER);break;case Pl:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}iA=mA}},setLocked:function(mA){Y=mA},setClear:function(mA){hA!==mA&&(i.clearDepth(mA),hA=mA)},reset:function(){Y=!1,fA=null,iA=null,hA=null}}}function o(){let Y=!1,fA=null,iA=null,hA=null,mA=null,At=null,Bt=null,ct=null,Ne=null;return{setTest:function(Et){Y||(Et?wA(i.STENCIL_TEST):NA(i.STENCIL_TEST))},setMask:function(Et){fA!==Et&&!Y&&(i.stencilMask(Et),fA=Et)},setFunc:function(Et,se,ft){(iA!==Et||hA!==se||mA!==ft)&&(i.stencilFunc(Et,se,ft),iA=Et,hA=se,mA=ft)},setOp:function(Et,se,ft){(At!==Et||Bt!==se||ct!==ft)&&(i.stencilOp(Et,se,ft),At=Et,Bt=se,ct=ft)},setLocked:function(Et){Y=Et},setClear:function(Et){Ne!==Et&&(i.clearStencil(Et),Ne=Et)},reset:function(){Y=!1,fA=null,iA=null,hA=null,mA=null,At=null,Bt=null,ct=null,Ne=null}}}const a=new n,g=new s,r=new o,I=new WeakMap,B=new WeakMap;let C={},Q={},c=new WeakMap,l=[],h=null,E=!1,f=null,d=null,u=null,m=null,y=null,p=null,R=null,D=!1,S=null,F=null,G=null,L=null,T=null;const b=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let V=!1,K=0;const tA=i.getParameter(i.VERSION);tA.indexOf("WebGL")!==-1?(K=parseFloat(/^WebGL (\d)/.exec(tA)[1]),V=K>=1):tA.indexOf("OpenGL ES")!==-1&&(K=parseFloat(/^OpenGL ES (\d)/.exec(tA)[1]),V=K>=2);let nA=null,Z={};const CA=i.getParameter(i.SCISSOR_BOX),q=i.getParameter(i.VIEWPORT),eA=new It().fromArray(CA),oA=new It().fromArray(q);function aA(Y,fA,iA,hA){const mA=new Uint8Array(4),At=i.createTexture();i.bindTexture(Y,At),i.texParameteri(Y,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(Y,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Bt=0;Bt<iA;Bt++)e&&(Y===i.TEXTURE_3D||Y===i.TEXTURE_2D_ARRAY)?i.texImage3D(fA,0,i.RGBA,1,1,hA,0,i.RGBA,i.UNSIGNED_BYTE,mA):i.texImage2D(fA+Bt,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,mA);return At}const QA={};QA[i.TEXTURE_2D]=aA(i.TEXTURE_2D,i.TEXTURE_2D,1),QA[i.TEXTURE_CUBE_MAP]=aA(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),e&&(QA[i.TEXTURE_2D_ARRAY]=aA(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),QA[i.TEXTURE_3D]=aA(i.TEXTURE_3D,i.TEXTURE_3D,1,1)),a.setClear(0,0,0,1),g.setClear(1),r.setClear(0),wA(i.DEPTH_TEST),g.setFunc(bI),SA(!1),qA(WB),wA(i.CULL_FACE),MA(on);function wA(Y){C[Y]!==!0&&(i.enable(Y),C[Y]=!0)}function NA(Y){C[Y]!==!1&&(i.disable(Y),C[Y]=!1)}function xA(Y,fA){return Q[Y]!==fA?(i.bindFramebuffer(Y,fA),Q[Y]=fA,e&&(Y===i.DRAW_FRAMEBUFFER&&(Q[i.FRAMEBUFFER]=fA),Y===i.FRAMEBUFFER&&(Q[i.DRAW_FRAMEBUFFER]=fA)),!0):!1}function it(Y,fA){let iA=l,hA=!1;if(Y)if(iA=c.get(fA),iA===void 0&&(iA=[],c.set(fA,iA)),Y.isWebGLMultipleRenderTargets){const mA=Y.texture;if(iA.length!==mA.length||iA[0]!==i.COLOR_ATTACHMENT0){for(let At=0,Bt=mA.length;At<Bt;At++)iA[At]=i.COLOR_ATTACHMENT0+At;iA.length=mA.length,hA=!0}}else iA[0]!==i.COLOR_ATTACHMENT0&&(iA[0]=i.COLOR_ATTACHMENT0,hA=!0);else iA[0]!==i.BACK&&(iA[0]=i.BACK,hA=!0);hA&&(t.isWebGL2?i.drawBuffers(iA):A.get("WEBGL_draw_buffers").drawBuffersWEBGL(iA))}function _A(Y){return h!==Y?(i.useProgram(Y),h=Y,!0):!1}const $={[vs]:i.FUNC_ADD,[Rl]:i.FUNC_SUBTRACT,[Fl]:i.FUNC_REVERSE_SUBTRACT};if(e)$[ZB]=i.MIN,$[jB]=i.MAX;else{const Y=A.get("EXT_blend_minmax");Y!==null&&($[ZB]=Y.MIN_EXT,$[jB]=Y.MAX_EXT)}const JA={[xl]:i.ZERO,[Nl]:i.ONE,[_l]:i.SRC_COLOR,[MQ]:i.SRC_ALPHA,[kl]:i.SRC_ALPHA_SATURATE,[bl]:i.DST_COLOR,[Ll]:i.DST_ALPHA,[Gl]:i.ONE_MINUS_SRC_COLOR,[RQ]:i.ONE_MINUS_SRC_ALPHA,[vl]:i.ONE_MINUS_DST_COLOR,[Ul]:i.ONE_MINUS_DST_ALPHA};function MA(Y,fA,iA,hA,mA,At,Bt,ct){if(Y===on){E===!0&&(NA(i.BLEND),E=!1);return}if(E===!1&&(wA(i.BLEND),E=!0),Y!==Ml){if(Y!==f||ct!==D){if((d!==vs||y!==vs)&&(i.blendEquation(i.FUNC_ADD),d=vs,y=vs),ct)switch(Y){case Js:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case VB:i.blendFunc(i.ONE,i.ONE);break;case zB:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case XB:i.blendFuncSeparate(i.ZERO,i.SRC_COLOR,i.ZERO,i.SRC_ALPHA);break;default:console.error("THREE.WebGLState: Invalid blending: ",Y);break}else switch(Y){case Js:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case VB:i.blendFunc(i.SRC_ALPHA,i.ONE);break;case zB:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case XB:i.blendFunc(i.ZERO,i.SRC_COLOR);break;default:console.error("THREE.WebGLState: Invalid blending: ",Y);break}u=null,m=null,p=null,R=null,f=Y,D=ct}return}mA=mA||fA,At=At||iA,Bt=Bt||hA,(fA!==d||mA!==y)&&(i.blendEquationSeparate($[fA],$[mA]),d=fA,y=mA),(iA!==u||hA!==m||At!==p||Bt!==R)&&(i.blendFuncSeparate(JA[iA],JA[hA],JA[At],JA[Bt]),u=iA,m=hA,p=At,R=Bt),f=Y,D=!1}function FA(Y,fA){Y.side===ii?NA(i.CULL_FACE):wA(i.CULL_FACE);let iA=Y.side===ie;fA&&(iA=!iA),SA(iA),Y.blending===Js&&Y.transparent===!1?MA(on):MA(Y.blending,Y.blendEquation,Y.blendSrc,Y.blendDst,Y.blendEquationAlpha,Y.blendSrcAlpha,Y.blendDstAlpha,Y.premultipliedAlpha),g.setFunc(Y.depthFunc),g.setTest(Y.depthTest),g.setMask(Y.depthWrite),a.setMask(Y.colorWrite);const hA=Y.stencilWrite;r.setTest(hA),hA&&(r.setMask(Y.stencilWriteMask),r.setFunc(Y.stencilFunc,Y.stencilRef,Y.stencilFuncMask),r.setOp(Y.stencilFail,Y.stencilZFail,Y.stencilZPass)),LA(Y.polygonOffset,Y.polygonOffsetFactor,Y.polygonOffsetUnits),Y.alphaToCoverage===!0?wA(i.SAMPLE_ALPHA_TO_COVERAGE):NA(i.SAMPLE_ALPHA_TO_COVERAGE)}function SA(Y){S!==Y&&(Y?i.frontFace(i.CW):i.frontFace(i.CCW),S=Y)}function qA(Y){Y!==Dl?(wA(i.CULL_FACE),Y!==F&&(Y===WB?i.cullFace(i.BACK):Y===Sl?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):NA(i.CULL_FACE),F=Y}function bA(Y){Y!==G&&(V&&i.lineWidth(Y),G=Y)}function LA(Y,fA,iA){Y?(wA(i.POLYGON_OFFSET_FILL),(L!==fA||T!==iA)&&(i.polygonOffset(fA,iA),L=fA,T=iA)):NA(i.POLYGON_OFFSET_FILL)}function PA(Y){Y?wA(i.SCISSOR_TEST):NA(i.SCISSOR_TEST)}function YA(Y){Y===void 0&&(Y=i.TEXTURE0+b-1),nA!==Y&&(i.activeTexture(Y),nA=Y)}function $A(Y,fA,iA){iA===void 0&&(nA===null?iA=i.TEXTURE0+b-1:iA=nA);let hA=Z[iA];hA===void 0&&(hA={type:void 0,texture:void 0},Z[iA]=hA),(hA.type!==Y||hA.texture!==fA)&&(nA!==iA&&(i.activeTexture(iA),nA=iA),i.bindTexture(Y,fA||QA[Y]),hA.type=Y,hA.texture=fA)}function N(){const Y=Z[nA];Y!==void 0&&Y.type!==void 0&&(i.bindTexture(Y.type,null),Y.type=void 0,Y.texture=void 0)}function M(){try{i.compressedTexImage2D.apply(i,arguments)}catch(Y){console.error("THREE.WebGLState:",Y)}}function k(){try{i.compressedTexImage3D.apply(i,arguments)}catch(Y){console.error("THREE.WebGLState:",Y)}}function X(){try{i.texSubImage2D.apply(i,arguments)}catch(Y){console.error("THREE.WebGLState:",Y)}}function j(){try{i.texSubImage3D.apply(i,arguments)}catch(Y){console.error("THREE.WebGLState:",Y)}}function x(){try{i.compressedTexSubImage2D.apply(i,arguments)}catch(Y){console.error("THREE.WebGLState:",Y)}}function AA(){try{i.compressedTexSubImage3D.apply(i,arguments)}catch(Y){console.error("THREE.WebGLState:",Y)}}function sA(){try{i.texStorage2D.apply(i,arguments)}catch(Y){console.error("THREE.WebGLState:",Y)}}function z(){try{i.texStorage3D.apply(i,arguments)}catch(Y){console.error("THREE.WebGLState:",Y)}}function IA(){try{i.texImage2D.apply(i,arguments)}catch(Y){console.error("THREE.WebGLState:",Y)}}function lA(){try{i.texImage3D.apply(i,arguments)}catch(Y){console.error("THREE.WebGLState:",Y)}}function EA(Y){eA.equals(Y)===!1&&(i.scissor(Y.x,Y.y,Y.z,Y.w),eA.copy(Y))}function DA(Y){oA.equals(Y)===!1&&(i.viewport(Y.x,Y.y,Y.z,Y.w),oA.copy(Y))}function RA(Y,fA){let iA=B.get(fA);iA===void 0&&(iA=new WeakMap,B.set(fA,iA));let hA=iA.get(Y);hA===void 0&&(hA=i.getUniformBlockIndex(fA,Y.name),iA.set(Y,hA))}function UA(Y,fA){const hA=B.get(fA).get(Y);I.get(fA)!==hA&&(i.uniformBlockBinding(fA,hA,Y.__bindingPointIndex),I.set(fA,hA))}function WA(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),e===!0&&(i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null)),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),C={},nA=null,Z={},Q={},c=new WeakMap,l=[],h=null,E=!1,f=null,d=null,u=null,m=null,y=null,p=null,R=null,D=!1,S=null,F=null,G=null,L=null,T=null,eA.set(0,0,i.canvas.width,i.canvas.height),oA.set(0,0,i.canvas.width,i.canvas.height),a.reset(),g.reset(),r.reset()}return{buffers:{color:a,depth:g,stencil:r},enable:wA,disable:NA,bindFramebuffer:xA,drawBuffers:it,useProgram:_A,setBlending:MA,setMaterial:FA,setFlipSided:SA,setCullFace:qA,setLineWidth:bA,setPolygonOffset:LA,setScissorTest:PA,activeTexture:YA,bindTexture:$A,unbindTexture:N,compressedTexImage2D:M,compressedTexImage3D:k,texImage2D:IA,texImage3D:lA,updateUBOMapping:RA,uniformBlockBinding:UA,texStorage2D:sA,texStorage3D:z,texSubImage2D:X,texSubImage3D:j,compressedTexSubImage2D:x,compressedTexSubImage3D:AA,scissor:EA,viewport:DA,reset:WA}}function Gm(i,A,t,e,n,s,o){const a=n.isWebGL2,g=n.maxTextures,r=n.maxCubemapSize,I=n.maxTextureSize,B=n.maxSamples,C=A.has("WEBGL_multisampled_render_to_texture")?A.get("WEBGL_multisampled_render_to_texture"):null,Q=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),c=new WeakMap;let l;const h=new WeakMap;let E=!1;try{E=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function f(N,M){return E?new OffscreenCanvas(N,M):Vo("canvas")}function d(N,M,k,X){let j=1;if((N.width>X||N.height>X)&&(j=X/Math.max(N.width,N.height)),j<1||M===!0)if(typeof HTMLImageElement<"u"&&N instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&N instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&N instanceof ImageBitmap){const x=M?br:Math.floor,AA=x(j*N.width),sA=x(j*N.height);l===void 0&&(l=f(AA,sA));const z=k?f(AA,sA):l;return z.width=AA,z.height=sA,z.getContext("2d").drawImage(N,0,0,AA,sA),console.warn("THREE.WebGLRenderer: Texture has been resized from ("+N.width+"x"+N.height+") to ("+AA+"x"+sA+")."),z}else return"data"in N&&console.warn("THREE.WebGLRenderer: Image in DataTexture is too big ("+N.width+"x"+N.height+")."),N;return N}function u(N){return qI(N.width)&&qI(N.height)}function m(N){return a?!1:N.wrapS!==Yt||N.wrapT!==Yt||N.minFilter!==Ut&&N.minFilter!==Dt}function y(N,M){return N.generateMipmaps&&M&&N.minFilter!==Ut&&N.minFilter!==Dt}function p(N){i.generateMipmap(N)}function R(N,M,k,X,j=!1){if(a===!1)return M;if(N!==null){if(i[N]!==void 0)return i[N];console.warn("THREE.WebGLRenderer: Attempt to use non-existing WebGL internal format '"+N+"'")}let x=M;return M===i.RED&&(k===i.FLOAT&&(x=i.R32F),k===i.HALF_FLOAT&&(x=i.R16F),k===i.UNSIGNED_BYTE&&(x=i.R8)),M===i.RG&&(k===i.FLOAT&&(x=i.RG32F),k===i.HALF_FLOAT&&(x=i.RG16F),k===i.UNSIGNED_BYTE&&(x=i.RG8)),M===i.RGBA&&(k===i.FLOAT&&(x=i.RGBA32F),k===i.HALF_FLOAT&&(x=i.RGBA16F),k===i.UNSIGNED_BYTE&&(x=X===kA&&j===!1?i.SRGB8_ALPHA8:i.RGBA8),k===i.UNSIGNED_SHORT_4_4_4_4&&(x=i.RGBA4),k===i.UNSIGNED_SHORT_5_5_5_1&&(x=i.RGB5_A1)),(x===i.R16F||x===i.R32F||x===i.RG16F||x===i.RG32F||x===i.RGBA16F||x===i.RGBA32F)&&A.get("EXT_color_buffer_float"),x}function D(N,M,k){return y(N,k)===!0||N.isFramebufferTexture&&N.minFilter!==Ut&&N.minFilter!==Dt?Math.log2(Math.max(M.width,M.height))+1:N.mipmaps!==void 0&&N.mipmaps.length>0?N.mipmaps.length:N.isCompressedTexture&&Array.isArray(N.image)?M.mipmaps.length:1}function S(N){return N===Ut||N===vI||N===pr?i.NEAREST:i.LINEAR}function F(N){const M=N.target;M.removeEventListener("dispose",F),L(M),M.isVideoTexture&&c.delete(M)}function G(N){const M=N.target;M.removeEventListener("dispose",G),b(M)}function L(N){const M=e.get(N);if(M.__webglInit===void 0)return;const k=N.source,X=h.get(k);if(X){const j=X[M.__cacheKey];j.usedTimes--,j.usedTimes===0&&T(N),Object.keys(X).length===0&&h.delete(k)}e.remove(N)}function T(N){const M=e.get(N);i.deleteTexture(M.__webglTexture);const k=N.source,X=h.get(k);delete X[M.__cacheKey],o.memory.textures--}function b(N){const M=N.texture,k=e.get(N),X=e.get(M);if(X.__webglTexture!==void 0&&(i.deleteTexture(X.__webglTexture),o.memory.textures--),N.depthTexture&&N.depthTexture.dispose(),N.isWebGLCubeRenderTarget)for(let j=0;j<6;j++)i.deleteFramebuffer(k.__webglFramebuffer[j]),k.__webglDepthbuffer&&i.deleteRenderbuffer(k.__webglDepthbuffer[j]);else{if(i.deleteFramebuffer(k.__webglFramebuffer),k.__webglDepthbuffer&&i.deleteRenderbuffer(k.__webglDepthbuffer),k.__webglMultisampledFramebuffer&&i.deleteFramebuffer(k.__webglMultisampledFramebuffer),k.__webglColorRenderbuffer)for(let j=0;j<k.__webglColorRenderbuffer.length;j++)k.__webglColorRenderbuffer[j]&&i.deleteRenderbuffer(k.__webglColorRenderbuffer[j]);k.__webglDepthRenderbuffer&&i.deleteRenderbuffer(k.__webglDepthRenderbuffer)}if(N.isWebGLMultipleRenderTargets)for(let j=0,x=M.length;j<x;j++){const AA=e.get(M[j]);AA.__webglTexture&&(i.deleteTexture(AA.__webglTexture),o.memory.textures--),e.remove(M[j])}e.remove(M),e.remove(N)}let V=0;function K(){V=0}function tA(){const N=V;return N>=g&&console.warn("THREE.WebGLTextures: Trying to use "+N+" texture units while this GPU supports only "+g),V+=1,N}function nA(N){const M=[];return M.push(N.wrapS),M.push(N.wrapT),M.push(N.wrapR||0),M.push(N.magFilter),M.push(N.minFilter),M.push(N.anisotropy),M.push(N.internalFormat),M.push(N.format),M.push(N.type),M.push(N.generateMipmaps),M.push(N.premultiplyAlpha),M.push(N.flipY),M.push(N.unpackAlignment),M.push(N.colorSpace),M.join()}function Z(N,M){const k=e.get(N);if(N.isVideoTexture&&YA(N),N.isRenderTargetTexture===!1&&N.version>0&&k.__version!==N.version){const X=N.image;if(X===null)console.warn("THREE.WebGLRenderer: Texture marked for update but no image data found.");else if(X.complete===!1)console.warn("THREE.WebGLRenderer: Texture marked for update but image is incomplete");else{xA(k,N,M);return}}t.bindTexture(i.TEXTURE_2D,k.__webglTexture,i.TEXTURE0+M)}function CA(N,M){const k=e.get(N);if(N.version>0&&k.__version!==N.version){xA(k,N,M);return}t.bindTexture(i.TEXTURE_2D_ARRAY,k.__webglTexture,i.TEXTURE0+M)}function q(N,M){const k=e.get(N);if(N.version>0&&k.__version!==N.version){xA(k,N,M);return}t.bindTexture(i.TEXTURE_3D,k.__webglTexture,i.TEXTURE0+M)}function eA(N,M){const k=e.get(N);if(N.version>0&&k.__version!==N.version){it(k,N,M);return}t.bindTexture(i.TEXTURE_CUBE_MAP,k.__webglTexture,i.TEXTURE0+M)}const oA={[Bn]:i.REPEAT,[Yt]:i.CLAMP_TO_EDGE,[Cn]:i.MIRRORED_REPEAT},aA={[Ut]:i.NEAREST,[vI]:i.NEAREST_MIPMAP_NEAREST,[pr]:i.NEAREST_MIPMAP_LINEAR,[Dt]:i.LINEAR,[xQ]:i.LINEAR_MIPMAP_NEAREST,[En]:i.LINEAR_MIPMAP_LINEAR},QA={[hd]:i.NEVER,[pd]:i.ALWAYS,[Qd]:i.LESS,[ld]:i.LEQUAL,[cd]:i.EQUAL,[fd]:i.GEQUAL,[dd]:i.GREATER,[ud]:i.NOTEQUAL};function wA(N,M,k){if(k?(i.texParameteri(N,i.TEXTURE_WRAP_S,oA[M.wrapS]),i.texParameteri(N,i.TEXTURE_WRAP_T,oA[M.wrapT]),(N===i.TEXTURE_3D||N===i.TEXTURE_2D_ARRAY)&&i.texParameteri(N,i.TEXTURE_WRAP_R,oA[M.wrapR]),i.texParameteri(N,i.TEXTURE_MAG_FILTER,aA[M.magFilter]),i.texParameteri(N,i.TEXTURE_MIN_FILTER,aA[M.minFilter])):(i.texParameteri(N,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(N,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE),(N===i.TEXTURE_3D||N===i.TEXTURE_2D_ARRAY)&&i.texParameteri(N,i.TEXTURE_WRAP_R,i.CLAMP_TO_EDGE),(M.wrapS!==Yt||M.wrapT!==Yt)&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.wrapS and Texture.wrapT should be set to THREE.ClampToEdgeWrapping."),i.texParameteri(N,i.TEXTURE_MAG_FILTER,S(M.magFilter)),i.texParameteri(N,i.TEXTURE_MIN_FILTER,S(M.minFilter)),M.minFilter!==Ut&&M.minFilter!==Dt&&console.warn("THREE.WebGLRenderer: Texture is not power of two. Texture.minFilter should be set to THREE.NearestFilter or THREE.LinearFilter.")),M.compareFunction&&(i.texParameteri(N,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(N,i.TEXTURE_COMPARE_FUNC,QA[M.compareFunction])),A.has("EXT_texture_filter_anisotropic")===!0){const X=A.get("EXT_texture_filter_anisotropic");if(M.magFilter===Ut||M.minFilter!==pr&&M.minFilter!==En||M.type===De&&A.has("OES_texture_float_linear")===!1||a===!1&&M.type===_i&&A.has("OES_texture_half_float_linear")===!1)return;(M.anisotropy>1||e.get(M).__currentAnisotropy)&&(i.texParameterf(N,X.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(M.anisotropy,n.getMaxAnisotropy())),e.get(M).__currentAnisotropy=M.anisotropy)}}function NA(N,M){let k=!1;N.__webglInit===void 0&&(N.__webglInit=!0,M.addEventListener("dispose",F));const X=M.source;let j=h.get(X);j===void 0&&(j={},h.set(X,j));const x=nA(M);if(x!==N.__cacheKey){j[x]===void 0&&(j[x]={texture:i.createTexture(),usedTimes:0},o.memory.textures++,k=!0),j[x].usedTimes++;const AA=j[N.__cacheKey];AA!==void 0&&(j[N.__cacheKey].usedTimes--,AA.usedTimes===0&&T(M)),N.__cacheKey=x,N.__webglTexture=j[x].texture}return k}function xA(N,M,k){let X=i.TEXTURE_2D;(M.isDataArrayTexture||M.isCompressedArrayTexture)&&(X=i.TEXTURE_2D_ARRAY),M.isData3DTexture&&(X=i.TEXTURE_3D);const j=NA(N,M),x=M.source;t.bindTexture(X,N.__webglTexture,i.TEXTURE0+k);const AA=e.get(x);if(x.version!==AA.__version||j===!0){t.activeTexture(i.TEXTURE0+k),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,M.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,M.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.NONE);const sA=m(M)&&u(M.image)===!1;let z=d(M.image,sA,!1,I);z=$A(M,z);const IA=u(z)||a,lA=s.convert(M.format,M.colorSpace);let EA=s.convert(M.type),DA=R(M.internalFormat,lA,EA,M.colorSpace);wA(X,M,IA);let RA;const UA=M.mipmaps,WA=a&&M.isVideoTexture!==!0,Y=AA.__version===void 0||j===!0,fA=D(M,z,IA);if(M.isDepthTexture)DA=i.DEPTH_COMPONENT,a?M.type===De?DA=i.DEPTH_COMPONENT32F:M.type===en?DA=i.DEPTH_COMPONENT24:M.type===Gn?DA=i.DEPTH24_STENCIL8:DA=i.DEPTH_COMPONENT16:M.type===De&&console.error("WebGLRenderer: Floating point depth texture requires WebGL2."),M.format===Ln&&DA===i.DEPTH_COMPONENT&&M.type!==cB&&M.type!==en&&(console.warn("THREE.WebGLRenderer: Use UnsignedShortType or UnsignedIntType for DepthFormat DepthTexture."),M.type=en,EA=s.convert(M.type)),M.format===Xs&&DA===i.DEPTH_COMPONENT&&(DA=i.DEPTH_STENCIL,M.type!==Gn&&(console.warn("THREE.WebGLRenderer: Use UnsignedInt248Type for DepthStencilFormat DepthTexture."),M.type=Gn,EA=s.convert(M.type))),Y&&(WA?t.texStorage2D(i.TEXTURE_2D,1,DA,z.width,z.height):t.texImage2D(i.TEXTURE_2D,0,DA,z.width,z.height,0,lA,EA,null));else if(M.isDataTexture)if(UA.length>0&&IA){WA&&Y&&t.texStorage2D(i.TEXTURE_2D,fA,DA,UA[0].width,UA[0].height);for(let iA=0,hA=UA.length;iA<hA;iA++)RA=UA[iA],WA?t.texSubImage2D(i.TEXTURE_2D,iA,0,0,RA.width,RA.height,lA,EA,RA.data):t.texImage2D(i.TEXTURE_2D,iA,DA,RA.width,RA.height,0,lA,EA,RA.data);M.generateMipmaps=!1}else WA?(Y&&t.texStorage2D(i.TEXTURE_2D,fA,DA,z.width,z.height),t.texSubImage2D(i.TEXTURE_2D,0,0,0,z.width,z.height,lA,EA,z.data)):t.texImage2D(i.TEXTURE_2D,0,DA,z.width,z.height,0,lA,EA,z.data);else if(M.isCompressedTexture)if(M.isCompressedArrayTexture){WA&&Y&&t.texStorage3D(i.TEXTURE_2D_ARRAY,fA,DA,UA[0].width,UA[0].height,z.depth);for(let iA=0,hA=UA.length;iA<hA;iA++)RA=UA[iA],M.format!==me?lA!==null?WA?t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,iA,0,0,0,RA.width,RA.height,z.depth,lA,RA.data,0,0):t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,iA,DA,RA.width,RA.height,z.depth,0,RA.data,0,0):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):WA?t.texSubImage3D(i.TEXTURE_2D_ARRAY,iA,0,0,0,RA.width,RA.height,z.depth,lA,EA,RA.data):t.texImage3D(i.TEXTURE_2D_ARRAY,iA,DA,RA.width,RA.height,z.depth,0,lA,EA,RA.data)}else{WA&&Y&&t.texStorage2D(i.TEXTURE_2D,fA,DA,UA[0].width,UA[0].height);for(let iA=0,hA=UA.length;iA<hA;iA++)RA=UA[iA],M.format!==me?lA!==null?WA?t.compressedTexSubImage2D(i.TEXTURE_2D,iA,0,0,RA.width,RA.height,lA,RA.data):t.compressedTexImage2D(i.TEXTURE_2D,iA,DA,RA.width,RA.height,0,RA.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):WA?t.texSubImage2D(i.TEXTURE_2D,iA,0,0,RA.width,RA.height,lA,EA,RA.data):t.texImage2D(i.TEXTURE_2D,iA,DA,RA.width,RA.height,0,lA,EA,RA.data)}else if(M.isDataArrayTexture)WA?(Y&&t.texStorage3D(i.TEXTURE_2D_ARRAY,fA,DA,z.width,z.height,z.depth),t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,z.width,z.height,z.depth,lA,EA,z.data)):t.texImage3D(i.TEXTURE_2D_ARRAY,0,DA,z.width,z.height,z.depth,0,lA,EA,z.data);else if(M.isData3DTexture)WA?(Y&&t.texStorage3D(i.TEXTURE_3D,fA,DA,z.width,z.height,z.depth),t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,z.width,z.height,z.depth,lA,EA,z.data)):t.texImage3D(i.TEXTURE_3D,0,DA,z.width,z.height,z.depth,0,lA,EA,z.data);else if(M.isFramebufferTexture){if(Y)if(WA)t.texStorage2D(i.TEXTURE_2D,fA,DA,z.width,z.height);else{let iA=z.width,hA=z.height;for(let mA=0;mA<fA;mA++)t.texImage2D(i.TEXTURE_2D,mA,DA,iA,hA,0,lA,EA,null),iA>>=1,hA>>=1}}else if(UA.length>0&&IA){WA&&Y&&t.texStorage2D(i.TEXTURE_2D,fA,DA,UA[0].width,UA[0].height);for(let iA=0,hA=UA.length;iA<hA;iA++)RA=UA[iA],WA?t.texSubImage2D(i.TEXTURE_2D,iA,0,0,lA,EA,RA):t.texImage2D(i.TEXTURE_2D,iA,DA,lA,EA,RA);M.generateMipmaps=!1}else WA?(Y&&t.texStorage2D(i.TEXTURE_2D,fA,DA,z.width,z.height),t.texSubImage2D(i.TEXTURE_2D,0,0,0,lA,EA,z)):t.texImage2D(i.TEXTURE_2D,0,DA,lA,EA,z);y(M,IA)&&p(X),AA.__version=x.version,M.onUpdate&&M.onUpdate(M)}N.__version=M.version}function it(N,M,k){if(M.image.length!==6)return;const X=NA(N,M),j=M.source;t.bindTexture(i.TEXTURE_CUBE_MAP,N.__webglTexture,i.TEXTURE0+k);const x=e.get(j);if(j.version!==x.__version||X===!0){t.activeTexture(i.TEXTURE0+k),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,M.flipY),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,M.premultiplyAlpha),i.pixelStorei(i.UNPACK_ALIGNMENT,M.unpackAlignment),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.NONE);const AA=M.isCompressedTexture||M.image[0].isCompressedTexture,sA=M.image[0]&&M.image[0].isDataTexture,z=[];for(let iA=0;iA<6;iA++)!AA&&!sA?z[iA]=d(M.image[iA],!1,!0,r):z[iA]=sA?M.image[iA].image:M.image[iA],z[iA]=$A(M,z[iA]);const IA=z[0],lA=u(IA)||a,EA=s.convert(M.format,M.colorSpace),DA=s.convert(M.type),RA=R(M.internalFormat,EA,DA,M.colorSpace),UA=a&&M.isVideoTexture!==!0,WA=x.__version===void 0||X===!0;let Y=D(M,IA,lA);wA(i.TEXTURE_CUBE_MAP,M,lA);let fA;if(AA){UA&&WA&&t.texStorage2D(i.TEXTURE_CUBE_MAP,Y,RA,IA.width,IA.height);for(let iA=0;iA<6;iA++){fA=z[iA].mipmaps;for(let hA=0;hA<fA.length;hA++){const mA=fA[hA];M.format!==me?EA!==null?UA?t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+iA,hA,0,0,mA.width,mA.height,EA,mA.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+iA,hA,RA,mA.width,mA.height,0,mA.data):console.warn("THREE.WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):UA?t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+iA,hA,0,0,mA.width,mA.height,EA,DA,mA.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+iA,hA,RA,mA.width,mA.height,0,EA,DA,mA.data)}}}else{fA=M.mipmaps,UA&&WA&&(fA.length>0&&Y++,t.texStorage2D(i.TEXTURE_CUBE_MAP,Y,RA,z[0].width,z[0].height));for(let iA=0;iA<6;iA++)if(sA){UA?t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+iA,0,0,0,z[iA].width,z[iA].height,EA,DA,z[iA].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+iA,0,RA,z[iA].width,z[iA].height,0,EA,DA,z[iA].data);for(let hA=0;hA<fA.length;hA++){const At=fA[hA].image[iA].image;UA?t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+iA,hA+1,0,0,At.width,At.height,EA,DA,At.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+iA,hA+1,RA,At.width,At.height,0,EA,DA,At.data)}}else{UA?t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+iA,0,0,0,EA,DA,z[iA]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+iA,0,RA,EA,DA,z[iA]);for(let hA=0;hA<fA.length;hA++){const mA=fA[hA];UA?t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+iA,hA+1,0,0,EA,DA,mA.image[iA]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+iA,hA+1,RA,EA,DA,mA.image[iA])}}}y(M,lA)&&p(i.TEXTURE_CUBE_MAP),x.__version=j.version,M.onUpdate&&M.onUpdate(M)}N.__version=M.version}function _A(N,M,k,X,j){const x=s.convert(k.format,k.colorSpace),AA=s.convert(k.type),sA=R(k.internalFormat,x,AA,k.colorSpace);e.get(M).__hasExternalTextures||(j===i.TEXTURE_3D||j===i.TEXTURE_2D_ARRAY?t.texImage3D(j,0,sA,M.width,M.height,M.depth,0,x,AA,null):t.texImage2D(j,0,sA,M.width,M.height,0,x,AA,null)),t.bindFramebuffer(i.FRAMEBUFFER,N),PA(M)?C.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,X,j,e.get(k).__webglTexture,0,LA(M)):(j===i.TEXTURE_2D||j>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&j<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,X,j,e.get(k).__webglTexture,0),t.bindFramebuffer(i.FRAMEBUFFER,null)}function $(N,M,k){if(i.bindRenderbuffer(i.RENDERBUFFER,N),M.depthBuffer&&!M.stencilBuffer){let X=i.DEPTH_COMPONENT16;if(k||PA(M)){const j=M.depthTexture;j&&j.isDepthTexture&&(j.type===De?X=i.DEPTH_COMPONENT32F:j.type===en&&(X=i.DEPTH_COMPONENT24));const x=LA(M);PA(M)?C.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,x,X,M.width,M.height):i.renderbufferStorageMultisample(i.RENDERBUFFER,x,X,M.width,M.height)}else i.renderbufferStorage(i.RENDERBUFFER,X,M.width,M.height);i.framebufferRenderbuffer(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.RENDERBUFFER,N)}else if(M.depthBuffer&&M.stencilBuffer){const X=LA(M);k&&PA(M)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,X,i.DEPTH24_STENCIL8,M.width,M.height):PA(M)?C.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,X,i.DEPTH24_STENCIL8,M.width,M.height):i.renderbufferStorage(i.RENDERBUFFER,i.DEPTH_STENCIL,M.width,M.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.RENDERBUFFER,N)}else{const X=M.isWebGLMultipleRenderTargets===!0?M.texture:[M.texture];for(let j=0;j<X.length;j++){const x=X[j],AA=s.convert(x.format,x.colorSpace),sA=s.convert(x.type),z=R(x.internalFormat,AA,sA,x.colorSpace),IA=LA(M);k&&PA(M)===!1?i.renderbufferStorageMultisample(i.RENDERBUFFER,IA,z,M.width,M.height):PA(M)?C.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,IA,z,M.width,M.height):i.renderbufferStorage(i.RENDERBUFFER,z,M.width,M.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function JA(N,M){if(M&&M.isWebGLCubeRenderTarget)throw new Error("Depth Texture with cube render targets is not supported");if(t.bindFramebuffer(i.FRAMEBUFFER,N),!(M.depthTexture&&M.depthTexture.isDepthTexture))throw new Error("renderTarget.depthTexture must be an instance of THREE.DepthTexture");(!e.get(M.depthTexture).__webglTexture||M.depthTexture.image.width!==M.width||M.depthTexture.image.height!==M.height)&&(M.depthTexture.image.width=M.width,M.depthTexture.image.height=M.height,M.depthTexture.needsUpdate=!0),Z(M.depthTexture,0);const X=e.get(M.depthTexture).__webglTexture,j=LA(M);if(M.depthTexture.format===Ln)PA(M)?C.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,X,0,j):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_ATTACHMENT,i.TEXTURE_2D,X,0);else if(M.depthTexture.format===Xs)PA(M)?C.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,X,0,j):i.framebufferTexture2D(i.FRAMEBUFFER,i.DEPTH_STENCIL_ATTACHMENT,i.TEXTURE_2D,X,0);else throw new Error("Unknown depthTexture format")}function MA(N){const M=e.get(N),k=N.isWebGLCubeRenderTarget===!0;if(N.depthTexture&&!M.__autoAllocateDepthBuffer){if(k)throw new Error("target.depthTexture not supported in Cube render targets");JA(M.__webglFramebuffer,N)}else if(k){M.__webglDepthbuffer=[];for(let X=0;X<6;X++)t.bindFramebuffer(i.FRAMEBUFFER,M.__webglFramebuffer[X]),M.__webglDepthbuffer[X]=i.createRenderbuffer(),$(M.__webglDepthbuffer[X],N,!1)}else t.bindFramebuffer(i.FRAMEBUFFER,M.__webglFramebuffer),M.__webglDepthbuffer=i.createRenderbuffer(),$(M.__webglDepthbuffer,N,!1);t.bindFramebuffer(i.FRAMEBUFFER,null)}function FA(N,M,k){const X=e.get(N);M!==void 0&&_A(X.__webglFramebuffer,N,N.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D),k!==void 0&&MA(N)}function SA(N){const M=N.texture,k=e.get(N),X=e.get(M);N.addEventListener("dispose",G),N.isWebGLMultipleRenderTargets!==!0&&(X.__webglTexture===void 0&&(X.__webglTexture=i.createTexture()),X.__version=M.version,o.memory.textures++);const j=N.isWebGLCubeRenderTarget===!0,x=N.isWebGLMultipleRenderTargets===!0,AA=u(N)||a;if(j){k.__webglFramebuffer=[];for(let sA=0;sA<6;sA++)k.__webglFramebuffer[sA]=i.createFramebuffer()}else{if(k.__webglFramebuffer=i.createFramebuffer(),x)if(n.drawBuffers){const sA=N.texture;for(let z=0,IA=sA.length;z<IA;z++){const lA=e.get(sA[z]);lA.__webglTexture===void 0&&(lA.__webglTexture=i.createTexture(),o.memory.textures++)}}else console.warn("THREE.WebGLRenderer: WebGLMultipleRenderTargets can only be used with WebGL2 or WEBGL_draw_buffers extension.");if(a&&N.samples>0&&PA(N)===!1){const sA=x?M:[M];k.__webglMultisampledFramebuffer=i.createFramebuffer(),k.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,k.__webglMultisampledFramebuffer);for(let z=0;z<sA.length;z++){const IA=sA[z];k.__webglColorRenderbuffer[z]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,k.__webglColorRenderbuffer[z]);const lA=s.convert(IA.format,IA.colorSpace),EA=s.convert(IA.type),DA=R(IA.internalFormat,lA,EA,IA.colorSpace,N.isXRRenderTarget===!0),RA=LA(N);i.renderbufferStorageMultisample(i.RENDERBUFFER,RA,DA,N.width,N.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+z,i.RENDERBUFFER,k.__webglColorRenderbuffer[z])}i.bindRenderbuffer(i.RENDERBUFFER,null),N.depthBuffer&&(k.__webglDepthRenderbuffer=i.createRenderbuffer(),$(k.__webglDepthRenderbuffer,N,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(j){t.bindTexture(i.TEXTURE_CUBE_MAP,X.__webglTexture),wA(i.TEXTURE_CUBE_MAP,M,AA);for(let sA=0;sA<6;sA++)_A(k.__webglFramebuffer[sA],N,M,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+sA);y(M,AA)&&p(i.TEXTURE_CUBE_MAP),t.unbindTexture()}else if(x){const sA=N.texture;for(let z=0,IA=sA.length;z<IA;z++){const lA=sA[z],EA=e.get(lA);t.bindTexture(i.TEXTURE_2D,EA.__webglTexture),wA(i.TEXTURE_2D,lA,AA),_A(k.__webglFramebuffer,N,lA,i.COLOR_ATTACHMENT0+z,i.TEXTURE_2D),y(lA,AA)&&p(i.TEXTURE_2D)}t.unbindTexture()}else{let sA=i.TEXTURE_2D;(N.isWebGL3DRenderTarget||N.isWebGLArrayRenderTarget)&&(a?sA=N.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY:console.error("THREE.WebGLTextures: THREE.Data3DTexture and THREE.DataArrayTexture only supported with WebGL2.")),t.bindTexture(sA,X.__webglTexture),wA(sA,M,AA),_A(k.__webglFramebuffer,N,M,i.COLOR_ATTACHMENT0,sA),y(M,AA)&&p(sA),t.unbindTexture()}N.depthBuffer&&MA(N)}function qA(N){const M=u(N)||a,k=N.isWebGLMultipleRenderTargets===!0?N.texture:[N.texture];for(let X=0,j=k.length;X<j;X++){const x=k[X];if(y(x,M)){const AA=N.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:i.TEXTURE_2D,sA=e.get(x).__webglTexture;t.bindTexture(AA,sA),p(AA),t.unbindTexture()}}}function bA(N){if(a&&N.samples>0&&PA(N)===!1){const M=N.isWebGLMultipleRenderTargets?N.texture:[N.texture],k=N.width,X=N.height;let j=i.COLOR_BUFFER_BIT;const x=[],AA=N.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,sA=e.get(N),z=N.isWebGLMultipleRenderTargets===!0;if(z)for(let IA=0;IA<M.length;IA++)t.bindFramebuffer(i.FRAMEBUFFER,sA.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+IA,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,sA.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+IA,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,sA.__webglMultisampledFramebuffer),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,sA.__webglFramebuffer);for(let IA=0;IA<M.length;IA++){x.push(i.COLOR_ATTACHMENT0+IA),N.depthBuffer&&x.push(AA);const lA=sA.__ignoreDepthValues!==void 0?sA.__ignoreDepthValues:!1;if(lA===!1&&(N.depthBuffer&&(j|=i.DEPTH_BUFFER_BIT),N.stencilBuffer&&(j|=i.STENCIL_BUFFER_BIT)),z&&i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,sA.__webglColorRenderbuffer[IA]),lA===!0&&(i.invalidateFramebuffer(i.READ_FRAMEBUFFER,[AA]),i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[AA])),z){const EA=e.get(M[IA]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,EA,0)}i.blitFramebuffer(0,0,k,X,0,0,k,X,j,i.NEAREST),Q&&i.invalidateFramebuffer(i.READ_FRAMEBUFFER,x)}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),z)for(let IA=0;IA<M.length;IA++){t.bindFramebuffer(i.FRAMEBUFFER,sA.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+IA,i.RENDERBUFFER,sA.__webglColorRenderbuffer[IA]);const lA=e.get(M[IA]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,sA.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+IA,i.TEXTURE_2D,lA,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,sA.__webglMultisampledFramebuffer)}}function LA(N){return Math.min(B,N.samples)}function PA(N){const M=e.get(N);return a&&N.samples>0&&A.has("WEBGL_multisampled_render_to_texture")===!0&&M.__useRenderToTexture!==!1}function YA(N){const M=o.render.frame;c.get(N)!==M&&(c.set(N,M),N.update())}function $A(N,M){const k=N.colorSpace,X=N.format,j=N.type;return N.isCompressedTexture===!0||N.format===HI||k!==Xe&&k!==Un&&(k===kA?a===!1?A.has("EXT_sRGB")===!0&&X===me?(N.format=HI,N.minFilter=Dt,N.generateMipmaps=!1):M=JQ.sRGBToLinear(M):(X!==me||j!==an)&&console.warn("THREE.WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):console.error("THREE.WebGLTextures: Unsupported texture color space:",k)),M}this.allocateTextureUnit=tA,this.resetTextureUnits=K,this.setTexture2D=Z,this.setTexture2DArray=CA,this.setTexture3D=q,this.setTextureCube=eA,this.rebindTextures=FA,this.setupRenderTarget=SA,this.updateRenderTargetMipmap=qA,this.updateMultisampleRenderTarget=bA,this.setupDepthRenderbuffer=MA,this.setupFrameBufferTexture=_A,this.useMultisampledRTT=PA}function Lm(i,A,t){const e=t.isWebGL2;function n(s,o=Un){let a;if(s===an)return i.UNSIGNED_BYTE;if(s===_Q)return i.UNSIGNED_SHORT_4_4_4_4;if(s===GQ)return i.UNSIGNED_SHORT_5_5_5_1;if(s===$l)return i.BYTE;if(s===Ad)return i.SHORT;if(s===cB)return i.UNSIGNED_SHORT;if(s===NQ)return i.INT;if(s===en)return i.UNSIGNED_INT;if(s===De)return i.FLOAT;if(s===_i)return e?i.HALF_FLOAT:(a=A.get("OES_texture_half_float"),a!==null?a.HALF_FLOAT_OES:null);if(s===td)return i.ALPHA;if(s===me)return i.RGBA;if(s===ed)return i.LUMINANCE;if(s===id)return i.LUMINANCE_ALPHA;if(s===Ln)return i.DEPTH_COMPONENT;if(s===Xs)return i.DEPTH_STENCIL;if(s===HI)return a=A.get("EXT_sRGB"),a!==null?a.SRGB_ALPHA_EXT:null;if(s===nd)return i.RED;if(s===LQ)return i.RED_INTEGER;if(s===sd)return i.RG;if(s===UQ)return i.RG_INTEGER;if(s===bQ)return i.RGBA_INTEGER;if(s===Ig||s===Bg||s===Cg||s===Eg)if(o===kA)if(a=A.get("WEBGL_compressed_texture_s3tc_srgb"),a!==null){if(s===Ig)return a.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(s===Bg)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(s===Cg)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(s===Eg)return a.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(a=A.get("WEBGL_compressed_texture_s3tc"),a!==null){if(s===Ig)return a.COMPRESSED_RGB_S3TC_DXT1_EXT;if(s===Bg)return a.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(s===Cg)return a.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(s===Eg)return a.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(s===$B||s===AC||s===tC||s===eC)if(a=A.get("WEBGL_compressed_texture_pvrtc"),a!==null){if(s===$B)return a.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(s===AC)return a.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(s===tC)return a.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(s===eC)return a.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(s===od)return a=A.get("WEBGL_compressed_texture_etc1"),a!==null?a.COMPRESSED_RGB_ETC1_WEBGL:null;if(s===iC||s===nC)if(a=A.get("WEBGL_compressed_texture_etc"),a!==null){if(s===iC)return o===kA?a.COMPRESSED_SRGB8_ETC2:a.COMPRESSED_RGB8_ETC2;if(s===nC)return o===kA?a.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:a.COMPRESSED_RGBA8_ETC2_EAC}else return null;if(s===sC||s===oC||s===aC||s===rC||s===gC||s===IC||s===BC||s===CC||s===EC||s===hC||s===QC||s===cC||s===lC||s===dC)if(a=A.get("WEBGL_compressed_texture_astc"),a!==null){if(s===sC)return o===kA?a.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:a.COMPRESSED_RGBA_ASTC_4x4_KHR;if(s===oC)return o===kA?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:a.COMPRESSED_RGBA_ASTC_5x4_KHR;if(s===aC)return o===kA?a.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:a.COMPRESSED_RGBA_ASTC_5x5_KHR;if(s===rC)return o===kA?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:a.COMPRESSED_RGBA_ASTC_6x5_KHR;if(s===gC)return o===kA?a.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:a.COMPRESSED_RGBA_ASTC_6x6_KHR;if(s===IC)return o===kA?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:a.COMPRESSED_RGBA_ASTC_8x5_KHR;if(s===BC)return o===kA?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:a.COMPRESSED_RGBA_ASTC_8x6_KHR;if(s===CC)return o===kA?a.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:a.COMPRESSED_RGBA_ASTC_8x8_KHR;if(s===EC)return o===kA?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:a.COMPRESSED_RGBA_ASTC_10x5_KHR;if(s===hC)return o===kA?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:a.COMPRESSED_RGBA_ASTC_10x6_KHR;if(s===QC)return o===kA?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:a.COMPRESSED_RGBA_ASTC_10x8_KHR;if(s===cC)return o===kA?a.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:a.COMPRESSED_RGBA_ASTC_10x10_KHR;if(s===lC)return o===kA?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:a.COMPRESSED_RGBA_ASTC_12x10_KHR;if(s===dC)return o===kA?a.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:a.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(s===hg)if(a=A.get("EXT_texture_compression_bptc"),a!==null){if(s===hg)return o===kA?a.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:a.COMPRESSED_RGBA_BPTC_UNORM_EXT}else return null;if(s===ad||s===uC||s===fC||s===pC)if(a=A.get("EXT_texture_compression_rgtc"),a!==null){if(s===hg)return a.COMPRESSED_RED_RGTC1_EXT;if(s===uC)return a.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(s===fC)return a.COMPRESSED_RED_GREEN_RGTC2_EXT;if(s===pC)return a.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return s===Gn?e?i.UNSIGNED_INT_24_8:(a=A.get("WEBGL_depth_texture"),a!==null?a.UNSIGNED_INT_24_8_WEBGL:null):i[s]!==void 0?i[s]:null}return{convert:n}}class Um extends zt{constructor(A=[]){super(),this.isArrayCamera=!0,this.cameras=A}}class Ke extends Qt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const bm={type:"move"};class vg{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new Ke,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new Ke,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new P,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new P),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new Ke,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new P,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new P),this._grip}dispatchEvent(A){return this._targetRay!==null&&this._targetRay.dispatchEvent(A),this._grip!==null&&this._grip.dispatchEvent(A),this._hand!==null&&this._hand.dispatchEvent(A),this}connect(A){if(A&&A.hand){const t=this._hand;if(t)for(const e of A.hand.values())this._getHandJoint(t,e)}return this.dispatchEvent({type:"connected",data:A}),this}disconnect(A){return this.dispatchEvent({type:"disconnected",data:A}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(A,t,e){let n=null,s=null,o=null;const a=this._targetRay,g=this._grip,r=this._hand;if(A&&t.session.visibilityState!=="visible-blurred"){if(r&&A.hand){o=!0;for(const l of A.hand.values()){const h=t.getJointPose(l,e),E=this._getHandJoint(r,l);h!==null&&(E.matrix.fromArray(h.transform.matrix),E.matrix.decompose(E.position,E.rotation,E.scale),E.matrixWorldNeedsUpdate=!0,E.jointRadius=h.radius),E.visible=h!==null}const I=r.joints["index-finger-tip"],B=r.joints["thumb-tip"],C=I.position.distanceTo(B.position),Q=.02,c=.005;r.inputState.pinching&&C>Q+c?(r.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:A.handedness,target:this})):!r.inputState.pinching&&C<=Q-c&&(r.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:A.handedness,target:this}))}else g!==null&&A.gripSpace&&(s=t.getPose(A.gripSpace,e),s!==null&&(g.matrix.fromArray(s.transform.matrix),g.matrix.decompose(g.position,g.rotation,g.scale),g.matrixWorldNeedsUpdate=!0,s.linearVelocity?(g.hasLinearVelocity=!0,g.linearVelocity.copy(s.linearVelocity)):g.hasLinearVelocity=!1,s.angularVelocity?(g.hasAngularVelocity=!0,g.angularVelocity.copy(s.angularVelocity)):g.hasAngularVelocity=!1));a!==null&&(n=t.getPose(A.targetRaySpace,e),n===null&&s!==null&&(n=s),n!==null&&(a.matrix.fromArray(n.transform.matrix),a.matrix.decompose(a.position,a.rotation,a.scale),a.matrixWorldNeedsUpdate=!0,n.linearVelocity?(a.hasLinearVelocity=!0,a.linearVelocity.copy(n.linearVelocity)):a.hasLinearVelocity=!1,n.angularVelocity?(a.hasAngularVelocity=!0,a.angularVelocity.copy(n.angularVelocity)):a.hasAngularVelocity=!1,this.dispatchEvent(bm)))}return a!==null&&(a.visible=n!==null),g!==null&&(g.visible=s!==null),r!==null&&(r.visible=o!==null),this}_getHandJoint(A,t){if(A.joints[t.jointName]===void 0){const e=new Ke;e.matrixAutoUpdate=!1,e.visible=!1,A.joints[t.jointName]=e,A.add(e)}return A.joints[t.jointName]}}class vm extends Tt{constructor(A,t,e,n,s,o,a,g,r,I){if(I=I!==void 0?I:Ln,I!==Ln&&I!==Xs)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");e===void 0&&I===Ln&&(e=en),e===void 0&&I===Xs&&(e=Gn),super(null,n,s,o,a,g,I,e,r),this.isDepthTexture=!0,this.image={width:A,height:t},this.magFilter=a!==void 0?a:Ut,this.minFilter=g!==void 0?g:Ut,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(A){return super.copy(A),this.compareFunction=A.compareFunction,this}toJSON(A){const t=super.toJSON(A);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}class km extends Vn{constructor(A,t){super();const e=this;let n=null,s=1,o=null,a="local-floor",g=1,r=null,I=null,B=null,C=null,Q=null,c=null;const l=t.getContextAttributes();let h=null,E=null;const f=[],d=[];let u=null;const m=new zt;m.layers.enable(1),m.viewport=new It;const y=new zt;y.layers.enable(2),y.viewport=new It;const p=[m,y],R=new Um;R.layers.enable(1),R.layers.enable(2);let D=null,S=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getCamera=function(){},this.setUserCamera=function(q){u=q},this.getController=function(q){let eA=f[q];return eA===void 0&&(eA=new vg,f[q]=eA),eA.getTargetRaySpace()},this.getControllerGrip=function(q){let eA=f[q];return eA===void 0&&(eA=new vg,f[q]=eA),eA.getGripSpace()},this.getHand=function(q){let eA=f[q];return eA===void 0&&(eA=new vg,f[q]=eA),eA.getHandSpace()};function F(q){const eA=d.indexOf(q.inputSource);if(eA===-1)return;const oA=f[eA];oA!==void 0&&(oA.update(q.inputSource,q.frame,r||o),oA.dispatchEvent({type:q.type,data:q.inputSource}))}function G(){n.removeEventListener("select",F),n.removeEventListener("selectstart",F),n.removeEventListener("selectend",F),n.removeEventListener("squeeze",F),n.removeEventListener("squeezestart",F),n.removeEventListener("squeezeend",F),n.removeEventListener("end",G),n.removeEventListener("inputsourceschange",L);for(let q=0;q<f.length;q++){const eA=d[q];eA!==null&&(d[q]=null,f[q].disconnect(eA))}D=null,S=null,A.setRenderTarget(h),Q=null,C=null,B=null,n=null,E=null,CA.stop(),e.isPresenting=!1,e.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(q){s=q,e.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(q){a=q,e.isPresenting===!0&&console.warn("THREE.WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return r||o},this.setReferenceSpace=function(q){r=q},this.getBaseLayer=function(){return C!==null?C:Q},this.getBinding=function(){return B},this.getFrame=function(){return c},this.getSession=function(){return n},this.setSession=async function(q){if(n=q,n!==null){if(h=A.getRenderTarget(),n.addEventListener("select",F),n.addEventListener("selectstart",F),n.addEventListener("selectend",F),n.addEventListener("squeeze",F),n.addEventListener("squeezestart",F),n.addEventListener("squeezeend",F),n.addEventListener("end",G),n.addEventListener("inputsourceschange",L),l.xrCompatible!==!0&&await t.makeXRCompatible(),n.renderState.layers===void 0||A.capabilities.isWebGL2===!1){const eA={antialias:n.renderState.layers===void 0?l.antialias:!0,alpha:!0,depth:l.depth,stencil:l.stencil,framebufferScaleFactor:s};Q=new XRWebGLLayer(n,t,eA),n.updateRenderState({baseLayer:Q}),E=new Hn(Q.framebufferWidth,Q.framebufferHeight,{format:me,type:an,colorSpace:A.outputColorSpace,stencilBuffer:l.stencil})}else{let eA=null,oA=null,aA=null;l.depth&&(aA=l.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,eA=l.stencil?Xs:Ln,oA=l.stencil?Gn:en);const QA={colorFormat:t.RGBA8,depthFormat:aA,scaleFactor:s};B=new XRWebGLBinding(n,t),C=B.createProjectionLayer(QA),n.updateRenderState({layers:[C]}),E=new Hn(C.textureWidth,C.textureHeight,{format:me,type:an,depthTexture:new vm(C.textureWidth,C.textureHeight,oA,void 0,void 0,void 0,void 0,void 0,void 0,eA),stencilBuffer:l.stencil,colorSpace:A.outputColorSpace,samples:l.antialias?4:0});const wA=A.properties.get(E);wA.__ignoreDepthValues=C.ignoreDepthValues}E.isXRRenderTarget=!0,this.setFoveation(g),r=null,o=await n.requestReferenceSpace(a),CA.setContext(n),CA.start(),e.isPresenting=!0,e.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(n!==null)return n.environmentBlendMode};function L(q){for(let eA=0;eA<q.removed.length;eA++){const oA=q.removed[eA],aA=d.indexOf(oA);aA>=0&&(d[aA]=null,f[aA].disconnect(oA))}for(let eA=0;eA<q.added.length;eA++){const oA=q.added[eA];let aA=d.indexOf(oA);if(aA===-1){for(let wA=0;wA<f.length;wA++)if(wA>=d.length){d.push(oA),aA=wA;break}else if(d[wA]===null){d[wA]=oA,aA=wA;break}if(aA===-1)break}const QA=f[aA];QA&&QA.connect(oA)}}const T=new P,b=new P;function V(q,eA,oA){T.setFromMatrixPosition(eA.matrixWorld),b.setFromMatrixPosition(oA.matrixWorld);const aA=T.distanceTo(b),QA=eA.projectionMatrix.elements,wA=oA.projectionMatrix.elements,NA=QA[14]/(QA[10]-1),xA=QA[14]/(QA[10]+1),it=(QA[9]+1)/QA[5],_A=(QA[9]-1)/QA[5],$=(QA[8]-1)/QA[0],JA=(wA[8]+1)/wA[0],MA=NA*$,FA=NA*JA,SA=aA/(-$+JA),qA=SA*-$;eA.matrixWorld.decompose(q.position,q.quaternion,q.scale),q.translateX(qA),q.translateZ(SA),q.matrixWorld.compose(q.position,q.quaternion,q.scale),q.matrixWorldInverse.copy(q.matrixWorld).invert();const bA=NA+SA,LA=xA+SA,PA=MA-qA,YA=FA+(aA-qA),$A=it*xA/LA*bA,N=_A*xA/LA*bA;q.projectionMatrix.makePerspective(PA,YA,$A,N,bA,LA),q.projectionMatrixInverse.copy(q.projectionMatrix).invert()}function K(q,eA){eA===null?q.matrixWorld.copy(q.matrix):q.matrixWorld.multiplyMatrices(eA.matrixWorld,q.matrix),q.matrixWorldInverse.copy(q.matrixWorld).invert()}this.updateCameraXR=function(q){if(n===null)return q;u&&(q=u),R.near=y.near=m.near=q.near,R.far=y.far=m.far=q.far,(D!==R.near||S!==R.far)&&(n.updateRenderState({depthNear:R.near,depthFar:R.far}),D=R.near,S=R.far);const eA=q.parent,oA=R.cameras;K(R,eA);for(let aA=0;aA<oA.length;aA++)K(oA[aA],eA);return oA.length===2?V(R,m,y):R.projectionMatrix.copy(m.projectionMatrix),u&&tA(R,eA),R};function tA(q,eA){const oA=u;eA===null?oA.matrix.copy(q.matrixWorld):(oA.matrix.copy(eA.matrixWorld),oA.matrix.invert(),oA.matrix.multiply(q.matrixWorld)),oA.matrix.decompose(oA.position,oA.quaternion,oA.scale),oA.updateMatrixWorld(!0);const aA=oA.children;for(let QA=0,wA=aA.length;QA<wA;QA++)aA[QA].updateMatrixWorld(!0);oA.projectionMatrix.copy(q.projectionMatrix),oA.projectionMatrixInverse.copy(q.projectionMatrixInverse),oA.isPerspectiveCamera&&(oA.fov=js*2*Math.atan(1/oA.projectionMatrix.elements[5]),oA.zoom=1)}this.getFoveation=function(){if(!(C===null&&Q===null))return g},this.setFoveation=function(q){g=q,C!==null&&(C.fixedFoveation=q),Q!==null&&Q.fixedFoveation!==void 0&&(Q.fixedFoveation=q)};let nA=null;function Z(q,eA){if(I=eA.getViewerPose(r||o),c=eA,I!==null){const oA=I.views;Q!==null&&(A.setRenderTargetFramebuffer(E,Q.framebuffer),A.setRenderTarget(E));let aA=!1;oA.length!==R.cameras.length&&(R.cameras.length=0,aA=!0);for(let QA=0;QA<oA.length;QA++){const wA=oA[QA];let NA=null;if(Q!==null)NA=Q.getViewport(wA);else{const it=B.getViewSubImage(C,wA);NA=it.viewport,QA===0&&(A.setRenderTargetTextures(E,it.colorTexture,C.ignoreDepthValues?void 0:it.depthStencilTexture),A.setRenderTarget(E))}let xA=p[QA];xA===void 0&&(xA=new zt,xA.layers.enable(QA),xA.viewport=new It,p[QA]=xA),xA.matrix.fromArray(wA.transform.matrix),xA.matrix.decompose(xA.position,xA.quaternion,xA.scale),xA.projectionMatrix.fromArray(wA.projectionMatrix),xA.projectionMatrixInverse.copy(xA.projectionMatrix).invert(),xA.viewport.set(NA.x,NA.y,NA.width,NA.height),QA===0&&(R.matrix.copy(xA.matrix),R.matrix.decompose(R.position,R.quaternion,R.scale)),aA===!0&&R.cameras.push(xA)}}for(let oA=0;oA<f.length;oA++){const aA=d[oA],QA=f[oA];aA!==null&&QA!==void 0&&QA.update(aA,eA,r||o)}nA&&nA(q,eA),eA.detectedPlanes&&e.dispatchEvent({type:"planesdetected",data:eA}),c=null}const CA=new jQ;CA.setAnimationLoop(Z),this.setAnimationLoop=function(q){nA=q},this.dispose=function(){}}}function Tm(i,A){function t(h,E){h.matrixAutoUpdate===!0&&h.updateMatrix(),E.value.copy(h.matrix)}function e(h,E){E.color.getRGB(h.fogColor.value,zQ(i)),E.isFog?(h.fogNear.value=E.near,h.fogFar.value=E.far):E.isFogExp2&&(h.fogDensity.value=E.density)}function n(h,E,f,d,u){E.isMeshBasicMaterial||E.isMeshLambertMaterial?s(h,E):E.isMeshToonMaterial?(s(h,E),B(h,E)):E.isMeshPhongMaterial?(s(h,E),I(h,E)):E.isMeshStandardMaterial?(s(h,E),C(h,E),E.isMeshPhysicalMaterial&&Q(h,E,u)):E.isMeshMatcapMaterial?(s(h,E),c(h,E)):E.isMeshDepthMaterial?s(h,E):E.isMeshDistanceMaterial?(s(h,E),l(h,E)):E.isMeshNormalMaterial?s(h,E):E.isLineBasicMaterial?(o(h,E),E.isLineDashedMaterial&&a(h,E)):E.isPointsMaterial?g(h,E,f,d):E.isSpriteMaterial?r(h,E):E.isShadowMaterial?(h.color.value.copy(E.color),h.opacity.value=E.opacity):E.isShaderMaterial&&(E.uniformsNeedUpdate=!1)}function s(h,E){h.opacity.value=E.opacity,E.color&&h.diffuse.value.copy(E.color),E.emissive&&h.emissive.value.copy(E.emissive).multiplyScalar(E.emissiveIntensity),E.map&&(h.map.value=E.map,t(E.map,h.mapTransform)),E.alphaMap&&(h.alphaMap.value=E.alphaMap,t(E.alphaMap,h.alphaMapTransform)),E.bumpMap&&(h.bumpMap.value=E.bumpMap,t(E.bumpMap,h.bumpMapTransform),h.bumpScale.value=E.bumpScale,E.side===ie&&(h.bumpScale.value*=-1)),E.normalMap&&(h.normalMap.value=E.normalMap,t(E.normalMap,h.normalMapTransform),h.normalScale.value.copy(E.normalScale),E.side===ie&&h.normalScale.value.negate()),E.displacementMap&&(h.displacementMap.value=E.displacementMap,t(E.displacementMap,h.displacementMapTransform),h.displacementScale.value=E.displacementScale,h.displacementBias.value=E.displacementBias),E.emissiveMap&&(h.emissiveMap.value=E.emissiveMap,t(E.emissiveMap,h.emissiveMapTransform)),E.specularMap&&(h.specularMap.value=E.specularMap,t(E.specularMap,h.specularMapTransform)),E.alphaTest>0&&(h.alphaTest.value=E.alphaTest);const f=A.get(E).envMap;if(f&&(h.envMap.value=f,h.flipEnvMap.value=f.isCubeTexture&&f.isRenderTargetTexture===!1?-1:1,h.reflectivity.value=E.reflectivity,h.ior.value=E.ior,h.refractionRatio.value=E.refractionRatio),E.lightMap){h.lightMap.value=E.lightMap;const d=i.useLegacyLights===!0?Math.PI:1;h.lightMapIntensity.value=E.lightMapIntensity*d,t(E.lightMap,h.lightMapTransform)}E.aoMap&&(h.aoMap.value=E.aoMap,h.aoMapIntensity.value=E.aoMapIntensity,t(E.aoMap,h.aoMapTransform))}function o(h,E){h.diffuse.value.copy(E.color),h.opacity.value=E.opacity,E.map&&(h.map.value=E.map,t(E.map,h.mapTransform))}function a(h,E){h.dashSize.value=E.dashSize,h.totalSize.value=E.dashSize+E.gapSize,h.scale.value=E.scale}function g(h,E,f,d){h.diffuse.value.copy(E.color),h.opacity.value=E.opacity,h.size.value=E.size*f,h.scale.value=d*.5,E.map&&(h.map.value=E.map,t(E.map,h.uvTransform)),E.alphaMap&&(h.alphaMap.value=E.alphaMap,t(E.alphaMap,h.alphaMapTransform)),E.alphaTest>0&&(h.alphaTest.value=E.alphaTest)}function r(h,E){h.diffuse.value.copy(E.color),h.opacity.value=E.opacity,h.rotation.value=E.rotation,E.map&&(h.map.value=E.map,t(E.map,h.mapTransform)),E.alphaMap&&(h.alphaMap.value=E.alphaMap,t(E.alphaMap,h.alphaMapTransform)),E.alphaTest>0&&(h.alphaTest.value=E.alphaTest)}function I(h,E){h.specular.value.copy(E.specular),h.shininess.value=Math.max(E.shininess,1e-4)}function B(h,E){E.gradientMap&&(h.gradientMap.value=E.gradientMap)}function C(h,E){h.metalness.value=E.metalness,E.metalnessMap&&(h.metalnessMap.value=E.metalnessMap,t(E.metalnessMap,h.metalnessMapTransform)),h.roughness.value=E.roughness,E.roughnessMap&&(h.roughnessMap.value=E.roughnessMap,t(E.roughnessMap,h.roughnessMapTransform)),A.get(E).envMap&&(h.envMapIntensity.value=E.envMapIntensity)}function Q(h,E,f){h.ior.value=E.ior,E.sheen>0&&(h.sheenColor.value.copy(E.sheenColor).multiplyScalar(E.sheen),h.sheenRoughness.value=E.sheenRoughness,E.sheenColorMap&&(h.sheenColorMap.value=E.sheenColorMap,t(E.sheenColorMap,h.sheenColorMapTransform)),E.sheenRoughnessMap&&(h.sheenRoughnessMap.value=E.sheenRoughnessMap,t(E.sheenRoughnessMap,h.sheenRoughnessMapTransform))),E.clearcoat>0&&(h.clearcoat.value=E.clearcoat,h.clearcoatRoughness.value=E.clearcoatRoughness,E.clearcoatMap&&(h.clearcoatMap.value=E.clearcoatMap,t(E.clearcoatMap,h.clearcoatMapTransform)),E.clearcoatRoughnessMap&&(h.clearcoatRoughnessMap.value=E.clearcoatRoughnessMap,t(E.clearcoatRoughnessMap,h.clearcoatRoughnessMapTransform)),E.clearcoatNormalMap&&(h.clearcoatNormalMap.value=E.clearcoatNormalMap,t(E.clearcoatNormalMap,h.clearcoatNormalMapTransform),h.clearcoatNormalScale.value.copy(E.clearcoatNormalScale),E.side===ie&&h.clearcoatNormalScale.value.negate())),E.iridescence>0&&(h.iridescence.value=E.iridescence,h.iridescenceIOR.value=E.iridescenceIOR,h.iridescenceThicknessMinimum.value=E.iridescenceThicknessRange[0],h.iridescenceThicknessMaximum.value=E.iridescenceThicknessRange[1],E.iridescenceMap&&(h.iridescenceMap.value=E.iridescenceMap,t(E.iridescenceMap,h.iridescenceMapTransform)),E.iridescenceThicknessMap&&(h.iridescenceThicknessMap.value=E.iridescenceThicknessMap,t(E.iridescenceThicknessMap,h.iridescenceThicknessMapTransform))),E.transmission>0&&(h.transmission.value=E.transmission,h.transmissionSamplerMap.value=f.texture,h.transmissionSamplerSize.value.set(f.width,f.height),E.transmissionMap&&(h.transmissionMap.value=E.transmissionMap,t(E.transmissionMap,h.transmissionMapTransform)),h.thickness.value=E.thickness,E.thicknessMap&&(h.thicknessMap.value=E.thicknessMap,t(E.thicknessMap,h.thicknessMapTransform)),h.attenuationDistance.value=E.attenuationDistance,h.attenuationColor.value.copy(E.attenuationColor)),E.anisotropy>0&&(h.anisotropyVector.value.set(E.anisotropy*Math.cos(E.anisotropyRotation),E.anisotropy*Math.sin(E.anisotropyRotation)),E.anisotropyMap&&(h.anisotropyMap.value=E.anisotropyMap,t(E.anisotropyMap,h.anisotropyMapTransform))),h.specularIntensity.value=E.specularIntensity,h.specularColor.value.copy(E.specularColor),E.specularColorMap&&(h.specularColorMap.value=E.specularColorMap,t(E.specularColorMap,h.specularColorMapTransform)),E.specularIntensityMap&&(h.specularIntensityMap.value=E.specularIntensityMap,t(E.specularIntensityMap,h.specularIntensityMapTransform))}function c(h,E){E.matcap&&(h.matcap.value=E.matcap)}function l(h,E){const f=A.get(E).light;h.referencePosition.value.setFromMatrixPosition(f.matrixWorld),h.nearDistance.value=f.shadow.camera.near,h.farDistance.value=f.shadow.camera.far}return{refreshFogUniforms:e,refreshMaterialUniforms:n}}function Hm(i,A,t,e){let n={},s={},o=[];const a=t.isWebGL2?i.getParameter(i.MAX_UNIFORM_BUFFER_BINDINGS):0;function g(f,d){const u=d.program;e.uniformBlockBinding(f,u)}function r(f,d){let u=n[f.id];u===void 0&&(c(f),u=I(f),n[f.id]=u,f.addEventListener("dispose",h));const m=d.program;e.updateUBOMapping(f,m);const y=A.render.frame;s[f.id]!==y&&(C(f),s[f.id]=y)}function I(f){const d=B();f.__bindingPointIndex=d;const u=i.createBuffer(),m=f.__size,y=f.usage;return i.bindBuffer(i.UNIFORM_BUFFER,u),i.bufferData(i.UNIFORM_BUFFER,m,y),i.bindBuffer(i.UNIFORM_BUFFER,null),i.bindBufferBase(i.UNIFORM_BUFFER,d,u),u}function B(){for(let f=0;f<a;f++)if(o.indexOf(f)===-1)return o.push(f),f;return console.error("THREE.WebGLRenderer: Maximum number of simultaneously usable uniforms groups reached."),0}function C(f){const d=n[f.id],u=f.uniforms,m=f.__cache;i.bindBuffer(i.UNIFORM_BUFFER,d);for(let y=0,p=u.length;y<p;y++){const R=u[y];if(Q(R,y,m)===!0){const D=R.__offset,S=Array.isArray(R.value)?R.value:[R.value];let F=0;for(let G=0;G<S.length;G++){const L=S[G],T=l(L);typeof L=="number"?(R.__data[0]=L,i.bufferSubData(i.UNIFORM_BUFFER,D+F,R.__data)):L.isMatrix3?(R.__data[0]=L.elements[0],R.__data[1]=L.elements[1],R.__data[2]=L.elements[2],R.__data[3]=L.elements[0],R.__data[4]=L.elements[3],R.__data[5]=L.elements[4],R.__data[6]=L.elements[5],R.__data[7]=L.elements[0],R.__data[8]=L.elements[6],R.__data[9]=L.elements[7],R.__data[10]=L.elements[8],R.__data[11]=L.elements[0]):(L.toArray(R.__data,F),F+=T.storage/Float32Array.BYTES_PER_ELEMENT)}i.bufferSubData(i.UNIFORM_BUFFER,D,R.__data)}}i.bindBuffer(i.UNIFORM_BUFFER,null)}function Q(f,d,u){const m=f.value;if(u[d]===void 0){if(typeof m=="number")u[d]=m;else{const y=Array.isArray(m)?m:[m],p=[];for(let R=0;R<y.length;R++)p.push(y[R].clone());u[d]=p}return!0}else if(typeof m=="number"){if(u[d]!==m)return u[d]=m,!0}else{const y=Array.isArray(u[d])?u[d]:[u[d]],p=Array.isArray(m)?m:[m];for(let R=0;R<y.length;R++){const D=y[R];if(D.equals(p[R])===!1)return D.copy(p[R]),!0}}return!1}function c(f){const d=f.uniforms;let u=0;const m=16;let y=0;for(let p=0,R=d.length;p<R;p++){const D=d[p],S={boundary:0,storage:0},F=Array.isArray(D.value)?D.value:[D.value];for(let G=0,L=F.length;G<L;G++){const T=F[G],b=l(T);S.boundary+=b.boundary,S.storage+=b.storage}if(D.__data=new Float32Array(S.storage/Float32Array.BYTES_PER_ELEMENT),D.__offset=u,p>0){y=u%m;const G=m-y;y!==0&&G-S.boundary<0&&(u+=m-y,D.__offset=u)}u+=S.storage}return y=u%m,y>0&&(u+=m-y),f.__size=u,f.__cache={},this}function l(f){const d={boundary:0,storage:0};return typeof f=="number"?(d.boundary=4,d.storage=4):f.isVector2?(d.boundary=8,d.storage=8):f.isVector3||f.isColor?(d.boundary=16,d.storage=12):f.isVector4?(d.boundary=16,d.storage=16):f.isMatrix3?(d.boundary=48,d.storage=48):f.isMatrix4?(d.boundary=64,d.storage=64):f.isTexture?console.warn("THREE.WebGLRenderer: Texture samplers can not be part of an uniforms group."):console.warn("THREE.WebGLRenderer: Unsupported uniform value type.",f),d}function h(f){const d=f.target;d.removeEventListener("dispose",h);const u=o.indexOf(d.__bindingPointIndex);o.splice(u,1),i.deleteBuffer(n[d.id]),delete n[d.id],delete s[d.id]}function E(){for(const f in n)i.deleteBuffer(n[f]);o=[],n={},s={}}return{bind:g,update:r,dispose:E}}function qm(){const i=Vo("canvas");return i.style.display="block",i}class ic{constructor(A={}){const{canvas:t=qm(),context:e=null,depth:n=!0,stencil:s=!0,alpha:o=!1,antialias:a=!1,premultipliedAlpha:g=!0,preserveDrawingBuffer:r=!1,powerPreference:I="default",failIfMajorPerformanceCaveat:B=!1}=A;this.isWebGLRenderer=!0;let C;e!==null?C=e.getContextAttributes().alpha:C=o;const Q=new Uint32Array(4),c=new Int32Array(4);let l=null,h=null;const E=[],f=[];this.domElement=t,this.debug={checkShaderErrors:!0,onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.outputColorSpace=kA,this.useLegacyLights=!0,this.toneMapping=bi,this.toneMappingExposure=1;const d=this;let u=!1,m=0,y=0,p=null,R=-1,D=null;const S=new It,F=new It;let G=null;const L=new HA(0);let T=0,b=t.width,V=t.height,K=1,tA=null,nA=null;const Z=new It(0,0,b,V),CA=new It(0,0,b,V);let q=!1;const eA=new uB;let oA=!1,aA=!1,QA=null;const wA=new zA,NA=new TA,xA=new P,it={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};function _A(){return p===null?K:1}let $=e;function JA(w,_){for(let v=0;v<w.length;v++){const H=w[v],O=t.getContext(H,_);if(O!==null)return O}return null}try{const w={alpha:!0,depth:n,stencil:s,antialias:a,premultipliedAlpha:g,preserveDrawingBuffer:r,powerPreference:I,failIfMajorPerformanceCaveat:B};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${hB}`),t.addEventListener("webglcontextlost",fA,!1),t.addEventListener("webglcontextrestored",iA,!1),t.addEventListener("webglcontextcreationerror",hA,!1),$===null){const _=["webgl2","webgl","experimental-webgl"];if(d.isWebGL1Renderer===!0&&_.shift(),$=JA(_,w),$===null)throw JA(_)?new Error("Error creating WebGL context with your selected attributes."):new Error("Error creating WebGL context.")}$ instanceof WebGLRenderingContext&&console.warn("THREE.WebGLRenderer: WebGL 1 support was deprecated in r153 and will be removed in r163."),$.getShaderPrecisionFormat===void 0&&($.getShaderPrecisionFormat=function(){return{rangeMin:1,rangeMax:1,precision:1}})}catch(w){throw console.error("THREE.WebGLRenderer: "+w.message),w}let MA,FA,SA,qA,bA,LA,PA,YA,$A,N,M,k,X,j,x,AA,sA,z,IA,lA,EA,DA,RA,UA;function WA(){MA=new j0($),FA=new O0($,MA,A),MA.init(FA),DA=new Lm($,MA,FA),SA=new _m($,MA,FA),qA=new tp($),bA=new dm,LA=new Gm($,MA,SA,bA,FA,DA,qA),PA=new V0(d),YA=new Z0(d),$A=new Cu($,FA),RA=new Y0($,MA,$A,FA),N=new $0($,$A,qA,RA),M=new sp($,N,$A,qA),IA=new np($,FA,LA),AA=new W0(bA),k=new lm(d,PA,YA,MA,FA,RA,AA),X=new Tm(d,bA),j=new fm,x=new wm(MA,FA),z=new K0(d,PA,YA,SA,M,C,g),sA=new Nm(d,M,FA),UA=new Hm($,qA,FA,SA),lA=new P0($,MA,qA,FA),EA=new Ap($,MA,qA,FA),qA.programs=k.programs,d.capabilities=FA,d.extensions=MA,d.properties=bA,d.renderLists=j,d.shadowMap=sA,d.state=SA,d.info=qA}WA();const Y=new km(d,$);this.xr=Y,this.getContext=function(){return $},this.getContextAttributes=function(){return $.getContextAttributes()},this.forceContextLoss=function(){const w=MA.get("WEBGL_lose_context");w&&w.loseContext()},this.forceContextRestore=function(){const w=MA.get("WEBGL_lose_context");w&&w.restoreContext()},this.getPixelRatio=function(){return K},this.setPixelRatio=function(w){w!==void 0&&(K=w,this.setSize(b,V,!1))},this.getSize=function(w){return w.set(b,V)},this.setSize=function(w,_,v=!0){if(Y.isPresenting){console.warn("THREE.WebGLRenderer: Can't change size while VR device is presenting.");return}b=w,V=_,t.width=Math.floor(w*K),t.height=Math.floor(_*K),v===!0&&(t.style.width=w+"px",t.style.height=_+"px"),this.setViewport(0,0,w,_)},this.getDrawingBufferSize=function(w){return w.set(b*K,V*K).floor()},this.setDrawingBufferSize=function(w,_,v){b=w,V=_,K=v,t.width=Math.floor(w*v),t.height=Math.floor(_*v),this.setViewport(0,0,w,_)},this.getCurrentViewport=function(w){return w.copy(S)},this.getViewport=function(w){return w.copy(Z)},this.setViewport=function(w,_,v,H){w.isVector4?Z.set(w.x,w.y,w.z,w.w):Z.set(w,_,v,H),SA.viewport(S.copy(Z).multiplyScalar(K).floor())},this.getScissor=function(w){return w.copy(CA)},this.setScissor=function(w,_,v,H){w.isVector4?CA.set(w.x,w.y,w.z,w.w):CA.set(w,_,v,H),SA.scissor(F.copy(CA).multiplyScalar(K).floor())},this.getScissorTest=function(){return q},this.setScissorTest=function(w){SA.setScissorTest(q=w)},this.setOpaqueSort=function(w){tA=w},this.setTransparentSort=function(w){nA=w},this.getClearColor=function(w){return w.copy(z.getClearColor())},this.setClearColor=function(){z.setClearColor.apply(z,arguments)},this.getClearAlpha=function(){return z.getClearAlpha()},this.setClearAlpha=function(){z.setClearAlpha.apply(z,arguments)},this.clear=function(w=!0,_=!0,v=!0){let H=0;if(w){let O=!1;if(p!==null){const gA=p.texture.format;O=gA===bQ||gA===UQ||gA===LQ}if(O){const gA=p.texture.type,BA=gA===an||gA===en||gA===cB||gA===Gn||gA===_Q||gA===GQ,pA=z.getClearColor(),yA=z.getClearAlpha(),vA=pA.r,GA=pA.g,dA=pA.b,ot=bA.get(p).__webglFramebuffer;BA?(Q[0]=vA,Q[1]=GA,Q[2]=dA,Q[3]=yA,$.clearBufferuiv($.COLOR,ot,Q)):(c[0]=vA,c[1]=GA,c[2]=dA,c[3]=yA,$.clearBufferiv($.COLOR,ot,c))}else H|=$.COLOR_BUFFER_BIT}_&&(H|=$.DEPTH_BUFFER_BIT),v&&(H|=$.STENCIL_BUFFER_BIT),$.clear(H)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.dispose=function(){t.removeEventListener("webglcontextlost",fA,!1),t.removeEventListener("webglcontextrestored",iA,!1),t.removeEventListener("webglcontextcreationerror",hA,!1),j.dispose(),x.dispose(),bA.dispose(),PA.dispose(),YA.dispose(),M.dispose(),RA.dispose(),UA.dispose(),k.dispose(),Y.dispose(),Y.removeEventListener("sessionstart",Et),Y.removeEventListener("sessionend",se),QA&&(QA.dispose(),QA=null),ft.stop()};function fA(w){w.preventDefault(),console.log("THREE.WebGLRenderer: Context Lost."),u=!0}function iA(){console.log("THREE.WebGLRenderer: Context Restored."),u=!1;const w=qA.autoReset,_=sA.enabled,v=sA.autoUpdate,H=sA.needsUpdate,O=sA.type;WA(),qA.autoReset=w,sA.enabled=_,sA.autoUpdate=v,sA.needsUpdate=H,sA.type=O}function hA(w){console.error("THREE.WebGLRenderer: A WebGL context could not be created. Reason: ",w.statusMessage)}function mA(w){const _=w.target;_.removeEventListener("dispose",mA),At(_)}function At(w){Bt(w),bA.remove(w)}function Bt(w){const _=bA.get(w).programs;_!==void 0&&(_.forEach(function(v){k.releaseProgram(v)}),w.isShaderMaterial&&k.releaseShaderCache(w))}this.renderBufferDirect=function(w,_,v,H,O,gA){_===null&&(_=it);const BA=O.isMesh&&O.matrixWorld.determinant()<0,pA=U(w,_,v,H,O);SA.setMaterial(H,BA);let yA=v.index,vA=1;H.wireframe===!0&&(yA=N.getWireframeAttribute(v),vA=2);const GA=v.drawRange,dA=v.attributes.position;let ot=GA.start*vA,nt=(GA.start+GA.count)*vA;gA!==null&&(ot=Math.max(ot,gA.start*vA),nt=Math.min(nt,(gA.start+gA.count)*vA)),yA!==null?(ot=Math.max(ot,0),nt=Math.min(nt,yA.count)):dA!=null&&(ot=Math.max(ot,0),nt=Math.min(nt,dA.count));const Rt=nt-ot;if(Rt<0||Rt===1/0)return;RA.setup(O,H,pA,v,yA);let ce,pt=lA;if(yA!==null&&(ce=$A.get(yA),pt=EA,pt.setIndex(ce)),O.isMesh)H.wireframe===!0?(SA.setLineWidth(H.wireframeLinewidth*_A()),pt.setMode($.LINES)):pt.setMode($.TRIANGLES);else if(O.isLine){let tt=H.linewidth;tt===void 0&&(tt=1),SA.setLineWidth(tt*_A()),O.isLineSegments?pt.setMode($.LINES):O.isLineLoop?pt.setMode($.LINE_LOOP):pt.setMode($.LINE_STRIP)}else O.isPoints?pt.setMode($.POINTS):O.isSprite&&pt.setMode($.TRIANGLES);if(O.isInstancedMesh)pt.renderInstances(ot,Rt,O.count);else if(v.isInstancedBufferGeometry){const tt=v._maxInstanceCount!==void 0?v._maxInstanceCount:1/0,og=Math.min(v.instanceCount,tt);pt.renderInstances(ot,Rt,og)}else pt.render(ot,Rt)},this.compile=function(w,_){function v(H,O,gA){H.transparent===!0&&H.side===ii&&H.forceSinglePass===!1?(H.side=ie,H.needsUpdate=!0,Ci(H,O,gA),H.side=vi,H.needsUpdate=!0,Ci(H,O,gA),H.side=ii):Ci(H,O,gA)}h=x.get(w),h.init(),f.push(h),w.traverseVisible(function(H){H.isLight&&H.layers.test(_.layers)&&(h.pushLight(H),H.castShadow&&h.pushShadow(H))}),h.setupLights(d.useLegacyLights),w.traverse(function(H){const O=H.material;if(O)if(Array.isArray(O))for(let gA=0;gA<O.length;gA++){const BA=O[gA];v(BA,w,H)}else v(O,w,H)}),f.pop(),h=null};let ct=null;function Ne(w){ct&&ct(w)}function Et(){ft.stop()}function se(){ft.start()}const ft=new jQ;ft.setAnimationLoop(Ne),typeof self<"u"&&ft.setContext(self),this.setAnimationLoop=function(w){ct=w,Y.setAnimationLoop(w),w===null?ft.stop():ft.start()},Y.addEventListener("sessionstart",Et),Y.addEventListener("sessionend",se),this.render=function(w,_){if(_!==void 0&&_.isCamera!==!0){console.error("THREE.WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(u===!0)return;w.matrixWorldAutoUpdate===!0&&w.updateMatrixWorld(),_.parent===null&&_.matrixWorldAutoUpdate===!0&&_.updateMatrixWorld(),Y.enabled===!0&&Y.isPresenting===!0&&(_=Y.updateCameraXR(_)),w.isScene===!0&&w.onBeforeRender(d,w,_,p),h=x.get(w,f.length),h.init(),f.push(h),wA.multiplyMatrices(_.projectionMatrix,_.matrixWorldInverse),eA.setFromProjectionMatrix(wA),aA=this.localClippingEnabled,oA=AA.init(this.clippingPlanes,aA),l=j.get(w,E.length),l.init(),E.push(l),ua(w,_,0,d.sortObjects),l.finish(),d.sortObjects===!0&&l.sort(tA,nA),oA===!0&&AA.beginShadows();const v=h.state.shadowsArray;if(sA.render(v,w,_),oA===!0&&AA.endShadows(),this.info.autoReset===!0&&this.info.reset(),this.info.render.frame++,z.render(l,w),h.setupLights(d.useLegacyLights),_.isArrayCamera){const H=_.cameras;for(let O=0,gA=H.length;O<gA;O++){const BA=H[O];Eo(l,w,BA,BA.viewport)}}else Eo(l,w,_);p!==null&&(LA.updateMultisampleRenderTarget(p),LA.updateRenderTargetMipmap(p)),w.isScene===!0&&w.onAfterRender(d,w,_),RA.resetDefaultState(),R=-1,D=null,f.pop(),f.length>0?h=f[f.length-1]:h=null,E.pop(),E.length>0?l=E[E.length-1]:l=null};function ua(w,_,v,H){if(w.visible===!1)return;if(w.layers.test(_.layers)){if(w.isGroup)v=w.renderOrder;else if(w.isLOD)w.autoUpdate===!0&&w.update(_);else if(w.isLight)h.pushLight(w),w.castShadow&&h.pushShadow(w);else if(w.isSprite){if(!w.frustumCulled||eA.intersectsSprite(w)){H&&xA.setFromMatrixPosition(w.matrixWorld).applyMatrix4(wA);const BA=M.update(w),pA=w.material;pA.visible&&l.push(w,BA,pA,v,xA.z,null)}}else if((w.isMesh||w.isLine||w.isPoints)&&(!w.frustumCulled||eA.intersectsObject(w))){w.isSkinnedMesh&&w.skeleton.frame!==qA.render.frame&&(w.skeleton.update(),w.skeleton.frame=qA.render.frame);const BA=M.update(w),pA=w.material;if(H&&(w.boundingSphere!==void 0?(w.boundingSphere===null&&w.computeBoundingSphere(),xA.copy(w.boundingSphere.center)):(BA.boundingSphere===null&&BA.computeBoundingSphere(),xA.copy(BA.boundingSphere.center)),xA.applyMatrix4(w.matrixWorld).applyMatrix4(wA)),Array.isArray(pA)){const yA=BA.groups;for(let vA=0,GA=yA.length;vA<GA;vA++){const dA=yA[vA],ot=pA[dA.materialIndex];ot&&ot.visible&&l.push(w,BA,ot,v,xA.z,dA)}}else pA.visible&&l.push(w,BA,pA,v,xA.z,null)}}const gA=w.children;for(let BA=0,pA=gA.length;BA<pA;BA++)ua(gA[BA],_,v,H)}function Eo(w,_,v,H){const O=w.opaque,gA=w.transmissive,BA=w.transparent;h.setupLightsView(v),oA===!0&&AA.setGlobalState(d.clippingPlanes,v),gA.length>0&&Zn(O,gA,_,v),H&&SA.viewport(S.copy(H)),O.length>0&&$t(O,_,v),gA.length>0&&$t(gA,_,v),BA.length>0&&$t(BA,_,v),SA.buffers.depth.setTest(!0),SA.buffers.depth.setMask(!0),SA.buffers.color.setMask(!0),SA.setPolygonOffset(!1)}function Zn(w,_,v,H){const O=FA.isWebGL2;QA===null&&(QA=new Hn(1,1,{generateMipmaps:!0,type:MA.has("EXT_color_buffer_half_float")?_i:an,minFilter:En,samples:O&&a===!0?4:0})),d.getDrawingBufferSize(NA),O?QA.setSize(NA.x,NA.y):QA.setSize(br(NA.x),br(NA.y));const gA=d.getRenderTarget();d.setRenderTarget(QA),d.getClearColor(L),T=d.getClearAlpha(),T<1&&d.setClearColor(16777215,.5),d.clear();const BA=d.toneMapping;d.toneMapping=bi,$t(w,v,H),LA.updateMultisampleRenderTarget(QA),LA.updateRenderTargetMipmap(QA);let pA=!1;for(let yA=0,vA=_.length;yA<vA;yA++){const GA=_[yA],dA=GA.object,ot=GA.geometry,nt=GA.material,Rt=GA.group;if(nt.side===ii&&dA.layers.test(H.layers)){const ce=nt.side;nt.side=ie,nt.needsUpdate=!0,ho(dA,v,H,ot,nt,Rt),nt.side=ce,nt.needsUpdate=!0,pA=!0}}pA===!0&&(LA.updateMultisampleRenderTarget(QA),LA.updateRenderTargetMipmap(QA)),d.setRenderTarget(gA),d.setClearColor(L,T),d.toneMapping=BA}function $t(w,_,v){const H=_.isScene===!0?_.overrideMaterial:null;for(let O=0,gA=w.length;O<gA;O++){const BA=w[O],pA=BA.object,yA=BA.geometry,vA=H===null?BA.material:H,GA=BA.group;pA.layers.test(v.layers)&&ho(pA,_,v,yA,vA,GA)}}function ho(w,_,v,H,O,gA){w.onBeforeRender(d,_,v,H,O,gA),w.modelViewMatrix.multiplyMatrices(v.matrixWorldInverse,w.matrixWorld),w.normalMatrix.getNormalMatrix(w.modelViewMatrix),O.onBeforeRender(d,_,v,H,w,gA),O.transparent===!0&&O.side===ii&&O.forceSinglePass===!1?(O.side=ie,O.needsUpdate=!0,d.renderBufferDirect(v,_,H,O,w,gA),O.side=vi,O.needsUpdate=!0,d.renderBufferDirect(v,_,H,O,w,gA),O.side=ii):d.renderBufferDirect(v,_,H,O,w,gA),w.onAfterRender(d,_,v,H,O,gA)}function Ci(w,_,v){_.isScene!==!0&&(_=it);const H=bA.get(w),O=h.state.lights,gA=h.state.shadowsArray,BA=O.state.version,pA=k.getParameters(w,O.state,gA,_,v),yA=k.getProgramCacheKey(pA);let vA=H.programs;H.environment=w.isMeshStandardMaterial?_.environment:null,H.fog=_.fog,H.envMap=(w.isMeshStandardMaterial?YA:PA).get(w.envMap||H.environment),vA===void 0&&(w.addEventListener("dispose",mA),vA=new Map,H.programs=vA);let GA=vA.get(yA);if(GA!==void 0){if(H.currentProgram===GA&&H.lightsStateVersion===BA)return jn(w,pA),GA}else pA.uniforms=k.getUniforms(w),w.onBuild(v,pA,d),w.onBeforeCompile(pA,d),GA=k.acquireProgram(pA,yA),vA.set(yA,GA),H.uniforms=pA.uniforms;const dA=H.uniforms;(!w.isShaderMaterial&&!w.isRawShaderMaterial||w.clipping===!0)&&(dA.clippingPlanes=AA.uniform),jn(w,pA),H.needsLights=W(w),H.lightsStateVersion=BA,H.needsLights&&(dA.ambientLightColor.value=O.state.ambient,dA.lightProbe.value=O.state.probe,dA.directionalLights.value=O.state.directional,dA.directionalLightShadows.value=O.state.directionalShadow,dA.spotLights.value=O.state.spot,dA.spotLightShadows.value=O.state.spotShadow,dA.rectAreaLights.value=O.state.rectArea,dA.ltc_1.value=O.state.rectAreaLTC1,dA.ltc_2.value=O.state.rectAreaLTC2,dA.pointLights.value=O.state.point,dA.pointLightShadows.value=O.state.pointShadow,dA.hemisphereLights.value=O.state.hemi,dA.directionalShadowMap.value=O.state.directionalShadowMap,dA.directionalShadowMatrix.value=O.state.directionalShadowMatrix,dA.spotShadowMap.value=O.state.spotShadowMap,dA.spotLightMatrix.value=O.state.spotLightMatrix,dA.spotLightMap.value=O.state.spotLightMap,dA.pointShadowMap.value=O.state.pointShadowMap,dA.pointShadowMatrix.value=O.state.pointShadowMatrix);const ot=GA.getUniforms(),nt=mr.seqWithValue(ot.seq,dA);return H.currentProgram=GA,H.uniformsList=nt,GA}function jn(w,_){const v=bA.get(w);v.outputColorSpace=_.outputColorSpace,v.instancing=_.instancing,v.skinning=_.skinning,v.morphTargets=_.morphTargets,v.morphNormals=_.morphNormals,v.morphColors=_.morphColors,v.morphTargetsCount=_.morphTargetsCount,v.numClippingPlanes=_.numClippingPlanes,v.numIntersection=_.numClipIntersection,v.vertexAlphas=_.vertexAlphas,v.vertexTangents=_.vertexTangents,v.toneMapping=_.toneMapping}function U(w,_,v,H,O){_.isScene!==!0&&(_=it),LA.resetTextureUnits();const gA=_.fog,BA=H.isMeshStandardMaterial?_.environment:null,pA=p===null?d.outputColorSpace:p.isXRRenderTarget===!0?p.texture.colorSpace:Xe,yA=(H.isMeshStandardMaterial?YA:PA).get(H.envMap||BA),vA=H.vertexColors===!0&&!!v.attributes.color&&v.attributes.color.itemSize===4,GA=!!v.attributes.tangent&&(!!H.normalMap||H.anisotropy>0),dA=!!v.morphAttributes.position,ot=!!v.morphAttributes.normal,nt=!!v.morphAttributes.color,Rt=H.toneMapped?d.toneMapping:bi,ce=v.morphAttributes.position||v.morphAttributes.normal||v.morphAttributes.color,pt=ce!==void 0?ce.length:0,tt=bA.get(H),og=h.state.lights;if(oA===!0&&(aA===!0||w!==D)){const oe=w===D&&H.id===R;AA.setState(H,w,oe)}let Ft=!1;H.version===tt.__version?(tt.needsLights&&tt.lightsStateVersion!==og.state.version||tt.outputColorSpace!==pA||O.isInstancedMesh&&tt.instancing===!1||!O.isInstancedMesh&&tt.instancing===!0||O.isSkinnedMesh&&tt.skinning===!1||!O.isSkinnedMesh&&tt.skinning===!0||tt.envMap!==yA||H.fog===!0&&tt.fog!==gA||tt.numClippingPlanes!==void 0&&(tt.numClippingPlanes!==AA.numPlanes||tt.numIntersection!==AA.numIntersection)||tt.vertexAlphas!==vA||tt.vertexTangents!==GA||tt.morphTargets!==dA||tt.morphNormals!==ot||tt.morphColors!==nt||tt.toneMapping!==Rt||FA.isWebGL2===!0&&tt.morphTargetsCount!==pt)&&(Ft=!0):(Ft=!0,tt.__version=H.version);let cn=tt.currentProgram;Ft===!0&&(cn=Ci(H,_,O));let PB=!1,Qo=!1,ag=!1;const Ot=cn.getUniforms(),ln=tt.uniforms;if(SA.useProgram(cn.program)&&(PB=!0,Qo=!0,ag=!0),H.id!==R&&(R=H.id,Qo=!0),PB||D!==w){if(Ot.setValue($,"projectionMatrix",w.projectionMatrix),FA.logarithmicDepthBuffer&&Ot.setValue($,"logDepthBufFC",2/(Math.log(w.far+1)/Math.LN2)),D!==w&&(D=w,Qo=!0,ag=!0),H.isShaderMaterial||H.isMeshPhongMaterial||H.isMeshToonMaterial||H.isMeshStandardMaterial||H.envMap){const oe=Ot.map.cameraPosition;oe!==void 0&&oe.setValue($,xA.setFromMatrixPosition(w.matrixWorld))}(H.isMeshPhongMaterial||H.isMeshToonMaterial||H.isMeshLambertMaterial||H.isMeshBasicMaterial||H.isMeshStandardMaterial||H.isShaderMaterial)&&Ot.setValue($,"isOrthographic",w.isOrthographicCamera===!0),(H.isMeshPhongMaterial||H.isMeshToonMaterial||H.isMeshLambertMaterial||H.isMeshBasicMaterial||H.isMeshStandardMaterial||H.isShaderMaterial||H.isShadowMaterial||O.isSkinnedMesh)&&Ot.setValue($,"viewMatrix",w.matrixWorldInverse)}if(O.isSkinnedMesh){Ot.setOptional($,O,"bindMatrix"),Ot.setOptional($,O,"bindMatrixInverse");const oe=O.skeleton;oe&&(FA.floatVertexTextures?(oe.boneTexture===null&&oe.computeBoneTexture(),Ot.setValue($,"boneTexture",oe.boneTexture,LA),Ot.setValue($,"boneTextureSize",oe.boneTextureSize)):console.warn("THREE.WebGLRenderer: SkinnedMesh can only be used with WebGL 2. With WebGL 1 OES_texture_float and vertex textures support is required."))}const rg=v.morphAttributes;if((rg.position!==void 0||rg.normal!==void 0||rg.color!==void 0&&FA.isWebGL2===!0)&&IA.update(O,v,cn),(Qo||tt.receiveShadow!==O.receiveShadow)&&(tt.receiveShadow=O.receiveShadow,Ot.setValue($,"receiveShadow",O.receiveShadow)),H.isMeshGouraudMaterial&&H.envMap!==null&&(ln.envMap.value=yA,ln.flipEnvMap.value=yA.isCubeTexture&&yA.isRenderTargetTexture===!1?-1:1),Qo&&(Ot.setValue($,"toneMappingExposure",d.toneMappingExposure),tt.needsLights&&J(ln,ag),gA&&H.fog===!0&&X.refreshFogUniforms(ln,gA),X.refreshMaterialUniforms(ln,H,K,V,QA),mr.upload($,tt.uniformsList,ln,LA)),H.isShaderMaterial&&H.uniformsNeedUpdate===!0&&(mr.upload($,tt.uniformsList,ln,LA),H.uniformsNeedUpdate=!1),H.isSpriteMaterial&&Ot.setValue($,"center",O.center),Ot.setValue($,"modelViewMatrix",O.modelViewMatrix),Ot.setValue($,"normalMatrix",O.normalMatrix),Ot.setValue($,"modelMatrix",O.matrixWorld),H.isShaderMaterial||H.isRawShaderMaterial){const oe=H.uniformsGroups;for(let gg=0,pl=oe.length;gg<pl;gg++)if(FA.isWebGL2){const OB=oe[gg];UA.update(OB,cn),UA.bind(OB,cn)}else console.warn("THREE.WebGLRenderer: Uniform Buffer Objects can only be used with WebGL 2.")}return cn}function J(w,_){w.ambientLightColor.needsUpdate=_,w.lightProbe.needsUpdate=_,w.directionalLights.needsUpdate=_,w.directionalLightShadows.needsUpdate=_,w.pointLights.needsUpdate=_,w.pointLightShadows.needsUpdate=_,w.spotLights.needsUpdate=_,w.spotLightShadows.needsUpdate=_,w.rectAreaLights.needsUpdate=_,w.hemisphereLights.needsUpdate=_}function W(w){return w.isMeshLambertMaterial||w.isMeshToonMaterial||w.isMeshPhongMaterial||w.isMeshStandardMaterial||w.isShadowMaterial||w.isShaderMaterial&&w.lights===!0}this.getActiveCubeFace=function(){return m},this.getActiveMipmapLevel=function(){return y},this.getRenderTarget=function(){return p},this.setRenderTargetTextures=function(w,_,v){bA.get(w.texture).__webglTexture=_,bA.get(w.depthTexture).__webglTexture=v;const H=bA.get(w);H.__hasExternalTextures=!0,H.__hasExternalTextures&&(H.__autoAllocateDepthBuffer=v===void 0,H.__autoAllocateDepthBuffer||MA.has("WEBGL_multisampled_render_to_texture")===!0&&(console.warn("THREE.WebGLRenderer: Render-to-texture extension was disabled because an external texture was provided"),H.__useRenderToTexture=!1))},this.setRenderTargetFramebuffer=function(w,_){const v=bA.get(w);v.__webglFramebuffer=_,v.__useDefaultFramebuffer=_===void 0},this.setRenderTarget=function(w,_=0,v=0){p=w,m=_,y=v;let H=!0,O=null,gA=!1,BA=!1;if(w){const yA=bA.get(w);yA.__useDefaultFramebuffer!==void 0?(SA.bindFramebuffer($.FRAMEBUFFER,null),H=!1):yA.__webglFramebuffer===void 0?LA.setupRenderTarget(w):yA.__hasExternalTextures&&LA.rebindTextures(w,bA.get(w.texture).__webglTexture,bA.get(w.depthTexture).__webglTexture);const vA=w.texture;(vA.isData3DTexture||vA.isDataArrayTexture||vA.isCompressedArrayTexture)&&(BA=!0);const GA=bA.get(w).__webglFramebuffer;w.isWebGLCubeRenderTarget?(O=GA[_],gA=!0):FA.isWebGL2&&w.samples>0&&LA.useMultisampledRTT(w)===!1?O=bA.get(w).__webglMultisampledFramebuffer:O=GA,S.copy(w.viewport),F.copy(w.scissor),G=w.scissorTest}else S.copy(Z).multiplyScalar(K).floor(),F.copy(CA).multiplyScalar(K).floor(),G=q;if(SA.bindFramebuffer($.FRAMEBUFFER,O)&&FA.drawBuffers&&H&&SA.drawBuffers(w,O),SA.viewport(S),SA.scissor(F),SA.setScissorTest(G),gA){const yA=bA.get(w.texture);$.framebufferTexture2D($.FRAMEBUFFER,$.COLOR_ATTACHMENT0,$.TEXTURE_CUBE_MAP_POSITIVE_X+_,yA.__webglTexture,v)}else if(BA){const yA=bA.get(w.texture),vA=_||0;$.framebufferTextureLayer($.FRAMEBUFFER,$.COLOR_ATTACHMENT0,yA.__webglTexture,v||0,vA)}R=-1},this.readRenderTargetPixels=function(w,_,v,H,O,gA,BA){if(!(w&&w.isWebGLRenderTarget)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let pA=bA.get(w).__webglFramebuffer;if(w.isWebGLCubeRenderTarget&&BA!==void 0&&(pA=pA[BA]),pA){SA.bindFramebuffer($.FRAMEBUFFER,pA);try{const yA=w.texture,vA=yA.format,GA=yA.type;if(vA!==me&&DA.convert(vA)!==$.getParameter($.IMPLEMENTATION_COLOR_READ_FORMAT)){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}const dA=GA===_i&&(MA.has("EXT_color_buffer_half_float")||FA.isWebGL2&&MA.has("EXT_color_buffer_float"));if(GA!==an&&DA.convert(GA)!==$.getParameter($.IMPLEMENTATION_COLOR_READ_TYPE)&&!(GA===De&&(FA.isWebGL2||MA.has("OES_texture_float")||MA.has("WEBGL_color_buffer_float")))&&!dA){console.error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}_>=0&&_<=w.width-H&&v>=0&&v<=w.height-O&&$.readPixels(_,v,H,O,DA.convert(vA),DA.convert(GA),gA)}finally{const yA=p!==null?bA.get(p).__webglFramebuffer:null;SA.bindFramebuffer($.FRAMEBUFFER,yA)}}},this.copyFramebufferToTexture=function(w,_,v=0){const H=Math.pow(2,-v),O=Math.floor(_.image.width*H),gA=Math.floor(_.image.height*H);LA.setTexture2D(_,0),$.copyTexSubImage2D($.TEXTURE_2D,v,0,0,w.x,w.y,O,gA),SA.unbindTexture()},this.copyTextureToTexture=function(w,_,v,H=0){const O=_.image.width,gA=_.image.height,BA=DA.convert(v.format),pA=DA.convert(v.type);LA.setTexture2D(v,0),$.pixelStorei($.UNPACK_FLIP_Y_WEBGL,v.flipY),$.pixelStorei($.UNPACK_PREMULTIPLY_ALPHA_WEBGL,v.premultiplyAlpha),$.pixelStorei($.UNPACK_ALIGNMENT,v.unpackAlignment),_.isDataTexture?$.texSubImage2D($.TEXTURE_2D,H,w.x,w.y,O,gA,BA,pA,_.image.data):_.isCompressedTexture?$.compressedTexSubImage2D($.TEXTURE_2D,H,w.x,w.y,_.mipmaps[0].width,_.mipmaps[0].height,BA,_.mipmaps[0].data):$.texSubImage2D($.TEXTURE_2D,H,w.x,w.y,BA,pA,_.image),H===0&&v.generateMipmaps&&$.generateMipmap($.TEXTURE_2D),SA.unbindTexture()},this.copyTextureToTexture3D=function(w,_,v,H,O=0){if(d.isWebGL1Renderer){console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: can only be used with WebGL2.");return}const gA=w.max.x-w.min.x+1,BA=w.max.y-w.min.y+1,pA=w.max.z-w.min.z+1,yA=DA.convert(H.format),vA=DA.convert(H.type);let GA;if(H.isData3DTexture)LA.setTexture3D(H,0),GA=$.TEXTURE_3D;else if(H.isDataArrayTexture)LA.setTexture2DArray(H,0),GA=$.TEXTURE_2D_ARRAY;else{console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: only supports THREE.DataTexture3D and THREE.DataTexture2DArray.");return}$.pixelStorei($.UNPACK_FLIP_Y_WEBGL,H.flipY),$.pixelStorei($.UNPACK_PREMULTIPLY_ALPHA_WEBGL,H.premultiplyAlpha),$.pixelStorei($.UNPACK_ALIGNMENT,H.unpackAlignment);const dA=$.getParameter($.UNPACK_ROW_LENGTH),ot=$.getParameter($.UNPACK_IMAGE_HEIGHT),nt=$.getParameter($.UNPACK_SKIP_PIXELS),Rt=$.getParameter($.UNPACK_SKIP_ROWS),ce=$.getParameter($.UNPACK_SKIP_IMAGES),pt=v.isCompressedTexture?v.mipmaps[0]:v.image;$.pixelStorei($.UNPACK_ROW_LENGTH,pt.width),$.pixelStorei($.UNPACK_IMAGE_HEIGHT,pt.height),$.pixelStorei($.UNPACK_SKIP_PIXELS,w.min.x),$.pixelStorei($.UNPACK_SKIP_ROWS,w.min.y),$.pixelStorei($.UNPACK_SKIP_IMAGES,w.min.z),v.isDataTexture||v.isData3DTexture?$.texSubImage3D(GA,O,_.x,_.y,_.z,gA,BA,pA,yA,vA,pt.data):v.isCompressedArrayTexture?(console.warn("THREE.WebGLRenderer.copyTextureToTexture3D: untested support for compressed srcTexture."),$.compressedTexSubImage3D(GA,O,_.x,_.y,_.z,gA,BA,pA,yA,pt.data)):$.texSubImage3D(GA,O,_.x,_.y,_.z,gA,BA,pA,yA,vA,pt),$.pixelStorei($.UNPACK_ROW_LENGTH,dA),$.pixelStorei($.UNPACK_IMAGE_HEIGHT,ot),$.pixelStorei($.UNPACK_SKIP_PIXELS,nt),$.pixelStorei($.UNPACK_SKIP_ROWS,Rt),$.pixelStorei($.UNPACK_SKIP_IMAGES,ce),O===0&&H.generateMipmaps&&$.generateMipmap(GA),SA.unbindTexture()},this.initTexture=function(w){w.isCubeTexture?LA.setTextureCube(w,0):w.isData3DTexture?LA.setTexture3D(w,0):w.isDataArrayTexture||w.isCompressedArrayTexture?LA.setTexture2DArray(w,0):LA.setTexture2D(w,0),SA.unbindTexture()},this.resetState=function(){m=0,y=0,p=null,SA.reset(),RA.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return Gi}get physicallyCorrectLights(){return console.warn("THREE.WebGLRenderer: the property .physicallyCorrectLights has been removed. Set renderer.useLegacyLights instead."),!this.useLegacyLights}set physicallyCorrectLights(A){console.warn("THREE.WebGLRenderer: the property .physicallyCorrectLights has been removed. Set renderer.useLegacyLights instead."),this.useLegacyLights=!A}get outputEncoding(){return console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace===kA?Pe:kQ}set outputEncoding(A){console.warn("THREE.WebGLRenderer: Property .outputEncoding has been removed. Use .outputColorSpace instead."),this.outputColorSpace=A===Pe?kA:Xe}}class Jm extends ic{}Jm.prototype.isWebGL1Renderer=!0;class Km extends Qt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(A,t){return super.copy(A,t),A.background!==null&&(this.background=A.background.clone()),A.environment!==null&&(this.environment=A.environment.clone()),A.fog!==null&&(this.fog=A.fog.clone()),this.backgroundBlurriness=A.backgroundBlurriness,this.backgroundIntensity=A.backgroundIntensity,A.overrideMaterial!==null&&(this.overrideMaterial=A.overrideMaterial.clone()),this.matrixAutoUpdate=A.matrixAutoUpdate,this}toJSON(A){const t=super.toJSON(A);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),this.backgroundBlurriness>0&&(t.object.backgroundBlurriness=this.backgroundBlurriness),this.backgroundIntensity!==1&&(t.object.backgroundIntensity=this.backgroundIntensity),t}get autoUpdate(){return console.warn("THREE.Scene: autoUpdate was renamed to matrixWorldAutoUpdate in r144."),this.matrixWorldAutoUpdate}set autoUpdate(A){console.warn("THREE.Scene: autoUpdate was renamed to matrixWorldAutoUpdate in r144."),this.matrixWorldAutoUpdate=A}}class Ym{constructor(A,t){this.isInterleavedBuffer=!0,this.array=A,this.stride=t,this.count=A!==void 0?A.length/t:0,this.usage=TI,this.updateRange={offset:0,count:-1},this.version=0,this.uuid=Oe()}onUploadCallback(){}set needsUpdate(A){A===!0&&this.version++}setUsage(A){return this.usage=A,this}copy(A){return this.array=new A.array.constructor(A.array),this.count=A.count,this.stride=A.stride,this.usage=A.usage,this}copyAt(A,t,e){A*=this.stride,e*=t.stride;for(let n=0,s=this.stride;n<s;n++)this.array[A+n]=t.array[e+n];return this}set(A,t=0){return this.array.set(A,t),this}clone(A){A.arrayBuffers===void 0&&(A.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Oe()),A.arrayBuffers[this.array.buffer._uuid]===void 0&&(A.arrayBuffers[this.array.buffer._uuid]=this.array.slice(0).buffer);const t=new this.array.constructor(A.arrayBuffers[this.array.buffer._uuid]),e=new this.constructor(t,this.stride);return e.setUsage(this.usage),e}onUpload(A){return this.onUploadCallback=A,this}toJSON(A){return A.arrayBuffers===void 0&&(A.arrayBuffers={}),this.array.buffer._uuid===void 0&&(this.array.buffer._uuid=Oe()),A.arrayBuffers[this.array.buffer._uuid]===void 0&&(A.arrayBuffers[this.array.buffer._uuid]=Array.from(new Uint32Array(this.array.buffer))),{uuid:this.uuid,buffer:this.array.buffer._uuid,type:this.array.constructor.name,stride:this.stride}}}const Wt=new P;class yB{constructor(A,t,e,n=!1){this.isInterleavedBufferAttribute=!0,this.name="",this.data=A,this.itemSize=t,this.offset=e,this.normalized=n}get count(){return this.data.count}get array(){return this.data.array}set needsUpdate(A){this.data.needsUpdate=A}applyMatrix4(A){for(let t=0,e=this.data.count;t<e;t++)Wt.fromBufferAttribute(this,t),Wt.applyMatrix4(A),this.setXYZ(t,Wt.x,Wt.y,Wt.z);return this}applyNormalMatrix(A){for(let t=0,e=this.count;t<e;t++)Wt.fromBufferAttribute(this,t),Wt.applyNormalMatrix(A),this.setXYZ(t,Wt.x,Wt.y,Wt.z);return this}transformDirection(A){for(let t=0,e=this.count;t<e;t++)Wt.fromBufferAttribute(this,t),Wt.transformDirection(A),this.setXYZ(t,Wt.x,Wt.y,Wt.z);return this}setX(A,t){return this.normalized&&(t=rt(t,this.array)),this.data.array[A*this.data.stride+this.offset]=t,this}setY(A,t){return this.normalized&&(t=rt(t,this.array)),this.data.array[A*this.data.stride+this.offset+1]=t,this}setZ(A,t){return this.normalized&&(t=rt(t,this.array)),this.data.array[A*this.data.stride+this.offset+2]=t,this}setW(A,t){return this.normalized&&(t=rt(t,this.array)),this.data.array[A*this.data.stride+this.offset+3]=t,this}getX(A){let t=this.data.array[A*this.data.stride+this.offset];return this.normalized&&(t=Li(t,this.array)),t}getY(A){let t=this.data.array[A*this.data.stride+this.offset+1];return this.normalized&&(t=Li(t,this.array)),t}getZ(A){let t=this.data.array[A*this.data.stride+this.offset+2];return this.normalized&&(t=Li(t,this.array)),t}getW(A){let t=this.data.array[A*this.data.stride+this.offset+3];return this.normalized&&(t=Li(t,this.array)),t}setXY(A,t,e){return A=A*this.data.stride+this.offset,this.normalized&&(t=rt(t,this.array),e=rt(e,this.array)),this.data.array[A+0]=t,this.data.array[A+1]=e,this}setXYZ(A,t,e,n){return A=A*this.data.stride+this.offset,this.normalized&&(t=rt(t,this.array),e=rt(e,this.array),n=rt(n,this.array)),this.data.array[A+0]=t,this.data.array[A+1]=e,this.data.array[A+2]=n,this}setXYZW(A,t,e,n,s){return A=A*this.data.stride+this.offset,this.normalized&&(t=rt(t,this.array),e=rt(e,this.array),n=rt(n,this.array),s=rt(s,this.array)),this.data.array[A+0]=t,this.data.array[A+1]=e,this.data.array[A+2]=n,this.data.array[A+3]=s,this}clone(A){if(A===void 0){console.log("THREE.InterleavedBufferAttribute.clone(): Cloning an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let e=0;e<this.count;e++){const n=e*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[n+s])}return new Zt(new this.array.constructor(t),this.itemSize,this.normalized)}else return A.interleavedBuffers===void 0&&(A.interleavedBuffers={}),A.interleavedBuffers[this.data.uuid]===void 0&&(A.interleavedBuffers[this.data.uuid]=this.data.clone(A)),new yB(A.interleavedBuffers[this.data.uuid],this.itemSize,this.offset,this.normalized)}toJSON(A){if(A===void 0){console.log("THREE.InterleavedBufferAttribute.toJSON(): Serializing an interleaved buffer attribute will de-interleave buffer data.");const t=[];for(let e=0;e<this.count;e++){const n=e*this.data.stride+this.offset;for(let s=0;s<this.itemSize;s++)t.push(this.data.array[n+s])}return{itemSize:this.itemSize,type:this.array.constructor.name,array:t,normalized:this.normalized}}else return A.interleavedBuffers===void 0&&(A.interleavedBuffers={}),A.interleavedBuffers[this.data.uuid]===void 0&&(A.interleavedBuffers[this.data.uuid]=this.data.toJSON(A)),{isInterleavedBufferAttribute:!0,itemSize:this.itemSize,data:this.data.uuid,offset:this.offset,normalized:this.normalized}}}const IE=new P,BE=new It,CE=new It,Pm=new P,EE=new zA,ls=new P,kg=new Ii,hE=new zA,Tg=new Xr;class Om extends dt{constructor(A,t){super(A,t),this.isSkinnedMesh=!0,this.type="SkinnedMesh",this.bindMode="attached",this.bindMatrix=new zA,this.bindMatrixInverse=new zA,this.boundingBox=null,this.boundingSphere=null}computeBoundingBox(){const A=this.geometry;this.boundingBox===null&&(this.boundingBox=new xe),this.boundingBox.makeEmpty();const t=A.getAttribute("position");for(let e=0;e<t.count;e++)ls.fromBufferAttribute(t,e),this.applyBoneTransform(e,ls),this.boundingBox.expandByPoint(ls)}computeBoundingSphere(){const A=this.geometry;this.boundingSphere===null&&(this.boundingSphere=new Ii),this.boundingSphere.makeEmpty();const t=A.getAttribute("position");for(let e=0;e<t.count;e++)ls.fromBufferAttribute(t,e),this.applyBoneTransform(e,ls),this.boundingSphere.expandByPoint(ls)}copy(A,t){return super.copy(A,t),this.bindMode=A.bindMode,this.bindMatrix.copy(A.bindMatrix),this.bindMatrixInverse.copy(A.bindMatrixInverse),this.skeleton=A.skeleton,A.boundingBox!==null&&(this.boundingBox=A.boundingBox.clone()),A.boundingSphere!==null&&(this.boundingSphere=A.boundingSphere.clone()),this}raycast(A,t){const e=this.material,n=this.matrixWorld;e!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),kg.copy(this.boundingSphere),kg.applyMatrix4(n),A.ray.intersectsSphere(kg)!==!1&&(hE.copy(n).invert(),Tg.copy(A.ray).applyMatrix4(hE),!(this.boundingBox!==null&&Tg.intersectsBox(this.boundingBox)===!1)&&this._computeIntersections(A,t,Tg)))}getVertexPosition(A,t){return super.getVertexPosition(A,t),this.applyBoneTransform(A,t),t}bind(A,t){this.skeleton=A,t===void 0&&(this.updateMatrixWorld(!0),this.skeleton.calculateInverses(),t=this.matrixWorld),this.bindMatrix.copy(t),this.bindMatrixInverse.copy(t).invert()}pose(){this.skeleton.pose()}normalizeSkinWeights(){const A=new It,t=this.geometry.attributes.skinWeight;for(let e=0,n=t.count;e<n;e++){A.fromBufferAttribute(t,e);const s=1/A.manhattanLength();s!==1/0?A.multiplyScalar(s):A.set(1,0,0,0),t.setXYZW(e,A.x,A.y,A.z,A.w)}}updateMatrixWorld(A){super.updateMatrixWorld(A),this.bindMode==="attached"?this.bindMatrixInverse.copy(this.matrixWorld).invert():this.bindMode==="detached"?this.bindMatrixInverse.copy(this.bindMatrix).invert():console.warn("THREE.SkinnedMesh: Unrecognized bindMode: "+this.bindMode)}applyBoneTransform(A,t){const e=this.skeleton,n=this.geometry;BE.fromBufferAttribute(n.attributes.skinIndex,A),CE.fromBufferAttribute(n.attributes.skinWeight,A),IE.copy(t).applyMatrix4(this.bindMatrix),t.set(0,0,0);for(let s=0;s<4;s++){const o=CE.getComponent(s);if(o!==0){const a=BE.getComponent(s);EE.multiplyMatrices(e.bones[a].matrixWorld,e.boneInverses[a]),t.addScaledVector(Pm.copy(IE).applyMatrix4(EE),o)}}return t.applyMatrix4(this.bindMatrixInverse)}boneTransform(A,t){return console.warn("THREE.SkinnedMesh: .boneTransform() was renamed to .applyBoneTransform() in r151."),this.applyBoneTransform(A,t)}}class nc extends Qt{constructor(){super(),this.isBone=!0,this.type="Bone"}}class sc extends Tt{constructor(A=null,t=1,e=1,n,s,o,a,g,r=Ut,I=Ut,B,C){super(null,o,a,g,r,I,n,s,B,C),this.isDataTexture=!0,this.image={data:A,width:t,height:e},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const QE=new zA,Wm=new zA;class DB{constructor(A=[],t=[]){this.uuid=Oe(),this.bones=A.slice(0),this.boneInverses=t,this.boneMatrices=null,this.boneTexture=null,this.boneTextureSize=0,this.frame=-1,this.init()}init(){const A=this.bones,t=this.boneInverses;if(this.boneMatrices=new Float32Array(A.length*16),t.length===0)this.calculateInverses();else if(A.length!==t.length){console.warn("THREE.Skeleton: Number of inverse bone matrices does not match amount of bones."),this.boneInverses=[];for(let e=0,n=this.bones.length;e<n;e++)this.boneInverses.push(new zA)}}calculateInverses(){this.boneInverses.length=0;for(let A=0,t=this.bones.length;A<t;A++){const e=new zA;this.bones[A]&&e.copy(this.bones[A].matrixWorld).invert(),this.boneInverses.push(e)}}pose(){for(let A=0,t=this.bones.length;A<t;A++){const e=this.bones[A];e&&e.matrixWorld.copy(this.boneInverses[A]).invert()}for(let A=0,t=this.bones.length;A<t;A++){const e=this.bones[A];e&&(e.parent&&e.parent.isBone?(e.matrix.copy(e.parent.matrixWorld).invert(),e.matrix.multiply(e.matrixWorld)):e.matrix.copy(e.matrixWorld),e.matrix.decompose(e.position,e.quaternion,e.scale))}}update(){const A=this.bones,t=this.boneInverses,e=this.boneMatrices,n=this.boneTexture;for(let s=0,o=A.length;s<o;s++){const a=A[s]?A[s].matrixWorld:Wm;QE.multiplyMatrices(a,t[s]),QE.toArray(e,s*16)}n!==null&&(n.needsUpdate=!0)}clone(){return new DB(this.bones,this.boneInverses)}computeBoneTexture(){let A=Math.sqrt(this.bones.length*4);A=HQ(A),A=Math.max(A,4);const t=new Float32Array(A*A*4);t.set(this.boneMatrices);const e=new sc(t,A,A,me,De);return e.needsUpdate=!0,this.boneMatrices=t,this.boneTexture=e,this.boneTextureSize=A,this}getBoneByName(A){for(let t=0,e=this.bones.length;t<e;t++){const n=this.bones[t];if(n.name===A)return n}}dispose(){this.boneTexture!==null&&(this.boneTexture.dispose(),this.boneTexture=null)}fromJSON(A,t){this.uuid=A.uuid;for(let e=0,n=A.bones.length;e<n;e++){const s=A.bones[e];let o=t[s];o===void 0&&(console.warn("THREE.Skeleton: No bone found with UUID:",s),o=new nc),this.bones.push(o),this.boneInverses.push(new zA().fromArray(A.boneInverses[e]))}return this.init(),this}toJSON(){const A={metadata:{version:4.6,type:"Skeleton",generator:"Skeleton.toJSON"},bones:[],boneInverses:[]};A.uuid=this.uuid;const t=this.bones,e=this.boneInverses;for(let n=0,s=t.length;n<s;n++){const o=t[n];A.bones.push(o.uuid);const a=e[n];A.boneInverses.push(a.toArray())}return A}}class cE extends Zt{constructor(A,t,e,n=1){super(A,t,e),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=n}copy(A){return super.copy(A),this.meshPerAttribute=A.meshPerAttribute,this}toJSON(){const A=super.toJSON();return A.meshPerAttribute=this.meshPerAttribute,A.isInstancedBufferAttribute=!0,A}}const ds=new zA,lE=new zA,qa=[],dE=new xe,Vm=new zA,po=new dt,mo=new Ii;class zm extends dt{constructor(A,t,e){super(A,t),this.isInstancedMesh=!0,this.instanceMatrix=new cE(new Float32Array(e*16),16),this.instanceColor=null,this.count=e,this.boundingBox=null,this.boundingSphere=null;for(let n=0;n<e;n++)this.setMatrixAt(n,Vm)}computeBoundingBox(){const A=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new xe),A.boundingBox===null&&A.computeBoundingBox(),this.boundingBox.makeEmpty();for(let e=0;e<t;e++)this.getMatrixAt(e,ds),dE.copy(A.boundingBox).applyMatrix4(ds),this.boundingBox.union(dE)}computeBoundingSphere(){const A=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Ii),A.boundingSphere===null&&A.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let e=0;e<t;e++)this.getMatrixAt(e,ds),mo.copy(A.boundingSphere).applyMatrix4(ds),this.boundingSphere.union(mo)}copy(A,t){return super.copy(A,t),this.instanceMatrix.copy(A.instanceMatrix),A.instanceColor!==null&&(this.instanceColor=A.instanceColor.clone()),this.count=A.count,A.boundingBox!==null&&(this.boundingBox=A.boundingBox.clone()),A.boundingSphere!==null&&(this.boundingSphere=A.boundingSphere.clone()),this}getColorAt(A,t){t.fromArray(this.instanceColor.array,A*3)}getMatrixAt(A,t){t.fromArray(this.instanceMatrix.array,A*16)}raycast(A,t){const e=this.matrixWorld,n=this.count;if(po.geometry=this.geometry,po.material=this.material,po.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),mo.copy(this.boundingSphere),mo.applyMatrix4(e),A.ray.intersectsSphere(mo)!==!1))for(let s=0;s<n;s++){this.getMatrixAt(s,ds),lE.multiplyMatrices(e,ds),po.matrixWorld=lE,po.raycast(A,qa);for(let o=0,a=qa.length;o<a;o++){const g=qa[o];g.instanceId=s,g.object=this,t.push(g)}qa.length=0}}setColorAt(A,t){this.instanceColor===null&&(this.instanceColor=new cE(new Float32Array(this.instanceMatrix.count*3),3)),t.toArray(this.instanceColor.array,A*3)}setMatrixAt(A,t){t.toArray(this.instanceMatrix.array,A*16)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"})}}class oc extends We{constructor(A){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new HA(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(A)}copy(A){return super.copy(A),this.color.copy(A.color),this.map=A.map,this.linewidth=A.linewidth,this.linecap=A.linecap,this.linejoin=A.linejoin,this.fog=A.fog,this}}const uE=new P,fE=new P,pE=new zA,Hg=new Xr,Ja=new Ii;class SB extends Qt{constructor(A=new Ze,t=new oc){super(),this.isLine=!0,this.type="Line",this.geometry=A,this.material=t,this.updateMorphTargets()}copy(A,t){return super.copy(A,t),this.material=A.material,this.geometry=A.geometry,this}computeLineDistances(){const A=this.geometry;if(A.index===null){const t=A.attributes.position,e=[0];for(let n=1,s=t.count;n<s;n++)uE.fromBufferAttribute(t,n-1),fE.fromBufferAttribute(t,n),e[n]=e[n-1],e[n]+=uE.distanceTo(fE);A.setAttribute("lineDistance",new we(e,1))}else console.warn("THREE.Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}raycast(A,t){const e=this.geometry,n=this.matrixWorld,s=A.params.Line.threshold,o=e.drawRange;if(e.boundingSphere===null&&e.computeBoundingSphere(),Ja.copy(e.boundingSphere),Ja.applyMatrix4(n),Ja.radius+=s,A.ray.intersectsSphere(Ja)===!1)return;pE.copy(n).invert(),Hg.copy(A.ray).applyMatrix4(pE);const a=s/((this.scale.x+this.scale.y+this.scale.z)/3),g=a*a,r=new P,I=new P,B=new P,C=new P,Q=this.isLineSegments?2:1,c=e.index,h=e.attributes.position;if(c!==null){const E=Math.max(0,o.start),f=Math.min(c.count,o.start+o.count);for(let d=E,u=f-1;d<u;d+=Q){const m=c.getX(d),y=c.getX(d+1);if(r.fromBufferAttribute(h,m),I.fromBufferAttribute(h,y),Hg.distanceSqToSegment(r,I,C,B)>g)continue;C.applyMatrix4(this.matrixWorld);const R=A.ray.origin.distanceTo(C);R<A.near||R>A.far||t.push({distance:R,point:B.clone().applyMatrix4(this.matrixWorld),index:d,face:null,faceIndex:null,object:this})}}else{const E=Math.max(0,o.start),f=Math.min(h.count,o.start+o.count);for(let d=E,u=f-1;d<u;d+=Q){if(r.fromBufferAttribute(h,d),I.fromBufferAttribute(h,d+1),Hg.distanceSqToSegment(r,I,C,B)>g)continue;C.applyMatrix4(this.matrixWorld);const y=A.ray.origin.distanceTo(C);y<A.near||y>A.far||t.push({distance:y,point:B.clone().applyMatrix4(this.matrixWorld),index:d,face:null,faceIndex:null,object:this})}}}updateMorphTargets(){const t=this.geometry.morphAttributes,e=Object.keys(t);if(e.length>0){const n=t[e[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=n.length;s<o;s++){const a=n[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}}const mE=new P,yE=new P;class Xm extends SB{constructor(A,t){super(A,t),this.isLineSegments=!0,this.type="LineSegments"}computeLineDistances(){const A=this.geometry;if(A.index===null){const t=A.attributes.position,e=[];for(let n=0,s=t.count;n<s;n+=2)mE.fromBufferAttribute(t,n),yE.fromBufferAttribute(t,n+1),e[n]=n===0?0:e[n-1],e[n+1]=e[n]+mE.distanceTo(yE);A.setAttribute("lineDistance",new we(e,1))}else console.warn("THREE.LineSegments.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}}class Zm extends SB{constructor(A,t){super(A,t),this.isLineLoop=!0,this.type="LineLoop"}}class ac extends We{constructor(A){super(),this.isPointsMaterial=!0,this.type="PointsMaterial",this.color=new HA(16777215),this.map=null,this.alphaMap=null,this.size=1,this.sizeAttenuation=!0,this.fog=!0,this.setValues(A)}copy(A){return super.copy(A),this.color.copy(A.color),this.map=A.map,this.alphaMap=A.alphaMap,this.size=A.size,this.sizeAttenuation=A.sizeAttenuation,this.fog=A.fog,this}}const DE=new zA,KI=new Xr,Ka=new Ii,Ya=new P;class jm extends Qt{constructor(A=new Ze,t=new ac){super(),this.isPoints=!0,this.type="Points",this.geometry=A,this.material=t,this.updateMorphTargets()}copy(A,t){return super.copy(A,t),this.material=A.material,this.geometry=A.geometry,this}raycast(A,t){const e=this.geometry,n=this.matrixWorld,s=A.params.Points.threshold,o=e.drawRange;if(e.boundingSphere===null&&e.computeBoundingSphere(),Ka.copy(e.boundingSphere),Ka.applyMatrix4(n),Ka.radius+=s,A.ray.intersectsSphere(Ka)===!1)return;DE.copy(n).invert(),KI.copy(A.ray).applyMatrix4(DE);const a=s/((this.scale.x+this.scale.y+this.scale.z)/3),g=a*a,r=e.index,B=e.attributes.position;if(r!==null){const C=Math.max(0,o.start),Q=Math.min(r.count,o.start+o.count);for(let c=C,l=Q;c<l;c++){const h=r.getX(c);Ya.fromBufferAttribute(B,h),SE(Ya,h,g,n,A,t,this)}}else{const C=Math.max(0,o.start),Q=Math.min(B.count,o.start+o.count);for(let c=C,l=Q;c<l;c++)Ya.fromBufferAttribute(B,c),SE(Ya,c,g,n,A,t,this)}}updateMorphTargets(){const t=this.geometry.morphAttributes,e=Object.keys(t);if(e.length>0){const n=t[e[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=n.length;s<o;s++){const a=n[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}}function SE(i,A,t,e,n,s,o){const a=KI.distanceSqToPoint(i);if(a<t){const g=new P;KI.closestPointToPoint(i,g),g.applyMatrix4(e);const r=n.ray.origin.distanceTo(g);if(r<n.near||r>n.far)return;s.push({distance:r,distanceToRay:Math.sqrt(a),point:g,index:A,face:null,object:o})}}class ye extends Ze{constructor(A=1,t=32,e=16,n=0,s=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:A,widthSegments:t,heightSegments:e,phiStart:n,phiLength:s,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),e=Math.max(2,Math.floor(e));const g=Math.min(o+a,Math.PI);let r=0;const I=[],B=new P,C=new P,Q=[],c=[],l=[],h=[];for(let E=0;E<=e;E++){const f=[],d=E/e;let u=0;E===0&&o===0?u=.5/t:E===e&&g===Math.PI&&(u=-.5/t);for(let m=0;m<=t;m++){const y=m/t;B.x=-A*Math.cos(n+y*s)*Math.sin(o+d*a),B.y=A*Math.cos(o+d*a),B.z=A*Math.sin(n+y*s)*Math.sin(o+d*a),c.push(B.x,B.y,B.z),C.copy(B).normalize(),l.push(C.x,C.y,C.z),h.push(y+u,1-d),f.push(r++)}I.push(f)}for(let E=0;E<e;E++)for(let f=0;f<t;f++){const d=I[E][f+1],u=I[E][f],m=I[E+1][f],y=I[E+1][f+1];(E!==0||o>0)&&Q.push(d,u,y),(E!==e-1||g<Math.PI)&&Q.push(u,m,y)}this.setIndex(Q),this.setAttribute("position",new we(c,3)),this.setAttribute("normal",new we(l,3)),this.setAttribute("uv",new we(h,2))}copy(A){return super.copy(A),this.parameters=Object.assign({},A.parameters),this}static fromJSON(A){return new ye(A.radius,A.widthSegments,A.heightSegments,A.phiStart,A.phiLength,A.thetaStart,A.thetaLength)}}class Ao extends We{constructor(A){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new HA(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new HA(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=lB,this.normalScale=new TA(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(A)}copy(A){return super.copy(A),this.defines={STANDARD:""},this.color.copy(A.color),this.roughness=A.roughness,this.metalness=A.metalness,this.map=A.map,this.lightMap=A.lightMap,this.lightMapIntensity=A.lightMapIntensity,this.aoMap=A.aoMap,this.aoMapIntensity=A.aoMapIntensity,this.emissive.copy(A.emissive),this.emissiveMap=A.emissiveMap,this.emissiveIntensity=A.emissiveIntensity,this.bumpMap=A.bumpMap,this.bumpScale=A.bumpScale,this.normalMap=A.normalMap,this.normalMapType=A.normalMapType,this.normalScale.copy(A.normalScale),this.displacementMap=A.displacementMap,this.displacementScale=A.displacementScale,this.displacementBias=A.displacementBias,this.roughnessMap=A.roughnessMap,this.metalnessMap=A.metalnessMap,this.alphaMap=A.alphaMap,this.envMap=A.envMap,this.envMapIntensity=A.envMapIntensity,this.wireframe=A.wireframe,this.wireframeLinewidth=A.wireframeLinewidth,this.wireframeLinecap=A.wireframeLinecap,this.wireframeLinejoin=A.wireframeLinejoin,this.flatShading=A.flatShading,this.fog=A.fog,this}}class hn extends Ao{constructor(A){super(),this.isMeshPhysicalMaterial=!0,this.defines={STANDARD:"",PHYSICAL:""},this.type="MeshPhysicalMaterial",this.anisotropyRotation=0,this.anisotropyMap=null,this.clearcoatMap=null,this.clearcoatRoughness=0,this.clearcoatRoughnessMap=null,this.clearcoatNormalScale=new TA(1,1),this.clearcoatNormalMap=null,this.ior=1.5,Object.defineProperty(this,"reflectivity",{get:function(){return bt(2.5*(this.ior-1)/(this.ior+1),0,1)},set:function(t){this.ior=(1+.4*t)/(1-.4*t)}}),this.iridescenceMap=null,this.iridescenceIOR=1.3,this.iridescenceThicknessRange=[100,400],this.iridescenceThicknessMap=null,this.sheenColor=new HA(0),this.sheenColorMap=null,this.sheenRoughness=1,this.sheenRoughnessMap=null,this.transmissionMap=null,this.thickness=0,this.thicknessMap=null,this.attenuationDistance=1/0,this.attenuationColor=new HA(1,1,1),this.specularIntensity=1,this.specularIntensityMap=null,this.specularColor=new HA(1,1,1),this.specularColorMap=null,this._anisotropy=0,this._clearcoat=0,this._iridescence=0,this._sheen=0,this._transmission=0,this.setValues(A)}get anisotropy(){return this._anisotropy}set anisotropy(A){this._anisotropy>0!=A>0&&this.version++,this._anisotropy=A}get clearcoat(){return this._clearcoat}set clearcoat(A){this._clearcoat>0!=A>0&&this.version++,this._clearcoat=A}get iridescence(){return this._iridescence}set iridescence(A){this._iridescence>0!=A>0&&this.version++,this._iridescence=A}get sheen(){return this._sheen}set sheen(A){this._sheen>0!=A>0&&this.version++,this._sheen=A}get transmission(){return this._transmission}set transmission(A){this._transmission>0!=A>0&&this.version++,this._transmission=A}copy(A){return super.copy(A),this.defines={STANDARD:"",PHYSICAL:""},this.anisotropy=A.anisotropy,this.anisotropyRotation=A.anisotropyRotation,this.anisotropyMap=A.anisotropyMap,this.clearcoat=A.clearcoat,this.clearcoatMap=A.clearcoatMap,this.clearcoatRoughness=A.clearcoatRoughness,this.clearcoatRoughnessMap=A.clearcoatRoughnessMap,this.clearcoatNormalMap=A.clearcoatNormalMap,this.clearcoatNormalScale.copy(A.clearcoatNormalScale),this.ior=A.ior,this.iridescence=A.iridescence,this.iridescenceMap=A.iridescenceMap,this.iridescenceIOR=A.iridescenceIOR,this.iridescenceThicknessRange=[...A.iridescenceThicknessRange],this.iridescenceThicknessMap=A.iridescenceThicknessMap,this.sheen=A.sheen,this.sheenColor.copy(A.sheenColor),this.sheenColorMap=A.sheenColorMap,this.sheenRoughness=A.sheenRoughness,this.sheenRoughnessMap=A.sheenRoughnessMap,this.transmission=A.transmission,this.transmissionMap=A.transmissionMap,this.thickness=A.thickness,this.thicknessMap=A.thicknessMap,this.attenuationDistance=A.attenuationDistance,this.attenuationColor.copy(A.attenuationColor),this.specularIntensity=A.specularIntensity,this.specularIntensityMap=A.specularIntensityMap,this.specularColor.copy(A.specularColor),this.specularColorMap=A.specularColorMap,this}}class $m extends We{constructor(A){super(),this.isMeshPhongMaterial=!0,this.type="MeshPhongMaterial",this.color=new HA(16777215),this.specular=new HA(1118481),this.shininess=30,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new HA(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=lB,this.normalScale=new TA(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=QB,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(A)}copy(A){return super.copy(A),this.color.copy(A.color),this.specular.copy(A.specular),this.shininess=A.shininess,this.map=A.map,this.lightMap=A.lightMap,this.lightMapIntensity=A.lightMapIntensity,this.aoMap=A.aoMap,this.aoMapIntensity=A.aoMapIntensity,this.emissive.copy(A.emissive),this.emissiveMap=A.emissiveMap,this.emissiveIntensity=A.emissiveIntensity,this.bumpMap=A.bumpMap,this.bumpScale=A.bumpScale,this.normalMap=A.normalMap,this.normalMapType=A.normalMapType,this.normalScale.copy(A.normalScale),this.displacementMap=A.displacementMap,this.displacementScale=A.displacementScale,this.displacementBias=A.displacementBias,this.specularMap=A.specularMap,this.alphaMap=A.alphaMap,this.envMap=A.envMap,this.combine=A.combine,this.reflectivity=A.reflectivity,this.refractionRatio=A.refractionRatio,this.wireframe=A.wireframe,this.wireframeLinewidth=A.wireframeLinewidth,this.wireframeLinecap=A.wireframeLinecap,this.wireframeLinejoin=A.wireframeLinejoin,this.flatShading=A.flatShading,this.fog=A.fog,this}}function Yi(i,A,t){return rc(i)?new i.constructor(i.subarray(A,t!==void 0?t:i.length)):i.slice(A,t)}function Pa(i,A,t){return!i||!t&&i.constructor===A?i:typeof A.BYTES_PER_ELEMENT=="number"?new A(i):Array.prototype.slice.call(i)}function rc(i){return ArrayBuffer.isView(i)&&!(i instanceof DataView)}function Ay(i){function A(n,s){return i[n]-i[s]}const t=i.length,e=new Array(t);for(let n=0;n!==t;++n)e[n]=n;return e.sort(A),e}function wE(i,A,t){const e=i.length,n=new i.constructor(e);for(let s=0,o=0;o!==e;++s){const a=t[s]*A;for(let g=0;g!==A;++g)n[o++]=i[a+g]}return n}function gc(i,A,t,e){let n=1,s=i[0];for(;s!==void 0&&s[e]===void 0;)s=i[n++];if(s===void 0)return;let o=s[e];if(o!==void 0)if(Array.isArray(o))do o=s[e],o!==void 0&&(A.push(s.time),t.push.apply(t,o)),s=i[n++];while(s!==void 0);else if(o.toArray!==void 0)do o=s[e],o!==void 0&&(A.push(s.time),o.toArray(t,t.length)),s=i[n++];while(s!==void 0);else do o=s[e],o!==void 0&&(A.push(s.time),t.push(o)),s=i[n++];while(s!==void 0)}class ga{constructor(A,t,e,n){this.parameterPositions=A,this._cachedIndex=0,this.resultBuffer=n!==void 0?n:new t.constructor(e),this.sampleValues=t,this.valueSize=e,this.settings=null,this.DefaultSettings_={}}evaluate(A){const t=this.parameterPositions;let e=this._cachedIndex,n=t[e],s=t[e-1];A:{t:{let o;e:{i:if(!(A<n)){for(let a=e+2;;){if(n===void 0){if(A<s)break i;return e=t.length,this._cachedIndex=e,this.copySampleValue_(e-1)}if(e===a)break;if(s=n,n=t[++e],A<n)break t}o=t.length;break e}if(!(A>=s)){const a=t[1];A<a&&(e=2,s=a);for(let g=e-2;;){if(s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(e===g)break;if(n=s,s=t[--e-1],A>=s)break t}o=e,e=0;break e}break A}for(;e<o;){const a=e+o>>>1;A<t[a]?o=a:e=a+1}if(n=t[e],s=t[e-1],s===void 0)return this._cachedIndex=0,this.copySampleValue_(0);if(n===void 0)return e=t.length,this._cachedIndex=e,this.copySampleValue_(e-1)}this._cachedIndex=e,this.intervalChanged_(e,s,n)}return this.interpolate_(e,s,A,n)}getSettings_(){return this.settings||this.DefaultSettings_}copySampleValue_(A){const t=this.resultBuffer,e=this.sampleValues,n=this.valueSize,s=A*n;for(let o=0;o!==n;++o)t[o]=e[s+o];return t}interpolate_(){throw new Error("call to abstract method")}intervalChanged_(){}}class ty extends ga{constructor(A,t,e,n){super(A,t,e,n),this._weightPrev=-0,this._offsetPrev=-0,this._weightNext=-0,this._offsetNext=-0,this.DefaultSettings_={endingStart:mC,endingEnd:mC}}intervalChanged_(A,t,e){const n=this.parameterPositions;let s=A-2,o=A+1,a=n[s],g=n[o];if(a===void 0)switch(this.getSettings_().endingStart){case yC:s=A,a=2*t-e;break;case DC:s=n.length-2,a=t+n[s]-n[s+1];break;default:s=A,a=e}if(g===void 0)switch(this.getSettings_().endingEnd){case yC:o=A,g=2*e-t;break;case DC:o=1,g=e+n[1]-n[0];break;default:o=A-1,g=t}const r=(e-t)*.5,I=this.valueSize;this._weightPrev=r/(t-a),this._weightNext=r/(g-e),this._offsetPrev=s*I,this._offsetNext=o*I}interpolate_(A,t,e,n){const s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,g=A*a,r=g-a,I=this._offsetPrev,B=this._offsetNext,C=this._weightPrev,Q=this._weightNext,c=(e-t)/(n-t),l=c*c,h=l*c,E=-C*h+2*C*l-C*c,f=(1+C)*h+(-1.5-2*C)*l+(-.5+C)*c+1,d=(-1-Q)*h+(1.5+Q)*l+.5*c,u=Q*h-Q*l;for(let m=0;m!==a;++m)s[m]=E*o[I+m]+f*o[r+m]+d*o[g+m]+u*o[B+m];return s}}class ey extends ga{constructor(A,t,e,n){super(A,t,e,n)}interpolate_(A,t,e,n){const s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,g=A*a,r=g-a,I=(e-t)/(n-t),B=1-I;for(let C=0;C!==a;++C)s[C]=o[r+C]*B+o[g+C]*I;return s}}class iy extends ga{constructor(A,t,e,n){super(A,t,e,n)}interpolate_(A){return this.copySampleValue_(A-1)}}class Bi{constructor(A,t,e,n){if(A===void 0)throw new Error("THREE.KeyframeTrack: track name is undefined");if(t===void 0||t.length===0)throw new Error("THREE.KeyframeTrack: no keyframes in track named "+A);this.name=A,this.times=Pa(t,this.TimeBufferType),this.values=Pa(e,this.ValueBufferType),this.setInterpolation(n||this.DefaultInterpolation)}static toJSON(A){const t=A.constructor;let e;if(t.toJSON!==this.toJSON)e=t.toJSON(A);else{e={name:A.name,times:Pa(A.times,Array),values:Pa(A.values,Array)};const n=A.getInterpolation();n!==A.DefaultInterpolation&&(e.interpolation=n)}return e.type=A.ValueTypeName,e}InterpolantFactoryMethodDiscrete(A){return new iy(this.times,this.values,this.getValueSize(),A)}InterpolantFactoryMethodLinear(A){return new ey(this.times,this.values,this.getValueSize(),A)}InterpolantFactoryMethodSmooth(A){return new ty(this.times,this.values,this.getValueSize(),A)}setInterpolation(A){let t;switch(A){case Wo:t=this.InterpolantFactoryMethodDiscrete;break;case Zs:t=this.InterpolantFactoryMethodLinear;break;case Qg:t=this.InterpolantFactoryMethodSmooth;break}if(t===void 0){const e="unsupported interpolation for "+this.ValueTypeName+" keyframe track named "+this.name;if(this.createInterpolant===void 0)if(A!==this.DefaultInterpolation)this.setInterpolation(this.DefaultInterpolation);else throw new Error(e);return console.warn("THREE.KeyframeTrack:",e),this}return this.createInterpolant=t,this}getInterpolation(){switch(this.createInterpolant){case this.InterpolantFactoryMethodDiscrete:return Wo;case this.InterpolantFactoryMethodLinear:return Zs;case this.InterpolantFactoryMethodSmooth:return Qg}}getValueSize(){return this.values.length/this.times.length}shift(A){if(A!==0){const t=this.times;for(let e=0,n=t.length;e!==n;++e)t[e]+=A}return this}scale(A){if(A!==1){const t=this.times;for(let e=0,n=t.length;e!==n;++e)t[e]*=A}return this}trim(A,t){const e=this.times,n=e.length;let s=0,o=n-1;for(;s!==n&&e[s]<A;)++s;for(;o!==-1&&e[o]>t;)--o;if(++o,s!==0||o!==n){s>=o&&(o=Math.max(o,1),s=o-1);const a=this.getValueSize();this.times=Yi(e,s,o),this.values=Yi(this.values,s*a,o*a)}return this}validate(){let A=!0;const t=this.getValueSize();t-Math.floor(t)!==0&&(console.error("THREE.KeyframeTrack: Invalid value size in track.",this),A=!1);const e=this.times,n=this.values,s=e.length;s===0&&(console.error("THREE.KeyframeTrack: Track is empty.",this),A=!1);let o=null;for(let a=0;a!==s;a++){const g=e[a];if(typeof g=="number"&&isNaN(g)){console.error("THREE.KeyframeTrack: Time is not a valid number.",this,a,g),A=!1;break}if(o!==null&&o>g){console.error("THREE.KeyframeTrack: Out of order keys.",this,a,g,o),A=!1;break}o=g}if(n!==void 0&&rc(n))for(let a=0,g=n.length;a!==g;++a){const r=n[a];if(isNaN(r)){console.error("THREE.KeyframeTrack: Value is not a valid number.",this,a,r),A=!1;break}}return A}optimize(){const A=Yi(this.times),t=Yi(this.values),e=this.getValueSize(),n=this.getInterpolation()===Qg,s=A.length-1;let o=1;for(let a=1;a<s;++a){let g=!1;const r=A[a],I=A[a+1];if(r!==I&&(a!==1||r!==A[0]))if(n)g=!0;else{const B=a*e,C=B-e,Q=B+e;for(let c=0;c!==e;++c){const l=t[B+c];if(l!==t[C+c]||l!==t[Q+c]){g=!0;break}}}if(g){if(a!==o){A[o]=A[a];const B=a*e,C=o*e;for(let Q=0;Q!==e;++Q)t[C+Q]=t[B+Q]}++o}}if(s>0){A[o]=A[s];for(let a=s*e,g=o*e,r=0;r!==e;++r)t[g+r]=t[a+r];++o}return o!==A.length?(this.times=Yi(A,0,o),this.values=Yi(t,0,o*e)):(this.times=A,this.values=t),this}clone(){const A=Yi(this.times,0),t=Yi(this.values,0),e=this.constructor,n=new e(this.name,A,t);return n.createInterpolant=this.createInterpolant,n}}Bi.prototype.TimeBufferType=Float32Array;Bi.prototype.ValueBufferType=Float32Array;Bi.prototype.DefaultInterpolation=Zs;class no extends Bi{}no.prototype.ValueTypeName="bool";no.prototype.ValueBufferType=Array;no.prototype.DefaultInterpolation=Wo;no.prototype.InterpolantFactoryMethodLinear=void 0;no.prototype.InterpolantFactoryMethodSmooth=void 0;class Ic extends Bi{}Ic.prototype.ValueTypeName="color";class zo extends Bi{}zo.prototype.ValueTypeName="number";class ny extends ga{constructor(A,t,e,n){super(A,t,e,n)}interpolate_(A,t,e,n){const s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,g=(e-t)/(n-t);let r=A*a;for(let I=r+a;r!==I;r+=4)gi.slerpFlat(s,0,o,r-a,o,r,g);return s}}class Jn extends Bi{InterpolantFactoryMethodLinear(A){return new ny(this.times,this.values,this.getValueSize(),A)}}Jn.prototype.ValueTypeName="quaternion";Jn.prototype.DefaultInterpolation=Zs;Jn.prototype.InterpolantFactoryMethodSmooth=void 0;class so extends Bi{}so.prototype.ValueTypeName="string";so.prototype.ValueBufferType=Array;so.prototype.DefaultInterpolation=Wo;so.prototype.InterpolantFactoryMethodLinear=void 0;so.prototype.InterpolantFactoryMethodSmooth=void 0;class Xo extends Bi{}Xo.prototype.ValueTypeName="vector";class sy{constructor(A,t=-1,e,n=rd){this.name=A,this.tracks=e,this.duration=t,this.blendMode=n,this.uuid=Oe(),this.duration<0&&this.resetDuration()}static parse(A){const t=[],e=A.tracks,n=1/(A.fps||1);for(let o=0,a=e.length;o!==a;++o)t.push(ay(e[o]).scale(n));const s=new this(A.name,A.duration,t,A.blendMode);return s.uuid=A.uuid,s}static toJSON(A){const t=[],e=A.tracks,n={name:A.name,duration:A.duration,tracks:t,uuid:A.uuid,blendMode:A.blendMode};for(let s=0,o=e.length;s!==o;++s)t.push(Bi.toJSON(e[s]));return n}static CreateFromMorphTargetSequence(A,t,e,n){const s=t.length,o=[];for(let a=0;a<s;a++){let g=[],r=[];g.push((a+s-1)%s,a,(a+1)%s),r.push(0,1,0);const I=Ay(g);g=wE(g,1,I),r=wE(r,1,I),!n&&g[0]===0&&(g.push(s),r.push(r[0])),o.push(new zo(".morphTargetInfluences["+t[a].name+"]",g,r).scale(1/e))}return new this(A,-1,o)}static findByName(A,t){let e=A;if(!Array.isArray(A)){const n=A;e=n.geometry&&n.geometry.animations||n.animations}for(let n=0;n<e.length;n++)if(e[n].name===t)return e[n];return null}static CreateClipsFromMorphTargetSequences(A,t,e){const n={},s=/^([\w-]*?)([\d]+)$/;for(let a=0,g=A.length;a<g;a++){const r=A[a],I=r.name.match(s);if(I&&I.length>1){const B=I[1];let C=n[B];C||(n[B]=C=[]),C.push(r)}}const o=[];for(const a in n)o.push(this.CreateFromMorphTargetSequence(a,n[a],t,e));return o}static parseAnimation(A,t){if(!A)return console.error("THREE.AnimationClip: No animation in JSONLoader data."),null;const e=function(B,C,Q,c,l){if(Q.length!==0){const h=[],E=[];gc(Q,h,E,c),h.length!==0&&l.push(new B(C,h,E))}},n=[],s=A.name||"default",o=A.fps||30,a=A.blendMode;let g=A.length||-1;const r=A.hierarchy||[];for(let B=0;B<r.length;B++){const C=r[B].keys;if(!(!C||C.length===0))if(C[0].morphTargets){const Q={};let c;for(c=0;c<C.length;c++)if(C[c].morphTargets)for(let l=0;l<C[c].morphTargets.length;l++)Q[C[c].morphTargets[l]]=-1;for(const l in Q){const h=[],E=[];for(let f=0;f!==C[c].morphTargets.length;++f){const d=C[c];h.push(d.time),E.push(d.morphTarget===l?1:0)}n.push(new zo(".morphTargetInfluence["+l+"]",h,E))}g=Q.length*o}else{const Q=".bones["+t[B].name+"]";e(Xo,Q+".position",C,"pos",n),e(Jn,Q+".quaternion",C,"rot",n),e(Xo,Q+".scale",C,"scl",n)}}return n.length===0?null:new this(s,g,n,a)}resetDuration(){const A=this.tracks;let t=0;for(let e=0,n=A.length;e!==n;++e){const s=this.tracks[e];t=Math.max(t,s.times[s.times.length-1])}return this.duration=t,this}trim(){for(let A=0;A<this.tracks.length;A++)this.tracks[A].trim(0,this.duration);return this}validate(){let A=!0;for(let t=0;t<this.tracks.length;t++)A=A&&this.tracks[t].validate();return A}optimize(){for(let A=0;A<this.tracks.length;A++)this.tracks[A].optimize();return this}clone(){const A=[];for(let t=0;t<this.tracks.length;t++)A.push(this.tracks[t].clone());return new this.constructor(this.name,this.duration,A,this.blendMode)}toJSON(){return this.constructor.toJSON(this)}}function oy(i){switch(i.toLowerCase()){case"scalar":case"double":case"float":case"number":case"integer":return zo;case"vector":case"vector2":case"vector3":case"vector4":return Xo;case"color":return Ic;case"quaternion":return Jn;case"bool":case"boolean":return no;case"string":return so}throw new Error("THREE.KeyframeTrack: Unsupported typeName: "+i)}function ay(i){if(i.type===void 0)throw new Error("THREE.KeyframeTrack: track type undefined, can not parse");const A=oy(i.type);if(i.times===void 0){const t=[],e=[];gc(i.keys,t,e,"value"),i.times=t,i.values=e}return A.parse!==void 0?A.parse(i):new A(i.name,i.times,i.values,i.interpolation)}const to={enabled:!1,files:{},add:function(i,A){this.enabled!==!1&&(this.files[i]=A)},get:function(i){if(this.enabled!==!1)return this.files[i]},remove:function(i){delete this.files[i]},clear:function(){this.files={}}};class ry{constructor(A,t,e){const n=this;let s=!1,o=0,a=0,g;const r=[];this.onStart=void 0,this.onLoad=A,this.onProgress=t,this.onError=e,this.itemStart=function(I){a++,s===!1&&n.onStart!==void 0&&n.onStart(I,o,a),s=!0},this.itemEnd=function(I){o++,n.onProgress!==void 0&&n.onProgress(I,o,a),o===a&&(s=!1,n.onLoad!==void 0&&n.onLoad())},this.itemError=function(I){n.onError!==void 0&&n.onError(I)},this.resolveURL=function(I){return g?g(I):I},this.setURLModifier=function(I){return g=I,this},this.addHandler=function(I,B){return r.push(I,B),this},this.removeHandler=function(I){const B=r.indexOf(I);return B!==-1&&r.splice(B,2),this},this.getHandler=function(I){for(let B=0,C=r.length;B<C;B+=2){const Q=r[B],c=r[B+1];if(Q.global&&(Q.lastIndex=0),Q.test(I))return c}return null}}}const gy=new ry;class oo{constructor(A){this.manager=A!==void 0?A:gy,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(A,t){const e=this;return new Promise(function(n,s){e.load(A,n,t,s)})}parse(){}setCrossOrigin(A){return this.crossOrigin=A,this}setWithCredentials(A){return this.withCredentials=A,this}setPath(A){return this.path=A,this}setResourcePath(A){return this.resourcePath=A,this}setRequestHeader(A){return this.requestHeader=A,this}}const ui={};class Iy extends Error{constructor(A,t){super(A),this.response=t}}class wB extends oo{constructor(A){super(A)}load(A,t,e,n){A===void 0&&(A=""),this.path!==void 0&&(A=this.path+A),A=this.manager.resolveURL(A);const s=to.get(A);if(s!==void 0)return this.manager.itemStart(A),setTimeout(()=>{t&&t(s),this.manager.itemEnd(A)},0),s;if(ui[A]!==void 0){ui[A].push({onLoad:t,onProgress:e,onError:n});return}ui[A]=[],ui[A].push({onLoad:t,onProgress:e,onError:n});const o=new Request(A,{headers:new Headers(this.requestHeader),credentials:this.withCredentials?"include":"same-origin"}),a=this.mimeType,g=this.responseType;fetch(o).then(r=>{if(r.status===200||r.status===0){if(r.status===0&&console.warn("THREE.FileLoader: HTTP Status 0 received."),typeof ReadableStream>"u"||r.body===void 0||r.body.getReader===void 0)return r;const I=ui[A],B=r.body.getReader(),C=r.headers.get("Content-Length")||r.headers.get("X-File-Size"),Q=C?parseInt(C):0,c=Q!==0;let l=0;const h=new ReadableStream({start(E){f();function f(){B.read().then(({done:d,value:u})=>{if(d)E.close();else{l+=u.byteLength;const m=new ProgressEvent("progress",{lengthComputable:c,loaded:l,total:Q});for(let y=0,p=I.length;y<p;y++){const R=I[y];R.onProgress&&R.onProgress(m)}E.enqueue(u),f()}})}}});return new Response(h)}else throw new Iy(`fetch for "${r.url}" responded with ${r.status}: ${r.statusText}`,r)}).then(r=>{switch(g){case"arraybuffer":return r.arrayBuffer();case"blob":return r.blob();case"document":return r.text().then(I=>new DOMParser().parseFromString(I,a));case"json":return r.json();default:if(a===void 0)return r.text();{const B=/charset="?([^;"\s]*)"?/i.exec(a),C=B&&B[1]?B[1].toLowerCase():void 0,Q=new TextDecoder(C);return r.arrayBuffer().then(c=>Q.decode(c))}}}).then(r=>{to.add(A,r);const I=ui[A];delete ui[A];for(let B=0,C=I.length;B<C;B++){const Q=I[B];Q.onLoad&&Q.onLoad(r)}}).catch(r=>{const I=ui[A];if(I===void 0)throw this.manager.itemError(A),r;delete ui[A];for(let B=0,C=I.length;B<C;B++){const Q=I[B];Q.onError&&Q.onError(r)}this.manager.itemError(A)}).finally(()=>{this.manager.itemEnd(A)}),this.manager.itemStart(A)}setResponseType(A){return this.responseType=A,this}setMimeType(A){return this.mimeType=A,this}}class By extends oo{constructor(A){super(A)}load(A,t,e,n){this.path!==void 0&&(A=this.path+A),A=this.manager.resolveURL(A);const s=this,o=to.get(A);if(o!==void 0)return s.manager.itemStart(A),setTimeout(function(){t&&t(o),s.manager.itemEnd(A)},0),o;const a=Vo("img");function g(){I(),to.add(A,this),t&&t(this),s.manager.itemEnd(A)}function r(B){I(),n&&n(B),s.manager.itemError(A),s.manager.itemEnd(A)}function I(){a.removeEventListener("load",g,!1),a.removeEventListener("error",r,!1)}return a.addEventListener("load",g,!1),a.addEventListener("error",r,!1),A.slice(0,5)!=="data:"&&this.crossOrigin!==void 0&&(a.crossOrigin=this.crossOrigin),s.manager.itemStart(A),a.src=A,a}}class Cy extends oo{constructor(A){super(A)}load(A,t,e,n){const s=this,o=new sc,a=new wB(this.manager);return a.setResponseType("arraybuffer"),a.setRequestHeader(this.requestHeader),a.setPath(this.path),a.setWithCredentials(s.withCredentials),a.load(A,function(g){const r=s.parse(g);!r||(r.image!==void 0?o.image=r.image:r.data!==void 0&&(o.image.width=r.width,o.image.height=r.height,o.image.data=r.data),o.wrapS=r.wrapS!==void 0?r.wrapS:Yt,o.wrapT=r.wrapT!==void 0?r.wrapT:Yt,o.magFilter=r.magFilter!==void 0?r.magFilter:Dt,o.minFilter=r.minFilter!==void 0?r.minFilter:Dt,o.anisotropy=r.anisotropy!==void 0?r.anisotropy:1,r.colorSpace!==void 0?o.colorSpace=r.colorSpace:r.encoding!==void 0&&(o.encoding=r.encoding),r.flipY!==void 0&&(o.flipY=r.flipY),r.format!==void 0&&(o.format=r.format),r.type!==void 0&&(o.type=r.type),r.mipmaps!==void 0&&(o.mipmaps=r.mipmaps,o.minFilter=En),r.mipmapCount===1&&(o.minFilter=Dt),r.generateMipmaps!==void 0&&(o.generateMipmaps=r.generateMipmaps),o.needsUpdate=!0,t&&t(o,r))},e,n),o}}class Bc extends oo{constructor(A){super(A)}load(A,t,e,n){const s=new Tt,o=new By(this.manager);return o.setCrossOrigin(this.crossOrigin),o.setPath(this.path),o.load(A,function(a){s.image=a,s.needsUpdate=!0,t!==void 0&&t(s)},e,n),s}}class $r extends Qt{constructor(A,t=1){super(),this.isLight=!0,this.type="Light",this.color=new HA(A),this.intensity=t}dispose(){}copy(A,t){return super.copy(A,t),this.color.copy(A.color),this.intensity=A.intensity,this}toJSON(A){const t=super.toJSON(A);return t.object.color=this.color.getHex(),t.object.intensity=this.intensity,this.groundColor!==void 0&&(t.object.groundColor=this.groundColor.getHex()),this.distance!==void 0&&(t.object.distance=this.distance),this.angle!==void 0&&(t.object.angle=this.angle),this.decay!==void 0&&(t.object.decay=this.decay),this.penumbra!==void 0&&(t.object.penumbra=this.penumbra),this.shadow!==void 0&&(t.object.shadow=this.shadow.toJSON()),t}}class Cc extends $r{constructor(A,t,e){super(A,e),this.isHemisphereLight=!0,this.type="HemisphereLight",this.position.copy(Qt.DEFAULT_UP),this.updateMatrix(),this.groundColor=new HA(t)}copy(A,t){return super.copy(A,t),this.groundColor.copy(A.groundColor),this}}const qg=new zA,ME=new P,RE=new P;class MB{constructor(A){this.camera=A,this.bias=0,this.normalBias=0,this.radius=1,this.blurSamples=8,this.mapSize=new TA(512,512),this.map=null,this.mapPass=null,this.matrix=new zA,this.autoUpdate=!0,this.needsUpdate=!1,this._frustum=new uB,this._frameExtents=new TA(1,1),this._viewportCount=1,this._viewports=[new It(0,0,1,1)]}getViewportCount(){return this._viewportCount}getFrustum(){return this._frustum}updateMatrices(A){const t=this.camera,e=this.matrix;ME.setFromMatrixPosition(A.matrixWorld),t.position.copy(ME),RE.setFromMatrixPosition(A.target.matrixWorld),t.lookAt(RE),t.updateMatrixWorld(),qg.multiplyMatrices(t.projectionMatrix,t.matrixWorldInverse),this._frustum.setFromProjectionMatrix(qg),e.set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1),e.multiply(qg)}getViewport(A){return this._viewports[A]}getFrameExtents(){return this._frameExtents}dispose(){this.map&&this.map.dispose(),this.mapPass&&this.mapPass.dispose()}copy(A){return this.camera=A.camera.clone(),this.bias=A.bias,this.radius=A.radius,this.mapSize.copy(A.mapSize),this}clone(){return new this.constructor().copy(this)}toJSON(){const A={};return this.bias!==0&&(A.bias=this.bias),this.normalBias!==0&&(A.normalBias=this.normalBias),this.radius!==1&&(A.radius=this.radius),(this.mapSize.x!==512||this.mapSize.y!==512)&&(A.mapSize=this.mapSize.toArray()),A.camera=this.camera.toJSON(!1).object,delete A.camera.matrix,A}}class Ey extends MB{constructor(){super(new zt(50,1,.5,500)),this.isSpotLightShadow=!0,this.focus=1}updateMatrices(A){const t=this.camera,e=js*2*A.angle*this.focus,n=this.mapSize.width/this.mapSize.height,s=A.distance||t.far;(e!==t.fov||n!==t.aspect||s!==t.far)&&(t.fov=e,t.aspect=n,t.far=s,t.updateProjectionMatrix()),super.updateMatrices(A)}copy(A){return super.copy(A),this.focus=A.focus,this}}class RB extends $r{constructor(A,t,e=0,n=Math.PI/3,s=0,o=2){super(A,t),this.isSpotLight=!0,this.type="SpotLight",this.position.copy(Qt.DEFAULT_UP),this.updateMatrix(),this.target=new Qt,this.distance=e,this.angle=n,this.penumbra=s,this.decay=o,this.map=null,this.shadow=new Ey}get power(){return this.intensity*Math.PI}set power(A){this.intensity=A/Math.PI}dispose(){this.shadow.dispose()}copy(A,t){return super.copy(A,t),this.distance=A.distance,this.angle=A.angle,this.penumbra=A.penumbra,this.decay=A.decay,this.target=A.target.clone(),this.shadow=A.shadow.clone(),this}}const FE=new zA,yo=new P,Jg=new P;class hy extends MB{constructor(){super(new zt(90,1,.5,500)),this.isPointLightShadow=!0,this._frameExtents=new TA(4,2),this._viewportCount=6,this._viewports=[new It(2,1,1,1),new It(0,1,1,1),new It(3,1,1,1),new It(1,1,1,1),new It(3,0,1,1),new It(1,0,1,1)],this._cubeDirections=[new P(1,0,0),new P(-1,0,0),new P(0,0,1),new P(0,0,-1),new P(0,1,0),new P(0,-1,0)],this._cubeUps=[new P(0,1,0),new P(0,1,0),new P(0,1,0),new P(0,1,0),new P(0,0,1),new P(0,0,-1)]}updateMatrices(A,t=0){const e=this.camera,n=this.matrix,s=A.distance||e.far;s!==e.far&&(e.far=s,e.updateProjectionMatrix()),yo.setFromMatrixPosition(A.matrixWorld),e.position.copy(yo),Jg.copy(e.position),Jg.add(this._cubeDirections[t]),e.up.copy(this._cubeUps[t]),e.lookAt(Jg),e.updateMatrixWorld(),n.makeTranslation(-yo.x,-yo.y,-yo.z),FE.multiplyMatrices(e.projectionMatrix,e.matrixWorldInverse),this._frustum.setFromProjectionMatrix(FE)}}class FB extends $r{constructor(A,t,e=0,n=2){super(A,t),this.isPointLight=!0,this.type="PointLight",this.distance=e,this.decay=n,this.shadow=new hy}get power(){return this.intensity*4*Math.PI}set power(A){this.intensity=A/(4*Math.PI)}dispose(){this.shadow.dispose()}copy(A,t){return super.copy(A,t),this.distance=A.distance,this.decay=A.decay,this.shadow=A.shadow.clone(),this}}class Qy extends MB{constructor(){super(new pB(-5,5,5,-5,.5,500)),this.isDirectionalLightShadow=!0}}class Ia extends $r{constructor(A,t){super(A,t),this.isDirectionalLight=!0,this.type="DirectionalLight",this.position.copy(Qt.DEFAULT_UP),this.updateMatrix(),this.target=new Qt,this.shadow=new Qy}dispose(){this.shadow.dispose()}copy(A){return super.copy(A),this.target=A.target.clone(),this.shadow=A.shadow.clone(),this}}class YI{static decodeText(A){if(typeof TextDecoder<"u")return new TextDecoder().decode(A);let t="";for(let e=0,n=A.length;e<n;e++)t+=String.fromCharCode(A[e]);try{return decodeURIComponent(escape(t))}catch{return t}}static extractUrlBase(A){const t=A.lastIndexOf("/");return t===-1?"./":A.slice(0,t+1)}static resolveURL(A,t){return typeof A!="string"||A===""?"":(/^https?:\/\//i.test(t)&&/^\//.test(A)&&(t=t.replace(/(^https?:\/\/[^\/]+).*/i,"$1")),/^(https?:)?\/\//i.test(A)||/^data:.*,.*$/i.test(A)||/^blob:.*$/i.test(A)?A:t+A)}}class cy extends oo{constructor(A){super(A),this.isImageBitmapLoader=!0,typeof createImageBitmap>"u"&&console.warn("THREE.ImageBitmapLoader: createImageBitmap() not supported."),typeof fetch>"u"&&console.warn("THREE.ImageBitmapLoader: fetch() not supported."),this.options={premultiplyAlpha:"none"}}setOptions(A){return this.options=A,this}load(A,t,e,n){A===void 0&&(A=""),this.path!==void 0&&(A=this.path+A),A=this.manager.resolveURL(A);const s=this,o=to.get(A);if(o!==void 0)return s.manager.itemStart(A),setTimeout(function(){t&&t(o),s.manager.itemEnd(A)},0),o;const a={};a.credentials=this.crossOrigin==="anonymous"?"same-origin":"include",a.headers=this.requestHeader,fetch(A,a).then(function(g){return g.blob()}).then(function(g){return createImageBitmap(g,Object.assign(s.options,{colorSpaceConversion:"none"}))}).then(function(g){to.add(A,g),t&&t(g),s.manager.itemEnd(A)}).catch(function(g){n&&n(g),s.manager.itemError(A),s.manager.itemEnd(A)}),s.manager.itemStart(A)}}const xB="\\[\\]\\.:\\/",ly=new RegExp("["+xB+"]","g"),NB="[^"+xB+"]",dy="[^"+xB.replace("\\.","")+"]",uy=/((?:WC+[\/:])*)/.source.replace("WC",NB),fy=/(WCOD+)?/.source.replace("WCOD",dy),py=/(?:\.(WC+)(?:\[(.+)\])?)?/.source.replace("WC",NB),my=/\.(WC+)(?:\[(.+)\])?/.source.replace("WC",NB),yy=new RegExp("^"+uy+fy+py+my+"$"),Dy=["material","materials","bones","map"];class Sy{constructor(A,t,e){const n=e||st.parseTrackName(t);this._targetGroup=A,this._bindings=A.subscribe_(t,n)}getValue(A,t){this.bind();const e=this._targetGroup.nCachedObjects_,n=this._bindings[e];n!==void 0&&n.getValue(A,t)}setValue(A,t){const e=this._bindings;for(let n=this._targetGroup.nCachedObjects_,s=e.length;n!==s;++n)e[n].setValue(A,t)}bind(){const A=this._bindings;for(let t=this._targetGroup.nCachedObjects_,e=A.length;t!==e;++t)A[t].bind()}unbind(){const A=this._bindings;for(let t=this._targetGroup.nCachedObjects_,e=A.length;t!==e;++t)A[t].unbind()}}class st{constructor(A,t,e){this.path=t,this.parsedPath=e||st.parseTrackName(t),this.node=st.findNode(A,this.parsedPath.nodeName),this.rootNode=A,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}static create(A,t,e){return A&&A.isAnimationObjectGroup?new st.Composite(A,t,e):new st(A,t,e)}static sanitizeNodeName(A){return A.replace(/\s/g,"_").replace(ly,"")}static parseTrackName(A){const t=yy.exec(A);if(t===null)throw new Error("PropertyBinding: Cannot parse trackName: "+A);const e={nodeName:t[2],objectName:t[3],objectIndex:t[4],propertyName:t[5],propertyIndex:t[6]},n=e.nodeName&&e.nodeName.lastIndexOf(".");if(n!==void 0&&n!==-1){const s=e.nodeName.substring(n+1);Dy.indexOf(s)!==-1&&(e.nodeName=e.nodeName.substring(0,n),e.objectName=s)}if(e.propertyName===null||e.propertyName.length===0)throw new Error("PropertyBinding: can not parse propertyName from trackName: "+A);return e}static findNode(A,t){if(t===void 0||t===""||t==="."||t===-1||t===A.name||t===A.uuid)return A;if(A.skeleton){const e=A.skeleton.getBoneByName(t);if(e!==void 0)return e}if(A.children){const e=function(s){for(let o=0;o<s.length;o++){const a=s[o];if(a.name===t||a.uuid===t)return a;const g=e(a.children);if(g)return g}return null},n=e(A.children);if(n)return n}return null}_getValue_unavailable(){}_setValue_unavailable(){}_getValue_direct(A,t){A[t]=this.targetObject[this.propertyName]}_getValue_array(A,t){const e=this.resolvedProperty;for(let n=0,s=e.length;n!==s;++n)A[t++]=e[n]}_getValue_arrayElement(A,t){A[t]=this.resolvedProperty[this.propertyIndex]}_getValue_toArray(A,t){this.resolvedProperty.toArray(A,t)}_setValue_direct(A,t){this.targetObject[this.propertyName]=A[t]}_setValue_direct_setNeedsUpdate(A,t){this.targetObject[this.propertyName]=A[t],this.targetObject.needsUpdate=!0}_setValue_direct_setMatrixWorldNeedsUpdate(A,t){this.targetObject[this.propertyName]=A[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_array(A,t){const e=this.resolvedProperty;for(let n=0,s=e.length;n!==s;++n)e[n]=A[t++]}_setValue_array_setNeedsUpdate(A,t){const e=this.resolvedProperty;for(let n=0,s=e.length;n!==s;++n)e[n]=A[t++];this.targetObject.needsUpdate=!0}_setValue_array_setMatrixWorldNeedsUpdate(A,t){const e=this.resolvedProperty;for(let n=0,s=e.length;n!==s;++n)e[n]=A[t++];this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_arrayElement(A,t){this.resolvedProperty[this.propertyIndex]=A[t]}_setValue_arrayElement_setNeedsUpdate(A,t){this.resolvedProperty[this.propertyIndex]=A[t],this.targetObject.needsUpdate=!0}_setValue_arrayElement_setMatrixWorldNeedsUpdate(A,t){this.resolvedProperty[this.propertyIndex]=A[t],this.targetObject.matrixWorldNeedsUpdate=!0}_setValue_fromArray(A,t){this.resolvedProperty.fromArray(A,t)}_setValue_fromArray_setNeedsUpdate(A,t){this.resolvedProperty.fromArray(A,t),this.targetObject.needsUpdate=!0}_setValue_fromArray_setMatrixWorldNeedsUpdate(A,t){this.resolvedProperty.fromArray(A,t),this.targetObject.matrixWorldNeedsUpdate=!0}_getValue_unbound(A,t){this.bind(),this.getValue(A,t)}_setValue_unbound(A,t){this.bind(),this.setValue(A,t)}bind(){let A=this.node;const t=this.parsedPath,e=t.objectName,n=t.propertyName;let s=t.propertyIndex;if(A||(A=st.findNode(this.rootNode,t.nodeName),this.node=A),this.getValue=this._getValue_unavailable,this.setValue=this._setValue_unavailable,!A){console.error("THREE.PropertyBinding: Trying to update node for track: "+this.path+" but it wasn't found.");return}if(e){let r=t.objectIndex;switch(e){case"materials":if(!A.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!A.material.materials){console.error("THREE.PropertyBinding: Can not bind to material.materials as node.material does not have a materials array.",this);return}A=A.material.materials;break;case"bones":if(!A.skeleton){console.error("THREE.PropertyBinding: Can not bind to bones as node does not have a skeleton.",this);return}A=A.skeleton.bones;for(let I=0;I<A.length;I++)if(A[I].name===r){r=I;break}break;case"map":if("map"in A){A=A.map;break}if(!A.material){console.error("THREE.PropertyBinding: Can not bind to material as node does not have a material.",this);return}if(!A.material.map){console.error("THREE.PropertyBinding: Can not bind to material.map as node.material does not have a map.",this);return}A=A.material.map;break;default:if(A[e]===void 0){console.error("THREE.PropertyBinding: Can not bind to objectName of node undefined.",this);return}A=A[e]}if(r!==void 0){if(A[r]===void 0){console.error("THREE.PropertyBinding: Trying to bind to objectIndex of objectName, but is undefined.",this,A);return}A=A[r]}}const o=A[n];if(o===void 0){const r=t.nodeName;console.error("THREE.PropertyBinding: Trying to update property for track: "+r+"."+n+" but it wasn't found.",A);return}let a=this.Versioning.None;this.targetObject=A,A.needsUpdate!==void 0?a=this.Versioning.NeedsUpdate:A.matrixWorldNeedsUpdate!==void 0&&(a=this.Versioning.MatrixWorldNeedsUpdate);let g=this.BindingType.Direct;if(s!==void 0){if(n==="morphTargetInfluences"){if(!A.geometry){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.",this);return}if(!A.geometry.morphAttributes){console.error("THREE.PropertyBinding: Can not bind to morphTargetInfluences because node does not have a geometry.morphAttributes.",this);return}A.morphTargetDictionary[s]!==void 0&&(s=A.morphTargetDictionary[s])}g=this.BindingType.ArrayElement,this.resolvedProperty=o,this.propertyIndex=s}else o.fromArray!==void 0&&o.toArray!==void 0?(g=this.BindingType.HasFromToArray,this.resolvedProperty=o):Array.isArray(o)?(g=this.BindingType.EntireArray,this.resolvedProperty=o):this.propertyName=n;this.getValue=this.GetterByBindingType[g],this.setValue=this.SetterByBindingTypeAndVersioning[g][a]}unbind(){this.node=null,this.getValue=this._getValue_unbound,this.setValue=this._setValue_unbound}}st.Composite=Sy;st.prototype.BindingType={Direct:0,EntireArray:1,ArrayElement:2,HasFromToArray:3};st.prototype.Versioning={None:0,NeedsUpdate:1,MatrixWorldNeedsUpdate:2};st.prototype.GetterByBindingType=[st.prototype._getValue_direct,st.prototype._getValue_array,st.prototype._getValue_arrayElement,st.prototype._getValue_toArray];st.prototype.SetterByBindingTypeAndVersioning=[[st.prototype._setValue_direct,st.prototype._setValue_direct_setNeedsUpdate,st.prototype._setValue_direct_setMatrixWorldNeedsUpdate],[st.prototype._setValue_array,st.prototype._setValue_array_setNeedsUpdate,st.prototype._setValue_array_setMatrixWorldNeedsUpdate],[st.prototype._setValue_arrayElement,st.prototype._setValue_arrayElement_setNeedsUpdate,st.prototype._setValue_arrayElement_setMatrixWorldNeedsUpdate],[st.prototype._setValue_fromArray,st.prototype._setValue_fromArray_setNeedsUpdate,st.prototype._setValue_fromArray_setMatrixWorldNeedsUpdate]];class xE{constructor(A=1,t=0,e=0){return this.radius=A,this.phi=t,this.theta=e,this}set(A,t,e){return this.radius=A,this.phi=t,this.theta=e,this}copy(A){return this.radius=A.radius,this.phi=A.phi,this.theta=A.theta,this}makeSafe(){return this.phi=Math.max(1e-6,Math.min(Math.PI-1e-6,this.phi)),this}setFromVector3(A){return this.setFromCartesianCoords(A.x,A.y,A.z)}setFromCartesianCoords(A,t,e){return this.radius=Math.sqrt(A*A+t*t+e*e),this.radius===0?(this.theta=0,this.phi=0):(this.theta=Math.atan2(A,e),this.phi=Math.acos(bt(t/this.radius,-1,1))),this}clone(){return new this.constructor().copy(this)}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:hB}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=hB);const NE={type:"change"},Kg={type:"start"},_E={type:"end"};class wy extends Vn{constructor(A,t){super(),this.object=A,this.domElement=t,this.domElement.style.touchAction="none",this.enabled=!0,this.target=new P,this.minDistance=0,this.maxDistance=1/0,this.minZoom=0,this.maxZoom=1/0,this.minPolarAngle=0,this.maxPolarAngle=Math.PI,this.minAzimuthAngle=-1/0,this.maxAzimuthAngle=1/0,this.enableDamping=!1,this.dampingFactor=.05,this.enableZoom=!0,this.zoomSpeed=1,this.enableRotate=!0,this.rotateSpeed=1,this.enablePan=!0,this.panSpeed=1,this.screenSpacePanning=!0,this.keyPanSpeed=7,this.autoRotate=!1,this.autoRotateSpeed=2,this.keys={LEFT:"ArrowLeft",UP:"ArrowUp",RIGHT:"ArrowRight",BOTTOM:"ArrowDown"},this.mouseButtons={LEFT:$n.ROTATE,MIDDLE:$n.DOLLY,RIGHT:$n.PAN},this.touches={ONE:As.ROTATE,TWO:As.DOLLY_PAN},this.target0=this.target.clone(),this.position0=this.object.position.clone(),this.zoom0=this.object.zoom,this._domElementKeyEvents=null,this.getPolarAngle=function(){return a.phi},this.getAzimuthalAngle=function(){return a.theta},this.getDistance=function(){return this.object.position.distanceTo(this.target)},this.listenToKeyEvents=function(x){x.addEventListener("keydown",PA),this._domElementKeyEvents=x},this.stopListenToKeyEvents=function(){this._domElementKeyEvents.removeEventListener("keydown",PA),this._domElementKeyEvents=null},this.saveState=function(){e.target0.copy(e.target),e.position0.copy(e.object.position),e.zoom0=e.object.zoom},this.reset=function(){e.target.copy(e.target0),e.object.position.copy(e.position0),e.object.zoom=e.zoom0,e.object.updateProjectionMatrix(),e.dispatchEvent(NE),e.update(),s=n.NONE},this.update=function(){const x=new P,AA=new gi().setFromUnitVectors(A.up,new P(0,1,0)),sA=AA.clone().invert(),z=new P,IA=new gi,lA=new P,EA=2*Math.PI;return function(){const RA=e.object.position;x.copy(RA).sub(e.target),x.applyQuaternion(AA),a.setFromVector3(x),e.autoRotate&&s===n.NONE&&D(p()),e.enableDamping?(a.theta+=g.theta*e.dampingFactor,a.phi+=g.phi*e.dampingFactor):(a.theta+=g.theta,a.phi+=g.phi);let UA=e.minAzimuthAngle,WA=e.maxAzimuthAngle;return isFinite(UA)&&isFinite(WA)&&(UA<-Math.PI?UA+=EA:UA>Math.PI&&(UA-=EA),WA<-Math.PI?WA+=EA:WA>Math.PI&&(WA-=EA),UA<=WA?a.theta=Math.max(UA,Math.min(WA,a.theta)):a.theta=a.theta>(UA+WA)/2?Math.max(UA,a.theta):Math.min(WA,a.theta)),a.phi=Math.max(e.minPolarAngle,Math.min(e.maxPolarAngle,a.phi)),a.makeSafe(),a.radius*=r,a.radius=Math.max(e.minDistance,Math.min(e.maxDistance,a.radius)),e.enableDamping===!0?e.target.addScaledVector(I,e.dampingFactor):e.target.add(I),x.setFromSpherical(a),x.applyQuaternion(sA),RA.copy(e.target).add(x),e.object.lookAt(e.target),e.enableDamping===!0?(g.theta*=1-e.dampingFactor,g.phi*=1-e.dampingFactor,I.multiplyScalar(1-e.dampingFactor)):(g.set(0,0,0),I.set(0,0,0)),r=1,B||z.distanceToSquared(e.object.position)>o||8*(1-IA.dot(e.object.quaternion))>o||lA.distanceToSquared(e.target)>0?(e.dispatchEvent(NE),z.copy(e.object.position),IA.copy(e.object.quaternion),lA.copy(e.target),B=!1,!0):!1}}(),this.dispose=function(){e.domElement.removeEventListener("contextmenu",N),e.domElement.removeEventListener("pointerdown",MA),e.domElement.removeEventListener("pointercancel",SA),e.domElement.removeEventListener("wheel",LA),e.domElement.removeEventListener("pointermove",FA),e.domElement.removeEventListener("pointerup",SA),e._domElementKeyEvents!==null&&(e._domElementKeyEvents.removeEventListener("keydown",PA),e._domElementKeyEvents=null)};const e=this,n={NONE:-1,ROTATE:0,DOLLY:1,PAN:2,TOUCH_ROTATE:3,TOUCH_PAN:4,TOUCH_DOLLY_PAN:5,TOUCH_DOLLY_ROTATE:6};let s=n.NONE;const o=1e-6,a=new xE,g=new xE;let r=1;const I=new P;let B=!1;const C=new TA,Q=new TA,c=new TA,l=new TA,h=new TA,E=new TA,f=new TA,d=new TA,u=new TA,m=[],y={};function p(){return 2*Math.PI/60/60*e.autoRotateSpeed}function R(){return Math.pow(.95,e.zoomSpeed)}function D(x){g.theta-=x}function S(x){g.phi-=x}const F=function(){const x=new P;return function(sA,z){x.setFromMatrixColumn(z,0),x.multiplyScalar(-sA),I.add(x)}}(),G=function(){const x=new P;return function(sA,z){e.screenSpacePanning===!0?x.setFromMatrixColumn(z,1):(x.setFromMatrixColumn(z,0),x.crossVectors(e.object.up,x)),x.multiplyScalar(sA),I.add(x)}}(),L=function(){const x=new P;return function(sA,z){const IA=e.domElement;if(e.object.isPerspectiveCamera){const lA=e.object.position;x.copy(lA).sub(e.target);let EA=x.length();EA*=Math.tan(e.object.fov/2*Math.PI/180),F(2*sA*EA/IA.clientHeight,e.object.matrix),G(2*z*EA/IA.clientHeight,e.object.matrix)}else e.object.isOrthographicCamera?(F(sA*(e.object.right-e.object.left)/e.object.zoom/IA.clientWidth,e.object.matrix),G(z*(e.object.top-e.object.bottom)/e.object.zoom/IA.clientHeight,e.object.matrix)):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."),e.enablePan=!1)}}();function T(x){e.object.isPerspectiveCamera?r/=x:e.object.isOrthographicCamera?(e.object.zoom=Math.max(e.minZoom,Math.min(e.maxZoom,e.object.zoom*x)),e.object.updateProjectionMatrix(),B=!0):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),e.enableZoom=!1)}function b(x){e.object.isPerspectiveCamera?r*=x:e.object.isOrthographicCamera?(e.object.zoom=Math.max(e.minZoom,Math.min(e.maxZoom,e.object.zoom/x)),e.object.updateProjectionMatrix(),B=!0):(console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."),e.enableZoom=!1)}function V(x){C.set(x.clientX,x.clientY)}function K(x){f.set(x.clientX,x.clientY)}function tA(x){l.set(x.clientX,x.clientY)}function nA(x){Q.set(x.clientX,x.clientY),c.subVectors(Q,C).multiplyScalar(e.rotateSpeed);const AA=e.domElement;D(2*Math.PI*c.x/AA.clientHeight),S(2*Math.PI*c.y/AA.clientHeight),C.copy(Q),e.update()}function Z(x){d.set(x.clientX,x.clientY),u.subVectors(d,f),u.y>0?T(R()):u.y<0&&b(R()),f.copy(d),e.update()}function CA(x){h.set(x.clientX,x.clientY),E.subVectors(h,l).multiplyScalar(e.panSpeed),L(E.x,E.y),l.copy(h),e.update()}function q(x){x.deltaY<0?b(R()):x.deltaY>0&&T(R()),e.update()}function eA(x){let AA=!1;switch(x.code){case e.keys.UP:x.ctrlKey||x.metaKey||x.shiftKey?S(2*Math.PI*e.rotateSpeed/e.domElement.clientHeight):L(0,e.keyPanSpeed),AA=!0;break;case e.keys.BOTTOM:x.ctrlKey||x.metaKey||x.shiftKey?S(-2*Math.PI*e.rotateSpeed/e.domElement.clientHeight):L(0,-e.keyPanSpeed),AA=!0;break;case e.keys.LEFT:x.ctrlKey||x.metaKey||x.shiftKey?D(2*Math.PI*e.rotateSpeed/e.domElement.clientHeight):L(e.keyPanSpeed,0),AA=!0;break;case e.keys.RIGHT:x.ctrlKey||x.metaKey||x.shiftKey?D(-2*Math.PI*e.rotateSpeed/e.domElement.clientHeight):L(-e.keyPanSpeed,0),AA=!0;break}AA&&(x.preventDefault(),e.update())}function oA(){if(m.length===1)C.set(m[0].pageX,m[0].pageY);else{const x=.5*(m[0].pageX+m[1].pageX),AA=.5*(m[0].pageY+m[1].pageY);C.set(x,AA)}}function aA(){if(m.length===1)l.set(m[0].pageX,m[0].pageY);else{const x=.5*(m[0].pageX+m[1].pageX),AA=.5*(m[0].pageY+m[1].pageY);l.set(x,AA)}}function QA(){const x=m[0].pageX-m[1].pageX,AA=m[0].pageY-m[1].pageY,sA=Math.sqrt(x*x+AA*AA);f.set(0,sA)}function wA(){e.enableZoom&&QA(),e.enablePan&&aA()}function NA(){e.enableZoom&&QA(),e.enableRotate&&oA()}function xA(x){if(m.length==1)Q.set(x.pageX,x.pageY);else{const sA=j(x),z=.5*(x.pageX+sA.x),IA=.5*(x.pageY+sA.y);Q.set(z,IA)}c.subVectors(Q,C).multiplyScalar(e.rotateSpeed);const AA=e.domElement;D(2*Math.PI*c.x/AA.clientHeight),S(2*Math.PI*c.y/AA.clientHeight),C.copy(Q)}function it(x){if(m.length===1)h.set(x.pageX,x.pageY);else{const AA=j(x),sA=.5*(x.pageX+AA.x),z=.5*(x.pageY+AA.y);h.set(sA,z)}E.subVectors(h,l).multiplyScalar(e.panSpeed),L(E.x,E.y),l.copy(h)}function _A(x){const AA=j(x),sA=x.pageX-AA.x,z=x.pageY-AA.y,IA=Math.sqrt(sA*sA+z*z);d.set(0,IA),u.set(0,Math.pow(d.y/f.y,e.zoomSpeed)),T(u.y),f.copy(d)}function $(x){e.enableZoom&&_A(x),e.enablePan&&it(x)}function JA(x){e.enableZoom&&_A(x),e.enableRotate&&xA(x)}function MA(x){e.enabled!==!1&&(m.length===0&&(e.domElement.setPointerCapture(x.pointerId),e.domElement.addEventListener("pointermove",FA),e.domElement.addEventListener("pointerup",SA)),M(x),x.pointerType==="touch"?YA(x):qA(x))}function FA(x){e.enabled!==!1&&(x.pointerType==="touch"?$A(x):bA(x))}function SA(x){k(x),m.length===0&&(e.domElement.releasePointerCapture(x.pointerId),e.domElement.removeEventListener("pointermove",FA),e.domElement.removeEventListener("pointerup",SA)),e.dispatchEvent(_E),s=n.NONE}function qA(x){let AA;switch(x.button){case 0:AA=e.mouseButtons.LEFT;break;case 1:AA=e.mouseButtons.MIDDLE;break;case 2:AA=e.mouseButtons.RIGHT;break;default:AA=-1}switch(AA){case $n.DOLLY:if(e.enableZoom===!1)return;K(x),s=n.DOLLY;break;case $n.ROTATE:if(x.ctrlKey||x.metaKey||x.shiftKey){if(e.enablePan===!1)return;tA(x),s=n.PAN}else{if(e.enableRotate===!1)return;V(x),s=n.ROTATE}break;case $n.PAN:if(x.ctrlKey||x.metaKey||x.shiftKey){if(e.enableRotate===!1)return;V(x),s=n.ROTATE}else{if(e.enablePan===!1)return;tA(x),s=n.PAN}break;default:s=n.NONE}s!==n.NONE&&e.dispatchEvent(Kg)}function bA(x){switch(s){case n.ROTATE:if(e.enableRotate===!1)return;nA(x);break;case n.DOLLY:if(e.enableZoom===!1)return;Z(x);break;case n.PAN:if(e.enablePan===!1)return;CA(x);break}}function LA(x){e.enabled===!1||e.enableZoom===!1||s!==n.NONE||(x.preventDefault(),e.dispatchEvent(Kg),q(x),e.dispatchEvent(_E))}function PA(x){e.enabled===!1||e.enablePan===!1||eA(x)}function YA(x){switch(X(x),m.length){case 1:switch(e.touches.ONE){case As.ROTATE:if(e.enableRotate===!1)return;oA(),s=n.TOUCH_ROTATE;break;case As.PAN:if(e.enablePan===!1)return;aA(),s=n.TOUCH_PAN;break;default:s=n.NONE}break;case 2:switch(e.touches.TWO){case As.DOLLY_PAN:if(e.enableZoom===!1&&e.enablePan===!1)return;wA(),s=n.TOUCH_DOLLY_PAN;break;case As.DOLLY_ROTATE:if(e.enableZoom===!1&&e.enableRotate===!1)return;NA(),s=n.TOUCH_DOLLY_ROTATE;break;default:s=n.NONE}break;default:s=n.NONE}s!==n.NONE&&e.dispatchEvent(Kg)}function $A(x){switch(X(x),s){case n.TOUCH_ROTATE:if(e.enableRotate===!1)return;xA(x),e.update();break;case n.TOUCH_PAN:if(e.enablePan===!1)return;it(x),e.update();break;case n.TOUCH_DOLLY_PAN:if(e.enableZoom===!1&&e.enablePan===!1)return;$(x),e.update();break;case n.TOUCH_DOLLY_ROTATE:if(e.enableZoom===!1&&e.enableRotate===!1)return;JA(x),e.update();break;default:s=n.NONE}}function N(x){e.enabled!==!1&&x.preventDefault()}function M(x){m.push(x)}function k(x){delete y[x.pointerId];for(let AA=0;AA<m.length;AA++)if(m[AA].pointerId==x.pointerId){m.splice(AA,1);return}}function X(x){let AA=y[x.pointerId];AA===void 0&&(AA=new TA,y[x.pointerId]=AA),AA.set(x.pageX,x.pageY)}function j(x){const AA=x.pointerId===m[0].pointerId?m[1]:m[0];return y[AA.pointerId]}e.domElement.addEventListener("contextmenu",N),e.domElement.addEventListener("pointerdown",MA),e.domElement.addEventListener("pointercancel",SA),e.domElement.addEventListener("wheel",LA,{passive:!1}),this.update()}}var My=typeof globalThis<"u"?globalThis:typeof window<"u"?window:typeof global<"u"?global:typeof self<"u"?self:{},Ec={exports:{}};(function(i,A){(function(t,e){i.exports=e()})(My,function(){var t=function(){function e(Q){return o.appendChild(Q.dom),Q}function n(Q){for(var c=0;c<o.children.length;c++)o.children[c].style.display=c===Q?"block":"none";s=Q}var s=0,o=document.createElement("div");o.style.cssText="position:fixed;top:0;left:0;cursor:pointer;opacity:0.9;z-index:10000",o.addEventListener("click",function(Q){Q.preventDefault(),n(++s%o.children.length)},!1);var a=(performance||Date).now(),g=a,r=0,I=e(new t.Panel("FPS","#0ff","#002")),B=e(new t.Panel("MS","#0f0","#020"));if(self.performance&&self.performance.memory)var C=e(new t.Panel("MB","#f08","#201"));return n(0),{REVISION:16,dom:o,addPanel:e,showPanel:n,begin:function(){a=(performance||Date).now()},end:function(){r++;var Q=(performance||Date).now();if(B.update(Q-a,200),Q>g+1e3&&(I.update(1e3*r/(Q-g),100),g=Q,r=0,C)){var c=performance.memory;C.update(c.usedJSHeapSize/1048576,c.jsHeapSizeLimit/1048576)}return Q},update:function(){a=this.end()},domElement:o,setMode:n}};return t.Panel=function(e,n,s){var o=1/0,a=0,g=Math.round,r=g(window.devicePixelRatio||1),I=80*r,B=48*r,C=3*r,Q=2*r,c=3*r,l=15*r,h=74*r,E=30*r,f=document.createElement("canvas");f.width=I,f.height=B,f.style.cssText="width:80px;height:48px";var d=f.getContext("2d");return d.font="bold "+9*r+"px Helvetica,Arial,sans-serif",d.textBaseline="top",d.fillStyle=s,d.fillRect(0,0,I,B),d.fillStyle=n,d.fillText(e,C,Q),d.fillRect(c,l,h,E),d.fillStyle=s,d.globalAlpha=.9,d.fillRect(c,l,h,E),{dom:f,update:function(u,m){o=Math.min(o,u),a=Math.max(a,u),d.fillStyle=s,d.globalAlpha=1,d.fillRect(0,0,I,l),d.fillStyle=n,d.fillText(g(u)+" "+e+" ("+g(o)+"-"+g(a)+")",C,Q),d.drawImage(f,c+r,l,h-r,E,c,l,h-r,E),d.fillRect(c+h-r,l,r,E),d.fillStyle=s,d.globalAlpha=.9,d.fillRect(c+h-r,l,r,g((1-u/m)*E))}}},t})})(Ec);const Ry=Ec.exports;/**
 * @license
 * Copyright 2010-2023 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const hc="153",PI=0,Qc=1,Fy=2,GE=1,xy=100,Ny=204,_y=205,Gy=3,Ly=0,cc=300,vr=1e3,ni=1001,kr=1002,eo=1003,fe=1006,Uy=1008,by=1009,vy=1014,ky=1015,Ty=1020,lc=1023,Yg=1026,LE=1027,Oa=1028,Hy=3e3,yr=3001,qy=0,Dr="",he="srgb",_B="srgb-linear",dc="display-p3",Pg=7680,Jy=519,UE=35044,Wa=2e3,bE=2001;class Ba{addEventListener(A,t){this._listeners===void 0&&(this._listeners={});const e=this._listeners;e[A]===void 0&&(e[A]=[]),e[A].indexOf(t)===-1&&e[A].push(t)}hasEventListener(A,t){if(this._listeners===void 0)return!1;const e=this._listeners;return e[A]!==void 0&&e[A].indexOf(t)!==-1}removeEventListener(A,t){if(this._listeners===void 0)return;const n=this._listeners[A];if(n!==void 0){const s=n.indexOf(t);s!==-1&&n.splice(s,1)}}dispatchEvent(A){if(this._listeners===void 0)return;const e=this._listeners[A.type];if(e!==void 0){A.target=this;const n=e.slice(0);for(let s=0,o=n.length;s<o;s++)n[s].call(this,A);A.target=null}}}const Jt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"];function Ca(){const i=Math.random()*4294967295|0,A=Math.random()*4294967295|0,t=Math.random()*4294967295|0,e=Math.random()*4294967295|0;return(Jt[i&255]+Jt[i>>8&255]+Jt[i>>16&255]+Jt[i>>24&255]+"-"+Jt[A&255]+Jt[A>>8&255]+"-"+Jt[A>>16&15|64]+Jt[A>>24&255]+"-"+Jt[t&63|128]+Jt[t>>8&255]+"-"+Jt[t>>16&255]+Jt[t>>24&255]+Jt[e&255]+Jt[e>>8&255]+Jt[e>>16&255]+Jt[e>>24&255]).toLowerCase()}function te(i,A,t){return Math.max(A,Math.min(t,i))}function Ky(i,A){return(i%A+A)%A}function Og(i,A,t){return(1-t)*i+t*A}function Va(i,A){switch(A.constructor){case Float32Array:return i;case Uint32Array:return i/4294967295;case Uint16Array:return i/65535;case Uint8Array:return i/255;case Int32Array:return Math.max(i/2147483647,-1);case Int16Array:return Math.max(i/32767,-1);case Int8Array:return Math.max(i/127,-1);default:throw new Error("Invalid component type.")}}function ge(i,A){switch(A.constructor){case Float32Array:return i;case Uint32Array:return Math.round(i*4294967295);case Uint16Array:return Math.round(i*65535);case Uint8Array:return Math.round(i*255);case Int32Array:return Math.round(i*2147483647);case Int16Array:return Math.round(i*32767);case Int8Array:return Math.round(i*127);default:throw new Error("Invalid component type.")}}class Pt{constructor(A=0,t=0){Pt.prototype.isVector2=!0,this.x=A,this.y=t}get width(){return this.x}set width(A){this.x=A}get height(){return this.y}set height(A){this.y=A}set(A,t){return this.x=A,this.y=t,this}setScalar(A){return this.x=A,this.y=A,this}setX(A){return this.x=A,this}setY(A){return this.y=A,this}setComponent(A,t){switch(A){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("index is out of range: "+A)}return this}getComponent(A){switch(A){case 0:return this.x;case 1:return this.y;default:throw new Error("index is out of range: "+A)}}clone(){return new this.constructor(this.x,this.y)}copy(A){return this.x=A.x,this.y=A.y,this}add(A){return this.x+=A.x,this.y+=A.y,this}addScalar(A){return this.x+=A,this.y+=A,this}addVectors(A,t){return this.x=A.x+t.x,this.y=A.y+t.y,this}addScaledVector(A,t){return this.x+=A.x*t,this.y+=A.y*t,this}sub(A){return this.x-=A.x,this.y-=A.y,this}subScalar(A){return this.x-=A,this.y-=A,this}subVectors(A,t){return this.x=A.x-t.x,this.y=A.y-t.y,this}multiply(A){return this.x*=A.x,this.y*=A.y,this}multiplyScalar(A){return this.x*=A,this.y*=A,this}divide(A){return this.x/=A.x,this.y/=A.y,this}divideScalar(A){return this.multiplyScalar(1/A)}applyMatrix3(A){const t=this.x,e=this.y,n=A.elements;return this.x=n[0]*t+n[3]*e+n[6],this.y=n[1]*t+n[4]*e+n[7],this}min(A){return this.x=Math.min(this.x,A.x),this.y=Math.min(this.y,A.y),this}max(A){return this.x=Math.max(this.x,A.x),this.y=Math.max(this.y,A.y),this}clamp(A,t){return this.x=Math.max(A.x,Math.min(t.x,this.x)),this.y=Math.max(A.y,Math.min(t.y,this.y)),this}clampScalar(A,t){return this.x=Math.max(A,Math.min(t,this.x)),this.y=Math.max(A,Math.min(t,this.y)),this}clampLength(A,t){const e=this.length();return this.divideScalar(e||1).multiplyScalar(Math.max(A,Math.min(t,e)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(A){return this.x*A.x+this.y*A.y}cross(A){return this.x*A.y-this.y*A.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(A){const t=Math.sqrt(this.lengthSq()*A.lengthSq());if(t===0)return Math.PI/2;const e=this.dot(A)/t;return Math.acos(te(e,-1,1))}distanceTo(A){return Math.sqrt(this.distanceToSquared(A))}distanceToSquared(A){const t=this.x-A.x,e=this.y-A.y;return t*t+e*e}manhattanDistanceTo(A){return Math.abs(this.x-A.x)+Math.abs(this.y-A.y)}setLength(A){return this.normalize().multiplyScalar(A)}lerp(A,t){return this.x+=(A.x-this.x)*t,this.y+=(A.y-this.y)*t,this}lerpVectors(A,t,e){return this.x=A.x+(t.x-A.x)*e,this.y=A.y+(t.y-A.y)*e,this}equals(A){return A.x===this.x&&A.y===this.y}fromArray(A,t=0){return this.x=A[t],this.y=A[t+1],this}toArray(A=[],t=0){return A[t]=this.x,A[t+1]=this.y,A}fromBufferAttribute(A,t){return this.x=A.getX(t),this.y=A.getY(t),this}rotateAround(A,t){const e=Math.cos(t),n=Math.sin(t),s=this.x-A.x,o=this.y-A.y;return this.x=s*e-o*n+A.x,this.y=s*n+o*e+A.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}}class Qn{constructor(A,t,e,n,s,o,a,g,r){Qn.prototype.isMatrix3=!0,this.elements=[1,0,0,0,1,0,0,0,1],A!==void 0&&this.set(A,t,e,n,s,o,a,g,r)}set(A,t,e,n,s,o,a,g,r){const I=this.elements;return I[0]=A,I[1]=n,I[2]=a,I[3]=t,I[4]=s,I[5]=g,I[6]=e,I[7]=o,I[8]=r,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(A){const t=this.elements,e=A.elements;return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t[4]=e[4],t[5]=e[5],t[6]=e[6],t[7]=e[7],t[8]=e[8],this}extractBasis(A,t,e){return A.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),e.setFromMatrix3Column(this,2),this}setFromMatrix4(A){const t=A.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(A){return this.multiplyMatrices(this,A)}premultiply(A){return this.multiplyMatrices(A,this)}multiplyMatrices(A,t){const e=A.elements,n=t.elements,s=this.elements,o=e[0],a=e[3],g=e[6],r=e[1],I=e[4],B=e[7],C=e[2],Q=e[5],c=e[8],l=n[0],h=n[3],E=n[6],f=n[1],d=n[4],u=n[7],m=n[2],y=n[5],p=n[8];return s[0]=o*l+a*f+g*m,s[3]=o*h+a*d+g*y,s[6]=o*E+a*u+g*p,s[1]=r*l+I*f+B*m,s[4]=r*h+I*d+B*y,s[7]=r*E+I*u+B*p,s[2]=C*l+Q*f+c*m,s[5]=C*h+Q*d+c*y,s[8]=C*E+Q*u+c*p,this}multiplyScalar(A){const t=this.elements;return t[0]*=A,t[3]*=A,t[6]*=A,t[1]*=A,t[4]*=A,t[7]*=A,t[2]*=A,t[5]*=A,t[8]*=A,this}determinant(){const A=this.elements,t=A[0],e=A[1],n=A[2],s=A[3],o=A[4],a=A[5],g=A[6],r=A[7],I=A[8];return t*o*I-t*a*r-e*s*I+e*a*g+n*s*r-n*o*g}invert(){const A=this.elements,t=A[0],e=A[1],n=A[2],s=A[3],o=A[4],a=A[5],g=A[6],r=A[7],I=A[8],B=I*o-a*r,C=a*g-I*s,Q=r*s-o*g,c=t*B+e*C+n*Q;if(c===0)return this.set(0,0,0,0,0,0,0,0,0);const l=1/c;return A[0]=B*l,A[1]=(n*r-I*e)*l,A[2]=(a*e-n*o)*l,A[3]=C*l,A[4]=(I*t-n*g)*l,A[5]=(n*s-a*t)*l,A[6]=Q*l,A[7]=(e*g-r*t)*l,A[8]=(o*t-e*s)*l,this}transpose(){let A;const t=this.elements;return A=t[1],t[1]=t[3],t[3]=A,A=t[2],t[2]=t[6],t[6]=A,A=t[5],t[5]=t[7],t[7]=A,this}getNormalMatrix(A){return this.setFromMatrix4(A).invert().transpose()}transposeIntoArray(A){const t=this.elements;return A[0]=t[0],A[1]=t[3],A[2]=t[6],A[3]=t[1],A[4]=t[4],A[5]=t[7],A[6]=t[2],A[7]=t[5],A[8]=t[8],this}setUvTransform(A,t,e,n,s,o,a){const g=Math.cos(s),r=Math.sin(s);return this.set(e*g,e*r,-e*(g*o+r*a)+o+A,-n*r,n*g,-n*(-r*o+g*a)+a+t,0,0,1),this}scale(A,t){return this.premultiply(Wg.makeScale(A,t)),this}rotate(A){return this.premultiply(Wg.makeRotation(-A)),this}translate(A,t){return this.premultiply(Wg.makeTranslation(A,t)),this}makeTranslation(A,t){return A.isVector2?this.set(1,0,A.x,0,1,A.y,0,0,1):this.set(1,0,A,0,1,t,0,0,1),this}makeRotation(A){const t=Math.cos(A),e=Math.sin(A);return this.set(t,-e,0,e,t,0,0,0,1),this}makeScale(A,t){return this.set(A,0,0,0,t,0,0,0,1),this}equals(A){const t=this.elements,e=A.elements;for(let n=0;n<9;n++)if(t[n]!==e[n])return!1;return!0}fromArray(A,t=0){for(let e=0;e<9;e++)this.elements[e]=A[e+t];return this}toArray(A=[],t=0){const e=this.elements;return A[t]=e[0],A[t+1]=e[1],A[t+2]=e[2],A[t+3]=e[3],A[t+4]=e[4],A[t+5]=e[5],A[t+6]=e[6],A[t+7]=e[7],A[t+8]=e[8],A}clone(){return new this.constructor().fromArray(this.elements)}}const Wg=new Qn;function Yy(i){for(let A=i.length-1;A>=0;--A)if(i[A]>=65535)return!0;return!1}function vE(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}const kE={};function Sr(i){i in kE||(kE[i]=!0,console.warn(i))}function Ys(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Vg(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}const Py=new Qn().fromArray([.8224621,.0331941,.0170827,.177538,.9668058,.0723974,-1e-7,1e-7,.9105199]),Oy=new Qn().fromArray([1.2249401,-.0420569,-.0196376,-.2249404,1.0420571,-.0786361,1e-7,0,1.0982735]);function Wy(i){return i.convertSRGBToLinear().applyMatrix3(Oy)}function Vy(i){return i.applyMatrix3(Py).convertLinearToSRGB()}const zy={[_B]:i=>i,[he]:i=>i.convertSRGBToLinear(),[dc]:Wy},Xy={[_B]:i=>i,[he]:i=>i.convertLinearToSRGB(),[dc]:Vy},be={enabled:!0,get legacyMode(){return console.warn("THREE.ColorManagement: .legacyMode=false renamed to .enabled=true in r150."),!this.enabled},set legacyMode(i){console.warn("THREE.ColorManagement: .legacyMode=false renamed to .enabled=true in r150."),this.enabled=!i},get workingColorSpace(){return _B},set workingColorSpace(i){console.warn("THREE.ColorManagement: .workingColorSpace is readonly.")},convert:function(i,A,t){if(this.enabled===!1||A===t||!A||!t)return i;const e=zy[A],n=Xy[t];if(e===void 0||n===void 0)throw new Error(`Unsupported color space conversion, "${A}" to "${t}".`);return n(e(i))},fromWorkingColorSpace:function(i,A){return this.convert(i,this.workingColorSpace,A)},toWorkingColorSpace:function(i,A){return this.convert(i,A,this.workingColorSpace)}};let us;class Zy{static getDataURL(A){if(/^data:/i.test(A.src)||typeof HTMLCanvasElement>"u")return A.src;let t;if(A instanceof HTMLCanvasElement)t=A;else{us===void 0&&(us=vE("canvas")),us.width=A.width,us.height=A.height;const e=us.getContext("2d");A instanceof ImageData?e.putImageData(A,0,0):e.drawImage(A,0,0,A.width,A.height),t=us}return t.width>2048||t.height>2048?(console.warn("THREE.ImageUtils.getDataURL: Image converted to jpg for performance reasons",A),t.toDataURL("image/jpeg",.6)):t.toDataURL("image/png")}static sRGBToLinear(A){if(typeof HTMLImageElement<"u"&&A instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&A instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&A instanceof ImageBitmap){const t=vE("canvas");t.width=A.width,t.height=A.height;const e=t.getContext("2d");e.drawImage(A,0,0,A.width,A.height);const n=e.getImageData(0,0,A.width,A.height),s=n.data;for(let o=0;o<s.length;o++)s[o]=Ys(s[o]/255)*255;return e.putImageData(n,0,0),t}else if(A.data){const t=A.data.slice(0);for(let e=0;e<t.length;e++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[e]=Math.floor(Ys(t[e]/255)*255):t[e]=Ys(t[e]);return{data:t,width:A.width,height:A.height}}else return console.warn("THREE.ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),A}}let jy=0;class uc{constructor(A=null){this.isSource=!0,Object.defineProperty(this,"id",{value:jy++}),this.uuid=Ca(),this.data=A,this.version=0}set needsUpdate(A){A===!0&&this.version++}toJSON(A){const t=A===void 0||typeof A=="string";if(!t&&A.images[this.uuid]!==void 0)return A.images[this.uuid];const e={uuid:this.uuid,url:""},n=this.data;if(n!==null){let s;if(Array.isArray(n)){s=[];for(let o=0,a=n.length;o<a;o++)n[o].isDataTexture?s.push(zg(n[o].image)):s.push(zg(n[o]))}else s=zg(n);e.url=s}return t||(A.images[this.uuid]=e),e}}function zg(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?Zy.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(console.warn("THREE.Texture: Unable to serialize Texture."),{})}let $y=0;class Ve extends Ba{constructor(A=Ve.DEFAULT_IMAGE,t=Ve.DEFAULT_MAPPING,e=ni,n=ni,s=fe,o=Uy,a=lc,g=by,r=Ve.DEFAULT_ANISOTROPY,I=Dr){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:$y++}),this.uuid=Ca(),this.name="",this.source=new uc(A),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=e,this.wrapT=n,this.magFilter=s,this.minFilter=o,this.anisotropy=r,this.format=a,this.internalFormat=null,this.type=g,this.offset=new Pt(0,0),this.repeat=new Pt(1,1),this.center=new Pt(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Qn,this.generateMipmaps=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,typeof I=="string"?this.colorSpace=I:(Sr("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=I===yr?he:Dr),this.userData={},this.version=0,this.onUpdate=null,this.isRenderTargetTexture=!1,this.needsPMREMUpdate=!1}get image(){return this.source.data}set image(A=null){this.source.data=A}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}clone(){return new this.constructor().copy(this)}copy(A){return this.name=A.name,this.source=A.source,this.mipmaps=A.mipmaps.slice(0),this.mapping=A.mapping,this.channel=A.channel,this.wrapS=A.wrapS,this.wrapT=A.wrapT,this.magFilter=A.magFilter,this.minFilter=A.minFilter,this.anisotropy=A.anisotropy,this.format=A.format,this.internalFormat=A.internalFormat,this.type=A.type,this.offset.copy(A.offset),this.repeat.copy(A.repeat),this.center.copy(A.center),this.rotation=A.rotation,this.matrixAutoUpdate=A.matrixAutoUpdate,this.matrix.copy(A.matrix),this.generateMipmaps=A.generateMipmaps,this.premultiplyAlpha=A.premultiplyAlpha,this.flipY=A.flipY,this.unpackAlignment=A.unpackAlignment,this.colorSpace=A.colorSpace,this.userData=JSON.parse(JSON.stringify(A.userData)),this.needsUpdate=!0,this}toJSON(A){const t=A===void 0||typeof A=="string";if(!t&&A.textures[this.uuid]!==void 0)return A.textures[this.uuid];const e={metadata:{version:4.6,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(A).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(e.userData=this.userData),t||(A.textures[this.uuid]=e),e}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(A){if(this.mapping!==cc)return A;if(A.applyMatrix3(this.matrix),A.x<0||A.x>1)switch(this.wrapS){case vr:A.x=A.x-Math.floor(A.x);break;case ni:A.x=A.x<0?0:1;break;case kr:Math.abs(Math.floor(A.x)%2)===1?A.x=Math.ceil(A.x)-A.x:A.x=A.x-Math.floor(A.x);break}if(A.y<0||A.y>1)switch(this.wrapT){case vr:A.y=A.y-Math.floor(A.y);break;case ni:A.y=A.y<0?0:1;break;case kr:Math.abs(Math.floor(A.y)%2)===1?A.y=Math.ceil(A.y)-A.y:A.y=A.y-Math.floor(A.y);break}return this.flipY&&(A.y=1-A.y),A}set needsUpdate(A){A===!0&&(this.version++,this.source.needsUpdate=!0)}get encoding(){return Sr("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace===he?yr:Hy}set encoding(A){Sr("THREE.Texture: Property .encoding has been replaced by .colorSpace."),this.colorSpace=A===yr?he:Dr}}Ve.DEFAULT_IMAGE=null;Ve.DEFAULT_MAPPING=cc;Ve.DEFAULT_ANISOTROPY=1;class Zo{constructor(A=0,t=0,e=0,n=1){Zo.prototype.isVector4=!0,this.x=A,this.y=t,this.z=e,this.w=n}get width(){return this.z}set width(A){this.z=A}get height(){return this.w}set height(A){this.w=A}set(A,t,e,n){return this.x=A,this.y=t,this.z=e,this.w=n,this}setScalar(A){return this.x=A,this.y=A,this.z=A,this.w=A,this}setX(A){return this.x=A,this}setY(A){return this.y=A,this}setZ(A){return this.z=A,this}setW(A){return this.w=A,this}setComponent(A,t){switch(A){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("index is out of range: "+A)}return this}getComponent(A){switch(A){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("index is out of range: "+A)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(A){return this.x=A.x,this.y=A.y,this.z=A.z,this.w=A.w!==void 0?A.w:1,this}add(A){return this.x+=A.x,this.y+=A.y,this.z+=A.z,this.w+=A.w,this}addScalar(A){return this.x+=A,this.y+=A,this.z+=A,this.w+=A,this}addVectors(A,t){return this.x=A.x+t.x,this.y=A.y+t.y,this.z=A.z+t.z,this.w=A.w+t.w,this}addScaledVector(A,t){return this.x+=A.x*t,this.y+=A.y*t,this.z+=A.z*t,this.w+=A.w*t,this}sub(A){return this.x-=A.x,this.y-=A.y,this.z-=A.z,this.w-=A.w,this}subScalar(A){return this.x-=A,this.y-=A,this.z-=A,this.w-=A,this}subVectors(A,t){return this.x=A.x-t.x,this.y=A.y-t.y,this.z=A.z-t.z,this.w=A.w-t.w,this}multiply(A){return this.x*=A.x,this.y*=A.y,this.z*=A.z,this.w*=A.w,this}multiplyScalar(A){return this.x*=A,this.y*=A,this.z*=A,this.w*=A,this}applyMatrix4(A){const t=this.x,e=this.y,n=this.z,s=this.w,o=A.elements;return this.x=o[0]*t+o[4]*e+o[8]*n+o[12]*s,this.y=o[1]*t+o[5]*e+o[9]*n+o[13]*s,this.z=o[2]*t+o[6]*e+o[10]*n+o[14]*s,this.w=o[3]*t+o[7]*e+o[11]*n+o[15]*s,this}divideScalar(A){return this.multiplyScalar(1/A)}setAxisAngleFromQuaternion(A){this.w=2*Math.acos(A.w);const t=Math.sqrt(1-A.w*A.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=A.x/t,this.y=A.y/t,this.z=A.z/t),this}setAxisAngleFromRotationMatrix(A){let t,e,n,s;const g=A.elements,r=g[0],I=g[4],B=g[8],C=g[1],Q=g[5],c=g[9],l=g[2],h=g[6],E=g[10];if(Math.abs(I-C)<.01&&Math.abs(B-l)<.01&&Math.abs(c-h)<.01){if(Math.abs(I+C)<.1&&Math.abs(B+l)<.1&&Math.abs(c+h)<.1&&Math.abs(r+Q+E-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const d=(r+1)/2,u=(Q+1)/2,m=(E+1)/2,y=(I+C)/4,p=(B+l)/4,R=(c+h)/4;return d>u&&d>m?d<.01?(e=0,n=.707106781,s=.707106781):(e=Math.sqrt(d),n=y/e,s=p/e):u>m?u<.01?(e=.707106781,n=0,s=.707106781):(n=Math.sqrt(u),e=y/n,s=R/n):m<.01?(e=.707106781,n=.707106781,s=0):(s=Math.sqrt(m),e=p/s,n=R/s),this.set(e,n,s,t),this}let f=Math.sqrt((h-c)*(h-c)+(B-l)*(B-l)+(C-I)*(C-I));return Math.abs(f)<.001&&(f=1),this.x=(h-c)/f,this.y=(B-l)/f,this.z=(C-I)/f,this.w=Math.acos((r+Q+E-1)/2),this}min(A){return this.x=Math.min(this.x,A.x),this.y=Math.min(this.y,A.y),this.z=Math.min(this.z,A.z),this.w=Math.min(this.w,A.w),this}max(A){return this.x=Math.max(this.x,A.x),this.y=Math.max(this.y,A.y),this.z=Math.max(this.z,A.z),this.w=Math.max(this.w,A.w),this}clamp(A,t){return this.x=Math.max(A.x,Math.min(t.x,this.x)),this.y=Math.max(A.y,Math.min(t.y,this.y)),this.z=Math.max(A.z,Math.min(t.z,this.z)),this.w=Math.max(A.w,Math.min(t.w,this.w)),this}clampScalar(A,t){return this.x=Math.max(A,Math.min(t,this.x)),this.y=Math.max(A,Math.min(t,this.y)),this.z=Math.max(A,Math.min(t,this.z)),this.w=Math.max(A,Math.min(t,this.w)),this}clampLength(A,t){const e=this.length();return this.divideScalar(e||1).multiplyScalar(Math.max(A,Math.min(t,e)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this.z=this.z<0?Math.ceil(this.z):Math.floor(this.z),this.w=this.w<0?Math.ceil(this.w):Math.floor(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(A){return this.x*A.x+this.y*A.y+this.z*A.z+this.w*A.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(A){return this.normalize().multiplyScalar(A)}lerp(A,t){return this.x+=(A.x-this.x)*t,this.y+=(A.y-this.y)*t,this.z+=(A.z-this.z)*t,this.w+=(A.w-this.w)*t,this}lerpVectors(A,t,e){return this.x=A.x+(t.x-A.x)*e,this.y=A.y+(t.y-A.y)*e,this.z=A.z+(t.z-A.z)*e,this.w=A.w+(t.w-A.w)*e,this}equals(A){return A.x===this.x&&A.y===this.y&&A.z===this.z&&A.w===this.w}fromArray(A,t=0){return this.x=A[t],this.y=A[t+1],this.z=A[t+2],this.w=A[t+3],this}toArray(A=[],t=0){return A[t]=this.x,A[t+1]=this.y,A[t+2]=this.z,A[t+3]=this.w,A}fromBufferAttribute(A,t){return this.x=A.getX(t),this.y=A.getY(t),this.z=A.getZ(t),this.w=A.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}}class AD extends Ba{constructor(A=1,t=1,e={}){super(),this.isWebGLRenderTarget=!0,this.width=A,this.height=t,this.depth=1,this.scissor=new Zo(0,0,A,t),this.scissorTest=!1,this.viewport=new Zo(0,0,A,t);const n={width:A,height:t,depth:1};e.encoding!==void 0&&(Sr("THREE.WebGLRenderTarget: option.encoding has been replaced by option.colorSpace."),e.colorSpace=e.encoding===yr?he:Dr),this.texture=new Ve(n,e.mapping,e.wrapS,e.wrapT,e.magFilter,e.minFilter,e.format,e.type,e.anisotropy,e.colorSpace),this.texture.isRenderTargetTexture=!0,this.texture.flipY=!1,this.texture.generateMipmaps=e.generateMipmaps!==void 0?e.generateMipmaps:!1,this.texture.internalFormat=e.internalFormat!==void 0?e.internalFormat:null,this.texture.minFilter=e.minFilter!==void 0?e.minFilter:fe,this.depthBuffer=e.depthBuffer!==void 0?e.depthBuffer:!0,this.stencilBuffer=e.stencilBuffer!==void 0?e.stencilBuffer:!1,this.depthTexture=e.depthTexture!==void 0?e.depthTexture:null,this.samples=e.samples!==void 0?e.samples:0}setSize(A,t,e=1){(this.width!==A||this.height!==t||this.depth!==e)&&(this.width=A,this.height=t,this.depth=e,this.texture.image.width=A,this.texture.image.height=t,this.texture.image.depth=e,this.dispose()),this.viewport.set(0,0,A,t),this.scissor.set(0,0,A,t)}clone(){return new this.constructor().copy(this)}copy(A){this.width=A.width,this.height=A.height,this.depth=A.depth,this.scissor.copy(A.scissor),this.scissorTest=A.scissorTest,this.viewport.copy(A.viewport),this.texture=A.texture.clone(),this.texture.isRenderTargetTexture=!0;const t=Object.assign({},A.texture.image);return this.texture.source=new uc(t),this.depthBuffer=A.depthBuffer,this.stencilBuffer=A.stencilBuffer,A.depthTexture!==null&&(this.depthTexture=A.depthTexture.clone()),this.samples=A.samples,this}dispose(){this.dispatchEvent({type:"dispose"})}}class Pi extends Ve{constructor(A=null,t=1,e=1,n=1){super(null),this.isData3DTexture=!0,this.image={data:A,width:t,height:e,depth:n},this.magFilter=eo,this.minFilter=eo,this.wrapR=ni,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}class ao{constructor(A=0,t=0,e=0,n=1){this.isQuaternion=!0,this._x=A,this._y=t,this._z=e,this._w=n}static slerpFlat(A,t,e,n,s,o,a){let g=e[n+0],r=e[n+1],I=e[n+2],B=e[n+3];const C=s[o+0],Q=s[o+1],c=s[o+2],l=s[o+3];if(a===0){A[t+0]=g,A[t+1]=r,A[t+2]=I,A[t+3]=B;return}if(a===1){A[t+0]=C,A[t+1]=Q,A[t+2]=c,A[t+3]=l;return}if(B!==l||g!==C||r!==Q||I!==c){let h=1-a;const E=g*C+r*Q+I*c+B*l,f=E>=0?1:-1,d=1-E*E;if(d>Number.EPSILON){const m=Math.sqrt(d),y=Math.atan2(m,E*f);h=Math.sin(h*y)/m,a=Math.sin(a*y)/m}const u=a*f;if(g=g*h+C*u,r=r*h+Q*u,I=I*h+c*u,B=B*h+l*u,h===1-a){const m=1/Math.sqrt(g*g+r*r+I*I+B*B);g*=m,r*=m,I*=m,B*=m}}A[t]=g,A[t+1]=r,A[t+2]=I,A[t+3]=B}static multiplyQuaternionsFlat(A,t,e,n,s,o){const a=e[n],g=e[n+1],r=e[n+2],I=e[n+3],B=s[o],C=s[o+1],Q=s[o+2],c=s[o+3];return A[t]=a*c+I*B+g*Q-r*C,A[t+1]=g*c+I*C+r*B-a*Q,A[t+2]=r*c+I*Q+a*C-g*B,A[t+3]=I*c-a*B-g*C-r*Q,A}get x(){return this._x}set x(A){this._x=A,this._onChangeCallback()}get y(){return this._y}set y(A){this._y=A,this._onChangeCallback()}get z(){return this._z}set z(A){this._z=A,this._onChangeCallback()}get w(){return this._w}set w(A){this._w=A,this._onChangeCallback()}set(A,t,e,n){return this._x=A,this._y=t,this._z=e,this._w=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(A){return this._x=A.x,this._y=A.y,this._z=A.z,this._w=A.w,this._onChangeCallback(),this}setFromEuler(A,t){const e=A._x,n=A._y,s=A._z,o=A._order,a=Math.cos,g=Math.sin,r=a(e/2),I=a(n/2),B=a(s/2),C=g(e/2),Q=g(n/2),c=g(s/2);switch(o){case"XYZ":this._x=C*I*B+r*Q*c,this._y=r*Q*B-C*I*c,this._z=r*I*c+C*Q*B,this._w=r*I*B-C*Q*c;break;case"YXZ":this._x=C*I*B+r*Q*c,this._y=r*Q*B-C*I*c,this._z=r*I*c-C*Q*B,this._w=r*I*B+C*Q*c;break;case"ZXY":this._x=C*I*B-r*Q*c,this._y=r*Q*B+C*I*c,this._z=r*I*c+C*Q*B,this._w=r*I*B-C*Q*c;break;case"ZYX":this._x=C*I*B-r*Q*c,this._y=r*Q*B+C*I*c,this._z=r*I*c-C*Q*B,this._w=r*I*B+C*Q*c;break;case"YZX":this._x=C*I*B+r*Q*c,this._y=r*Q*B+C*I*c,this._z=r*I*c-C*Q*B,this._w=r*I*B-C*Q*c;break;case"XZY":this._x=C*I*B-r*Q*c,this._y=r*Q*B-C*I*c,this._z=r*I*c+C*Q*B,this._w=r*I*B+C*Q*c;break;default:console.warn("THREE.Quaternion: .setFromEuler() encountered an unknown order: "+o)}return t!==!1&&this._onChangeCallback(),this}setFromAxisAngle(A,t){const e=t/2,n=Math.sin(e);return this._x=A.x*n,this._y=A.y*n,this._z=A.z*n,this._w=Math.cos(e),this._onChangeCallback(),this}setFromRotationMatrix(A){const t=A.elements,e=t[0],n=t[4],s=t[8],o=t[1],a=t[5],g=t[9],r=t[2],I=t[6],B=t[10],C=e+a+B;if(C>0){const Q=.5/Math.sqrt(C+1);this._w=.25/Q,this._x=(I-g)*Q,this._y=(s-r)*Q,this._z=(o-n)*Q}else if(e>a&&e>B){const Q=2*Math.sqrt(1+e-a-B);this._w=(I-g)/Q,this._x=.25*Q,this._y=(n+o)/Q,this._z=(s+r)/Q}else if(a>B){const Q=2*Math.sqrt(1+a-e-B);this._w=(s-r)/Q,this._x=(n+o)/Q,this._y=.25*Q,this._z=(g+I)/Q}else{const Q=2*Math.sqrt(1+B-e-a);this._w=(o-n)/Q,this._x=(s+r)/Q,this._y=(g+I)/Q,this._z=.25*Q}return this._onChangeCallback(),this}setFromUnitVectors(A,t){let e=A.dot(t)+1;return e<Number.EPSILON?(e=0,Math.abs(A.x)>Math.abs(A.z)?(this._x=-A.y,this._y=A.x,this._z=0,this._w=e):(this._x=0,this._y=-A.z,this._z=A.y,this._w=e)):(this._x=A.y*t.z-A.z*t.y,this._y=A.z*t.x-A.x*t.z,this._z=A.x*t.y-A.y*t.x,this._w=e),this.normalize()}angleTo(A){return 2*Math.acos(Math.abs(te(this.dot(A),-1,1)))}rotateTowards(A,t){const e=this.angleTo(A);if(e===0)return this;const n=Math.min(1,t/e);return this.slerp(A,n),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(A){return this._x*A._x+this._y*A._y+this._z*A._z+this._w*A._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let A=this.length();return A===0?(this._x=0,this._y=0,this._z=0,this._w=1):(A=1/A,this._x=this._x*A,this._y=this._y*A,this._z=this._z*A,this._w=this._w*A),this._onChangeCallback(),this}multiply(A){return this.multiplyQuaternions(this,A)}premultiply(A){return this.multiplyQuaternions(A,this)}multiplyQuaternions(A,t){const e=A._x,n=A._y,s=A._z,o=A._w,a=t._x,g=t._y,r=t._z,I=t._w;return this._x=e*I+o*a+n*r-s*g,this._y=n*I+o*g+s*a-e*r,this._z=s*I+o*r+e*g-n*a,this._w=o*I-e*a-n*g-s*r,this._onChangeCallback(),this}slerp(A,t){if(t===0)return this;if(t===1)return this.copy(A);const e=this._x,n=this._y,s=this._z,o=this._w;let a=o*A._w+e*A._x+n*A._y+s*A._z;if(a<0?(this._w=-A._w,this._x=-A._x,this._y=-A._y,this._z=-A._z,a=-a):this.copy(A),a>=1)return this._w=o,this._x=e,this._y=n,this._z=s,this;const g=1-a*a;if(g<=Number.EPSILON){const Q=1-t;return this._w=Q*o+t*this._w,this._x=Q*e+t*this._x,this._y=Q*n+t*this._y,this._z=Q*s+t*this._z,this.normalize(),this._onChangeCallback(),this}const r=Math.sqrt(g),I=Math.atan2(r,a),B=Math.sin((1-t)*I)/r,C=Math.sin(t*I)/r;return this._w=o*B+this._w*C,this._x=e*B+this._x*C,this._y=n*B+this._y*C,this._z=s*B+this._z*C,this._onChangeCallback(),this}slerpQuaternions(A,t,e){return this.copy(A).slerp(t,e)}random(){const A=Math.random(),t=Math.sqrt(1-A),e=Math.sqrt(A),n=2*Math.PI*Math.random(),s=2*Math.PI*Math.random();return this.set(t*Math.cos(n),e*Math.sin(s),e*Math.cos(s),t*Math.sin(n))}equals(A){return A._x===this._x&&A._y===this._y&&A._z===this._z&&A._w===this._w}fromArray(A,t=0){return this._x=A[t],this._y=A[t+1],this._z=A[t+2],this._w=A[t+3],this._onChangeCallback(),this}toArray(A=[],t=0){return A[t]=this._x,A[t+1]=this._y,A[t+2]=this._z,A[t+3]=this._w,A}fromBufferAttribute(A,t){return this._x=A.getX(t),this._y=A.getY(t),this._z=A.getZ(t),this._w=A.getW(t),this}toJSON(){return this.toArray()}_onChange(A){return this._onChangeCallback=A,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}class rA{constructor(A=0,t=0,e=0){rA.prototype.isVector3=!0,this.x=A,this.y=t,this.z=e}set(A,t,e){return e===void 0&&(e=this.z),this.x=A,this.y=t,this.z=e,this}setScalar(A){return this.x=A,this.y=A,this.z=A,this}setX(A){return this.x=A,this}setY(A){return this.y=A,this}setZ(A){return this.z=A,this}setComponent(A,t){switch(A){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("index is out of range: "+A)}return this}getComponent(A){switch(A){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("index is out of range: "+A)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(A){return this.x=A.x,this.y=A.y,this.z=A.z,this}add(A){return this.x+=A.x,this.y+=A.y,this.z+=A.z,this}addScalar(A){return this.x+=A,this.y+=A,this.z+=A,this}addVectors(A,t){return this.x=A.x+t.x,this.y=A.y+t.y,this.z=A.z+t.z,this}addScaledVector(A,t){return this.x+=A.x*t,this.y+=A.y*t,this.z+=A.z*t,this}sub(A){return this.x-=A.x,this.y-=A.y,this.z-=A.z,this}subScalar(A){return this.x-=A,this.y-=A,this.z-=A,this}subVectors(A,t){return this.x=A.x-t.x,this.y=A.y-t.y,this.z=A.z-t.z,this}multiply(A){return this.x*=A.x,this.y*=A.y,this.z*=A.z,this}multiplyScalar(A){return this.x*=A,this.y*=A,this.z*=A,this}multiplyVectors(A,t){return this.x=A.x*t.x,this.y=A.y*t.y,this.z=A.z*t.z,this}applyEuler(A){return this.applyQuaternion(TE.setFromEuler(A))}applyAxisAngle(A,t){return this.applyQuaternion(TE.setFromAxisAngle(A,t))}applyMatrix3(A){const t=this.x,e=this.y,n=this.z,s=A.elements;return this.x=s[0]*t+s[3]*e+s[6]*n,this.y=s[1]*t+s[4]*e+s[7]*n,this.z=s[2]*t+s[5]*e+s[8]*n,this}applyNormalMatrix(A){return this.applyMatrix3(A).normalize()}applyMatrix4(A){const t=this.x,e=this.y,n=this.z,s=A.elements,o=1/(s[3]*t+s[7]*e+s[11]*n+s[15]);return this.x=(s[0]*t+s[4]*e+s[8]*n+s[12])*o,this.y=(s[1]*t+s[5]*e+s[9]*n+s[13])*o,this.z=(s[2]*t+s[6]*e+s[10]*n+s[14])*o,this}applyQuaternion(A){const t=this.x,e=this.y,n=this.z,s=A.x,o=A.y,a=A.z,g=A.w,r=g*t+o*n-a*e,I=g*e+a*t-s*n,B=g*n+s*e-o*t,C=-s*t-o*e-a*n;return this.x=r*g+C*-s+I*-a-B*-o,this.y=I*g+C*-o+B*-s-r*-a,this.z=B*g+C*-a+r*-o-I*-s,this}project(A){return this.applyMatrix4(A.matrixWorldInverse).applyMatrix4(A.projectionMatrix)}unproject(A){return this.applyMatrix4(A.projectionMatrixInverse).applyMatrix4(A.matrixWorld)}transformDirection(A){const t=this.x,e=this.y,n=this.z,s=A.elements;return this.x=s[0]*t+s[4]*e+s[8]*n,this.y=s[1]*t+s[5]*e+s[9]*n,this.z=s[2]*t+s[6]*e+s[10]*n,this.normalize()}divide(A){return this.x/=A.x,this.y/=A.y,this.z/=A.z,this}divideScalar(A){return this.multiplyScalar(1/A)}min(A){return this.x=Math.min(this.x,A.x),this.y=Math.min(this.y,A.y),this.z=Math.min(this.z,A.z),this}max(A){return this.x=Math.max(this.x,A.x),this.y=Math.max(this.y,A.y),this.z=Math.max(this.z,A.z),this}clamp(A,t){return this.x=Math.max(A.x,Math.min(t.x,this.x)),this.y=Math.max(A.y,Math.min(t.y,this.y)),this.z=Math.max(A.z,Math.min(t.z,this.z)),this}clampScalar(A,t){return this.x=Math.max(A,Math.min(t,this.x)),this.y=Math.max(A,Math.min(t,this.y)),this.z=Math.max(A,Math.min(t,this.z)),this}clampLength(A,t){const e=this.length();return this.divideScalar(e||1).multiplyScalar(Math.max(A,Math.min(t,e)))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=this.x<0?Math.ceil(this.x):Math.floor(this.x),this.y=this.y<0?Math.ceil(this.y):Math.floor(this.y),this.z=this.z<0?Math.ceil(this.z):Math.floor(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(A){return this.x*A.x+this.y*A.y+this.z*A.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(A){return this.normalize().multiplyScalar(A)}lerp(A,t){return this.x+=(A.x-this.x)*t,this.y+=(A.y-this.y)*t,this.z+=(A.z-this.z)*t,this}lerpVectors(A,t,e){return this.x=A.x+(t.x-A.x)*e,this.y=A.y+(t.y-A.y)*e,this.z=A.z+(t.z-A.z)*e,this}cross(A){return this.crossVectors(this,A)}crossVectors(A,t){const e=A.x,n=A.y,s=A.z,o=t.x,a=t.y,g=t.z;return this.x=n*g-s*a,this.y=s*o-e*g,this.z=e*a-n*o,this}projectOnVector(A){const t=A.lengthSq();if(t===0)return this.set(0,0,0);const e=A.dot(this)/t;return this.copy(A).multiplyScalar(e)}projectOnPlane(A){return Xg.copy(this).projectOnVector(A),this.sub(Xg)}reflect(A){return this.sub(Xg.copy(A).multiplyScalar(2*this.dot(A)))}angleTo(A){const t=Math.sqrt(this.lengthSq()*A.lengthSq());if(t===0)return Math.PI/2;const e=this.dot(A)/t;return Math.acos(te(e,-1,1))}distanceTo(A){return Math.sqrt(this.distanceToSquared(A))}distanceToSquared(A){const t=this.x-A.x,e=this.y-A.y,n=this.z-A.z;return t*t+e*e+n*n}manhattanDistanceTo(A){return Math.abs(this.x-A.x)+Math.abs(this.y-A.y)+Math.abs(this.z-A.z)}setFromSpherical(A){return this.setFromSphericalCoords(A.radius,A.phi,A.theta)}setFromSphericalCoords(A,t,e){const n=Math.sin(t)*A;return this.x=n*Math.sin(e),this.y=Math.cos(t)*A,this.z=n*Math.cos(e),this}setFromCylindrical(A){return this.setFromCylindricalCoords(A.radius,A.theta,A.y)}setFromCylindricalCoords(A,t,e){return this.x=A*Math.sin(t),this.y=e,this.z=A*Math.cos(t),this}setFromMatrixPosition(A){const t=A.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(A){const t=this.setFromMatrixColumn(A,0).length(),e=this.setFromMatrixColumn(A,1).length(),n=this.setFromMatrixColumn(A,2).length();return this.x=t,this.y=e,this.z=n,this}setFromMatrixColumn(A,t){return this.fromArray(A.elements,t*4)}setFromMatrix3Column(A,t){return this.fromArray(A.elements,t*3)}setFromEuler(A){return this.x=A._x,this.y=A._y,this.z=A._z,this}setFromColor(A){return this.x=A.r,this.y=A.g,this.z=A.b,this}equals(A){return A.x===this.x&&A.y===this.y&&A.z===this.z}fromArray(A,t=0){return this.x=A[t],this.y=A[t+1],this.z=A[t+2],this}toArray(A=[],t=0){return A[t]=this.x,A[t+1]=this.y,A[t+2]=this.z,A}fromBufferAttribute(A,t){return this.x=A.getX(t),this.y=A.getY(t),this.z=A.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const A=(Math.random()-.5)*2,t=Math.random()*Math.PI*2,e=Math.sqrt(1-A**2);return this.x=e*Math.cos(t),this.y=e*Math.sin(t),this.z=A,this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}}const Xg=new rA,TE=new ao;class Ti{constructor(A=new rA(1/0,1/0,1/0),t=new rA(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=A,this.max=t}set(A,t){return this.min.copy(A),this.max.copy(t),this}setFromArray(A){this.makeEmpty();for(let t=0,e=A.length;t<e;t+=3)this.expandByPoint(pi.fromArray(A,t));return this}setFromBufferAttribute(A){this.makeEmpty();for(let t=0,e=A.count;t<e;t++)this.expandByPoint(pi.fromBufferAttribute(A,t));return this}setFromPoints(A){this.makeEmpty();for(let t=0,e=A.length;t<e;t++)this.expandByPoint(A[t]);return this}setFromCenterAndSize(A,t){const e=pi.copy(t).multiplyScalar(.5);return this.min.copy(A).sub(e),this.max.copy(A).add(e),this}setFromObject(A,t=!1){return this.makeEmpty(),this.expandByObject(A,t)}clone(){return new this.constructor().copy(this)}copy(A){return this.min.copy(A.min),this.max.copy(A.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(A){return this.isEmpty()?A.set(0,0,0):A.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(A){return this.isEmpty()?A.set(0,0,0):A.subVectors(this.max,this.min)}expandByPoint(A){return this.min.min(A),this.max.max(A),this}expandByVector(A){return this.min.sub(A),this.max.add(A),this}expandByScalar(A){return this.min.addScalar(-A),this.max.addScalar(A),this}expandByObject(A,t=!1){if(A.updateWorldMatrix(!1,!1),A.boundingBox!==void 0)A.boundingBox===null&&A.computeBoundingBox(),fs.copy(A.boundingBox),fs.applyMatrix4(A.matrixWorld),this.union(fs);else{const n=A.geometry;if(n!==void 0)if(t&&n.attributes!==void 0&&n.attributes.position!==void 0){const s=n.attributes.position;for(let o=0,a=s.count;o<a;o++)pi.fromBufferAttribute(s,o).applyMatrix4(A.matrixWorld),this.expandByPoint(pi)}else n.boundingBox===null&&n.computeBoundingBox(),fs.copy(n.boundingBox),fs.applyMatrix4(A.matrixWorld),this.union(fs)}const e=A.children;for(let n=0,s=e.length;n<s;n++)this.expandByObject(e[n],t);return this}containsPoint(A){return!(A.x<this.min.x||A.x>this.max.x||A.y<this.min.y||A.y>this.max.y||A.z<this.min.z||A.z>this.max.z)}containsBox(A){return this.min.x<=A.min.x&&A.max.x<=this.max.x&&this.min.y<=A.min.y&&A.max.y<=this.max.y&&this.min.z<=A.min.z&&A.max.z<=this.max.z}getParameter(A,t){return t.set((A.x-this.min.x)/(this.max.x-this.min.x),(A.y-this.min.y)/(this.max.y-this.min.y),(A.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(A){return!(A.max.x<this.min.x||A.min.x>this.max.x||A.max.y<this.min.y||A.min.y>this.max.y||A.max.z<this.min.z||A.min.z>this.max.z)}intersectsSphere(A){return this.clampPoint(A.center,pi),pi.distanceToSquared(A.center)<=A.radius*A.radius}intersectsPlane(A){let t,e;return A.normal.x>0?(t=A.normal.x*this.min.x,e=A.normal.x*this.max.x):(t=A.normal.x*this.max.x,e=A.normal.x*this.min.x),A.normal.y>0?(t+=A.normal.y*this.min.y,e+=A.normal.y*this.max.y):(t+=A.normal.y*this.max.y,e+=A.normal.y*this.min.y),A.normal.z>0?(t+=A.normal.z*this.min.z,e+=A.normal.z*this.max.z):(t+=A.normal.z*this.max.z,e+=A.normal.z*this.min.z),t<=-A.constant&&e>=-A.constant}intersectsTriangle(A){if(this.isEmpty())return!1;this.getCenter(Do),za.subVectors(this.max,Do),ps.subVectors(A.a,Do),ms.subVectors(A.b,Do),ys.subVectors(A.c,Do),Oi.subVectors(ms,ps),Wi.subVectors(ys,ms),mn.subVectors(ps,ys);let t=[0,-Oi.z,Oi.y,0,-Wi.z,Wi.y,0,-mn.z,mn.y,Oi.z,0,-Oi.x,Wi.z,0,-Wi.x,mn.z,0,-mn.x,-Oi.y,Oi.x,0,-Wi.y,Wi.x,0,-mn.y,mn.x,0];return!Zg(t,ps,ms,ys,za)||(t=[1,0,0,0,1,0,0,0,1],!Zg(t,ps,ms,ys,za))?!1:(Xa.crossVectors(Oi,Wi),t=[Xa.x,Xa.y,Xa.z],Zg(t,ps,ms,ys,za))}clampPoint(A,t){return t.copy(A).clamp(this.min,this.max)}distanceToPoint(A){return this.clampPoint(A,pi).distanceTo(A)}getBoundingSphere(A){return this.isEmpty()?A.makeEmpty():(this.getCenter(A.center),A.radius=this.getSize(pi).length()*.5),A}intersect(A){return this.min.max(A.min),this.max.min(A.max),this.isEmpty()&&this.makeEmpty(),this}union(A){return this.min.min(A.min),this.max.max(A.max),this}applyMatrix4(A){return this.isEmpty()?this:(fi[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(A),fi[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(A),fi[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(A),fi[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(A),fi[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(A),fi[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(A),fi[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(A),fi[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(A),this.setFromPoints(fi),this)}translate(A){return this.min.add(A),this.max.add(A),this}equals(A){return A.min.equals(this.min)&&A.max.equals(this.max)}}const fi=[new rA,new rA,new rA,new rA,new rA,new rA,new rA,new rA],pi=new rA,fs=new Ti,ps=new rA,ms=new rA,ys=new rA,Oi=new rA,Wi=new rA,mn=new rA,Do=new rA,za=new rA,Xa=new rA,yn=new rA;function Zg(i,A,t,e,n){for(let s=0,o=i.length-3;s<=o;s+=3){yn.fromArray(i,s);const a=n.x*Math.abs(yn.x)+n.y*Math.abs(yn.y)+n.z*Math.abs(yn.z),g=A.dot(yn),r=t.dot(yn),I=e.dot(yn);if(Math.max(-Math.max(g,r,I),Math.min(g,r,I))>a)return!1}return!0}const tD=new Ti,So=new rA,jg=new rA;class Ag{constructor(A=new rA,t=-1){this.center=A,this.radius=t}set(A,t){return this.center.copy(A),this.radius=t,this}setFromPoints(A,t){const e=this.center;t!==void 0?e.copy(t):tD.setFromPoints(A).getCenter(e);let n=0;for(let s=0,o=A.length;s<o;s++)n=Math.max(n,e.distanceToSquared(A[s]));return this.radius=Math.sqrt(n),this}copy(A){return this.center.copy(A.center),this.radius=A.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(A){return A.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(A){return A.distanceTo(this.center)-this.radius}intersectsSphere(A){const t=this.radius+A.radius;return A.center.distanceToSquared(this.center)<=t*t}intersectsBox(A){return A.intersectsSphere(this)}intersectsPlane(A){return Math.abs(A.distanceToPoint(this.center))<=this.radius}clampPoint(A,t){const e=this.center.distanceToSquared(A);return t.copy(A),e>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(A){return this.isEmpty()?(A.makeEmpty(),A):(A.set(this.center,this.center),A.expandByScalar(this.radius),A)}applyMatrix4(A){return this.center.applyMatrix4(A),this.radius=this.radius*A.getMaxScaleOnAxis(),this}translate(A){return this.center.add(A),this}expandByPoint(A){if(this.isEmpty())return this.center.copy(A),this.radius=0,this;So.subVectors(A,this.center);const t=So.lengthSq();if(t>this.radius*this.radius){const e=Math.sqrt(t),n=(e-this.radius)*.5;this.center.addScaledVector(So,n/e),this.radius+=n}return this}union(A){return A.isEmpty()?this:this.isEmpty()?(this.copy(A),this):(this.center.equals(A.center)===!0?this.radius=Math.max(this.radius,A.radius):(jg.subVectors(A.center,this.center).setLength(A.radius),this.expandByPoint(So.copy(A.center).add(jg)),this.expandByPoint(So.copy(A.center).sub(jg))),this)}equals(A){return A.center.equals(this.center)&&A.radius===this.radius}clone(){return new this.constructor().copy(this)}}const mi=new rA,$g=new rA,Za=new rA,Vi=new rA,AI=new rA,ja=new rA,tI=new rA;class fc{constructor(A=new rA,t=new rA(0,0,-1)){this.origin=A,this.direction=t}set(A,t){return this.origin.copy(A),this.direction.copy(t),this}copy(A){return this.origin.copy(A.origin),this.direction.copy(A.direction),this}at(A,t){return t.copy(this.origin).addScaledVector(this.direction,A)}lookAt(A){return this.direction.copy(A).sub(this.origin).normalize(),this}recast(A){return this.origin.copy(this.at(A,mi)),this}closestPointToPoint(A,t){t.subVectors(A,this.origin);const e=t.dot(this.direction);return e<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,e)}distanceToPoint(A){return Math.sqrt(this.distanceSqToPoint(A))}distanceSqToPoint(A){const t=mi.subVectors(A,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(A):(mi.copy(this.origin).addScaledVector(this.direction,t),mi.distanceToSquared(A))}distanceSqToSegment(A,t,e,n){$g.copy(A).add(t).multiplyScalar(.5),Za.copy(t).sub(A).normalize(),Vi.copy(this.origin).sub($g);const s=A.distanceTo(t)*.5,o=-this.direction.dot(Za),a=Vi.dot(this.direction),g=-Vi.dot(Za),r=Vi.lengthSq(),I=Math.abs(1-o*o);let B,C,Q,c;if(I>0)if(B=o*g-a,C=o*a-g,c=s*I,B>=0)if(C>=-c)if(C<=c){const l=1/I;B*=l,C*=l,Q=B*(B+o*C+2*a)+C*(o*B+C+2*g)+r}else C=s,B=Math.max(0,-(o*C+a)),Q=-B*B+C*(C+2*g)+r;else C=-s,B=Math.max(0,-(o*C+a)),Q=-B*B+C*(C+2*g)+r;else C<=-c?(B=Math.max(0,-(-o*s+a)),C=B>0?-s:Math.min(Math.max(-s,-g),s),Q=-B*B+C*(C+2*g)+r):C<=c?(B=0,C=Math.min(Math.max(-s,-g),s),Q=C*(C+2*g)+r):(B=Math.max(0,-(o*s+a)),C=B>0?s:Math.min(Math.max(-s,-g),s),Q=-B*B+C*(C+2*g)+r);else C=o>0?-s:s,B=Math.max(0,-(o*C+a)),Q=-B*B+C*(C+2*g)+r;return e&&e.copy(this.origin).addScaledVector(this.direction,B),n&&n.copy($g).addScaledVector(Za,C),Q}intersectSphere(A,t){mi.subVectors(A.center,this.origin);const e=mi.dot(this.direction),n=mi.dot(mi)-e*e,s=A.radius*A.radius;if(n>s)return null;const o=Math.sqrt(s-n),a=e-o,g=e+o;return g<0?null:a<0?this.at(g,t):this.at(a,t)}intersectsSphere(A){return this.distanceSqToPoint(A.center)<=A.radius*A.radius}distanceToPlane(A){const t=A.normal.dot(this.direction);if(t===0)return A.distanceToPoint(this.origin)===0?0:null;const e=-(this.origin.dot(A.normal)+A.constant)/t;return e>=0?e:null}intersectPlane(A,t){const e=this.distanceToPlane(A);return e===null?null:this.at(e,t)}intersectsPlane(A){const t=A.distanceToPoint(this.origin);return t===0||A.normal.dot(this.direction)*t<0}intersectBox(A,t){let e,n,s,o,a,g;const r=1/this.direction.x,I=1/this.direction.y,B=1/this.direction.z,C=this.origin;return r>=0?(e=(A.min.x-C.x)*r,n=(A.max.x-C.x)*r):(e=(A.max.x-C.x)*r,n=(A.min.x-C.x)*r),I>=0?(s=(A.min.y-C.y)*I,o=(A.max.y-C.y)*I):(s=(A.max.y-C.y)*I,o=(A.min.y-C.y)*I),e>o||s>n||((s>e||isNaN(e))&&(e=s),(o<n||isNaN(n))&&(n=o),B>=0?(a=(A.min.z-C.z)*B,g=(A.max.z-C.z)*B):(a=(A.max.z-C.z)*B,g=(A.min.z-C.z)*B),e>g||a>n)||((a>e||e!==e)&&(e=a),(g<n||n!==n)&&(n=g),n<0)?null:this.at(e>=0?e:n,t)}intersectsBox(A){return this.intersectBox(A,mi)!==null}intersectTriangle(A,t,e,n,s){AI.subVectors(t,A),ja.subVectors(e,A),tI.crossVectors(AI,ja);let o=this.direction.dot(tI),a;if(o>0){if(n)return null;a=1}else if(o<0)a=-1,o=-o;else return null;Vi.subVectors(this.origin,A);const g=a*this.direction.dot(ja.crossVectors(Vi,ja));if(g<0)return null;const r=a*this.direction.dot(AI.cross(Vi));if(r<0||g+r>o)return null;const I=-a*Vi.dot(tI);return I<0?null:this.at(I/o,s)}applyMatrix4(A){return this.origin.applyMatrix4(A),this.direction.transformDirection(A),this}equals(A){return A.origin.equals(this.origin)&&A.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class ne{constructor(A,t,e,n,s,o,a,g,r,I,B,C,Q,c,l,h){ne.prototype.isMatrix4=!0,this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],A!==void 0&&this.set(A,t,e,n,s,o,a,g,r,I,B,C,Q,c,l,h)}set(A,t,e,n,s,o,a,g,r,I,B,C,Q,c,l,h){const E=this.elements;return E[0]=A,E[4]=t,E[8]=e,E[12]=n,E[1]=s,E[5]=o,E[9]=a,E[13]=g,E[2]=r,E[6]=I,E[10]=B,E[14]=C,E[3]=Q,E[7]=c,E[11]=l,E[15]=h,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new ne().fromArray(this.elements)}copy(A){const t=this.elements,e=A.elements;return t[0]=e[0],t[1]=e[1],t[2]=e[2],t[3]=e[3],t[4]=e[4],t[5]=e[5],t[6]=e[6],t[7]=e[7],t[8]=e[8],t[9]=e[9],t[10]=e[10],t[11]=e[11],t[12]=e[12],t[13]=e[13],t[14]=e[14],t[15]=e[15],this}copyPosition(A){const t=this.elements,e=A.elements;return t[12]=e[12],t[13]=e[13],t[14]=e[14],this}setFromMatrix3(A){const t=A.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(A,t,e){return A.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),e.setFromMatrixColumn(this,2),this}makeBasis(A,t,e){return this.set(A.x,t.x,e.x,0,A.y,t.y,e.y,0,A.z,t.z,e.z,0,0,0,0,1),this}extractRotation(A){const t=this.elements,e=A.elements,n=1/Ds.setFromMatrixColumn(A,0).length(),s=1/Ds.setFromMatrixColumn(A,1).length(),o=1/Ds.setFromMatrixColumn(A,2).length();return t[0]=e[0]*n,t[1]=e[1]*n,t[2]=e[2]*n,t[3]=0,t[4]=e[4]*s,t[5]=e[5]*s,t[6]=e[6]*s,t[7]=0,t[8]=e[8]*o,t[9]=e[9]*o,t[10]=e[10]*o,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(A){const t=this.elements,e=A.x,n=A.y,s=A.z,o=Math.cos(e),a=Math.sin(e),g=Math.cos(n),r=Math.sin(n),I=Math.cos(s),B=Math.sin(s);if(A.order==="XYZ"){const C=o*I,Q=o*B,c=a*I,l=a*B;t[0]=g*I,t[4]=-g*B,t[8]=r,t[1]=Q+c*r,t[5]=C-l*r,t[9]=-a*g,t[2]=l-C*r,t[6]=c+Q*r,t[10]=o*g}else if(A.order==="YXZ"){const C=g*I,Q=g*B,c=r*I,l=r*B;t[0]=C+l*a,t[4]=c*a-Q,t[8]=o*r,t[1]=o*B,t[5]=o*I,t[9]=-a,t[2]=Q*a-c,t[6]=l+C*a,t[10]=o*g}else if(A.order==="ZXY"){const C=g*I,Q=g*B,c=r*I,l=r*B;t[0]=C-l*a,t[4]=-o*B,t[8]=c+Q*a,t[1]=Q+c*a,t[5]=o*I,t[9]=l-C*a,t[2]=-o*r,t[6]=a,t[10]=o*g}else if(A.order==="ZYX"){const C=o*I,Q=o*B,c=a*I,l=a*B;t[0]=g*I,t[4]=c*r-Q,t[8]=C*r+l,t[1]=g*B,t[5]=l*r+C,t[9]=Q*r-c,t[2]=-r,t[6]=a*g,t[10]=o*g}else if(A.order==="YZX"){const C=o*g,Q=o*r,c=a*g,l=a*r;t[0]=g*I,t[4]=l-C*B,t[8]=c*B+Q,t[1]=B,t[5]=o*I,t[9]=-a*I,t[2]=-r*I,t[6]=Q*B+c,t[10]=C-l*B}else if(A.order==="XZY"){const C=o*g,Q=o*r,c=a*g,l=a*r;t[0]=g*I,t[4]=-B,t[8]=r*I,t[1]=C*B+l,t[5]=o*I,t[9]=Q*B-c,t[2]=c*B-Q,t[6]=a*I,t[10]=l*B+C}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(A){return this.compose(eD,A,iD)}lookAt(A,t,e){const n=this.elements;return Ie.subVectors(A,t),Ie.lengthSq()===0&&(Ie.z=1),Ie.normalize(),zi.crossVectors(e,Ie),zi.lengthSq()===0&&(Math.abs(e.z)===1?Ie.x+=1e-4:Ie.z+=1e-4,Ie.normalize(),zi.crossVectors(e,Ie)),zi.normalize(),$a.crossVectors(Ie,zi),n[0]=zi.x,n[4]=$a.x,n[8]=Ie.x,n[1]=zi.y,n[5]=$a.y,n[9]=Ie.y,n[2]=zi.z,n[6]=$a.z,n[10]=Ie.z,this}multiply(A){return this.multiplyMatrices(this,A)}premultiply(A){return this.multiplyMatrices(A,this)}multiplyMatrices(A,t){const e=A.elements,n=t.elements,s=this.elements,o=e[0],a=e[4],g=e[8],r=e[12],I=e[1],B=e[5],C=e[9],Q=e[13],c=e[2],l=e[6],h=e[10],E=e[14],f=e[3],d=e[7],u=e[11],m=e[15],y=n[0],p=n[4],R=n[8],D=n[12],S=n[1],F=n[5],G=n[9],L=n[13],T=n[2],b=n[6],V=n[10],K=n[14],tA=n[3],nA=n[7],Z=n[11],CA=n[15];return s[0]=o*y+a*S+g*T+r*tA,s[4]=o*p+a*F+g*b+r*nA,s[8]=o*R+a*G+g*V+r*Z,s[12]=o*D+a*L+g*K+r*CA,s[1]=I*y+B*S+C*T+Q*tA,s[5]=I*p+B*F+C*b+Q*nA,s[9]=I*R+B*G+C*V+Q*Z,s[13]=I*D+B*L+C*K+Q*CA,s[2]=c*y+l*S+h*T+E*tA,s[6]=c*p+l*F+h*b+E*nA,s[10]=c*R+l*G+h*V+E*Z,s[14]=c*D+l*L+h*K+E*CA,s[3]=f*y+d*S+u*T+m*tA,s[7]=f*p+d*F+u*b+m*nA,s[11]=f*R+d*G+u*V+m*Z,s[15]=f*D+d*L+u*K+m*CA,this}multiplyScalar(A){const t=this.elements;return t[0]*=A,t[4]*=A,t[8]*=A,t[12]*=A,t[1]*=A,t[5]*=A,t[9]*=A,t[13]*=A,t[2]*=A,t[6]*=A,t[10]*=A,t[14]*=A,t[3]*=A,t[7]*=A,t[11]*=A,t[15]*=A,this}determinant(){const A=this.elements,t=A[0],e=A[4],n=A[8],s=A[12],o=A[1],a=A[5],g=A[9],r=A[13],I=A[2],B=A[6],C=A[10],Q=A[14],c=A[3],l=A[7],h=A[11],E=A[15];return c*(+s*g*B-n*r*B-s*a*C+e*r*C+n*a*Q-e*g*Q)+l*(+t*g*Q-t*r*C+s*o*C-n*o*Q+n*r*I-s*g*I)+h*(+t*r*B-t*a*Q-s*o*B+e*o*Q+s*a*I-e*r*I)+E*(-n*a*I-t*g*B+t*a*C+n*o*B-e*o*C+e*g*I)}transpose(){const A=this.elements;let t;return t=A[1],A[1]=A[4],A[4]=t,t=A[2],A[2]=A[8],A[8]=t,t=A[6],A[6]=A[9],A[9]=t,t=A[3],A[3]=A[12],A[12]=t,t=A[7],A[7]=A[13],A[13]=t,t=A[11],A[11]=A[14],A[14]=t,this}setPosition(A,t,e){const n=this.elements;return A.isVector3?(n[12]=A.x,n[13]=A.y,n[14]=A.z):(n[12]=A,n[13]=t,n[14]=e),this}invert(){const A=this.elements,t=A[0],e=A[1],n=A[2],s=A[3],o=A[4],a=A[5],g=A[6],r=A[7],I=A[8],B=A[9],C=A[10],Q=A[11],c=A[12],l=A[13],h=A[14],E=A[15],f=B*h*r-l*C*r+l*g*Q-a*h*Q-B*g*E+a*C*E,d=c*C*r-I*h*r-c*g*Q+o*h*Q+I*g*E-o*C*E,u=I*l*r-c*B*r+c*a*Q-o*l*Q-I*a*E+o*B*E,m=c*B*g-I*l*g-c*a*C+o*l*C+I*a*h-o*B*h,y=t*f+e*d+n*u+s*m;if(y===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const p=1/y;return A[0]=f*p,A[1]=(l*C*s-B*h*s-l*n*Q+e*h*Q+B*n*E-e*C*E)*p,A[2]=(a*h*s-l*g*s+l*n*r-e*h*r-a*n*E+e*g*E)*p,A[3]=(B*g*s-a*C*s-B*n*r+e*C*r+a*n*Q-e*g*Q)*p,A[4]=d*p,A[5]=(I*h*s-c*C*s+c*n*Q-t*h*Q-I*n*E+t*C*E)*p,A[6]=(c*g*s-o*h*s-c*n*r+t*h*r+o*n*E-t*g*E)*p,A[7]=(o*C*s-I*g*s+I*n*r-t*C*r-o*n*Q+t*g*Q)*p,A[8]=u*p,A[9]=(c*B*s-I*l*s-c*e*Q+t*l*Q+I*e*E-t*B*E)*p,A[10]=(o*l*s-c*a*s+c*e*r-t*l*r-o*e*E+t*a*E)*p,A[11]=(I*a*s-o*B*s-I*e*r+t*B*r+o*e*Q-t*a*Q)*p,A[12]=m*p,A[13]=(I*l*n-c*B*n+c*e*C-t*l*C-I*e*h+t*B*h)*p,A[14]=(c*a*n-o*l*n-c*e*g+t*l*g+o*e*h-t*a*h)*p,A[15]=(o*B*n-I*a*n+I*e*g-t*B*g-o*e*C+t*a*C)*p,this}scale(A){const t=this.elements,e=A.x,n=A.y,s=A.z;return t[0]*=e,t[4]*=n,t[8]*=s,t[1]*=e,t[5]*=n,t[9]*=s,t[2]*=e,t[6]*=n,t[10]*=s,t[3]*=e,t[7]*=n,t[11]*=s,this}getMaxScaleOnAxis(){const A=this.elements,t=A[0]*A[0]+A[1]*A[1]+A[2]*A[2],e=A[4]*A[4]+A[5]*A[5]+A[6]*A[6],n=A[8]*A[8]+A[9]*A[9]+A[10]*A[10];return Math.sqrt(Math.max(t,e,n))}makeTranslation(A,t,e){return A.isVector3?this.set(1,0,0,A.x,0,1,0,A.y,0,0,1,A.z,0,0,0,1):this.set(1,0,0,A,0,1,0,t,0,0,1,e,0,0,0,1),this}makeRotationX(A){const t=Math.cos(A),e=Math.sin(A);return this.set(1,0,0,0,0,t,-e,0,0,e,t,0,0,0,0,1),this}makeRotationY(A){const t=Math.cos(A),e=Math.sin(A);return this.set(t,0,e,0,0,1,0,0,-e,0,t,0,0,0,0,1),this}makeRotationZ(A){const t=Math.cos(A),e=Math.sin(A);return this.set(t,-e,0,0,e,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(A,t){const e=Math.cos(t),n=Math.sin(t),s=1-e,o=A.x,a=A.y,g=A.z,r=s*o,I=s*a;return this.set(r*o+e,r*a-n*g,r*g+n*a,0,r*a+n*g,I*a+e,I*g-n*o,0,r*g-n*a,I*g+n*o,s*g*g+e,0,0,0,0,1),this}makeScale(A,t,e){return this.set(A,0,0,0,0,t,0,0,0,0,e,0,0,0,0,1),this}makeShear(A,t,e,n,s,o){return this.set(1,e,s,0,A,1,o,0,t,n,1,0,0,0,0,1),this}compose(A,t,e){const n=this.elements,s=t._x,o=t._y,a=t._z,g=t._w,r=s+s,I=o+o,B=a+a,C=s*r,Q=s*I,c=s*B,l=o*I,h=o*B,E=a*B,f=g*r,d=g*I,u=g*B,m=e.x,y=e.y,p=e.z;return n[0]=(1-(l+E))*m,n[1]=(Q+u)*m,n[2]=(c-d)*m,n[3]=0,n[4]=(Q-u)*y,n[5]=(1-(C+E))*y,n[6]=(h+f)*y,n[7]=0,n[8]=(c+d)*p,n[9]=(h-f)*p,n[10]=(1-(C+l))*p,n[11]=0,n[12]=A.x,n[13]=A.y,n[14]=A.z,n[15]=1,this}decompose(A,t,e){const n=this.elements;let s=Ds.set(n[0],n[1],n[2]).length();const o=Ds.set(n[4],n[5],n[6]).length(),a=Ds.set(n[8],n[9],n[10]).length();this.determinant()<0&&(s=-s),A.x=n[12],A.y=n[13],A.z=n[14],ve.copy(this);const r=1/s,I=1/o,B=1/a;return ve.elements[0]*=r,ve.elements[1]*=r,ve.elements[2]*=r,ve.elements[4]*=I,ve.elements[5]*=I,ve.elements[6]*=I,ve.elements[8]*=B,ve.elements[9]*=B,ve.elements[10]*=B,t.setFromRotationMatrix(ve),e.x=s,e.y=o,e.z=a,this}makePerspective(A,t,e,n,s,o,a=Wa){const g=this.elements,r=2*s/(t-A),I=2*s/(e-n),B=(t+A)/(t-A),C=(e+n)/(e-n);let Q,c;if(a===Wa)Q=-(o+s)/(o-s),c=-2*o*s/(o-s);else if(a===bE)Q=-o/(o-s),c=-o*s/(o-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+a);return g[0]=r,g[4]=0,g[8]=B,g[12]=0,g[1]=0,g[5]=I,g[9]=C,g[13]=0,g[2]=0,g[6]=0,g[10]=Q,g[14]=c,g[3]=0,g[7]=0,g[11]=-1,g[15]=0,this}makeOrthographic(A,t,e,n,s,o,a=Wa){const g=this.elements,r=1/(t-A),I=1/(e-n),B=1/(o-s),C=(t+A)*r,Q=(e+n)*I;let c,l;if(a===Wa)c=(o+s)*B,l=-2*B;else if(a===bE)c=s*B,l=-1*B;else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+a);return g[0]=2*r,g[4]=0,g[8]=0,g[12]=-C,g[1]=0,g[5]=2*I,g[9]=0,g[13]=-Q,g[2]=0,g[6]=0,g[10]=l,g[14]=-c,g[3]=0,g[7]=0,g[11]=0,g[15]=1,this}equals(A){const t=this.elements,e=A.elements;for(let n=0;n<16;n++)if(t[n]!==e[n])return!1;return!0}fromArray(A,t=0){for(let e=0;e<16;e++)this.elements[e]=A[e+t];return this}toArray(A=[],t=0){const e=this.elements;return A[t]=e[0],A[t+1]=e[1],A[t+2]=e[2],A[t+3]=e[3],A[t+4]=e[4],A[t+5]=e[5],A[t+6]=e[6],A[t+7]=e[7],A[t+8]=e[8],A[t+9]=e[9],A[t+10]=e[10],A[t+11]=e[11],A[t+12]=e[12],A[t+13]=e[13],A[t+14]=e[14],A[t+15]=e[15],A}}const Ds=new rA,ve=new ne,eD=new rA(0,0,0),iD=new rA(1,1,1),zi=new rA,$a=new rA,Ie=new rA,HE=new ne,qE=new ao;class tg{constructor(A=0,t=0,e=0,n=tg.DEFAULT_ORDER){this.isEuler=!0,this._x=A,this._y=t,this._z=e,this._order=n}get x(){return this._x}set x(A){this._x=A,this._onChangeCallback()}get y(){return this._y}set y(A){this._y=A,this._onChangeCallback()}get z(){return this._z}set z(A){this._z=A,this._onChangeCallback()}get order(){return this._order}set order(A){this._order=A,this._onChangeCallback()}set(A,t,e,n=this._order){return this._x=A,this._y=t,this._z=e,this._order=n,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(A){return this._x=A._x,this._y=A._y,this._z=A._z,this._order=A._order,this._onChangeCallback(),this}setFromRotationMatrix(A,t=this._order,e=!0){const n=A.elements,s=n[0],o=n[4],a=n[8],g=n[1],r=n[5],I=n[9],B=n[2],C=n[6],Q=n[10];switch(t){case"XYZ":this._y=Math.asin(te(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(-I,Q),this._z=Math.atan2(-o,s)):(this._x=Math.atan2(C,r),this._z=0);break;case"YXZ":this._x=Math.asin(-te(I,-1,1)),Math.abs(I)<.9999999?(this._y=Math.atan2(a,Q),this._z=Math.atan2(g,r)):(this._y=Math.atan2(-B,s),this._z=0);break;case"ZXY":this._x=Math.asin(te(C,-1,1)),Math.abs(C)<.9999999?(this._y=Math.atan2(-B,Q),this._z=Math.atan2(-o,r)):(this._y=0,this._z=Math.atan2(g,s));break;case"ZYX":this._y=Math.asin(-te(B,-1,1)),Math.abs(B)<.9999999?(this._x=Math.atan2(C,Q),this._z=Math.atan2(g,s)):(this._x=0,this._z=Math.atan2(-o,r));break;case"YZX":this._z=Math.asin(te(g,-1,1)),Math.abs(g)<.9999999?(this._x=Math.atan2(-I,r),this._y=Math.atan2(-B,s)):(this._x=0,this._y=Math.atan2(a,Q));break;case"XZY":this._z=Math.asin(-te(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(C,r),this._y=Math.atan2(a,s)):(this._x=Math.atan2(-I,Q),this._y=0);break;default:console.warn("THREE.Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,e===!0&&this._onChangeCallback(),this}setFromQuaternion(A,t,e){return HE.makeRotationFromQuaternion(A),this.setFromRotationMatrix(HE,t,e)}setFromVector3(A,t=this._order){return this.set(A.x,A.y,A.z,t)}reorder(A){return qE.setFromEuler(this),this.setFromQuaternion(qE,A)}equals(A){return A._x===this._x&&A._y===this._y&&A._z===this._z&&A._order===this._order}fromArray(A){return this._x=A[0],this._y=A[1],this._z=A[2],A[3]!==void 0&&(this._order=A[3]),this._onChangeCallback(),this}toArray(A=[],t=0){return A[t]=this._x,A[t+1]=this._y,A[t+2]=this._z,A[t+3]=this._order,A}_onChange(A){return this._onChangeCallback=A,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}tg.DEFAULT_ORDER="XYZ";class pc{constructor(){this.mask=1}set(A){this.mask=(1<<A|0)>>>0}enable(A){this.mask|=1<<A|0}enableAll(){this.mask=-1}toggle(A){this.mask^=1<<A|0}disable(A){this.mask&=~(1<<A|0)}disableAll(){this.mask=0}test(A){return(this.mask&A.mask)!==0}isEnabled(A){return(this.mask&(1<<A|0))!==0}}let nD=0;const JE=new rA,Ss=new ao,yi=new ne,Ar=new rA,wo=new rA,sD=new rA,oD=new ao,KE=new rA(1,0,0),YE=new rA(0,1,0),PE=new rA(0,0,1),aD={type:"added"},OE={type:"removed"};class Me extends Ba{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:nD++}),this.uuid=Ca(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Me.DEFAULT_UP.clone();const A=new rA,t=new tg,e=new ao,n=new rA(1,1,1);function s(){e.setFromEuler(t,!1)}function o(){t.setFromQuaternion(e,void 0,!1)}t._onChange(s),e._onChange(o),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:A},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:e},scale:{configurable:!0,enumerable:!0,value:n},modelViewMatrix:{value:new ne},normalMatrix:{value:new Qn}}),this.matrix=new ne,this.matrixWorld=new ne,this.matrixAutoUpdate=Me.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.matrixWorldAutoUpdate=Me.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.layers=new pc,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.userData={}}onBeforeRender(){}onAfterRender(){}applyMatrix4(A){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(A),this.matrix.decompose(this.position,this.quaternion,this.scale)}applyQuaternion(A){return this.quaternion.premultiply(A),this}setRotationFromAxisAngle(A,t){this.quaternion.setFromAxisAngle(A,t)}setRotationFromEuler(A){this.quaternion.setFromEuler(A,!0)}setRotationFromMatrix(A){this.quaternion.setFromRotationMatrix(A)}setRotationFromQuaternion(A){this.quaternion.copy(A)}rotateOnAxis(A,t){return Ss.setFromAxisAngle(A,t),this.quaternion.multiply(Ss),this}rotateOnWorldAxis(A,t){return Ss.setFromAxisAngle(A,t),this.quaternion.premultiply(Ss),this}rotateX(A){return this.rotateOnAxis(KE,A)}rotateY(A){return this.rotateOnAxis(YE,A)}rotateZ(A){return this.rotateOnAxis(PE,A)}translateOnAxis(A,t){return JE.copy(A).applyQuaternion(this.quaternion),this.position.add(JE.multiplyScalar(t)),this}translateX(A){return this.translateOnAxis(KE,A)}translateY(A){return this.translateOnAxis(YE,A)}translateZ(A){return this.translateOnAxis(PE,A)}localToWorld(A){return this.updateWorldMatrix(!0,!1),A.applyMatrix4(this.matrixWorld)}worldToLocal(A){return this.updateWorldMatrix(!0,!1),A.applyMatrix4(yi.copy(this.matrixWorld).invert())}lookAt(A,t,e){A.isVector3?Ar.copy(A):Ar.set(A,t,e);const n=this.parent;this.updateWorldMatrix(!0,!1),wo.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?yi.lookAt(wo,Ar,this.up):yi.lookAt(Ar,wo,this.up),this.quaternion.setFromRotationMatrix(yi),n&&(yi.extractRotation(n.matrixWorld),Ss.setFromRotationMatrix(yi),this.quaternion.premultiply(Ss.invert()))}add(A){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return A===this?(console.error("THREE.Object3D.add: object can't be added as a child of itself.",A),this):(A&&A.isObject3D?(A.parent!==null&&A.parent.remove(A),A.parent=this,this.children.push(A),A.dispatchEvent(aD)):console.error("THREE.Object3D.add: object not an instance of THREE.Object3D.",A),this)}remove(A){if(arguments.length>1){for(let e=0;e<arguments.length;e++)this.remove(arguments[e]);return this}const t=this.children.indexOf(A);return t!==-1&&(A.parent=null,this.children.splice(t,1),A.dispatchEvent(OE)),this}removeFromParent(){const A=this.parent;return A!==null&&A.remove(this),this}clear(){for(let A=0;A<this.children.length;A++){const t=this.children[A];t.parent=null,t.dispatchEvent(OE)}return this.children.length=0,this}attach(A){return this.updateWorldMatrix(!0,!1),yi.copy(this.matrixWorld).invert(),A.parent!==null&&(A.parent.updateWorldMatrix(!0,!1),yi.multiply(A.parent.matrixWorld)),A.applyMatrix4(yi),this.add(A),A.updateWorldMatrix(!1,!0),this}getObjectById(A){return this.getObjectByProperty("id",A)}getObjectByName(A){return this.getObjectByProperty("name",A)}getObjectByProperty(A,t){if(this[A]===t)return this;for(let e=0,n=this.children.length;e<n;e++){const o=this.children[e].getObjectByProperty(A,t);if(o!==void 0)return o}}getObjectsByProperty(A,t){let e=[];this[A]===t&&e.push(this);for(let n=0,s=this.children.length;n<s;n++){const o=this.children[n].getObjectsByProperty(A,t);o.length>0&&(e=e.concat(o))}return e}getWorldPosition(A){return this.updateWorldMatrix(!0,!1),A.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(A){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(wo,A,sD),A}getWorldScale(A){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(wo,oD,A),A}getWorldDirection(A){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return A.set(t[8],t[9],t[10]).normalize()}raycast(){}traverse(A){A(this);const t=this.children;for(let e=0,n=t.length;e<n;e++)t[e].traverse(A)}traverseVisible(A){if(this.visible===!1)return;A(this);const t=this.children;for(let e=0,n=t.length;e<n;e++)t[e].traverseVisible(A)}traverseAncestors(A){const t=this.parent;t!==null&&(A(t),t.traverseAncestors(A))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale),this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(A){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||A)&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),this.matrixWorldNeedsUpdate=!1,A=!0);const t=this.children;for(let e=0,n=t.length;e<n;e++){const s=t[e];(s.matrixWorldAutoUpdate===!0||A===!0)&&s.updateMatrixWorld(A)}}updateWorldMatrix(A,t){const e=this.parent;if(A===!0&&e!==null&&e.matrixWorldAutoUpdate===!0&&e.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix),t===!0){const n=this.children;for(let s=0,o=n.length;s<o;s++){const a=n[s];a.matrixWorldAutoUpdate===!0&&a.updateWorldMatrix(!1,!0)}}}toJSON(A){const t=A===void 0||typeof A=="string",e={};t&&(A={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},e.metadata={version:4.6,type:"Object",generator:"Object3D.toJSON"});const n={};n.uuid=this.uuid,n.type=this.type,this.name!==""&&(n.name=this.name),this.castShadow===!0&&(n.castShadow=!0),this.receiveShadow===!0&&(n.receiveShadow=!0),this.visible===!1&&(n.visible=!1),this.frustumCulled===!1&&(n.frustumCulled=!1),this.renderOrder!==0&&(n.renderOrder=this.renderOrder),Object.keys(this.userData).length>0&&(n.userData=this.userData),n.layers=this.layers.mask,n.matrix=this.matrix.toArray(),n.up=this.up.toArray(),this.matrixAutoUpdate===!1&&(n.matrixAutoUpdate=!1),this.isInstancedMesh&&(n.type="InstancedMesh",n.count=this.count,n.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(n.instanceColor=this.instanceColor.toJSON()));function s(a,g){return a[g.uuid]===void 0&&(a[g.uuid]=g.toJSON(A)),g.uuid}if(this.isScene)this.background&&(this.background.isColor?n.background=this.background.toJSON():this.background.isTexture&&(n.background=this.background.toJSON(A).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(n.environment=this.environment.toJSON(A).uuid);else if(this.isMesh||this.isLine||this.isPoints){n.geometry=s(A.geometries,this.geometry);const a=this.geometry.parameters;if(a!==void 0&&a.shapes!==void 0){const g=a.shapes;if(Array.isArray(g))for(let r=0,I=g.length;r<I;r++){const B=g[r];s(A.shapes,B)}else s(A.shapes,g)}}if(this.isSkinnedMesh&&(n.bindMode=this.bindMode,n.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(A.skeletons,this.skeleton),n.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const a=[];for(let g=0,r=this.material.length;g<r;g++)a.push(s(A.materials,this.material[g]));n.material=a}else n.material=s(A.materials,this.material);if(this.children.length>0){n.children=[];for(let a=0;a<this.children.length;a++)n.children.push(this.children[a].toJSON(A).object)}if(this.animations.length>0){n.animations=[];for(let a=0;a<this.animations.length;a++){const g=this.animations[a];n.animations.push(s(A.animations,g))}}if(t){const a=o(A.geometries),g=o(A.materials),r=o(A.textures),I=o(A.images),B=o(A.shapes),C=o(A.skeletons),Q=o(A.animations),c=o(A.nodes);a.length>0&&(e.geometries=a),g.length>0&&(e.materials=g),r.length>0&&(e.textures=r),I.length>0&&(e.images=I),B.length>0&&(e.shapes=B),C.length>0&&(e.skeletons=C),Q.length>0&&(e.animations=Q),c.length>0&&(e.nodes=c)}return e.object=n,e;function o(a){const g=[];for(const r in a){const I=a[r];delete I.metadata,g.push(I)}return g}}clone(A){return new this.constructor().copy(this,A)}copy(A,t=!0){if(this.name=A.name,this.up.copy(A.up),this.position.copy(A.position),this.rotation.order=A.rotation.order,this.quaternion.copy(A.quaternion),this.scale.copy(A.scale),this.matrix.copy(A.matrix),this.matrixWorld.copy(A.matrixWorld),this.matrixAutoUpdate=A.matrixAutoUpdate,this.matrixWorldNeedsUpdate=A.matrixWorldNeedsUpdate,this.matrixWorldAutoUpdate=A.matrixWorldAutoUpdate,this.layers.mask=A.layers.mask,this.visible=A.visible,this.castShadow=A.castShadow,this.receiveShadow=A.receiveShadow,this.frustumCulled=A.frustumCulled,this.renderOrder=A.renderOrder,this.animations=A.animations,this.userData=JSON.parse(JSON.stringify(A.userData)),t===!0)for(let e=0;e<A.children.length;e++){const n=A.children[e];this.add(n.clone())}return this}}Me.DEFAULT_UP=new rA(0,1,0);Me.DEFAULT_MATRIX_AUTO_UPDATE=!0;Me.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;const ke=new rA,Di=new rA,eI=new rA,Si=new rA,ws=new rA,Ms=new rA,WE=new rA,iI=new rA,nI=new rA,sI=new rA;let tr=!1;class Je{constructor(A=new rA,t=new rA,e=new rA){this.a=A,this.b=t,this.c=e}static getNormal(A,t,e,n){n.subVectors(e,t),ke.subVectors(A,t),n.cross(ke);const s=n.lengthSq();return s>0?n.multiplyScalar(1/Math.sqrt(s)):n.set(0,0,0)}static getBarycoord(A,t,e,n,s){ke.subVectors(n,t),Di.subVectors(e,t),eI.subVectors(A,t);const o=ke.dot(ke),a=ke.dot(Di),g=ke.dot(eI),r=Di.dot(Di),I=Di.dot(eI),B=o*r-a*a;if(B===0)return s.set(-2,-1,-1);const C=1/B,Q=(r*g-a*I)*C,c=(o*I-a*g)*C;return s.set(1-Q-c,c,Q)}static containsPoint(A,t,e,n){return this.getBarycoord(A,t,e,n,Si),Si.x>=0&&Si.y>=0&&Si.x+Si.y<=1}static getUV(A,t,e,n,s,o,a,g){return tr===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),tr=!0),this.getInterpolation(A,t,e,n,s,o,a,g)}static getInterpolation(A,t,e,n,s,o,a,g){return this.getBarycoord(A,t,e,n,Si),g.setScalar(0),g.addScaledVector(s,Si.x),g.addScaledVector(o,Si.y),g.addScaledVector(a,Si.z),g}static isFrontFacing(A,t,e,n){return ke.subVectors(e,t),Di.subVectors(A,t),ke.cross(Di).dot(n)<0}set(A,t,e){return this.a.copy(A),this.b.copy(t),this.c.copy(e),this}setFromPointsAndIndices(A,t,e,n){return this.a.copy(A[t]),this.b.copy(A[e]),this.c.copy(A[n]),this}setFromAttributeAndIndices(A,t,e,n){return this.a.fromBufferAttribute(A,t),this.b.fromBufferAttribute(A,e),this.c.fromBufferAttribute(A,n),this}clone(){return new this.constructor().copy(this)}copy(A){return this.a.copy(A.a),this.b.copy(A.b),this.c.copy(A.c),this}getArea(){return ke.subVectors(this.c,this.b),Di.subVectors(this.a,this.b),ke.cross(Di).length()*.5}getMidpoint(A){return A.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(A){return Je.getNormal(this.a,this.b,this.c,A)}getPlane(A){return A.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(A,t){return Je.getBarycoord(A,this.a,this.b,this.c,t)}getUV(A,t,e,n,s){return tr===!1&&(console.warn("THREE.Triangle.getUV() has been renamed to THREE.Triangle.getInterpolation()."),tr=!0),Je.getInterpolation(A,this.a,this.b,this.c,t,e,n,s)}getInterpolation(A,t,e,n,s){return Je.getInterpolation(A,this.a,this.b,this.c,t,e,n,s)}containsPoint(A){return Je.containsPoint(A,this.a,this.b,this.c)}isFrontFacing(A){return Je.isFrontFacing(this.a,this.b,this.c,A)}intersectsBox(A){return A.intersectsTriangle(this)}closestPointToPoint(A,t){const e=this.a,n=this.b,s=this.c;let o,a;ws.subVectors(n,e),Ms.subVectors(s,e),iI.subVectors(A,e);const g=ws.dot(iI),r=Ms.dot(iI);if(g<=0&&r<=0)return t.copy(e);nI.subVectors(A,n);const I=ws.dot(nI),B=Ms.dot(nI);if(I>=0&&B<=I)return t.copy(n);const C=g*B-I*r;if(C<=0&&g>=0&&I<=0)return o=g/(g-I),t.copy(e).addScaledVector(ws,o);sI.subVectors(A,s);const Q=ws.dot(sI),c=Ms.dot(sI);if(c>=0&&Q<=c)return t.copy(s);const l=Q*r-g*c;if(l<=0&&r>=0&&c<=0)return a=r/(r-c),t.copy(e).addScaledVector(Ms,a);const h=I*c-Q*B;if(h<=0&&B-I>=0&&Q-c>=0)return WE.subVectors(s,n),a=(B-I)/(B-I+(Q-c)),t.copy(n).addScaledVector(WE,a);const E=1/(h+l+C);return o=l*E,a=C*E,t.copy(e).addScaledVector(ws,o).addScaledVector(Ms,a)}equals(A){return A.a.equals(this.a)&&A.b.equals(this.b)&&A.c.equals(this.c)}}let rD=0;class mc extends Ba{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:rD++}),this.uuid=Ca(),this.name="",this.type="Material",this.blending=GE,this.side=PI,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.blendSrc=Ny,this.blendDst=_y,this.blendEquation=xy,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.depthFunc=Gy,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=Jy,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=Pg,this.stencilZFail=Pg,this.stencilZPass=Pg,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(A){this._alphaTest>0!=A>0&&this.version++,this._alphaTest=A}onBuild(){}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(A){if(A!==void 0)for(const t in A){const e=A[t];if(e===void 0){console.warn(`THREE.Material: parameter '${t}' has value of undefined.`);continue}const n=this[t];if(n===void 0){console.warn(`THREE.Material: '${t}' is not a property of THREE.${this.type}.`);continue}n&&n.isColor?n.set(e):n&&n.isVector3&&e&&e.isVector3?n.copy(e):this[t]=e}}toJSON(A){const t=A===void 0||typeof A=="string";t&&(A={textures:{},images:{}});const e={metadata:{version:4.6,type:"Material",generator:"Material.toJSON"}};e.uuid=this.uuid,e.type=this.type,this.name!==""&&(e.name=this.name),this.color&&this.color.isColor&&(e.color=this.color.getHex()),this.roughness!==void 0&&(e.roughness=this.roughness),this.metalness!==void 0&&(e.metalness=this.metalness),this.sheen!==void 0&&(e.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(e.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(e.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(e.emissive=this.emissive.getHex()),this.emissiveIntensity&&this.emissiveIntensity!==1&&(e.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(e.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(e.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(e.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(e.shininess=this.shininess),this.clearcoat!==void 0&&(e.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(e.clearcoatRoughness=this.clearcoatRoughness),this.clearcoatMap&&this.clearcoatMap.isTexture&&(e.clearcoatMap=this.clearcoatMap.toJSON(A).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(e.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(A).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(e.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(A).uuid,e.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.iridescence!==void 0&&(e.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(e.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessRange!==void 0&&(e.iridescenceThicknessRange=this.iridescenceThicknessRange),this.iridescenceMap&&this.iridescenceMap.isTexture&&(e.iridescenceMap=this.iridescenceMap.toJSON(A).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(e.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(A).uuid),this.anisotropy!==void 0&&(e.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(e.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(e.anisotropyMap=this.anisotropyMap.toJSON(A).uuid),this.map&&this.map.isTexture&&(e.map=this.map.toJSON(A).uuid),this.matcap&&this.matcap.isTexture&&(e.matcap=this.matcap.toJSON(A).uuid),this.alphaMap&&this.alphaMap.isTexture&&(e.alphaMap=this.alphaMap.toJSON(A).uuid),this.lightMap&&this.lightMap.isTexture&&(e.lightMap=this.lightMap.toJSON(A).uuid,e.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(e.aoMap=this.aoMap.toJSON(A).uuid,e.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(e.bumpMap=this.bumpMap.toJSON(A).uuid,e.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(e.normalMap=this.normalMap.toJSON(A).uuid,e.normalMapType=this.normalMapType,e.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(e.displacementMap=this.displacementMap.toJSON(A).uuid,e.displacementScale=this.displacementScale,e.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(e.roughnessMap=this.roughnessMap.toJSON(A).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(e.metalnessMap=this.metalnessMap.toJSON(A).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(e.emissiveMap=this.emissiveMap.toJSON(A).uuid),this.specularMap&&this.specularMap.isTexture&&(e.specularMap=this.specularMap.toJSON(A).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(e.specularIntensityMap=this.specularIntensityMap.toJSON(A).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(e.specularColorMap=this.specularColorMap.toJSON(A).uuid),this.envMap&&this.envMap.isTexture&&(e.envMap=this.envMap.toJSON(A).uuid,this.combine!==void 0&&(e.combine=this.combine)),this.envMapIntensity!==void 0&&(e.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(e.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(e.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(e.gradientMap=this.gradientMap.toJSON(A).uuid),this.transmission!==void 0&&(e.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(e.transmissionMap=this.transmissionMap.toJSON(A).uuid),this.thickness!==void 0&&(e.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(e.thicknessMap=this.thicknessMap.toJSON(A).uuid),this.attenuationDistance!==void 0&&this.attenuationDistance!==1/0&&(e.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(e.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(e.size=this.size),this.shadowSide!==null&&(e.shadowSide=this.shadowSide),this.sizeAttenuation!==void 0&&(e.sizeAttenuation=this.sizeAttenuation),this.blending!==GE&&(e.blending=this.blending),this.side!==PI&&(e.side=this.side),this.vertexColors&&(e.vertexColors=!0),this.opacity<1&&(e.opacity=this.opacity),this.transparent===!0&&(e.transparent=this.transparent),e.depthFunc=this.depthFunc,e.depthTest=this.depthTest,e.depthWrite=this.depthWrite,e.colorWrite=this.colorWrite,e.stencilWrite=this.stencilWrite,e.stencilWriteMask=this.stencilWriteMask,e.stencilFunc=this.stencilFunc,e.stencilRef=this.stencilRef,e.stencilFuncMask=this.stencilFuncMask,e.stencilFail=this.stencilFail,e.stencilZFail=this.stencilZFail,e.stencilZPass=this.stencilZPass,this.rotation!==void 0&&this.rotation!==0&&(e.rotation=this.rotation),this.polygonOffset===!0&&(e.polygonOffset=!0),this.polygonOffsetFactor!==0&&(e.polygonOffsetFactor=this.polygonOffsetFactor),this.polygonOffsetUnits!==0&&(e.polygonOffsetUnits=this.polygonOffsetUnits),this.linewidth!==void 0&&this.linewidth!==1&&(e.linewidth=this.linewidth),this.dashSize!==void 0&&(e.dashSize=this.dashSize),this.gapSize!==void 0&&(e.gapSize=this.gapSize),this.scale!==void 0&&(e.scale=this.scale),this.dithering===!0&&(e.dithering=!0),this.alphaTest>0&&(e.alphaTest=this.alphaTest),this.alphaToCoverage===!0&&(e.alphaToCoverage=this.alphaToCoverage),this.premultipliedAlpha===!0&&(e.premultipliedAlpha=this.premultipliedAlpha),this.forceSinglePass===!0&&(e.forceSinglePass=this.forceSinglePass),this.wireframe===!0&&(e.wireframe=this.wireframe),this.wireframeLinewidth>1&&(e.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!=="round"&&(e.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!=="round"&&(e.wireframeLinejoin=this.wireframeLinejoin),this.flatShading===!0&&(e.flatShading=this.flatShading),this.visible===!1&&(e.visible=!1),this.toneMapped===!1&&(e.toneMapped=!1),this.fog===!1&&(e.fog=!1),Object.keys(this.userData).length>0&&(e.userData=this.userData);function n(s){const o=[];for(const a in s){const g=s[a];delete g.metadata,o.push(g)}return o}if(t){const s=n(A.textures),o=n(A.images);s.length>0&&(e.textures=s),o.length>0&&(e.images=o)}return e}clone(){return new this.constructor().copy(this)}copy(A){this.name=A.name,this.blending=A.blending,this.side=A.side,this.vertexColors=A.vertexColors,this.opacity=A.opacity,this.transparent=A.transparent,this.blendSrc=A.blendSrc,this.blendDst=A.blendDst,this.blendEquation=A.blendEquation,this.blendSrcAlpha=A.blendSrcAlpha,this.blendDstAlpha=A.blendDstAlpha,this.blendEquationAlpha=A.blendEquationAlpha,this.depthFunc=A.depthFunc,this.depthTest=A.depthTest,this.depthWrite=A.depthWrite,this.stencilWriteMask=A.stencilWriteMask,this.stencilFunc=A.stencilFunc,this.stencilRef=A.stencilRef,this.stencilFuncMask=A.stencilFuncMask,this.stencilFail=A.stencilFail,this.stencilZFail=A.stencilZFail,this.stencilZPass=A.stencilZPass,this.stencilWrite=A.stencilWrite;const t=A.clippingPlanes;let e=null;if(t!==null){const n=t.length;e=new Array(n);for(let s=0;s!==n;++s)e[s]=t[s].clone()}return this.clippingPlanes=e,this.clipIntersection=A.clipIntersection,this.clipShadows=A.clipShadows,this.shadowSide=A.shadowSide,this.colorWrite=A.colorWrite,this.precision=A.precision,this.polygonOffset=A.polygonOffset,this.polygonOffsetFactor=A.polygonOffsetFactor,this.polygonOffsetUnits=A.polygonOffsetUnits,this.dithering=A.dithering,this.alphaTest=A.alphaTest,this.alphaToCoverage=A.alphaToCoverage,this.premultipliedAlpha=A.premultipliedAlpha,this.forceSinglePass=A.forceSinglePass,this.visible=A.visible,this.toneMapped=A.toneMapped,this.userData=JSON.parse(JSON.stringify(A.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(A){A===!0&&this.version++}}const yc={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Te={h:0,s:0,l:0},er={h:0,s:0,l:0};function oI(i,A,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(A-i)*6*t:t<1/2?A:t<2/3?i+(A-i)*6*(2/3-t):i}class ki{constructor(A,t,e){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(A,t,e)}set(A,t,e){if(t===void 0&&e===void 0){const n=A;n&&n.isColor?this.copy(n):typeof n=="number"?this.setHex(n):typeof n=="string"&&this.setStyle(n)}else this.setRGB(A,t,e);return this}setScalar(A){return this.r=A,this.g=A,this.b=A,this}setHex(A,t=he){return A=Math.floor(A),this.r=(A>>16&255)/255,this.g=(A>>8&255)/255,this.b=(A&255)/255,be.toWorkingColorSpace(this,t),this}setRGB(A,t,e,n=be.workingColorSpace){return this.r=A,this.g=t,this.b=e,be.toWorkingColorSpace(this,n),this}setHSL(A,t,e,n=be.workingColorSpace){if(A=Ky(A,1),t=te(t,0,1),e=te(e,0,1),t===0)this.r=this.g=this.b=e;else{const s=e<=.5?e*(1+t):e+t-e*t,o=2*e-s;this.r=oI(o,s,A+1/3),this.g=oI(o,s,A),this.b=oI(o,s,A-1/3)}return be.toWorkingColorSpace(this,n),this}setStyle(A,t=he){function e(s){s!==void 0&&parseFloat(s)<1&&console.warn("THREE.Color: Alpha component of "+A+" will be ignored.")}let n;if(n=/^(\w+)\(([^\)]*)\)/.exec(A)){let s;const o=n[1],a=n[2];switch(o){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return e(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+)\%\s*,\s*(\d+)\%\s*,\s*(\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return e(s[4]),this.setRGB(Math.min(100,parseInt(s[1],10))/100,Math.min(100,parseInt(s[2],10))/100,Math.min(100,parseInt(s[3],10))/100,t);break;case"hsl":case"hsla":if(s=/^\s*(\d*\.?\d+)\s*,\s*(\d*\.?\d+)\%\s*,\s*(\d*\.?\d+)\%\s*(?:,\s*(\d*\.?\d+)\s*)?$/.exec(a))return e(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:console.warn("THREE.Color: Unknown color model "+A)}}else if(n=/^\#([A-Fa-f\d]+)$/.exec(A)){const s=n[1],o=s.length;if(o===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(o===6)return this.setHex(parseInt(s,16),t);console.warn("THREE.Color: Invalid hex color "+A)}else if(A&&A.length>0)return this.setColorName(A,t);return this}setColorName(A,t=he){const e=yc[A.toLowerCase()];return e!==void 0?this.setHex(e,t):console.warn("THREE.Color: Unknown color "+A),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(A){return this.r=A.r,this.g=A.g,this.b=A.b,this}copySRGBToLinear(A){return this.r=Ys(A.r),this.g=Ys(A.g),this.b=Ys(A.b),this}copyLinearToSRGB(A){return this.r=Vg(A.r),this.g=Vg(A.g),this.b=Vg(A.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(A=he){return be.fromWorkingColorSpace(Kt.copy(this),A),Math.round(te(Kt.r*255,0,255))*65536+Math.round(te(Kt.g*255,0,255))*256+Math.round(te(Kt.b*255,0,255))}getHexString(A=he){return("000000"+this.getHex(A).toString(16)).slice(-6)}getHSL(A,t=be.workingColorSpace){be.fromWorkingColorSpace(Kt.copy(this),t);const e=Kt.r,n=Kt.g,s=Kt.b,o=Math.max(e,n,s),a=Math.min(e,n,s);let g,r;const I=(a+o)/2;if(a===o)g=0,r=0;else{const B=o-a;switch(r=I<=.5?B/(o+a):B/(2-o-a),o){case e:g=(n-s)/B+(n<s?6:0);break;case n:g=(s-e)/B+2;break;case s:g=(e-n)/B+4;break}g/=6}return A.h=g,A.s=r,A.l=I,A}getRGB(A,t=be.workingColorSpace){return be.fromWorkingColorSpace(Kt.copy(this),t),A.r=Kt.r,A.g=Kt.g,A.b=Kt.b,A}getStyle(A=he){be.fromWorkingColorSpace(Kt.copy(this),A);const t=Kt.r,e=Kt.g,n=Kt.b;return A!==he?`color(${A} ${t.toFixed(3)} ${e.toFixed(3)} ${n.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(e*255)},${Math.round(n*255)})`}offsetHSL(A,t,e){return this.getHSL(Te),Te.h+=A,Te.s+=t,Te.l+=e,this.setHSL(Te.h,Te.s,Te.l),this}add(A){return this.r+=A.r,this.g+=A.g,this.b+=A.b,this}addColors(A,t){return this.r=A.r+t.r,this.g=A.g+t.g,this.b=A.b+t.b,this}addScalar(A){return this.r+=A,this.g+=A,this.b+=A,this}sub(A){return this.r=Math.max(0,this.r-A.r),this.g=Math.max(0,this.g-A.g),this.b=Math.max(0,this.b-A.b),this}multiply(A){return this.r*=A.r,this.g*=A.g,this.b*=A.b,this}multiplyScalar(A){return this.r*=A,this.g*=A,this.b*=A,this}lerp(A,t){return this.r+=(A.r-this.r)*t,this.g+=(A.g-this.g)*t,this.b+=(A.b-this.b)*t,this}lerpColors(A,t,e){return this.r=A.r+(t.r-A.r)*e,this.g=A.g+(t.g-A.g)*e,this.b=A.b+(t.b-A.b)*e,this}lerpHSL(A,t){this.getHSL(Te),A.getHSL(er);const e=Og(Te.h,er.h,t),n=Og(Te.s,er.s,t),s=Og(Te.l,er.l,t);return this.setHSL(e,n,s),this}setFromVector3(A){return this.r=A.x,this.g=A.y,this.b=A.z,this}applyMatrix3(A){const t=this.r,e=this.g,n=this.b,s=A.elements;return this.r=s[0]*t+s[3]*e+s[6]*n,this.g=s[1]*t+s[4]*e+s[7]*n,this.b=s[2]*t+s[5]*e+s[8]*n,this}equals(A){return A.r===this.r&&A.g===this.g&&A.b===this.b}fromArray(A,t=0){return this.r=A[t],this.g=A[t+1],this.b=A[t+2],this}toArray(A=[],t=0){return A[t]=this.r,A[t+1]=this.g,A[t+2]=this.b,A}fromBufferAttribute(A,t){return this.r=A.getX(t),this.g=A.getY(t),this.b=A.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Kt=new ki;ki.NAMES=yc;class eg extends mc{constructor(A){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new ki(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.combine=Ly,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(A)}copy(A){return super.copy(A),this.color.copy(A.color),this.map=A.map,this.lightMap=A.lightMap,this.lightMapIntensity=A.lightMapIntensity,this.aoMap=A.aoMap,this.aoMapIntensity=A.aoMapIntensity,this.specularMap=A.specularMap,this.alphaMap=A.alphaMap,this.envMap=A.envMap,this.combine=A.combine,this.reflectivity=A.reflectivity,this.refractionRatio=A.refractionRatio,this.wireframe=A.wireframe,this.wireframeLinewidth=A.wireframeLinewidth,this.wireframeLinecap=A.wireframeLinecap,this.wireframeLinejoin=A.wireframeLinejoin,this.fog=A.fog,this}}const yt=new rA,ir=new Pt;class Se{constructor(A,t,e=!1){if(Array.isArray(A))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,this.name="",this.array=A,this.itemSize=t,this.count=A!==void 0?A.length/t:0,this.normalized=e,this.usage=UE,this.updateRange={offset:0,count:-1},this.gpuType=ky,this.version=0}onUploadCallback(){}set needsUpdate(A){A===!0&&this.version++}setUsage(A){return this.usage=A,this}copy(A){return this.name=A.name,this.array=new A.array.constructor(A.array),this.itemSize=A.itemSize,this.count=A.count,this.normalized=A.normalized,this.usage=A.usage,this.gpuType=A.gpuType,this}copyAt(A,t,e){A*=this.itemSize,e*=t.itemSize;for(let n=0,s=this.itemSize;n<s;n++)this.array[A+n]=t.array[e+n];return this}copyArray(A){return this.array.set(A),this}applyMatrix3(A){if(this.itemSize===2)for(let t=0,e=this.count;t<e;t++)ir.fromBufferAttribute(this,t),ir.applyMatrix3(A),this.setXY(t,ir.x,ir.y);else if(this.itemSize===3)for(let t=0,e=this.count;t<e;t++)yt.fromBufferAttribute(this,t),yt.applyMatrix3(A),this.setXYZ(t,yt.x,yt.y,yt.z);return this}applyMatrix4(A){for(let t=0,e=this.count;t<e;t++)yt.fromBufferAttribute(this,t),yt.applyMatrix4(A),this.setXYZ(t,yt.x,yt.y,yt.z);return this}applyNormalMatrix(A){for(let t=0,e=this.count;t<e;t++)yt.fromBufferAttribute(this,t),yt.applyNormalMatrix(A),this.setXYZ(t,yt.x,yt.y,yt.z);return this}transformDirection(A){for(let t=0,e=this.count;t<e;t++)yt.fromBufferAttribute(this,t),yt.transformDirection(A),this.setXYZ(t,yt.x,yt.y,yt.z);return this}set(A,t=0){return this.array.set(A,t),this}getX(A){let t=this.array[A*this.itemSize];return this.normalized&&(t=Va(t,this.array)),t}setX(A,t){return this.normalized&&(t=ge(t,this.array)),this.array[A*this.itemSize]=t,this}getY(A){let t=this.array[A*this.itemSize+1];return this.normalized&&(t=Va(t,this.array)),t}setY(A,t){return this.normalized&&(t=ge(t,this.array)),this.array[A*this.itemSize+1]=t,this}getZ(A){let t=this.array[A*this.itemSize+2];return this.normalized&&(t=Va(t,this.array)),t}setZ(A,t){return this.normalized&&(t=ge(t,this.array)),this.array[A*this.itemSize+2]=t,this}getW(A){let t=this.array[A*this.itemSize+3];return this.normalized&&(t=Va(t,this.array)),t}setW(A,t){return this.normalized&&(t=ge(t,this.array)),this.array[A*this.itemSize+3]=t,this}setXY(A,t,e){return A*=this.itemSize,this.normalized&&(t=ge(t,this.array),e=ge(e,this.array)),this.array[A+0]=t,this.array[A+1]=e,this}setXYZ(A,t,e,n){return A*=this.itemSize,this.normalized&&(t=ge(t,this.array),e=ge(e,this.array),n=ge(n,this.array)),this.array[A+0]=t,this.array[A+1]=e,this.array[A+2]=n,this}setXYZW(A,t,e,n,s){return A*=this.itemSize,this.normalized&&(t=ge(t,this.array),e=ge(e,this.array),n=ge(n,this.array),s=ge(s,this.array)),this.array[A+0]=t,this.array[A+1]=e,this.array[A+2]=n,this.array[A+3]=s,this}onUpload(A){return this.onUploadCallback=A,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const A={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return this.name!==""&&(A.name=this.name),this.usage!==UE&&(A.usage=this.usage),(this.updateRange.offset!==0||this.updateRange.count!==-1)&&(A.updateRange=this.updateRange),A}copyColorsArray(){console.error("THREE.BufferAttribute: copyColorsArray() was removed in r144.")}copyVector2sArray(){console.error("THREE.BufferAttribute: copyVector2sArray() was removed in r144.")}copyVector3sArray(){console.error("THREE.BufferAttribute: copyVector3sArray() was removed in r144.")}copyVector4sArray(){console.error("THREE.BufferAttribute: copyVector4sArray() was removed in r144.")}}class gD extends Se{constructor(A,t,e){super(new Uint16Array(A),t,e)}}class ID extends Se{constructor(A,t,e){super(new Uint32Array(A),t,e)}}class bn extends Se{constructor(A,t,e){super(new Float32Array(A),t,e)}}let BD=0;const de=new ne,aI=new Me,Rs=new rA,Be=new Ti,Mo=new Ti,Nt=new rA;class ro extends Ba{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:BD++}),this.uuid=Ca(),this.name="",this.type="BufferGeometry",this.index=null,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={}}getIndex(){return this.index}setIndex(A){return Array.isArray(A)?this.index=new(Yy(A)?ID:gD)(A,1):this.index=A,this}getAttribute(A){return this.attributes[A]}setAttribute(A,t){return this.attributes[A]=t,this}deleteAttribute(A){return delete this.attributes[A],this}hasAttribute(A){return this.attributes[A]!==void 0}addGroup(A,t,e=0){this.groups.push({start:A,count:t,materialIndex:e})}clearGroups(){this.groups=[]}setDrawRange(A,t){this.drawRange.start=A,this.drawRange.count=t}applyMatrix4(A){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(A),t.needsUpdate=!0);const e=this.attributes.normal;if(e!==void 0){const s=new Qn().getNormalMatrix(A);e.applyNormalMatrix(s),e.needsUpdate=!0}const n=this.attributes.tangent;return n!==void 0&&(n.transformDirection(A),n.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this}applyQuaternion(A){return de.makeRotationFromQuaternion(A),this.applyMatrix4(de),this}rotateX(A){return de.makeRotationX(A),this.applyMatrix4(de),this}rotateY(A){return de.makeRotationY(A),this.applyMatrix4(de),this}rotateZ(A){return de.makeRotationZ(A),this.applyMatrix4(de),this}translate(A,t,e){return de.makeTranslation(A,t,e),this.applyMatrix4(de),this}scale(A,t,e){return de.makeScale(A,t,e),this.applyMatrix4(de),this}lookAt(A){return aI.lookAt(A),aI.updateMatrix(),this.applyMatrix4(aI.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(Rs).negate(),this.translate(Rs.x,Rs.y,Rs.z),this}setFromPoints(A){const t=[];for(let e=0,n=A.length;e<n;e++){const s=A[e];t.push(s.x,s.y,s.z||0)}return this.setAttribute("position",new bn(t,3)),this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ti);const A=this.attributes.position,t=this.morphAttributes.position;if(A&&A.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingBox.set(new rA(-1/0,-1/0,-1/0),new rA(1/0,1/0,1/0));return}if(A!==void 0){if(this.boundingBox.setFromBufferAttribute(A),t)for(let e=0,n=t.length;e<n;e++){const s=t[e];Be.setFromBufferAttribute(s),this.morphTargetsRelative?(Nt.addVectors(this.boundingBox.min,Be.min),this.boundingBox.expandByPoint(Nt),Nt.addVectors(this.boundingBox.max,Be.max),this.boundingBox.expandByPoint(Nt)):(this.boundingBox.expandByPoint(Be.min),this.boundingBox.expandByPoint(Be.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&console.error('THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Ag);const A=this.attributes.position,t=this.morphAttributes.position;if(A&&A.isGLBufferAttribute){console.error('THREE.BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere. Alternatively set "mesh.frustumCulled" to "false".',this),this.boundingSphere.set(new rA,1/0);return}if(A){const e=this.boundingSphere.center;if(Be.setFromBufferAttribute(A),t)for(let s=0,o=t.length;s<o;s++){const a=t[s];Mo.setFromBufferAttribute(a),this.morphTargetsRelative?(Nt.addVectors(Be.min,Mo.min),Be.expandByPoint(Nt),Nt.addVectors(Be.max,Mo.max),Be.expandByPoint(Nt)):(Be.expandByPoint(Mo.min),Be.expandByPoint(Mo.max))}Be.getCenter(e);let n=0;for(let s=0,o=A.count;s<o;s++)Nt.fromBufferAttribute(A,s),n=Math.max(n,e.distanceToSquared(Nt));if(t)for(let s=0,o=t.length;s<o;s++){const a=t[s],g=this.morphTargetsRelative;for(let r=0,I=a.count;r<I;r++)Nt.fromBufferAttribute(a,r),g&&(Rs.fromBufferAttribute(A,r),Nt.add(Rs)),n=Math.max(n,e.distanceToSquared(Nt))}this.boundingSphere.radius=Math.sqrt(n),isNaN(this.boundingSphere.radius)&&console.error('THREE.BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const A=this.index,t=this.attributes;if(A===null||t.position===void 0||t.normal===void 0||t.uv===void 0){console.error("THREE.BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const e=A.array,n=t.position.array,s=t.normal.array,o=t.uv.array,a=n.length/3;this.hasAttribute("tangent")===!1&&this.setAttribute("tangent",new Se(new Float32Array(4*a),4));const g=this.getAttribute("tangent").array,r=[],I=[];for(let S=0;S<a;S++)r[S]=new rA,I[S]=new rA;const B=new rA,C=new rA,Q=new rA,c=new Pt,l=new Pt,h=new Pt,E=new rA,f=new rA;function d(S,F,G){B.fromArray(n,S*3),C.fromArray(n,F*3),Q.fromArray(n,G*3),c.fromArray(o,S*2),l.fromArray(o,F*2),h.fromArray(o,G*2),C.sub(B),Q.sub(B),l.sub(c),h.sub(c);const L=1/(l.x*h.y-h.x*l.y);!isFinite(L)||(E.copy(C).multiplyScalar(h.y).addScaledVector(Q,-l.y).multiplyScalar(L),f.copy(Q).multiplyScalar(l.x).addScaledVector(C,-h.x).multiplyScalar(L),r[S].add(E),r[F].add(E),r[G].add(E),I[S].add(f),I[F].add(f),I[G].add(f))}let u=this.groups;u.length===0&&(u=[{start:0,count:e.length}]);for(let S=0,F=u.length;S<F;++S){const G=u[S],L=G.start,T=G.count;for(let b=L,V=L+T;b<V;b+=3)d(e[b+0],e[b+1],e[b+2])}const m=new rA,y=new rA,p=new rA,R=new rA;function D(S){p.fromArray(s,S*3),R.copy(p);const F=r[S];m.copy(F),m.sub(p.multiplyScalar(p.dot(F))).normalize(),y.crossVectors(R,F);const L=y.dot(I[S])<0?-1:1;g[S*4]=m.x,g[S*4+1]=m.y,g[S*4+2]=m.z,g[S*4+3]=L}for(let S=0,F=u.length;S<F;++S){const G=u[S],L=G.start,T=G.count;for(let b=L,V=L+T;b<V;b+=3)D(e[b+0]),D(e[b+1]),D(e[b+2])}}computeVertexNormals(){const A=this.index,t=this.getAttribute("position");if(t!==void 0){let e=this.getAttribute("normal");if(e===void 0)e=new Se(new Float32Array(t.count*3),3),this.setAttribute("normal",e);else for(let C=0,Q=e.count;C<Q;C++)e.setXYZ(C,0,0,0);const n=new rA,s=new rA,o=new rA,a=new rA,g=new rA,r=new rA,I=new rA,B=new rA;if(A)for(let C=0,Q=A.count;C<Q;C+=3){const c=A.getX(C+0),l=A.getX(C+1),h=A.getX(C+2);n.fromBufferAttribute(t,c),s.fromBufferAttribute(t,l),o.fromBufferAttribute(t,h),I.subVectors(o,s),B.subVectors(n,s),I.cross(B),a.fromBufferAttribute(e,c),g.fromBufferAttribute(e,l),r.fromBufferAttribute(e,h),a.add(I),g.add(I),r.add(I),e.setXYZ(c,a.x,a.y,a.z),e.setXYZ(l,g.x,g.y,g.z),e.setXYZ(h,r.x,r.y,r.z)}else for(let C=0,Q=t.count;C<Q;C+=3)n.fromBufferAttribute(t,C+0),s.fromBufferAttribute(t,C+1),o.fromBufferAttribute(t,C+2),I.subVectors(o,s),B.subVectors(n,s),I.cross(B),e.setXYZ(C+0,I.x,I.y,I.z),e.setXYZ(C+1,I.x,I.y,I.z),e.setXYZ(C+2,I.x,I.y,I.z);this.normalizeNormals(),e.needsUpdate=!0}}merge(){return console.error("THREE.BufferGeometry.merge() has been removed. Use THREE.BufferGeometryUtils.mergeGeometries() instead."),this}normalizeNormals(){const A=this.attributes.normal;for(let t=0,e=A.count;t<e;t++)Nt.fromBufferAttribute(A,t),Nt.normalize(),A.setXYZ(t,Nt.x,Nt.y,Nt.z)}toNonIndexed(){function A(a,g){const r=a.array,I=a.itemSize,B=a.normalized,C=new r.constructor(g.length*I);let Q=0,c=0;for(let l=0,h=g.length;l<h;l++){a.isInterleavedBufferAttribute?Q=g[l]*a.data.stride+a.offset:Q=g[l]*I;for(let E=0;E<I;E++)C[c++]=r[Q++]}return new Se(C,I,B)}if(this.index===null)return console.warn("THREE.BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new ro,e=this.index.array,n=this.attributes;for(const a in n){const g=n[a],r=A(g,e);t.setAttribute(a,r)}const s=this.morphAttributes;for(const a in s){const g=[],r=s[a];for(let I=0,B=r.length;I<B;I++){const C=r[I],Q=A(C,e);g.push(Q)}t.morphAttributes[a]=g}t.morphTargetsRelative=this.morphTargetsRelative;const o=this.groups;for(let a=0,g=o.length;a<g;a++){const r=o[a];t.addGroup(r.start,r.count,r.materialIndex)}return t}toJSON(){const A={metadata:{version:4.6,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(A.uuid=this.uuid,A.type=this.type,this.name!==""&&(A.name=this.name),Object.keys(this.userData).length>0&&(A.userData=this.userData),this.parameters!==void 0){const g=this.parameters;for(const r in g)g[r]!==void 0&&(A[r]=g[r]);return A}A.data={attributes:{}};const t=this.index;t!==null&&(A.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const e=this.attributes;for(const g in e){const r=e[g];A.data.attributes[g]=r.toJSON(A.data)}const n={};let s=!1;for(const g in this.morphAttributes){const r=this.morphAttributes[g],I=[];for(let B=0,C=r.length;B<C;B++){const Q=r[B];I.push(Q.toJSON(A.data))}I.length>0&&(n[g]=I,s=!0)}s&&(A.data.morphAttributes=n,A.data.morphTargetsRelative=this.morphTargetsRelative);const o=this.groups;o.length>0&&(A.data.groups=JSON.parse(JSON.stringify(o)));const a=this.boundingSphere;return a!==null&&(A.data.boundingSphere={center:a.center.toArray(),radius:a.radius}),A}clone(){return new this.constructor().copy(this)}copy(A){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=A.name;const e=A.index;e!==null&&this.setIndex(e.clone(t));const n=A.attributes;for(const r in n){const I=n[r];this.setAttribute(r,I.clone(t))}const s=A.morphAttributes;for(const r in s){const I=[],B=s[r];for(let C=0,Q=B.length;C<Q;C++)I.push(B[C].clone(t));this.morphAttributes[r]=I}this.morphTargetsRelative=A.morphTargetsRelative;const o=A.groups;for(let r=0,I=o.length;r<I;r++){const B=o[r];this.addGroup(B.start,B.count,B.materialIndex)}const a=A.boundingBox;a!==null&&(this.boundingBox=a.clone());const g=A.boundingSphere;return g!==null&&(this.boundingSphere=g.clone()),this.drawRange.start=A.drawRange.start,this.drawRange.count=A.drawRange.count,this.userData=A.userData,this}dispose(){this.dispatchEvent({type:"dispose"})}}const VE=new ne,Dn=new fc,nr=new Ag,zE=new rA,Fs=new rA,xs=new rA,Ns=new rA,rI=new rA,sr=new rA,or=new Pt,ar=new Pt,rr=new Pt,XE=new rA,ZE=new rA,jE=new rA,gr=new rA,Ir=new rA;class jo extends Me{constructor(A=new ro,t=new eg){super(),this.isMesh=!0,this.type="Mesh",this.geometry=A,this.material=t,this.updateMorphTargets()}copy(A,t){return super.copy(A,t),A.morphTargetInfluences!==void 0&&(this.morphTargetInfluences=A.morphTargetInfluences.slice()),A.morphTargetDictionary!==void 0&&(this.morphTargetDictionary=Object.assign({},A.morphTargetDictionary)),this.material=A.material,this.geometry=A.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,e=Object.keys(t);if(e.length>0){const n=t[e[0]];if(n!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,o=n.length;s<o;s++){const a=n[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[a]=s}}}}getVertexPosition(A,t){const e=this.geometry,n=e.attributes.position,s=e.morphAttributes.position,o=e.morphTargetsRelative;t.fromBufferAttribute(n,A);const a=this.morphTargetInfluences;if(s&&a){sr.set(0,0,0);for(let g=0,r=s.length;g<r;g++){const I=a[g],B=s[g];I!==0&&(rI.fromBufferAttribute(B,A),o?sr.addScaledVector(rI,I):sr.addScaledVector(rI.sub(t),I))}t.add(sr)}return t}raycast(A,t){const e=this.geometry,n=this.material,s=this.matrixWorld;n!==void 0&&(e.boundingSphere===null&&e.computeBoundingSphere(),nr.copy(e.boundingSphere),nr.applyMatrix4(s),Dn.copy(A.ray).recast(A.near),!(nr.containsPoint(Dn.origin)===!1&&(Dn.intersectSphere(nr,zE)===null||Dn.origin.distanceToSquared(zE)>(A.far-A.near)**2))&&(VE.copy(s).invert(),Dn.copy(A.ray).applyMatrix4(VE),!(e.boundingBox!==null&&Dn.intersectsBox(e.boundingBox)===!1)&&this._computeIntersections(A,t,Dn)))}_computeIntersections(A,t,e){let n;const s=this.geometry,o=this.material,a=s.index,g=s.attributes.position,r=s.attributes.uv,I=s.attributes.uv1,B=s.attributes.normal,C=s.groups,Q=s.drawRange;if(a!==null)if(Array.isArray(o))for(let c=0,l=C.length;c<l;c++){const h=C[c],E=o[h.materialIndex],f=Math.max(h.start,Q.start),d=Math.min(a.count,Math.min(h.start+h.count,Q.start+Q.count));for(let u=f,m=d;u<m;u+=3){const y=a.getX(u),p=a.getX(u+1),R=a.getX(u+2);n=Br(this,E,A,e,r,I,B,y,p,R),n&&(n.faceIndex=Math.floor(u/3),n.face.materialIndex=h.materialIndex,t.push(n))}}else{const c=Math.max(0,Q.start),l=Math.min(a.count,Q.start+Q.count);for(let h=c,E=l;h<E;h+=3){const f=a.getX(h),d=a.getX(h+1),u=a.getX(h+2);n=Br(this,o,A,e,r,I,B,f,d,u),n&&(n.faceIndex=Math.floor(h/3),t.push(n))}}else if(g!==void 0)if(Array.isArray(o))for(let c=0,l=C.length;c<l;c++){const h=C[c],E=o[h.materialIndex],f=Math.max(h.start,Q.start),d=Math.min(g.count,Math.min(h.start+h.count,Q.start+Q.count));for(let u=f,m=d;u<m;u+=3){const y=u,p=u+1,R=u+2;n=Br(this,E,A,e,r,I,B,y,p,R),n&&(n.faceIndex=Math.floor(u/3),n.face.materialIndex=h.materialIndex,t.push(n))}}else{const c=Math.max(0,Q.start),l=Math.min(g.count,Q.start+Q.count);for(let h=c,E=l;h<E;h+=3){const f=h,d=h+1,u=h+2;n=Br(this,o,A,e,r,I,B,f,d,u),n&&(n.faceIndex=Math.floor(h/3),t.push(n))}}}}function CD(i,A,t,e,n,s,o,a){let g;if(A.side===Qc?g=e.intersectTriangle(o,s,n,!0,a):g=e.intersectTriangle(n,s,o,A.side===PI,a),g===null)return null;Ir.copy(a),Ir.applyMatrix4(i.matrixWorld);const r=t.ray.origin.distanceTo(Ir);return r<t.near||r>t.far?null:{distance:r,point:Ir.clone(),object:i}}function Br(i,A,t,e,n,s,o,a,g,r){i.getVertexPosition(a,Fs),i.getVertexPosition(g,xs),i.getVertexPosition(r,Ns);const I=CD(i,A,t,e,Fs,xs,Ns,gr);if(I){n&&(or.fromBufferAttribute(n,a),ar.fromBufferAttribute(n,g),rr.fromBufferAttribute(n,r),I.uv=Je.getInterpolation(gr,Fs,xs,Ns,or,ar,rr,new Pt)),s&&(or.fromBufferAttribute(s,a),ar.fromBufferAttribute(s,g),rr.fromBufferAttribute(s,r),I.uv1=Je.getInterpolation(gr,Fs,xs,Ns,or,ar,rr,new Pt),I.uv2=I.uv1),o&&(XE.fromBufferAttribute(o,a),ZE.fromBufferAttribute(o,g),jE.fromBufferAttribute(o,r),I.normal=Je.getInterpolation(gr,Fs,xs,Ns,XE,ZE,jE,new rA),I.normal.dot(e.direction)>0&&I.normal.multiplyScalar(-1));const B={a,b:g,c:r,normal:new rA,materialIndex:0};Je.getNormal(Fs,xs,Ns,B.normal),I.face=B}return I}class GB extends ro{constructor(A=1,t=1,e=1,n=1,s=1,o=1){super(),this.type="BoxGeometry",this.parameters={width:A,height:t,depth:e,widthSegments:n,heightSegments:s,depthSegments:o};const a=this;n=Math.floor(n),s=Math.floor(s),o=Math.floor(o);const g=[],r=[],I=[],B=[];let C=0,Q=0;c("z","y","x",-1,-1,e,t,A,o,s,0),c("z","y","x",1,-1,e,t,-A,o,s,1),c("x","z","y",1,1,A,e,t,n,o,2),c("x","z","y",1,-1,A,e,-t,n,o,3),c("x","y","z",1,-1,A,t,e,n,s,4),c("x","y","z",-1,-1,A,t,-e,n,s,5),this.setIndex(g),this.setAttribute("position",new bn(r,3)),this.setAttribute("normal",new bn(I,3)),this.setAttribute("uv",new bn(B,2));function c(l,h,E,f,d,u,m,y,p,R,D){const S=u/p,F=m/R,G=u/2,L=m/2,T=y/2,b=p+1,V=R+1;let K=0,tA=0;const nA=new rA;for(let Z=0;Z<V;Z++){const CA=Z*F-L;for(let q=0;q<b;q++){const eA=q*S-G;nA[l]=eA*f,nA[h]=CA*d,nA[E]=T,r.push(nA.x,nA.y,nA.z),nA[l]=0,nA[h]=0,nA[E]=y>0?1:-1,I.push(nA.x,nA.y,nA.z),B.push(q/p),B.push(1-Z/R),K+=1}}for(let Z=0;Z<R;Z++)for(let CA=0;CA<p;CA++){const q=C+CA+b*Z,eA=C+CA+b*(Z+1),oA=C+(CA+1)+b*(Z+1),aA=C+(CA+1)+b*Z;g.push(q,eA,aA),g.push(eA,oA,aA),tA+=6}a.addGroup(Q,tA,D),Q+=tA,C+=K}}copy(A){return super.copy(A),this.parameters=Object.assign({},A.parameters),this}static fromJSON(A){return new GB(A.width,A.height,A.depth,A.widthSegments,A.heightSegments,A.depthSegments)}}class Dc extends Me{constructor(){super(),this.isGroup=!0,this.type="Group"}}class ED extends Ve{constructor(A,t,e,n,s,o,a,g,r,I){if(I=I!==void 0?I:Yg,I!==Yg&&I!==LE)throw new Error("DepthTexture format must be either THREE.DepthFormat or THREE.DepthStencilFormat");e===void 0&&I===Yg&&(e=vy),e===void 0&&I===LE&&(e=Ty),super(null,n,s,o,a,g,I,e,r),this.isDepthTexture=!0,this.image={width:A,height:t},this.magFilter=a!==void 0?a:eo,this.minFilter=g!==void 0?g:eo,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(A){return super.copy(A),this.compareFunction=A.compareFunction,this}toJSON(A){const t=super.toJSON(A);return this.compareFunction!==null&&(t.compareFunction=this.compareFunction),t}}class $E extends Se{constructor(A,t,e,n=1){super(A,t,e),this.isInstancedBufferAttribute=!0,this.meshPerAttribute=n}copy(A){return super.copy(A),this.meshPerAttribute=A.meshPerAttribute,this}toJSON(){const A=super.toJSON();return A.meshPerAttribute=this.meshPerAttribute,A.isInstancedBufferAttribute=!0,A}}const _s=new ne,Ah=new ne,Cr=[],th=new Ti,hD=new ne,Ro=new jo,Fo=new Ag;class QD extends jo{constructor(A,t,e){super(A,t),this.isInstancedMesh=!0,this.instanceMatrix=new $E(new Float32Array(e*16),16),this.instanceColor=null,this.count=e,this.boundingBox=null,this.boundingSphere=null;for(let n=0;n<e;n++)this.setMatrixAt(n,hD)}computeBoundingBox(){const A=this.geometry,t=this.count;this.boundingBox===null&&(this.boundingBox=new Ti),A.boundingBox===null&&A.computeBoundingBox(),this.boundingBox.makeEmpty();for(let e=0;e<t;e++)this.getMatrixAt(e,_s),th.copy(A.boundingBox).applyMatrix4(_s),this.boundingBox.union(th)}computeBoundingSphere(){const A=this.geometry,t=this.count;this.boundingSphere===null&&(this.boundingSphere=new Ag),A.boundingSphere===null&&A.computeBoundingSphere(),this.boundingSphere.makeEmpty();for(let e=0;e<t;e++)this.getMatrixAt(e,_s),Fo.copy(A.boundingSphere).applyMatrix4(_s),this.boundingSphere.union(Fo)}copy(A,t){return super.copy(A,t),this.instanceMatrix.copy(A.instanceMatrix),A.instanceColor!==null&&(this.instanceColor=A.instanceColor.clone()),this.count=A.count,A.boundingBox!==null&&(this.boundingBox=A.boundingBox.clone()),A.boundingSphere!==null&&(this.boundingSphere=A.boundingSphere.clone()),this}getColorAt(A,t){t.fromArray(this.instanceColor.array,A*3)}getMatrixAt(A,t){t.fromArray(this.instanceMatrix.array,A*16)}raycast(A,t){const e=this.matrixWorld,n=this.count;if(Ro.geometry=this.geometry,Ro.material=this.material,Ro.material!==void 0&&(this.boundingSphere===null&&this.computeBoundingSphere(),Fo.copy(this.boundingSphere),Fo.applyMatrix4(e),A.ray.intersectsSphere(Fo)!==!1))for(let s=0;s<n;s++){this.getMatrixAt(s,_s),Ah.multiplyMatrices(e,_s),Ro.matrixWorld=Ah,Ro.raycast(A,Cr);for(let o=0,a=Cr.length;o<a;o++){const g=Cr[o];g.instanceId=s,g.object=this,t.push(g)}Cr.length=0}}setColorAt(A,t){this.instanceColor===null&&(this.instanceColor=new $E(new Float32Array(this.instanceMatrix.count*3),3)),t.toArray(this.instanceColor.array,A*3)}setMatrixAt(A,t){t.toArray(this.instanceMatrix.array,A*16)}updateMorphTargets(){}dispose(){this.dispatchEvent({type:"dispose"})}}class Tr extends ro{constructor(A=1,t=32,e=16,n=0,s=Math.PI*2,o=0,a=Math.PI){super(),this.type="SphereGeometry",this.parameters={radius:A,widthSegments:t,heightSegments:e,phiStart:n,phiLength:s,thetaStart:o,thetaLength:a},t=Math.max(3,Math.floor(t)),e=Math.max(2,Math.floor(e));const g=Math.min(o+a,Math.PI);let r=0;const I=[],B=new rA,C=new rA,Q=[],c=[],l=[],h=[];for(let E=0;E<=e;E++){const f=[],d=E/e;let u=0;E===0&&o===0?u=.5/t:E===e&&g===Math.PI&&(u=-.5/t);for(let m=0;m<=t;m++){const y=m/t;B.x=-A*Math.cos(n+y*s)*Math.sin(o+d*a),B.y=A*Math.cos(o+d*a),B.z=A*Math.sin(n+y*s)*Math.sin(o+d*a),c.push(B.x,B.y,B.z),C.copy(B).normalize(),l.push(C.x,C.y,C.z),h.push(y+u,1-d),f.push(r++)}I.push(f)}for(let E=0;E<e;E++)for(let f=0;f<t;f++){const d=I[E][f+1],u=I[E][f],m=I[E+1][f],y=I[E+1][f+1];(E!==0||o>0)&&Q.push(d,u,y),(E!==e-1||g<Math.PI)&&Q.push(u,m,y)}this.setIndex(Q),this.setAttribute("position",new bn(c,3)),this.setAttribute("normal",new bn(l,3)),this.setAttribute("uv",new bn(h,2))}copy(A){return super.copy(A),this.parameters=Object.assign({},A.parameters),this}static fromJSON(A){return new Tr(A.radius,A.widthSegments,A.heightSegments,A.phiStart,A.phiLength,A.thetaStart,A.thetaLength)}}class cD extends mc{constructor(A){super(),this.isMeshStandardMaterial=!0,this.defines={STANDARD:""},this.type="MeshStandardMaterial",this.color=new ki(16777215),this.roughness=1,this.metalness=0,this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.emissive=new ki(0),this.emissiveIntensity=1,this.emissiveMap=null,this.bumpMap=null,this.bumpScale=1,this.normalMap=null,this.normalMapType=qy,this.normalScale=new Pt(1,1),this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.roughnessMap=null,this.metalnessMap=null,this.alphaMap=null,this.envMap=null,this.envMapIntensity=1,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.flatShading=!1,this.fog=!0,this.setValues(A)}copy(A){return super.copy(A),this.defines={STANDARD:""},this.color.copy(A.color),this.roughness=A.roughness,this.metalness=A.metalness,this.map=A.map,this.lightMap=A.lightMap,this.lightMapIntensity=A.lightMapIntensity,this.aoMap=A.aoMap,this.aoMapIntensity=A.aoMapIntensity,this.emissive.copy(A.emissive),this.emissiveMap=A.emissiveMap,this.emissiveIntensity=A.emissiveIntensity,this.bumpMap=A.bumpMap,this.bumpScale=A.bumpScale,this.normalMap=A.normalMap,this.normalMapType=A.normalMapType,this.normalScale.copy(A.normalScale),this.displacementMap=A.displacementMap,this.displacementScale=A.displacementScale,this.displacementBias=A.displacementBias,this.roughnessMap=A.roughnessMap,this.metalnessMap=A.metalnessMap,this.alphaMap=A.alphaMap,this.envMap=A.envMap,this.envMapIntensity=A.envMapIntensity,this.wireframe=A.wireframe,this.wireframeLinewidth=A.wireframeLinewidth,this.wireframeLinecap=A.wireframeLinecap,this.wireframeLinejoin=A.wireframeLinejoin,this.flatShading=A.flatShading,this.fog=A.fog,this}}class lD{constructor(A,t,e){const n=this;let s=!1,o=0,a=0,g;const r=[];this.onStart=void 0,this.onLoad=A,this.onProgress=t,this.onError=e,this.itemStart=function(I){a++,s===!1&&n.onStart!==void 0&&n.onStart(I,o,a),s=!0},this.itemEnd=function(I){o++,n.onProgress!==void 0&&n.onProgress(I,o,a),o===a&&(s=!1,n.onLoad!==void 0&&n.onLoad())},this.itemError=function(I){n.onError!==void 0&&n.onError(I)},this.resolveURL=function(I){return g?g(I):I},this.setURLModifier=function(I){return g=I,this},this.addHandler=function(I,B){return r.push(I,B),this},this.removeHandler=function(I){const B=r.indexOf(I);return B!==-1&&r.splice(B,2),this},this.getHandler=function(I){for(let B=0,C=r.length;B<C;B+=2){const Q=r[B],c=r[B+1];if(Q.global&&(Q.lastIndex=0),Q.test(I))return c}return null}}}const dD=new lD;class uD{constructor(A){this.manager=A!==void 0?A:dD,this.crossOrigin="anonymous",this.withCredentials=!1,this.path="",this.resourcePath="",this.requestHeader={}}load(){}loadAsync(A,t){const e=this;return new Promise(function(n,s){e.load(A,n,t,s)})}parse(){}setCrossOrigin(A){return this.crossOrigin=A,this}setWithCredentials(A){return this.withCredentials=A,this}setPath(A){return this.path=A,this}setResourcePath(A){return this.resourcePath=A,this}setRequestHeader(A){return this.requestHeader=A,this}}class fD{constructor(A,t,e=0,n=1/0){this.ray=new fc(A,t),this.near=e,this.far=n,this.camera=null,this.layers=new pc,this.params={Mesh:{},Line:{threshold:1},LOD:{},Points:{threshold:1},Sprite:{}}}set(A,t){this.ray.set(A,t)}setFromCamera(A,t){t.isPerspectiveCamera?(this.ray.origin.setFromMatrixPosition(t.matrixWorld),this.ray.direction.set(A.x,A.y,.5).unproject(t).sub(this.ray.origin).normalize(),this.camera=t):t.isOrthographicCamera?(this.ray.origin.set(A.x,A.y,(t.near+t.far)/(t.near-t.far)).unproject(t),this.ray.direction.set(0,0,-1).transformDirection(t.matrixWorld),this.camera=t):console.error("THREE.Raycaster: Unsupported camera type: "+t.type)}intersectObject(A,t=!0,e=[]){return OI(A,this,e,t),e.sort(eh),e}intersectObjects(A,t=!0,e=[]){for(let n=0,s=A.length;n<s;n++)OI(A[n],this,e,t);return e.sort(eh),e}}function eh(i,A){return i.distance-A.distance}function OI(i,A,t,e){if(i.layers.test(A.layers)&&i.raycast(A,t),e===!0){const n=i.children;for(let s=0,o=n.length;s<o;s++)OI(n[s],A,t,!0)}}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:hc}}));typeof window<"u"&&(window.__THREE__?console.warn("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=hc);const ih=(i,A,t)=>{},nh=i=>{};/*! pako 2.0.3 https://github.com/nodeca/pako @license (MIT AND Zlib) */const pD=4,sh=0,oh=1,mD=2;function go(i){let A=i.length;for(;--A>=0;)i[A]=0}const yD=0,Sc=1,DD=2,SD=3,wD=258,LB=29,Ea=256,$o=Ea+1+LB,Ps=30,UB=19,wc=2*$o+1,Nn=15,gI=16,MD=7,bB=256,Mc=16,Rc=17,Fc=18,WI=new Uint8Array([0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0]),wr=new Uint8Array([0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13]),RD=new Uint8Array([0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7]),xc=new Uint8Array([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]),FD=512,Fi=new Array(($o+2)*2);go(Fi);const Yo=new Array(Ps*2);go(Yo);const Aa=new Array(FD);go(Aa);const ta=new Array(wD-SD+1);go(ta);const vB=new Array(LB);go(vB);const Hr=new Array(Ps);go(Hr);function II(i,A,t,e,n){this.static_tree=i,this.extra_bits=A,this.extra_base=t,this.elems=e,this.max_length=n,this.has_stree=i&&i.length}let Nc,_c,Gc;function BI(i,A){this.dyn_tree=i,this.max_code=0,this.stat_desc=A}const Lc=i=>i<256?Aa[i]:Aa[256+(i>>>7)],ea=(i,A)=>{i.pending_buf[i.pending++]=A&255,i.pending_buf[i.pending++]=A>>>8&255},ee=(i,A,t)=>{i.bi_valid>gI-t?(i.bi_buf|=A<<i.bi_valid&65535,ea(i,i.bi_buf),i.bi_buf=A>>gI-i.bi_valid,i.bi_valid+=t-gI):(i.bi_buf|=A<<i.bi_valid&65535,i.bi_valid+=t)},si=(i,A,t)=>{ee(i,t[A*2],t[A*2+1])},Uc=(i,A)=>{let t=0;do t|=i&1,i>>>=1,t<<=1;while(--A>0);return t>>>1},xD=i=>{i.bi_valid===16?(ea(i,i.bi_buf),i.bi_buf=0,i.bi_valid=0):i.bi_valid>=8&&(i.pending_buf[i.pending++]=i.bi_buf&255,i.bi_buf>>=8,i.bi_valid-=8)},ND=(i,A)=>{const t=A.dyn_tree,e=A.max_code,n=A.stat_desc.static_tree,s=A.stat_desc.has_stree,o=A.stat_desc.extra_bits,a=A.stat_desc.extra_base,g=A.stat_desc.max_length;let r,I,B,C,Q,c,l=0;for(C=0;C<=Nn;C++)i.bl_count[C]=0;for(t[i.heap[i.heap_max]*2+1]=0,r=i.heap_max+1;r<wc;r++)I=i.heap[r],C=t[t[I*2+1]*2+1]+1,C>g&&(C=g,l++),t[I*2+1]=C,!(I>e)&&(i.bl_count[C]++,Q=0,I>=a&&(Q=o[I-a]),c=t[I*2],i.opt_len+=c*(C+Q),s&&(i.static_len+=c*(n[I*2+1]+Q)));if(l!==0){do{for(C=g-1;i.bl_count[C]===0;)C--;i.bl_count[C]--,i.bl_count[C+1]+=2,i.bl_count[g]--,l-=2}while(l>0);for(C=g;C!==0;C--)for(I=i.bl_count[C];I!==0;)B=i.heap[--r],!(B>e)&&(t[B*2+1]!==C&&(i.opt_len+=(C-t[B*2+1])*t[B*2],t[B*2+1]=C),I--)}},bc=(i,A,t)=>{const e=new Array(Nn+1);let n=0,s,o;for(s=1;s<=Nn;s++)e[s]=n=n+t[s-1]<<1;for(o=0;o<=A;o++){let a=i[o*2+1];a!==0&&(i[o*2]=Uc(e[a]++,a))}},_D=()=>{let i,A,t,e,n;const s=new Array(Nn+1);for(t=0,e=0;e<LB-1;e++)for(vB[e]=t,i=0;i<1<<WI[e];i++)ta[t++]=e;for(ta[t-1]=e,n=0,e=0;e<16;e++)for(Hr[e]=n,i=0;i<1<<wr[e];i++)Aa[n++]=e;for(n>>=7;e<Ps;e++)for(Hr[e]=n<<7,i=0;i<1<<wr[e]-7;i++)Aa[256+n++]=e;for(A=0;A<=Nn;A++)s[A]=0;for(i=0;i<=143;)Fi[i*2+1]=8,i++,s[8]++;for(;i<=255;)Fi[i*2+1]=9,i++,s[9]++;for(;i<=279;)Fi[i*2+1]=7,i++,s[7]++;for(;i<=287;)Fi[i*2+1]=8,i++,s[8]++;for(bc(Fi,$o+1,s),i=0;i<Ps;i++)Yo[i*2+1]=5,Yo[i*2]=Uc(i,5);Nc=new II(Fi,WI,Ea+1,$o,Nn),_c=new II(Yo,wr,0,Ps,Nn),Gc=new II(new Array(0),RD,0,UB,MD)},vc=i=>{let A;for(A=0;A<$o;A++)i.dyn_ltree[A*2]=0;for(A=0;A<Ps;A++)i.dyn_dtree[A*2]=0;for(A=0;A<UB;A++)i.bl_tree[A*2]=0;i.dyn_ltree[bB*2]=1,i.opt_len=i.static_len=0,i.last_lit=i.matches=0},kc=i=>{i.bi_valid>8?ea(i,i.bi_buf):i.bi_valid>0&&(i.pending_buf[i.pending++]=i.bi_buf),i.bi_buf=0,i.bi_valid=0},GD=(i,A,t,e)=>{kc(i),e&&(ea(i,t),ea(i,~t)),i.pending_buf.set(i.window.subarray(A,A+t),i.pending),i.pending+=t},ah=(i,A,t,e)=>{const n=A*2,s=t*2;return i[n]<i[s]||i[n]===i[s]&&e[A]<=e[t]},CI=(i,A,t)=>{const e=i.heap[t];let n=t<<1;for(;n<=i.heap_len&&(n<i.heap_len&&ah(A,i.heap[n+1],i.heap[n],i.depth)&&n++,!ah(A,e,i.heap[n],i.depth));)i.heap[t]=i.heap[n],t=n,n<<=1;i.heap[t]=e},rh=(i,A,t)=>{let e,n,s=0,o,a;if(i.last_lit!==0)do e=i.pending_buf[i.d_buf+s*2]<<8|i.pending_buf[i.d_buf+s*2+1],n=i.pending_buf[i.l_buf+s],s++,e===0?si(i,n,A):(o=ta[n],si(i,o+Ea+1,A),a=WI[o],a!==0&&(n-=vB[o],ee(i,n,a)),e--,o=Lc(e),si(i,o,t),a=wr[o],a!==0&&(e-=Hr[o],ee(i,e,a)));while(s<i.last_lit);si(i,bB,A)},VI=(i,A)=>{const t=A.dyn_tree,e=A.stat_desc.static_tree,n=A.stat_desc.has_stree,s=A.stat_desc.elems;let o,a,g=-1,r;for(i.heap_len=0,i.heap_max=wc,o=0;o<s;o++)t[o*2]!==0?(i.heap[++i.heap_len]=g=o,i.depth[o]=0):t[o*2+1]=0;for(;i.heap_len<2;)r=i.heap[++i.heap_len]=g<2?++g:0,t[r*2]=1,i.depth[r]=0,i.opt_len--,n&&(i.static_len-=e[r*2+1]);for(A.max_code=g,o=i.heap_len>>1;o>=1;o--)CI(i,t,o);r=s;do o=i.heap[1],i.heap[1]=i.heap[i.heap_len--],CI(i,t,1),a=i.heap[1],i.heap[--i.heap_max]=o,i.heap[--i.heap_max]=a,t[r*2]=t[o*2]+t[a*2],i.depth[r]=(i.depth[o]>=i.depth[a]?i.depth[o]:i.depth[a])+1,t[o*2+1]=t[a*2+1]=r,i.heap[1]=r++,CI(i,t,1);while(i.heap_len>=2);i.heap[--i.heap_max]=i.heap[1],ND(i,A),bc(t,g,i.bl_count)},gh=(i,A,t)=>{let e,n=-1,s,o=A[0*2+1],a=0,g=7,r=4;for(o===0&&(g=138,r=3),A[(t+1)*2+1]=65535,e=0;e<=t;e++)s=o,o=A[(e+1)*2+1],!(++a<g&&s===o)&&(a<r?i.bl_tree[s*2]+=a:s!==0?(s!==n&&i.bl_tree[s*2]++,i.bl_tree[Mc*2]++):a<=10?i.bl_tree[Rc*2]++:i.bl_tree[Fc*2]++,a=0,n=s,o===0?(g=138,r=3):s===o?(g=6,r=3):(g=7,r=4))},Ih=(i,A,t)=>{let e,n=-1,s,o=A[0*2+1],a=0,g=7,r=4;for(o===0&&(g=138,r=3),e=0;e<=t;e++)if(s=o,o=A[(e+1)*2+1],!(++a<g&&s===o)){if(a<r)do si(i,s,i.bl_tree);while(--a!==0);else s!==0?(s!==n&&(si(i,s,i.bl_tree),a--),si(i,Mc,i.bl_tree),ee(i,a-3,2)):a<=10?(si(i,Rc,i.bl_tree),ee(i,a-3,3)):(si(i,Fc,i.bl_tree),ee(i,a-11,7));a=0,n=s,o===0?(g=138,r=3):s===o?(g=6,r=3):(g=7,r=4)}},LD=i=>{let A;for(gh(i,i.dyn_ltree,i.l_desc.max_code),gh(i,i.dyn_dtree,i.d_desc.max_code),VI(i,i.bl_desc),A=UB-1;A>=3&&i.bl_tree[xc[A]*2+1]===0;A--);return i.opt_len+=3*(A+1)+5+5+4,A},UD=(i,A,t,e)=>{let n;for(ee(i,A-257,5),ee(i,t-1,5),ee(i,e-4,4),n=0;n<e;n++)ee(i,i.bl_tree[xc[n]*2+1],3);Ih(i,i.dyn_ltree,A-1),Ih(i,i.dyn_dtree,t-1)},bD=i=>{let A=4093624447,t;for(t=0;t<=31;t++,A>>>=1)if(A&1&&i.dyn_ltree[t*2]!==0)return sh;if(i.dyn_ltree[9*2]!==0||i.dyn_ltree[10*2]!==0||i.dyn_ltree[13*2]!==0)return oh;for(t=32;t<Ea;t++)if(i.dyn_ltree[t*2]!==0)return oh;return sh};let Bh=!1;const vD=i=>{Bh||(_D(),Bh=!0),i.l_desc=new BI(i.dyn_ltree,Nc),i.d_desc=new BI(i.dyn_dtree,_c),i.bl_desc=new BI(i.bl_tree,Gc),i.bi_buf=0,i.bi_valid=0,vc(i)},Tc=(i,A,t,e)=>{ee(i,(yD<<1)+(e?1:0),3),GD(i,A,t,!0)},kD=i=>{ee(i,Sc<<1,3),si(i,bB,Fi),xD(i)},TD=(i,A,t,e)=>{let n,s,o=0;i.level>0?(i.strm.data_type===mD&&(i.strm.data_type=bD(i)),VI(i,i.l_desc),VI(i,i.d_desc),o=LD(i),n=i.opt_len+3+7>>>3,s=i.static_len+3+7>>>3,s<=n&&(n=s)):n=s=t+5,t+4<=n&&A!==-1?Tc(i,A,t,e):i.strategy===pD||s===n?(ee(i,(Sc<<1)+(e?1:0),3),rh(i,Fi,Yo)):(ee(i,(DD<<1)+(e?1:0),3),UD(i,i.l_desc.max_code+1,i.d_desc.max_code+1,o+1),rh(i,i.dyn_ltree,i.dyn_dtree)),vc(i),e&&kc(i)},HD=(i,A,t)=>(i.pending_buf[i.d_buf+i.last_lit*2]=A>>>8&255,i.pending_buf[i.d_buf+i.last_lit*2+1]=A&255,i.pending_buf[i.l_buf+i.last_lit]=t&255,i.last_lit++,A===0?i.dyn_ltree[t*2]++:(i.matches++,A--,i.dyn_ltree[(ta[t]+Ea+1)*2]++,i.dyn_dtree[Lc(A)*2]++),i.last_lit===i.lit_bufsize-1);var qD=vD,JD=Tc,KD=TD,YD=HD,PD=kD,OD={_tr_init:qD,_tr_stored_block:JD,_tr_flush_block:KD,_tr_tally:YD,_tr_align:PD};const WD=(i,A,t,e)=>{let n=i&65535|0,s=i>>>16&65535|0,o=0;for(;t!==0;){o=t>2e3?2e3:t,t-=o;do n=n+A[e++]|0,s=s+n|0;while(--o);n%=65521,s%=65521}return n|s<<16|0};var ia=WD;const VD=()=>{let i,A=[];for(var t=0;t<256;t++){i=t;for(var e=0;e<8;e++)i=i&1?3988292384^i>>>1:i>>>1;A[t]=i}return A},zD=new Uint32Array(VD()),XD=(i,A,t,e)=>{const n=zD,s=e+t;i^=-1;for(let o=e;o<s;o++)i=i>>>8^n[(i^A[o])&255];return i^-1};var Lt=XD,Kn={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"},zn={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_MEM_ERROR:-4,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8};const{_tr_init:ZD,_tr_stored_block:jD,_tr_flush_block:$D,_tr_tally:rn,_tr_align:AS}=OD,{Z_NO_FLUSH:Xn,Z_PARTIAL_FLUSH:tS,Z_FULL_FLUSH:eS,Z_FINISH:gn,Z_BLOCK:Ch,Z_OK:oi,Z_STREAM_END:Eh,Z_STREAM_ERROR:Re,Z_DATA_ERROR:iS,Z_BUF_ERROR:EI,Z_DEFAULT_COMPRESSION:nS,Z_FILTERED:sS,Z_HUFFMAN_ONLY:Er,Z_RLE:oS,Z_FIXED:aS,Z_DEFAULT_STRATEGY:rS,Z_UNKNOWN:gS,Z_DEFLATED:ig}=zn,IS=9,BS=15,CS=8,ES=29,hS=256,zI=hS+1+ES,QS=30,cS=19,lS=2*zI+1,dS=15,XA=3,nn=258,ze=nn+XA+1,uS=32,ng=42,XI=69,Mr=73,Rr=91,Fr=103,_n=113,bo=666,St=1,ha=2,Yn=3,Io=4,fS=3,sn=(i,A)=>(i.msg=Kn[A],A),hh=i=>(i<<1)-(i>4?9:0),tn=i=>{let A=i.length;for(;--A>=0;)i[A]=0};let pS=(i,A,t)=>(A<<i.hash_shift^t)&i.hash_mask,In=pS;const Zi=i=>{const A=i.state;let t=A.pending;t>i.avail_out&&(t=i.avail_out),t!==0&&(i.output.set(A.pending_buf.subarray(A.pending_out,A.pending_out+t),i.next_out),i.next_out+=t,A.pending_out+=t,i.total_out+=t,i.avail_out-=t,A.pending-=t,A.pending===0&&(A.pending_out=0))},kt=(i,A)=>{$D(i,i.block_start>=0?i.block_start:-1,i.strstart-i.block_start,A),i.block_start=i.strstart,Zi(i.strm)},et=(i,A)=>{i.pending_buf[i.pending++]=A},xo=(i,A)=>{i.pending_buf[i.pending++]=A>>>8&255,i.pending_buf[i.pending++]=A&255},mS=(i,A,t,e)=>{let n=i.avail_in;return n>e&&(n=e),n===0?0:(i.avail_in-=n,A.set(i.input.subarray(i.next_in,i.next_in+n),t),i.state.wrap===1?i.adler=ia(i.adler,A,n,t):i.state.wrap===2&&(i.adler=Lt(i.adler,A,n,t)),i.next_in+=n,i.total_in+=n,n)},Hc=(i,A)=>{let t=i.max_chain_length,e=i.strstart,n,s,o=i.prev_length,a=i.nice_match;const g=i.strstart>i.w_size-ze?i.strstart-(i.w_size-ze):0,r=i.window,I=i.w_mask,B=i.prev,C=i.strstart+nn;let Q=r[e+o-1],c=r[e+o];i.prev_length>=i.good_match&&(t>>=2),a>i.lookahead&&(a=i.lookahead);do if(n=A,!(r[n+o]!==c||r[n+o-1]!==Q||r[n]!==r[e]||r[++n]!==r[e+1])){e+=2,n++;do;while(r[++e]===r[++n]&&r[++e]===r[++n]&&r[++e]===r[++n]&&r[++e]===r[++n]&&r[++e]===r[++n]&&r[++e]===r[++n]&&r[++e]===r[++n]&&r[++e]===r[++n]&&e<C);if(s=nn-(C-e),e=C-nn,s>o){if(i.match_start=A,o=s,s>=a)break;Q=r[e+o-1],c=r[e+o]}}while((A=B[A&I])>g&&--t!==0);return o<=i.lookahead?o:i.lookahead},Pn=i=>{const A=i.w_size;let t,e,n,s,o;do{if(s=i.window_size-i.lookahead-i.strstart,i.strstart>=A+(A-ze)){i.window.set(i.window.subarray(A,A+A),0),i.match_start-=A,i.strstart-=A,i.block_start-=A,e=i.hash_size,t=e;do n=i.head[--t],i.head[t]=n>=A?n-A:0;while(--e);e=A,t=e;do n=i.prev[--t],i.prev[t]=n>=A?n-A:0;while(--e);s+=A}if(i.strm.avail_in===0)break;if(e=mS(i.strm,i.window,i.strstart+i.lookahead,s),i.lookahead+=e,i.lookahead+i.insert>=XA)for(o=i.strstart-i.insert,i.ins_h=i.window[o],i.ins_h=In(i,i.ins_h,i.window[o+1]);i.insert&&(i.ins_h=In(i,i.ins_h,i.window[o+XA-1]),i.prev[o&i.w_mask]=i.head[i.ins_h],i.head[i.ins_h]=o,o++,i.insert--,!(i.lookahead+i.insert<XA)););}while(i.lookahead<ze&&i.strm.avail_in!==0)},yS=(i,A)=>{let t=65535;for(t>i.pending_buf_size-5&&(t=i.pending_buf_size-5);;){if(i.lookahead<=1){if(Pn(i),i.lookahead===0&&A===Xn)return St;if(i.lookahead===0)break}i.strstart+=i.lookahead,i.lookahead=0;const e=i.block_start+t;if((i.strstart===0||i.strstart>=e)&&(i.lookahead=i.strstart-e,i.strstart=e,kt(i,!1),i.strm.avail_out===0)||i.strstart-i.block_start>=i.w_size-ze&&(kt(i,!1),i.strm.avail_out===0))return St}return i.insert=0,A===gn?(kt(i,!0),i.strm.avail_out===0?Yn:Io):(i.strstart>i.block_start&&(kt(i,!1),i.strm.avail_out===0),St)},hI=(i,A)=>{let t,e;for(;;){if(i.lookahead<ze){if(Pn(i),i.lookahead<ze&&A===Xn)return St;if(i.lookahead===0)break}if(t=0,i.lookahead>=XA&&(i.ins_h=In(i,i.ins_h,i.window[i.strstart+XA-1]),t=i.prev[i.strstart&i.w_mask]=i.head[i.ins_h],i.head[i.ins_h]=i.strstart),t!==0&&i.strstart-t<=i.w_size-ze&&(i.match_length=Hc(i,t)),i.match_length>=XA)if(e=rn(i,i.strstart-i.match_start,i.match_length-XA),i.lookahead-=i.match_length,i.match_length<=i.max_lazy_match&&i.lookahead>=XA){i.match_length--;do i.strstart++,i.ins_h=In(i,i.ins_h,i.window[i.strstart+XA-1]),t=i.prev[i.strstart&i.w_mask]=i.head[i.ins_h],i.head[i.ins_h]=i.strstart;while(--i.match_length!==0);i.strstart++}else i.strstart+=i.match_length,i.match_length=0,i.ins_h=i.window[i.strstart],i.ins_h=In(i,i.ins_h,i.window[i.strstart+1]);else e=rn(i,0,i.window[i.strstart]),i.lookahead--,i.strstart++;if(e&&(kt(i,!1),i.strm.avail_out===0))return St}return i.insert=i.strstart<XA-1?i.strstart:XA-1,A===gn?(kt(i,!0),i.strm.avail_out===0?Yn:Io):i.last_lit&&(kt(i,!1),i.strm.avail_out===0)?St:ha},Gs=(i,A)=>{let t,e,n;for(;;){if(i.lookahead<ze){if(Pn(i),i.lookahead<ze&&A===Xn)return St;if(i.lookahead===0)break}if(t=0,i.lookahead>=XA&&(i.ins_h=In(i,i.ins_h,i.window[i.strstart+XA-1]),t=i.prev[i.strstart&i.w_mask]=i.head[i.ins_h],i.head[i.ins_h]=i.strstart),i.prev_length=i.match_length,i.prev_match=i.match_start,i.match_length=XA-1,t!==0&&i.prev_length<i.max_lazy_match&&i.strstart-t<=i.w_size-ze&&(i.match_length=Hc(i,t),i.match_length<=5&&(i.strategy===sS||i.match_length===XA&&i.strstart-i.match_start>4096)&&(i.match_length=XA-1)),i.prev_length>=XA&&i.match_length<=i.prev_length){n=i.strstart+i.lookahead-XA,e=rn(i,i.strstart-1-i.prev_match,i.prev_length-XA),i.lookahead-=i.prev_length-1,i.prev_length-=2;do++i.strstart<=n&&(i.ins_h=In(i,i.ins_h,i.window[i.strstart+XA-1]),t=i.prev[i.strstart&i.w_mask]=i.head[i.ins_h],i.head[i.ins_h]=i.strstart);while(--i.prev_length!==0);if(i.match_available=0,i.match_length=XA-1,i.strstart++,e&&(kt(i,!1),i.strm.avail_out===0))return St}else if(i.match_available){if(e=rn(i,0,i.window[i.strstart-1]),e&&kt(i,!1),i.strstart++,i.lookahead--,i.strm.avail_out===0)return St}else i.match_available=1,i.strstart++,i.lookahead--}return i.match_available&&(e=rn(i,0,i.window[i.strstart-1]),i.match_available=0),i.insert=i.strstart<XA-1?i.strstart:XA-1,A===gn?(kt(i,!0),i.strm.avail_out===0?Yn:Io):i.last_lit&&(kt(i,!1),i.strm.avail_out===0)?St:ha},DS=(i,A)=>{let t,e,n,s;const o=i.window;for(;;){if(i.lookahead<=nn){if(Pn(i),i.lookahead<=nn&&A===Xn)return St;if(i.lookahead===0)break}if(i.match_length=0,i.lookahead>=XA&&i.strstart>0&&(n=i.strstart-1,e=o[n],e===o[++n]&&e===o[++n]&&e===o[++n])){s=i.strstart+nn;do;while(e===o[++n]&&e===o[++n]&&e===o[++n]&&e===o[++n]&&e===o[++n]&&e===o[++n]&&e===o[++n]&&e===o[++n]&&n<s);i.match_length=nn-(s-n),i.match_length>i.lookahead&&(i.match_length=i.lookahead)}if(i.match_length>=XA?(t=rn(i,1,i.match_length-XA),i.lookahead-=i.match_length,i.strstart+=i.match_length,i.match_length=0):(t=rn(i,0,i.window[i.strstart]),i.lookahead--,i.strstart++),t&&(kt(i,!1),i.strm.avail_out===0))return St}return i.insert=0,A===gn?(kt(i,!0),i.strm.avail_out===0?Yn:Io):i.last_lit&&(kt(i,!1),i.strm.avail_out===0)?St:ha},SS=(i,A)=>{let t;for(;;){if(i.lookahead===0&&(Pn(i),i.lookahead===0)){if(A===Xn)return St;break}if(i.match_length=0,t=rn(i,0,i.window[i.strstart]),i.lookahead--,i.strstart++,t&&(kt(i,!1),i.strm.avail_out===0))return St}return i.insert=0,A===gn?(kt(i,!0),i.strm.avail_out===0?Yn:Io):i.last_lit&&(kt(i,!1),i.strm.avail_out===0)?St:ha};function je(i,A,t,e,n){this.good_length=i,this.max_lazy=A,this.nice_length=t,this.max_chain=e,this.func=n}const vo=[new je(0,0,0,0,yS),new je(4,4,8,4,hI),new je(4,5,16,8,hI),new je(4,6,32,32,hI),new je(4,4,16,16,Gs),new je(8,16,32,32,Gs),new je(8,16,128,128,Gs),new je(8,32,128,256,Gs),new je(32,128,258,1024,Gs),new je(32,258,258,4096,Gs)],wS=i=>{i.window_size=2*i.w_size,tn(i.head),i.max_lazy_match=vo[i.level].max_lazy,i.good_match=vo[i.level].good_length,i.nice_match=vo[i.level].nice_length,i.max_chain_length=vo[i.level].max_chain,i.strstart=0,i.block_start=0,i.lookahead=0,i.insert=0,i.match_length=i.prev_length=XA-1,i.match_available=0,i.ins_h=0};function MS(){this.strm=null,this.status=0,this.pending_buf=null,this.pending_buf_size=0,this.pending_out=0,this.pending=0,this.wrap=0,this.gzhead=null,this.gzindex=0,this.method=ig,this.last_flush=-1,this.w_size=0,this.w_bits=0,this.w_mask=0,this.window=null,this.window_size=0,this.prev=null,this.head=null,this.ins_h=0,this.hash_size=0,this.hash_bits=0,this.hash_mask=0,this.hash_shift=0,this.block_start=0,this.match_length=0,this.prev_match=0,this.match_available=0,this.strstart=0,this.match_start=0,this.lookahead=0,this.prev_length=0,this.max_chain_length=0,this.max_lazy_match=0,this.level=0,this.strategy=0,this.good_match=0,this.nice_match=0,this.dyn_ltree=new Uint16Array(lS*2),this.dyn_dtree=new Uint16Array((2*QS+1)*2),this.bl_tree=new Uint16Array((2*cS+1)*2),tn(this.dyn_ltree),tn(this.dyn_dtree),tn(this.bl_tree),this.l_desc=null,this.d_desc=null,this.bl_desc=null,this.bl_count=new Uint16Array(dS+1),this.heap=new Uint16Array(2*zI+1),tn(this.heap),this.heap_len=0,this.heap_max=0,this.depth=new Uint16Array(2*zI+1),tn(this.depth),this.l_buf=0,this.lit_bufsize=0,this.last_lit=0,this.d_buf=0,this.opt_len=0,this.static_len=0,this.matches=0,this.insert=0,this.bi_buf=0,this.bi_valid=0}const qc=i=>{if(!i||!i.state)return sn(i,Re);i.total_in=i.total_out=0,i.data_type=gS;const A=i.state;return A.pending=0,A.pending_out=0,A.wrap<0&&(A.wrap=-A.wrap),A.status=A.wrap?ng:_n,i.adler=A.wrap===2?0:1,A.last_flush=Xn,ZD(A),oi},Jc=i=>{const A=qc(i);return A===oi&&wS(i.state),A},RS=(i,A)=>!i||!i.state||i.state.wrap!==2?Re:(i.state.gzhead=A,oi),Kc=(i,A,t,e,n,s)=>{if(!i)return Re;let o=1;if(A===nS&&(A=6),e<0?(o=0,e=-e):e>15&&(o=2,e-=16),n<1||n>IS||t!==ig||e<8||e>15||A<0||A>9||s<0||s>aS)return sn(i,Re);e===8&&(e=9);const a=new MS;return i.state=a,a.strm=i,a.wrap=o,a.gzhead=null,a.w_bits=e,a.w_size=1<<a.w_bits,a.w_mask=a.w_size-1,a.hash_bits=n+7,a.hash_size=1<<a.hash_bits,a.hash_mask=a.hash_size-1,a.hash_shift=~~((a.hash_bits+XA-1)/XA),a.window=new Uint8Array(a.w_size*2),a.head=new Uint16Array(a.hash_size),a.prev=new Uint16Array(a.w_size),a.lit_bufsize=1<<n+6,a.pending_buf_size=a.lit_bufsize*4,a.pending_buf=new Uint8Array(a.pending_buf_size),a.d_buf=1*a.lit_bufsize,a.l_buf=(1+2)*a.lit_bufsize,a.level=A,a.strategy=s,a.method=t,Jc(i)},FS=(i,A)=>Kc(i,A,ig,BS,CS,rS),xS=(i,A)=>{let t,e;if(!i||!i.state||A>Ch||A<0)return i?sn(i,Re):Re;const n=i.state;if(!i.output||!i.input&&i.avail_in!==0||n.status===bo&&A!==gn)return sn(i,i.avail_out===0?EI:Re);n.strm=i;const s=n.last_flush;if(n.last_flush=A,n.status===ng)if(n.wrap===2)i.adler=0,et(n,31),et(n,139),et(n,8),n.gzhead?(et(n,(n.gzhead.text?1:0)+(n.gzhead.hcrc?2:0)+(n.gzhead.extra?4:0)+(n.gzhead.name?8:0)+(n.gzhead.comment?16:0)),et(n,n.gzhead.time&255),et(n,n.gzhead.time>>8&255),et(n,n.gzhead.time>>16&255),et(n,n.gzhead.time>>24&255),et(n,n.level===9?2:n.strategy>=Er||n.level<2?4:0),et(n,n.gzhead.os&255),n.gzhead.extra&&n.gzhead.extra.length&&(et(n,n.gzhead.extra.length&255),et(n,n.gzhead.extra.length>>8&255)),n.gzhead.hcrc&&(i.adler=Lt(i.adler,n.pending_buf,n.pending,0)),n.gzindex=0,n.status=XI):(et(n,0),et(n,0),et(n,0),et(n,0),et(n,0),et(n,n.level===9?2:n.strategy>=Er||n.level<2?4:0),et(n,fS),n.status=_n);else{let o=ig+(n.w_bits-8<<4)<<8,a=-1;n.strategy>=Er||n.level<2?a=0:n.level<6?a=1:n.level===6?a=2:a=3,o|=a<<6,n.strstart!==0&&(o|=uS),o+=31-o%31,n.status=_n,xo(n,o),n.strstart!==0&&(xo(n,i.adler>>>16),xo(n,i.adler&65535)),i.adler=1}if(n.status===XI)if(n.gzhead.extra){for(t=n.pending;n.gzindex<(n.gzhead.extra.length&65535)&&!(n.pending===n.pending_buf_size&&(n.gzhead.hcrc&&n.pending>t&&(i.adler=Lt(i.adler,n.pending_buf,n.pending-t,t)),Zi(i),t=n.pending,n.pending===n.pending_buf_size));)et(n,n.gzhead.extra[n.gzindex]&255),n.gzindex++;n.gzhead.hcrc&&n.pending>t&&(i.adler=Lt(i.adler,n.pending_buf,n.pending-t,t)),n.gzindex===n.gzhead.extra.length&&(n.gzindex=0,n.status=Mr)}else n.status=Mr;if(n.status===Mr)if(n.gzhead.name){t=n.pending;do{if(n.pending===n.pending_buf_size&&(n.gzhead.hcrc&&n.pending>t&&(i.adler=Lt(i.adler,n.pending_buf,n.pending-t,t)),Zi(i),t=n.pending,n.pending===n.pending_buf_size)){e=1;break}n.gzindex<n.gzhead.name.length?e=n.gzhead.name.charCodeAt(n.gzindex++)&255:e=0,et(n,e)}while(e!==0);n.gzhead.hcrc&&n.pending>t&&(i.adler=Lt(i.adler,n.pending_buf,n.pending-t,t)),e===0&&(n.gzindex=0,n.status=Rr)}else n.status=Rr;if(n.status===Rr)if(n.gzhead.comment){t=n.pending;do{if(n.pending===n.pending_buf_size&&(n.gzhead.hcrc&&n.pending>t&&(i.adler=Lt(i.adler,n.pending_buf,n.pending-t,t)),Zi(i),t=n.pending,n.pending===n.pending_buf_size)){e=1;break}n.gzindex<n.gzhead.comment.length?e=n.gzhead.comment.charCodeAt(n.gzindex++)&255:e=0,et(n,e)}while(e!==0);n.gzhead.hcrc&&n.pending>t&&(i.adler=Lt(i.adler,n.pending_buf,n.pending-t,t)),e===0&&(n.status=Fr)}else n.status=Fr;if(n.status===Fr&&(n.gzhead.hcrc?(n.pending+2>n.pending_buf_size&&Zi(i),n.pending+2<=n.pending_buf_size&&(et(n,i.adler&255),et(n,i.adler>>8&255),i.adler=0,n.status=_n)):n.status=_n),n.pending!==0){if(Zi(i),i.avail_out===0)return n.last_flush=-1,oi}else if(i.avail_in===0&&hh(A)<=hh(s)&&A!==gn)return sn(i,EI);if(n.status===bo&&i.avail_in!==0)return sn(i,EI);if(i.avail_in!==0||n.lookahead!==0||A!==Xn&&n.status!==bo){let o=n.strategy===Er?SS(n,A):n.strategy===oS?DS(n,A):vo[n.level].func(n,A);if((o===Yn||o===Io)&&(n.status=bo),o===St||o===Yn)return i.avail_out===0&&(n.last_flush=-1),oi;if(o===ha&&(A===tS?AS(n):A!==Ch&&(jD(n,0,0,!1),A===eS&&(tn(n.head),n.lookahead===0&&(n.strstart=0,n.block_start=0,n.insert=0))),Zi(i),i.avail_out===0))return n.last_flush=-1,oi}return A!==gn?oi:n.wrap<=0?Eh:(n.wrap===2?(et(n,i.adler&255),et(n,i.adler>>8&255),et(n,i.adler>>16&255),et(n,i.adler>>24&255),et(n,i.total_in&255),et(n,i.total_in>>8&255),et(n,i.total_in>>16&255),et(n,i.total_in>>24&255)):(xo(n,i.adler>>>16),xo(n,i.adler&65535)),Zi(i),n.wrap>0&&(n.wrap=-n.wrap),n.pending!==0?oi:Eh)},NS=i=>{if(!i||!i.state)return Re;const A=i.state.status;return A!==ng&&A!==XI&&A!==Mr&&A!==Rr&&A!==Fr&&A!==_n&&A!==bo?sn(i,Re):(i.state=null,A===_n?sn(i,iS):oi)},_S=(i,A)=>{let t=A.length;if(!i||!i.state)return Re;const e=i.state,n=e.wrap;if(n===2||n===1&&e.status!==ng||e.lookahead)return Re;if(n===1&&(i.adler=ia(i.adler,A,t,0)),e.wrap=0,t>=e.w_size){n===0&&(tn(e.head),e.strstart=0,e.block_start=0,e.insert=0);let g=new Uint8Array(e.w_size);g.set(A.subarray(t-e.w_size,t),0),A=g,t=e.w_size}const s=i.avail_in,o=i.next_in,a=i.input;for(i.avail_in=t,i.next_in=0,i.input=A,Pn(e);e.lookahead>=XA;){let g=e.strstart,r=e.lookahead-(XA-1);do e.ins_h=In(e,e.ins_h,e.window[g+XA-1]),e.prev[g&e.w_mask]=e.head[e.ins_h],e.head[e.ins_h]=g,g++;while(--r);e.strstart=g,e.lookahead=XA-1,Pn(e)}return e.strstart+=e.lookahead,e.block_start=e.strstart,e.insert=e.lookahead,e.lookahead=0,e.match_length=e.prev_length=XA-1,e.match_available=0,i.next_in=o,i.input=a,i.avail_in=s,e.wrap=n,oi};var GS=FS,LS=Kc,US=Jc,bS=qc,vS=RS,kS=xS,TS=NS,HS=_S,qS="pako deflate (from Nodeca project)",Po={deflateInit:GS,deflateInit2:LS,deflateReset:US,deflateResetKeep:bS,deflateSetHeader:vS,deflate:kS,deflateEnd:TS,deflateSetDictionary:HS,deflateInfo:qS};const JS=(i,A)=>Object.prototype.hasOwnProperty.call(i,A);var KS=function(i){const A=Array.prototype.slice.call(arguments,1);for(;A.length;){const t=A.shift();if(!!t){if(typeof t!="object")throw new TypeError(t+"must be non-object");for(const e in t)JS(t,e)&&(i[e]=t[e])}}return i},YS=i=>{let A=0;for(let e=0,n=i.length;e<n;e++)A+=i[e].length;const t=new Uint8Array(A);for(let e=0,n=0,s=i.length;e<s;e++){let o=i[e];t.set(o,n),n+=o.length}return t},sg={assign:KS,flattenChunks:YS};let Yc=!0;try{String.fromCharCode.apply(null,new Uint8Array(1))}catch{Yc=!1}const na=new Uint8Array(256);for(let i=0;i<256;i++)na[i]=i>=252?6:i>=248?5:i>=240?4:i>=224?3:i>=192?2:1;na[254]=na[254]=1;var PS=i=>{let A,t,e,n,s,o=i.length,a=0;for(n=0;n<o;n++)t=i.charCodeAt(n),(t&64512)===55296&&n+1<o&&(e=i.charCodeAt(n+1),(e&64512)===56320&&(t=65536+(t-55296<<10)+(e-56320),n++)),a+=t<128?1:t<2048?2:t<65536?3:4;for(A=new Uint8Array(a),s=0,n=0;s<a;n++)t=i.charCodeAt(n),(t&64512)===55296&&n+1<o&&(e=i.charCodeAt(n+1),(e&64512)===56320&&(t=65536+(t-55296<<10)+(e-56320),n++)),t<128?A[s++]=t:t<2048?(A[s++]=192|t>>>6,A[s++]=128|t&63):t<65536?(A[s++]=224|t>>>12,A[s++]=128|t>>>6&63,A[s++]=128|t&63):(A[s++]=240|t>>>18,A[s++]=128|t>>>12&63,A[s++]=128|t>>>6&63,A[s++]=128|t&63);return A};const OS=(i,A)=>{if(A<65534&&i.subarray&&Yc)return String.fromCharCode.apply(null,i.length===A?i:i.subarray(0,A));let t="";for(let e=0;e<A;e++)t+=String.fromCharCode(i[e]);return t};var WS=(i,A)=>{let t,e;const n=A||i.length,s=new Array(n*2);for(e=0,t=0;t<n;){let o=i[t++];if(o<128){s[e++]=o;continue}let a=na[o];if(a>4){s[e++]=65533,t+=a-1;continue}for(o&=a===2?31:a===3?15:7;a>1&&t<n;)o=o<<6|i[t++]&63,a--;if(a>1){s[e++]=65533;continue}o<65536?s[e++]=o:(o-=65536,s[e++]=55296|o>>10&1023,s[e++]=56320|o&1023)}return OS(s,e)},VS=(i,A)=>{A=A||i.length,A>i.length&&(A=i.length);let t=A-1;for(;t>=0&&(i[t]&192)===128;)t--;return t<0||t===0?A:t+na[i[t]]>A?t:A},sa={string2buf:PS,buf2string:WS,utf8border:VS};function zS(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0}var Pc=zS;const Oc=Object.prototype.toString,{Z_NO_FLUSH:XS,Z_SYNC_FLUSH:ZS,Z_FULL_FLUSH:jS,Z_FINISH:$S,Z_OK:qr,Z_STREAM_END:Aw,Z_DEFAULT_COMPRESSION:tw,Z_DEFAULT_STRATEGY:ew,Z_DEFLATED:iw}=zn;function Qa(i){this.options=sg.assign({level:tw,method:iw,chunkSize:16384,windowBits:15,memLevel:8,strategy:ew},i||{});let A=this.options;A.raw&&A.windowBits>0?A.windowBits=-A.windowBits:A.gzip&&A.windowBits>0&&A.windowBits<16&&(A.windowBits+=16),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new Pc,this.strm.avail_out=0;let t=Po.deflateInit2(this.strm,A.level,A.method,A.windowBits,A.memLevel,A.strategy);if(t!==qr)throw new Error(Kn[t]);if(A.header&&Po.deflateSetHeader(this.strm,A.header),A.dictionary){let e;if(typeof A.dictionary=="string"?e=sa.string2buf(A.dictionary):Oc.call(A.dictionary)==="[object ArrayBuffer]"?e=new Uint8Array(A.dictionary):e=A.dictionary,t=Po.deflateSetDictionary(this.strm,e),t!==qr)throw new Error(Kn[t]);this._dict_set=!0}}Qa.prototype.push=function(i,A){const t=this.strm,e=this.options.chunkSize;let n,s;if(this.ended)return!1;for(A===~~A?s=A:s=A===!0?$S:XS,typeof i=="string"?t.input=sa.string2buf(i):Oc.call(i)==="[object ArrayBuffer]"?t.input=new Uint8Array(i):t.input=i,t.next_in=0,t.avail_in=t.input.length;;){if(t.avail_out===0&&(t.output=new Uint8Array(e),t.next_out=0,t.avail_out=e),(s===ZS||s===jS)&&t.avail_out<=6){this.onData(t.output.subarray(0,t.next_out)),t.avail_out=0;continue}if(n=Po.deflate(t,s),n===Aw)return t.next_out>0&&this.onData(t.output.subarray(0,t.next_out)),n=Po.deflateEnd(this.strm),this.onEnd(n),this.ended=!0,n===qr;if(t.avail_out===0){this.onData(t.output);continue}if(s>0&&t.next_out>0){this.onData(t.output.subarray(0,t.next_out)),t.avail_out=0;continue}if(t.avail_in===0)break}return!0};Qa.prototype.onData=function(i){this.chunks.push(i)};Qa.prototype.onEnd=function(i){i===qr&&(this.result=sg.flattenChunks(this.chunks)),this.chunks=[],this.err=i,this.msg=this.strm.msg};function kB(i,A){const t=new Qa(A);if(t.push(i,!0),t.err)throw t.msg||Kn[t.err];return t.result}function nw(i,A){return A=A||{},A.raw=!0,kB(i,A)}function sw(i,A){return A=A||{},A.gzip=!0,kB(i,A)}var ow=Qa,aw=kB,rw=nw,gw=sw,Iw=zn,Bw={Deflate:ow,deflate:aw,deflateRaw:rw,gzip:gw,constants:Iw};const hr=30,Cw=12;var Ew=function(A,t){let e,n,s,o,a,g,r,I,B,C,Q,c,l,h,E,f,d,u,m,y,p,R,D,S;const F=A.state;e=A.next_in,D=A.input,n=e+(A.avail_in-5),s=A.next_out,S=A.output,o=s-(t-A.avail_out),a=s+(A.avail_out-257),g=F.dmax,r=F.wsize,I=F.whave,B=F.wnext,C=F.window,Q=F.hold,c=F.bits,l=F.lencode,h=F.distcode,E=(1<<F.lenbits)-1,f=(1<<F.distbits)-1;A:do{c<15&&(Q+=D[e++]<<c,c+=8,Q+=D[e++]<<c,c+=8),d=l[Q&E];t:for(;;){if(u=d>>>24,Q>>>=u,c-=u,u=d>>>16&255,u===0)S[s++]=d&65535;else if(u&16){m=d&65535,u&=15,u&&(c<u&&(Q+=D[e++]<<c,c+=8),m+=Q&(1<<u)-1,Q>>>=u,c-=u),c<15&&(Q+=D[e++]<<c,c+=8,Q+=D[e++]<<c,c+=8),d=h[Q&f];e:for(;;){if(u=d>>>24,Q>>>=u,c-=u,u=d>>>16&255,u&16){if(y=d&65535,u&=15,c<u&&(Q+=D[e++]<<c,c+=8,c<u&&(Q+=D[e++]<<c,c+=8)),y+=Q&(1<<u)-1,y>g){A.msg="invalid distance too far back",F.mode=hr;break A}if(Q>>>=u,c-=u,u=s-o,y>u){if(u=y-u,u>I&&F.sane){A.msg="invalid distance too far back",F.mode=hr;break A}if(p=0,R=C,B===0){if(p+=r-u,u<m){m-=u;do S[s++]=C[p++];while(--u);p=s-y,R=S}}else if(B<u){if(p+=r+B-u,u-=B,u<m){m-=u;do S[s++]=C[p++];while(--u);if(p=0,B<m){u=B,m-=u;do S[s++]=C[p++];while(--u);p=s-y,R=S}}}else if(p+=B-u,u<m){m-=u;do S[s++]=C[p++];while(--u);p=s-y,R=S}for(;m>2;)S[s++]=R[p++],S[s++]=R[p++],S[s++]=R[p++],m-=3;m&&(S[s++]=R[p++],m>1&&(S[s++]=R[p++]))}else{p=s-y;do S[s++]=S[p++],S[s++]=S[p++],S[s++]=S[p++],m-=3;while(m>2);m&&(S[s++]=S[p++],m>1&&(S[s++]=S[p++]))}}else if((u&64)===0){d=h[(d&65535)+(Q&(1<<u)-1)];continue e}else{A.msg="invalid distance code",F.mode=hr;break A}break}}else if((u&64)===0){d=l[(d&65535)+(Q&(1<<u)-1)];continue t}else if(u&32){F.mode=Cw;break A}else{A.msg="invalid literal/length code",F.mode=hr;break A}break}}while(e<n&&s<a);m=c>>3,e-=m,c-=m<<3,Q&=(1<<c)-1,A.next_in=e,A.next_out=s,A.avail_in=e<n?5+(n-e):5-(e-n),A.avail_out=s<a?257+(a-s):257-(s-a),F.hold=Q,F.bits=c};const Ls=15,Qh=852,ch=592,lh=0,QI=1,dh=2,hw=new Uint16Array([3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0]),Qw=new Uint8Array([16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78]),cw=new Uint16Array([1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0]),lw=new Uint8Array([16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64]),dw=(i,A,t,e,n,s,o,a)=>{const g=a.bits;let r=0,I=0,B=0,C=0,Q=0,c=0,l=0,h=0,E=0,f=0,d,u,m,y,p,R=null,D=0,S;const F=new Uint16Array(Ls+1),G=new Uint16Array(Ls+1);let L=null,T=0,b,V,K;for(r=0;r<=Ls;r++)F[r]=0;for(I=0;I<e;I++)F[A[t+I]]++;for(Q=g,C=Ls;C>=1&&F[C]===0;C--);if(Q>C&&(Q=C),C===0)return n[s++]=1<<24|64<<16|0,n[s++]=1<<24|64<<16|0,a.bits=1,0;for(B=1;B<C&&F[B]===0;B++);for(Q<B&&(Q=B),h=1,r=1;r<=Ls;r++)if(h<<=1,h-=F[r],h<0)return-1;if(h>0&&(i===lh||C!==1))return-1;for(G[1]=0,r=1;r<Ls;r++)G[r+1]=G[r]+F[r];for(I=0;I<e;I++)A[t+I]!==0&&(o[G[A[t+I]]++]=I);if(i===lh?(R=L=o,S=19):i===QI?(R=hw,D-=257,L=Qw,T-=257,S=256):(R=cw,L=lw,S=-1),f=0,I=0,r=B,p=s,c=Q,l=0,m=-1,E=1<<Q,y=E-1,i===QI&&E>Qh||i===dh&&E>ch)return 1;for(;;){b=r-l,o[I]<S?(V=0,K=o[I]):o[I]>S?(V=L[T+o[I]],K=R[D+o[I]]):(V=32+64,K=0),d=1<<r-l,u=1<<c,B=u;do u-=d,n[p+(f>>l)+u]=b<<24|V<<16|K|0;while(u!==0);for(d=1<<r-1;f&d;)d>>=1;if(d!==0?(f&=d-1,f+=d):f=0,I++,--F[r]===0){if(r===C)break;r=A[t+o[I]]}if(r>Q&&(f&y)!==m){for(l===0&&(l=Q),p+=B,c=r-l,h=1<<c;c+l<C&&(h-=F[c+l],!(h<=0));)c++,h<<=1;if(E+=1<<c,i===QI&&E>Qh||i===dh&&E>ch)return 1;m=f&y,n[m]=Q<<24|c<<16|p-s|0}}return f!==0&&(n[p+f]=r-l<<24|64<<16|0),a.bits=Q,0};var Oo=dw;const uw=0,Wc=1,Vc=2,{Z_FINISH:uh,Z_BLOCK:fw,Z_TREES:Qr,Z_OK:On,Z_STREAM_END:pw,Z_NEED_DICT:mw,Z_STREAM_ERROR:Fe,Z_DATA_ERROR:zc,Z_MEM_ERROR:Xc,Z_BUF_ERROR:yw,Z_DEFLATED:fh}=zn,Zc=1,ph=2,mh=3,yh=4,Dh=5,Sh=6,wh=7,Mh=8,Rh=9,Fh=10,Jr=11,wi=12,cI=13,xh=14,lI=15,Nh=16,_h=17,Gh=18,Lh=19,cr=20,lr=21,Uh=22,bh=23,vh=24,kh=25,Th=26,dI=27,Hh=28,qh=29,ht=30,jc=31,Dw=32,Sw=852,ww=592,Mw=15,Rw=Mw,Jh=i=>(i>>>24&255)+(i>>>8&65280)+((i&65280)<<8)+((i&255)<<24);function Fw(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new Uint16Array(320),this.work=new Uint16Array(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0}const $c=i=>{if(!i||!i.state)return Fe;const A=i.state;return i.total_in=i.total_out=A.total=0,i.msg="",A.wrap&&(i.adler=A.wrap&1),A.mode=Zc,A.last=0,A.havedict=0,A.dmax=32768,A.head=null,A.hold=0,A.bits=0,A.lencode=A.lendyn=new Int32Array(Sw),A.distcode=A.distdyn=new Int32Array(ww),A.sane=1,A.back=-1,On},Al=i=>{if(!i||!i.state)return Fe;const A=i.state;return A.wsize=0,A.whave=0,A.wnext=0,$c(i)},tl=(i,A)=>{let t;if(!i||!i.state)return Fe;const e=i.state;return A<0?(t=0,A=-A):(t=(A>>4)+1,A<48&&(A&=15)),A&&(A<8||A>15)?Fe:(e.window!==null&&e.wbits!==A&&(e.window=null),e.wrap=t,e.wbits=A,Al(i))},el=(i,A)=>{if(!i)return Fe;const t=new Fw;i.state=t,t.window=null;const e=tl(i,A);return e!==On&&(i.state=null),e},xw=i=>el(i,Rw);let Kh=!0,uI,fI;const Nw=i=>{if(Kh){uI=new Int32Array(512),fI=new Int32Array(32);let A=0;for(;A<144;)i.lens[A++]=8;for(;A<256;)i.lens[A++]=9;for(;A<280;)i.lens[A++]=7;for(;A<288;)i.lens[A++]=8;for(Oo(Wc,i.lens,0,288,uI,0,i.work,{bits:9}),A=0;A<32;)i.lens[A++]=5;Oo(Vc,i.lens,0,32,fI,0,i.work,{bits:5}),Kh=!1}i.lencode=uI,i.lenbits=9,i.distcode=fI,i.distbits=5},il=(i,A,t,e)=>{let n;const s=i.state;return s.window===null&&(s.wsize=1<<s.wbits,s.wnext=0,s.whave=0,s.window=new Uint8Array(s.wsize)),e>=s.wsize?(s.window.set(A.subarray(t-s.wsize,t),0),s.wnext=0,s.whave=s.wsize):(n=s.wsize-s.wnext,n>e&&(n=e),s.window.set(A.subarray(t-e,t-e+n),s.wnext),e-=n,e?(s.window.set(A.subarray(t-e,t),0),s.wnext=e,s.whave=s.wsize):(s.wnext+=n,s.wnext===s.wsize&&(s.wnext=0),s.whave<s.wsize&&(s.whave+=n))),0},_w=(i,A)=>{let t,e,n,s,o,a,g,r,I,B,C,Q,c,l,h=0,E,f,d,u,m,y,p,R;const D=new Uint8Array(4);let S,F;const G=new Uint8Array([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]);if(!i||!i.state||!i.output||!i.input&&i.avail_in!==0)return Fe;t=i.state,t.mode===wi&&(t.mode=cI),o=i.next_out,n=i.output,g=i.avail_out,s=i.next_in,e=i.input,a=i.avail_in,r=t.hold,I=t.bits,B=a,C=g,R=On;A:for(;;)switch(t.mode){case Zc:if(t.wrap===0){t.mode=cI;break}for(;I<16;){if(a===0)break A;a--,r+=e[s++]<<I,I+=8}if(t.wrap&2&&r===35615){t.check=0,D[0]=r&255,D[1]=r>>>8&255,t.check=Lt(t.check,D,2,0),r=0,I=0,t.mode=ph;break}if(t.flags=0,t.head&&(t.head.done=!1),!(t.wrap&1)||(((r&255)<<8)+(r>>8))%31){i.msg="incorrect header check",t.mode=ht;break}if((r&15)!==fh){i.msg="unknown compression method",t.mode=ht;break}if(r>>>=4,I-=4,p=(r&15)+8,t.wbits===0)t.wbits=p;else if(p>t.wbits){i.msg="invalid window size",t.mode=ht;break}t.dmax=1<<t.wbits,i.adler=t.check=1,t.mode=r&512?Fh:wi,r=0,I=0;break;case ph:for(;I<16;){if(a===0)break A;a--,r+=e[s++]<<I,I+=8}if(t.flags=r,(t.flags&255)!==fh){i.msg="unknown compression method",t.mode=ht;break}if(t.flags&57344){i.msg="unknown header flags set",t.mode=ht;break}t.head&&(t.head.text=r>>8&1),t.flags&512&&(D[0]=r&255,D[1]=r>>>8&255,t.check=Lt(t.check,D,2,0)),r=0,I=0,t.mode=mh;case mh:for(;I<32;){if(a===0)break A;a--,r+=e[s++]<<I,I+=8}t.head&&(t.head.time=r),t.flags&512&&(D[0]=r&255,D[1]=r>>>8&255,D[2]=r>>>16&255,D[3]=r>>>24&255,t.check=Lt(t.check,D,4,0)),r=0,I=0,t.mode=yh;case yh:for(;I<16;){if(a===0)break A;a--,r+=e[s++]<<I,I+=8}t.head&&(t.head.xflags=r&255,t.head.os=r>>8),t.flags&512&&(D[0]=r&255,D[1]=r>>>8&255,t.check=Lt(t.check,D,2,0)),r=0,I=0,t.mode=Dh;case Dh:if(t.flags&1024){for(;I<16;){if(a===0)break A;a--,r+=e[s++]<<I,I+=8}t.length=r,t.head&&(t.head.extra_len=r),t.flags&512&&(D[0]=r&255,D[1]=r>>>8&255,t.check=Lt(t.check,D,2,0)),r=0,I=0}else t.head&&(t.head.extra=null);t.mode=Sh;case Sh:if(t.flags&1024&&(Q=t.length,Q>a&&(Q=a),Q&&(t.head&&(p=t.head.extra_len-t.length,t.head.extra||(t.head.extra=new Uint8Array(t.head.extra_len)),t.head.extra.set(e.subarray(s,s+Q),p)),t.flags&512&&(t.check=Lt(t.check,e,Q,s)),a-=Q,s+=Q,t.length-=Q),t.length))break A;t.length=0,t.mode=wh;case wh:if(t.flags&2048){if(a===0)break A;Q=0;do p=e[s+Q++],t.head&&p&&t.length<65536&&(t.head.name+=String.fromCharCode(p));while(p&&Q<a);if(t.flags&512&&(t.check=Lt(t.check,e,Q,s)),a-=Q,s+=Q,p)break A}else t.head&&(t.head.name=null);t.length=0,t.mode=Mh;case Mh:if(t.flags&4096){if(a===0)break A;Q=0;do p=e[s+Q++],t.head&&p&&t.length<65536&&(t.head.comment+=String.fromCharCode(p));while(p&&Q<a);if(t.flags&512&&(t.check=Lt(t.check,e,Q,s)),a-=Q,s+=Q,p)break A}else t.head&&(t.head.comment=null);t.mode=Rh;case Rh:if(t.flags&512){for(;I<16;){if(a===0)break A;a--,r+=e[s++]<<I,I+=8}if(r!==(t.check&65535)){i.msg="header crc mismatch",t.mode=ht;break}r=0,I=0}t.head&&(t.head.hcrc=t.flags>>9&1,t.head.done=!0),i.adler=t.check=0,t.mode=wi;break;case Fh:for(;I<32;){if(a===0)break A;a--,r+=e[s++]<<I,I+=8}i.adler=t.check=Jh(r),r=0,I=0,t.mode=Jr;case Jr:if(t.havedict===0)return i.next_out=o,i.avail_out=g,i.next_in=s,i.avail_in=a,t.hold=r,t.bits=I,mw;i.adler=t.check=1,t.mode=wi;case wi:if(A===fw||A===Qr)break A;case cI:if(t.last){r>>>=I&7,I-=I&7,t.mode=dI;break}for(;I<3;){if(a===0)break A;a--,r+=e[s++]<<I,I+=8}switch(t.last=r&1,r>>>=1,I-=1,r&3){case 0:t.mode=xh;break;case 1:if(Nw(t),t.mode=cr,A===Qr){r>>>=2,I-=2;break A}break;case 2:t.mode=_h;break;case 3:i.msg="invalid block type",t.mode=ht}r>>>=2,I-=2;break;case xh:for(r>>>=I&7,I-=I&7;I<32;){if(a===0)break A;a--,r+=e[s++]<<I,I+=8}if((r&65535)!==(r>>>16^65535)){i.msg="invalid stored block lengths",t.mode=ht;break}if(t.length=r&65535,r=0,I=0,t.mode=lI,A===Qr)break A;case lI:t.mode=Nh;case Nh:if(Q=t.length,Q){if(Q>a&&(Q=a),Q>g&&(Q=g),Q===0)break A;n.set(e.subarray(s,s+Q),o),a-=Q,s+=Q,g-=Q,o+=Q,t.length-=Q;break}t.mode=wi;break;case _h:for(;I<14;){if(a===0)break A;a--,r+=e[s++]<<I,I+=8}if(t.nlen=(r&31)+257,r>>>=5,I-=5,t.ndist=(r&31)+1,r>>>=5,I-=5,t.ncode=(r&15)+4,r>>>=4,I-=4,t.nlen>286||t.ndist>30){i.msg="too many length or distance symbols",t.mode=ht;break}t.have=0,t.mode=Gh;case Gh:for(;t.have<t.ncode;){for(;I<3;){if(a===0)break A;a--,r+=e[s++]<<I,I+=8}t.lens[G[t.have++]]=r&7,r>>>=3,I-=3}for(;t.have<19;)t.lens[G[t.have++]]=0;if(t.lencode=t.lendyn,t.lenbits=7,S={bits:t.lenbits},R=Oo(uw,t.lens,0,19,t.lencode,0,t.work,S),t.lenbits=S.bits,R){i.msg="invalid code lengths set",t.mode=ht;break}t.have=0,t.mode=Lh;case Lh:for(;t.have<t.nlen+t.ndist;){for(;h=t.lencode[r&(1<<t.lenbits)-1],E=h>>>24,f=h>>>16&255,d=h&65535,!(E<=I);){if(a===0)break A;a--,r+=e[s++]<<I,I+=8}if(d<16)r>>>=E,I-=E,t.lens[t.have++]=d;else{if(d===16){for(F=E+2;I<F;){if(a===0)break A;a--,r+=e[s++]<<I,I+=8}if(r>>>=E,I-=E,t.have===0){i.msg="invalid bit length repeat",t.mode=ht;break}p=t.lens[t.have-1],Q=3+(r&3),r>>>=2,I-=2}else if(d===17){for(F=E+3;I<F;){if(a===0)break A;a--,r+=e[s++]<<I,I+=8}r>>>=E,I-=E,p=0,Q=3+(r&7),r>>>=3,I-=3}else{for(F=E+7;I<F;){if(a===0)break A;a--,r+=e[s++]<<I,I+=8}r>>>=E,I-=E,p=0,Q=11+(r&127),r>>>=7,I-=7}if(t.have+Q>t.nlen+t.ndist){i.msg="invalid bit length repeat",t.mode=ht;break}for(;Q--;)t.lens[t.have++]=p}}if(t.mode===ht)break;if(t.lens[256]===0){i.msg="invalid code -- missing end-of-block",t.mode=ht;break}if(t.lenbits=9,S={bits:t.lenbits},R=Oo(Wc,t.lens,0,t.nlen,t.lencode,0,t.work,S),t.lenbits=S.bits,R){i.msg="invalid literal/lengths set",t.mode=ht;break}if(t.distbits=6,t.distcode=t.distdyn,S={bits:t.distbits},R=Oo(Vc,t.lens,t.nlen,t.ndist,t.distcode,0,t.work,S),t.distbits=S.bits,R){i.msg="invalid distances set",t.mode=ht;break}if(t.mode=cr,A===Qr)break A;case cr:t.mode=lr;case lr:if(a>=6&&g>=258){i.next_out=o,i.avail_out=g,i.next_in=s,i.avail_in=a,t.hold=r,t.bits=I,Ew(i,C),o=i.next_out,n=i.output,g=i.avail_out,s=i.next_in,e=i.input,a=i.avail_in,r=t.hold,I=t.bits,t.mode===wi&&(t.back=-1);break}for(t.back=0;h=t.lencode[r&(1<<t.lenbits)-1],E=h>>>24,f=h>>>16&255,d=h&65535,!(E<=I);){if(a===0)break A;a--,r+=e[s++]<<I,I+=8}if(f&&(f&240)===0){for(u=E,m=f,y=d;h=t.lencode[y+((r&(1<<u+m)-1)>>u)],E=h>>>24,f=h>>>16&255,d=h&65535,!(u+E<=I);){if(a===0)break A;a--,r+=e[s++]<<I,I+=8}r>>>=u,I-=u,t.back+=u}if(r>>>=E,I-=E,t.back+=E,t.length=d,f===0){t.mode=Th;break}if(f&32){t.back=-1,t.mode=wi;break}if(f&64){i.msg="invalid literal/length code",t.mode=ht;break}t.extra=f&15,t.mode=Uh;case Uh:if(t.extra){for(F=t.extra;I<F;){if(a===0)break A;a--,r+=e[s++]<<I,I+=8}t.length+=r&(1<<t.extra)-1,r>>>=t.extra,I-=t.extra,t.back+=t.extra}t.was=t.length,t.mode=bh;case bh:for(;h=t.distcode[r&(1<<t.distbits)-1],E=h>>>24,f=h>>>16&255,d=h&65535,!(E<=I);){if(a===0)break A;a--,r+=e[s++]<<I,I+=8}if((f&240)===0){for(u=E,m=f,y=d;h=t.distcode[y+((r&(1<<u+m)-1)>>u)],E=h>>>24,f=h>>>16&255,d=h&65535,!(u+E<=I);){if(a===0)break A;a--,r+=e[s++]<<I,I+=8}r>>>=u,I-=u,t.back+=u}if(r>>>=E,I-=E,t.back+=E,f&64){i.msg="invalid distance code",t.mode=ht;break}t.offset=d,t.extra=f&15,t.mode=vh;case vh:if(t.extra){for(F=t.extra;I<F;){if(a===0)break A;a--,r+=e[s++]<<I,I+=8}t.offset+=r&(1<<t.extra)-1,r>>>=t.extra,I-=t.extra,t.back+=t.extra}if(t.offset>t.dmax){i.msg="invalid distance too far back",t.mode=ht;break}t.mode=kh;case kh:if(g===0)break A;if(Q=C-g,t.offset>Q){if(Q=t.offset-Q,Q>t.whave&&t.sane){i.msg="invalid distance too far back",t.mode=ht;break}Q>t.wnext?(Q-=t.wnext,c=t.wsize-Q):c=t.wnext-Q,Q>t.length&&(Q=t.length),l=t.window}else l=n,c=o-t.offset,Q=t.length;Q>g&&(Q=g),g-=Q,t.length-=Q;do n[o++]=l[c++];while(--Q);t.length===0&&(t.mode=lr);break;case Th:if(g===0)break A;n[o++]=t.length,g--,t.mode=lr;break;case dI:if(t.wrap){for(;I<32;){if(a===0)break A;a--,r|=e[s++]<<I,I+=8}if(C-=g,i.total_out+=C,t.total+=C,C&&(i.adler=t.check=t.flags?Lt(t.check,n,C,o-C):ia(t.check,n,C,o-C)),C=g,(t.flags?r:Jh(r))!==t.check){i.msg="incorrect data check",t.mode=ht;break}r=0,I=0}t.mode=Hh;case Hh:if(t.wrap&&t.flags){for(;I<32;){if(a===0)break A;a--,r+=e[s++]<<I,I+=8}if(r!==(t.total&4294967295)){i.msg="incorrect length check",t.mode=ht;break}r=0,I=0}t.mode=qh;case qh:R=pw;break A;case ht:R=zc;break A;case jc:return Xc;case Dw:default:return Fe}return i.next_out=o,i.avail_out=g,i.next_in=s,i.avail_in=a,t.hold=r,t.bits=I,(t.wsize||C!==i.avail_out&&t.mode<ht&&(t.mode<dI||A!==uh))&&il(i,i.output,i.next_out,C-i.avail_out),B-=i.avail_in,C-=i.avail_out,i.total_in+=B,i.total_out+=C,t.total+=C,t.wrap&&C&&(i.adler=t.check=t.flags?Lt(t.check,n,C,i.next_out-C):ia(t.check,n,C,i.next_out-C)),i.data_type=t.bits+(t.last?64:0)+(t.mode===wi?128:0)+(t.mode===cr||t.mode===lI?256:0),(B===0&&C===0||A===uh)&&R===On&&(R=yw),R},Gw=i=>{if(!i||!i.state)return Fe;let A=i.state;return A.window&&(A.window=null),i.state=null,On},Lw=(i,A)=>{if(!i||!i.state)return Fe;const t=i.state;return(t.wrap&2)===0?Fe:(t.head=A,A.done=!1,On)},Uw=(i,A)=>{const t=A.length;let e,n,s;return!i||!i.state||(e=i.state,e.wrap!==0&&e.mode!==Jr)?Fe:e.mode===Jr&&(n=1,n=ia(n,A,t,0),n!==e.check)?zc:(s=il(i,A,t,t),s?(e.mode=jc,Xc):(e.havedict=1,On))};var bw=Al,vw=tl,kw=$c,Tw=xw,Hw=el,qw=_w,Jw=Gw,Kw=Lw,Yw=Uw,Pw="pako inflate (from Nodeca project)",xi={inflateReset:bw,inflateReset2:vw,inflateResetKeep:kw,inflateInit:Tw,inflateInit2:Hw,inflate:qw,inflateEnd:Jw,inflateGetHeader:Kw,inflateSetDictionary:Yw,inflateInfo:Pw};function Ow(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name="",this.comment="",this.hcrc=0,this.done=!1}var Ww=Ow;const nl=Object.prototype.toString,{Z_NO_FLUSH:Vw,Z_FINISH:zw,Z_OK:oa,Z_STREAM_END:pI,Z_NEED_DICT:mI,Z_STREAM_ERROR:Xw,Z_DATA_ERROR:Yh,Z_MEM_ERROR:Zw}=zn;function ca(i){this.options=sg.assign({chunkSize:1024*64,windowBits:15,to:""},i||{});const A=this.options;A.raw&&A.windowBits>=0&&A.windowBits<16&&(A.windowBits=-A.windowBits,A.windowBits===0&&(A.windowBits=-15)),A.windowBits>=0&&A.windowBits<16&&!(i&&i.windowBits)&&(A.windowBits+=32),A.windowBits>15&&A.windowBits<48&&(A.windowBits&15)===0&&(A.windowBits|=15),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new Pc,this.strm.avail_out=0;let t=xi.inflateInit2(this.strm,A.windowBits);if(t!==oa)throw new Error(Kn[t]);if(this.header=new Ww,xi.inflateGetHeader(this.strm,this.header),A.dictionary&&(typeof A.dictionary=="string"?A.dictionary=sa.string2buf(A.dictionary):nl.call(A.dictionary)==="[object ArrayBuffer]"&&(A.dictionary=new Uint8Array(A.dictionary)),A.raw&&(t=xi.inflateSetDictionary(this.strm,A.dictionary),t!==oa)))throw new Error(Kn[t])}ca.prototype.push=function(i,A){const t=this.strm,e=this.options.chunkSize,n=this.options.dictionary;let s,o,a;if(this.ended)return!1;for(A===~~A?o=A:o=A===!0?zw:Vw,nl.call(i)==="[object ArrayBuffer]"?t.input=new Uint8Array(i):t.input=i,t.next_in=0,t.avail_in=t.input.length;;){for(t.avail_out===0&&(t.output=new Uint8Array(e),t.next_out=0,t.avail_out=e),s=xi.inflate(t,o),s===mI&&n&&(s=xi.inflateSetDictionary(t,n),s===oa?s=xi.inflate(t,o):s===Yh&&(s=mI));t.avail_in>0&&s===pI&&t.state.wrap>0&&i[t.next_in]!==0;)xi.inflateReset(t),s=xi.inflate(t,o);switch(s){case Xw:case Yh:case mI:case Zw:return this.onEnd(s),this.ended=!0,!1}if(a=t.avail_out,t.next_out&&(t.avail_out===0||s===pI))if(this.options.to==="string"){let g=sa.utf8border(t.output,t.next_out),r=t.next_out-g,I=sa.buf2string(t.output,g);t.next_out=r,t.avail_out=e-r,r&&t.output.set(t.output.subarray(g,g+r),0),this.onData(I)}else this.onData(t.output.length===t.next_out?t.output:t.output.subarray(0,t.next_out));if(!(s===oa&&a===0)){if(s===pI)return s=xi.inflateEnd(this.strm),this.onEnd(s),this.ended=!0,!0;if(t.avail_in===0)break}}return!0};ca.prototype.onData=function(i){this.chunks.push(i)};ca.prototype.onEnd=function(i){i===oa&&(this.options.to==="string"?this.result=this.chunks.join(""):this.result=sg.flattenChunks(this.chunks)),this.chunks=[],this.err=i,this.msg=this.strm.msg};function TB(i,A){const t=new ca(A);if(t.push(i),t.err)throw t.msg||Kn[t.err];return t.result}function jw(i,A){return A=A||{},A.raw=!0,TB(i,A)}var $w=ca,AM=TB,tM=jw,eM=TB,iM=zn,nM={Inflate:$w,inflate:AM,inflateRaw:tM,ungzip:eM,constants:iM};const{Deflate:sM,deflate:oM,deflateRaw:aM,gzip:rM}=Bw,{Inflate:gM,inflate:IM,inflateRaw:BM,ungzip:CM}=nM;var EM=sM,hM=oM,QM=aM,cM=rM,lM=gM,dM=IM,uM=BM,fM=CM,pM=zn,Ph={Deflate:EM,deflate:hM,deflateRaw:QM,gzip:cM,Inflate:lM,inflate:dM,inflateRaw:uM,ungzip:fM,constants:pM},Ae;const mM=(Ae=class{constructor(i=1){if(i<-1||i>9)throw new Error("Invalid zlib compression level, it should be between -1 and 9");this.level=i}static fromConfig({level:i}){return new Ae(i)}encode(i){return Ph.deflate(i,{level:this.level})}decode(i,A){const t=Ph.inflate(i);return A!==void 0?(A.set(t),A):t}},Ae.codecId="zlib",Ae);var yM=function(){return typeof document<"u"&&document.currentScript&&document.currentScript.src,function(i){i=i||{};var A;A||(A=typeof i<"u"?i:{});var t,e;A.ready=new Promise(function(U,J){t=U,e=J});var n={},s;for(s in A)A.hasOwnProperty(s)&&(n[s]=A[s]);var o="./this.program",a=A.print||console.log.bind(console),g=A.printErr||console.warn.bind(console);for(s in n)n.hasOwnProperty(s)&&(A[s]=n[s]);n=null,A.thisProgram&&(o=A.thisProgram);var r;A.wasmBinary&&(r=A.wasmBinary),A.noExitRuntime&&A.noExitRuntime,typeof WebAssembly!="object"&&aA("no native wasm support detected");var I,B=!1,C=typeof TextDecoder<"u"?new TextDecoder("utf8"):void 0;function Q(U,J,W){var w=J+W;for(W=J;U[W]&&!(W>=w);)++W;if(16<W-J&&U.subarray&&C)return C.decode(U.subarray(J,W));for(w="";J<W;){var _=U[J++];if(_&128){var v=U[J++]&63;if((_&224)==192)w+=String.fromCharCode((_&31)<<6|v);else{var H=U[J++]&63;_=(_&240)==224?(_&15)<<12|v<<6|H:(_&7)<<18|v<<12|H<<6|U[J++]&63,65536>_?w+=String.fromCharCode(_):(_-=65536,w+=String.fromCharCode(55296|_>>10,56320|_&1023))}}else w+=String.fromCharCode(_)}return w}function c(U,J,W){var w=R;if(0<W){W=J+W-1;for(var _=0;_<U.length;++_){var v=U.charCodeAt(_);if(55296<=v&&57343>=v){var H=U.charCodeAt(++_);v=65536+((v&1023)<<10)|H&1023}if(127>=v){if(J>=W)break;w[J++]=v}else{if(2047>=v){if(J+1>=W)break;w[J++]=192|v>>6}else{if(65535>=v){if(J+2>=W)break;w[J++]=224|v>>12}else{if(J+3>=W)break;w[J++]=240|v>>18,w[J++]=128|v>>12&63}w[J++]=128|v>>6&63}w[J++]=128|v&63}}w[J]=0}}var l=typeof TextDecoder<"u"?new TextDecoder("utf-16le"):void 0;function h(U,J){for(var W=U>>1,w=W+J/2;!(W>=w)&&S[W];)++W;if(W<<=1,32<W-U&&l)return l.decode(R.subarray(U,W));for(W=0,w="";;){var _=D[U+2*W>>1];if(_==0||W==J/2)return w;++W,w+=String.fromCharCode(_)}}function E(U,J,W){if(W===void 0&&(W=2147483647),2>W)return 0;W-=2;var w=J;W=W<2*U.length?W/2:U.length;for(var _=0;_<W;++_)D[J>>1]=U.charCodeAt(_),J+=2;return D[J>>1]=0,J-w}function f(U){return 2*U.length}function d(U,J){for(var W=0,w="";!(W>=J/4);){var _=F[U+4*W>>2];if(_==0)break;++W,65536<=_?(_-=65536,w+=String.fromCharCode(55296|_>>10,56320|_&1023)):w+=String.fromCharCode(_)}return w}function u(U,J,W){if(W===void 0&&(W=2147483647),4>W)return 0;var w=J;W=w+W-4;for(var _=0;_<U.length;++_){var v=U.charCodeAt(_);if(55296<=v&&57343>=v){var H=U.charCodeAt(++_);v=65536+((v&1023)<<10)|H&1023}if(F[J>>2]=v,J+=4,J+4>W)break}return F[J>>2]=0,J-w}function m(U){for(var J=0,W=0;W<U.length;++W){var w=U.charCodeAt(W);55296<=w&&57343>=w&&++W,J+=4}return J}var y,p,R,D,S,F,G,L,T;function b(U){y=U,A.HEAP8=p=new Int8Array(U),A.HEAP16=D=new Int16Array(U),A.HEAP32=F=new Int32Array(U),A.HEAPU8=R=new Uint8Array(U),A.HEAPU16=S=new Uint16Array(U),A.HEAPU32=G=new Uint32Array(U),A.HEAPF32=L=new Float32Array(U),A.HEAPF64=T=new Float64Array(U)}var V=A.INITIAL_MEMORY||16777216;A.wasmMemory?I=A.wasmMemory:I=new WebAssembly.Memory({initial:V/65536,maximum:32768}),I&&(y=I.buffer),V=y.byteLength,b(y);var K,tA=[],nA=[],Z=[],CA=[];function q(){var U=A.preRun.shift();tA.unshift(U)}var eA=0,oA=null;A.preloadedImages={},A.preloadedAudios={};function aA(U){throw A.onAbort&&A.onAbort(U),g(U),B=!0,U=new WebAssembly.RuntimeError("abort("+U+"). Build with -s ASSERTIONS=1 for more info."),e(U),U}function QA(U){var J=NA;return String.prototype.startsWith?J.startsWith(U):J.indexOf(U)===0}function wA(){return QA("data:application/octet-stream;base64,")}var NA="blosc_codec.wasm";if(!wA()){var xA=NA;NA=A.locateFile?A.locateFile(xA,""):""+xA}function it(){try{if(r)return new Uint8Array(r);throw"both async and sync fetching of the wasm failed"}catch(U){aA(U)}}function _A(U){for(;0<U.length;){var J=U.shift();if(typeof J=="function")J(A);else{var W=J.T;typeof W=="number"?J.O===void 0?K.get(W)():K.get(W)(J.O):W(J.O===void 0?null:J.O)}}}function $(U){this.N=U-16,this.$=function(J){F[this.N+8>>2]=J},this.X=function(J){F[this.N+0>>2]=J},this.Y=function(){F[this.N+4>>2]=0},this.W=function(){p[this.N+12>>0]=0},this.Z=function(){p[this.N+13>>0]=0},this.V=function(J,W){this.$(J),this.X(W),this.Y(),this.W(),this.Z()}}function JA(U){switch(U){case 1:return 0;case 2:return 1;case 4:return 2;case 8:return 3;default:throw new TypeError("Unknown type size: "+U)}}var MA=void 0;function FA(U){for(var J="";R[U];)J+=MA[R[U++]];return J}var SA={},qA={},bA={};function LA(U){if(U===void 0)return"_unknown";U=U.replace(/[^a-zA-Z0-9_]/g,"$");var J=U.charCodeAt(0);return 48<=J&&57>=J?"_"+U:U}function PA(U,J){return U=LA(U),new Function("body","return function "+U+`() {
    "use strict";    return body.apply(this, arguments);
};
`)(J)}function YA(U){var J=Error,W=PA(U,function(w){this.name=U,this.message=w,w=Error(w).stack,w!==void 0&&(this.stack=this.toString()+`
`+w.replace(/^Error(:[^\n]*)?\n/,""))});return W.prototype=Object.create(J.prototype),W.prototype.constructor=W,W.prototype.toString=function(){return this.message===void 0?this.name:this.name+": "+this.message},W}var $A=void 0;function N(U){throw new $A(U)}var M=void 0;function k(U,J){function W(O){if(O=J(O),O.length!==w.length)throw new M("Mismatched type converter count");for(var gA=0;gA<w.length;++gA)X(w[gA],O[gA])}var w=[];w.forEach(function(O){bA[O]=U});var _=Array(U.length),v=[],H=0;U.forEach(function(O,gA){qA.hasOwnProperty(O)?_[gA]=qA[O]:(v.push(O),SA.hasOwnProperty(O)||(SA[O]=[]),SA[O].push(function(){_[gA]=qA[O],++H,H===v.length&&W(_)}))}),v.length===0&&W(_)}function X(U,J,W){if(W=W||{},!("argPackAdvance"in J))throw new TypeError("registerType registeredInstance requires argPackAdvance");var w=J.name;if(U||N('type "'+w+'" must have a positive integer typeid pointer'),qA.hasOwnProperty(U)){if(W.U)return;N("Cannot register type '"+w+"' twice")}qA[U]=J,delete bA[U],SA.hasOwnProperty(U)&&(J=SA[U],delete SA[U],J.forEach(function(_){_()}))}var j=[],x=[{},{value:void 0},{value:null},{value:!0},{value:!1}];function AA(U){4<U&&--x[U].P===0&&(x[U]=void 0,j.push(U))}function sA(U){switch(U){case void 0:return 1;case null:return 2;case!0:return 3;case!1:return 4;default:var J=j.length?j.pop():x.length;return x[J]={P:1,value:U},J}}function z(U){return this.fromWireType(G[U>>2])}function IA(U){if(U===null)return"null";var J=typeof U;return J==="object"||J==="array"||J==="function"?U.toString():""+U}function lA(U,J){switch(J){case 2:return function(W){return this.fromWireType(L[W>>2])};case 3:return function(W){return this.fromWireType(T[W>>3])};default:throw new TypeError("Unknown float type: "+U)}}function EA(U){var J=Function;if(!(J instanceof Function))throw new TypeError("new_ called with constructor type "+typeof J+" which is not a function");var W=PA(J.name||"unknownFunctionName",function(){});return W.prototype=J.prototype,W=new W,U=J.apply(W,U),U instanceof Object?U:W}function DA(U){for(;U.length;){var J=U.pop();U.pop()(J)}}function RA(U,J){var W=A;if(W[U].L===void 0){var w=W[U];W[U]=function(){return W[U].L.hasOwnProperty(arguments.length)||N("Function '"+J+"' called with an invalid number of arguments ("+arguments.length+") - expects one of ("+W[U].L+")!"),W[U].L[arguments.length].apply(this,arguments)},W[U].L=[],W[U].L[w.S]=w}}function UA(U,J,W){A.hasOwnProperty(U)?((W===void 0||A[U].L!==void 0&&A[U].L[W]!==void 0)&&N("Cannot register public name '"+U+"' twice"),RA(U,U),A.hasOwnProperty(W)&&N("Cannot register multiple overloads of a function with the same number of arguments ("+W+")!"),A[U].L[W]=J):(A[U]=J,W!==void 0&&(A[U].ba=W))}function WA(U,J){for(var W=[],w=0;w<U;w++)W.push(F[(J>>2)+w]);return W}function Y(U,J){0<=U.indexOf("j")||aA("Assertion failed: getDynCaller should only be called with i64 sigs");var W=[];return function(){W.length=arguments.length;for(var w=0;w<arguments.length;w++)W[w]=arguments[w];var _;return U.indexOf("j")!=-1?_=W&&W.length?A["dynCall_"+U].apply(null,[J].concat(W)):A["dynCall_"+U].call(null,J):_=K.get(J).apply(null,W),_}}function fA(U,J){U=FA(U);var W=U.indexOf("j")!=-1?Y(U,J):K.get(J);return typeof W!="function"&&N("unknown function pointer with signature "+U+": "+J),W}var iA=void 0;function hA(U){U=ho(U);var J=FA(U);return $t(U),J}function mA(U,J){function W(v){_[v]||qA[v]||(bA[v]?bA[v].forEach(W):(w.push(v),_[v]=!0))}var w=[],_={};throw J.forEach(W),new iA(U+": "+w.map(hA).join([", "]))}function At(U,J,W){switch(J){case 0:return W?function(w){return p[w]}:function(w){return R[w]};case 1:return W?function(w){return D[w>>1]}:function(w){return S[w>>1]};case 2:return W?function(w){return F[w>>2]}:function(w){return G[w>>2]};default:throw new TypeError("Unknown integer type: "+U)}}var Bt={};function ct(){if(!Ne){var U={USER:"web_user",LOGNAME:"web_user",PATH:"/",PWD:"/",HOME:"/home/web_user",LANG:(typeof navigator=="object"&&navigator.languages&&navigator.languages[0]||"C").replace("-","_")+".UTF-8",_:o||"./this.program"},J;for(J in Bt)U[J]=Bt[J];var W=[];for(J in U)W.push(J+"="+U[J]);Ne=W}return Ne}for(var Ne,Et=[null,[],[]],se=Array(256),ft=0;256>ft;++ft)se[ft]=String.fromCharCode(ft);MA=se,$A=A.BindingError=YA("BindingError"),M=A.InternalError=YA("InternalError"),A.count_emval_handles=function(){for(var U=0,J=5;J<x.length;++J)x[J]!==void 0&&++U;return U},A.get_first_emval=function(){for(var U=5;U<x.length;++U)if(x[U]!==void 0)return x[U];return null},iA=A.UnboundTypeError=YA("UnboundTypeError"),nA.push({T:function(){Eo()}});var ua={p:function(U){return Zn(U+16)+16},o:function(U,J,W){throw new $(U).V(J,W),U},z:function(U,J,W,w,_){var v=JA(W);J=FA(J),X(U,{name:J,fromWireType:function(H){return!!H},toWireType:function(H,O){return O?w:_},argPackAdvance:8,readValueFromPointer:function(H){if(W===1)var O=p;else if(W===2)O=D;else if(W===4)O=F;else throw new TypeError("Unknown boolean type size: "+J);return this.fromWireType(O[H>>v])},M:null})},y:function(U,J){J=FA(J),X(U,{name:J,fromWireType:function(W){var w=x[W].value;return AA(W),w},toWireType:function(W,w){return sA(w)},argPackAdvance:8,readValueFromPointer:z,M:null})},h:function(U,J,W){W=JA(W),J=FA(J),X(U,{name:J,fromWireType:function(w){return w},toWireType:function(w,_){if(typeof _!="number"&&typeof _!="boolean")throw new TypeError('Cannot convert "'+IA(_)+'" to '+this.name);return _},argPackAdvance:8,readValueFromPointer:lA(J,W),M:null})},e:function(U,J,W,w,_,v){var H=WA(J,W);U=FA(U),_=fA(w,_),UA(U,function(){mA("Cannot call "+U+" due to unbound types",H)},J-1),k(H,function(O){var gA=U,BA=U;O=[O[0],null].concat(O.slice(1));var pA=_,yA=O.length;2>yA&&N("argTypes array size mismatch! Must at least get return value and 'this' types!");for(var vA=O[1]!==null&&!1,GA=!1,dA=1;dA<O.length;++dA)if(O[dA]!==null&&O[dA].M===void 0){GA=!0;break}var ot=O[0].name!=="void",nt="",Rt="";for(dA=0;dA<yA-2;++dA)nt+=(dA!==0?", ":"")+"arg"+dA,Rt+=(dA!==0?", ":"")+"arg"+dA+"Wired";BA="return function "+LA(BA)+"("+nt+`) {
if (arguments.length !== `+(yA-2)+`) {
throwBindingError('function `+BA+" called with ' + arguments.length + ' arguments, expected "+(yA-2)+` args!');
}
`,GA&&(BA+=`var destructors = [];
`);var ce=GA?"destructors":"null";for(nt="throwBindingError invoker fn runDestructors retType classParam".split(" "),pA=[N,pA,v,DA,O[0],O[1]],vA&&(BA+="var thisWired = classParam.toWireType("+ce+`, this);
`),dA=0;dA<yA-2;++dA)BA+="var arg"+dA+"Wired = argType"+dA+".toWireType("+ce+", arg"+dA+"); // "+O[dA+2].name+`
`,nt.push("argType"+dA),pA.push(O[dA+2]);if(vA&&(Rt="thisWired"+(0<Rt.length?", ":"")+Rt),BA+=(ot?"var rv = ":"")+"invoker(fn"+(0<Rt.length?", ":"")+Rt+`);
`,GA)BA+=`runDestructors(destructors);
`;else for(dA=vA?1:2;dA<O.length;++dA)yA=dA===1?"thisWired":"arg"+(dA-2)+"Wired",O[dA].M!==null&&(BA+=yA+"_dtor("+yA+"); // "+O[dA].name+`
`,nt.push(yA+"_dtor"),pA.push(O[dA].M));if(ot&&(BA+=`var ret = retType.fromWireType(rv);
return ret;
`),nt.push(BA+`}
        'blosclz', 'lz4', 'lz4hc','snappy', 'zlib', 'zstd'.`);if(t<-1||t>2)throw new Error(`Invalid shuffle ${t}. Must be one of 0 (NOSHUFFLE),
        1 (SHUFFLE), 2 (BITSHUFFLE), -1 (AUTOSHUFFLE).`);this.blocksize=e,this.clevel=i,this.cname=A,this.shuffle=t}static fromConfig({blocksize:i,clevel:A,cname:t,shuffle:e}){return new Ae(A,t,e,i)}async prepare(){dr||(dr=await MM())}encode(i){const A=dr,t=A.compress(i,this.cname,this.clevel,this.shuffle,this.blocksize),e=new Uint8Array(t);return A.free_result(),e}decode(i,A){const t=dr,e=t.decompress(i),n=new Uint8Array(e);return t.free_result(),A!==void 0?(A.set(n),A):n}},Ae.codecId="blosc",Ae.COMPRESSORS=[...Wh],Ae.NOSHUFFLE=0,Ae.SHUFFLE=1,Ae.BITSHUFFLE=2,Ae.AUTOSHUFFLE=-1,Ae),Kr=1,FM=1,Xt=4,Yr=8,xM=Yr,NM="string",ks="int32",vn="int64",_M="bool",GM="half",Ye="float",Fn="double",yI="vec3i",DI="vec3s",SI="vec3d",LM="ptdataidx32",UM="ptdataidx64",bM={[Fn]:{exp:11,bias:(1<<11-1)-1,size:xM},[Ye]:{exp:8,bias:(1<<8-1)-1,size:Xt},[ks]:{size:Xt},[vn]:{size:Yr},[LM]:{size:Xt},[UM]:{size:Yr},[GM]:{size:Xt/2,exp:5,bias:(1<<5-1)-1}},jA=rA;class Vh{constructor(A){cA(this,"source",null);cA(this,"offset",0);if(!(A instanceof Uint8Array))throw console.error("BufferIterator","constructor","source must be an Uint8Array buffer."),0;this.source=A}reset(){this.offset=0}readBytes(A){let t=0;return this.source.slice(this.offset,this.offset+A).forEach((e,n)=>{t=t|e<<8*n}),this.offset+=A,t}readRawBytes(A){const t=[];return this.source.slice(this.offset,this.offset+A).forEach((e,n)=>{t.push(e)}),this.offset+=A,Uint8Array.from(t)}readBool(){return Boolean(this.readBytes(FM))}readString(A=NM){const t=this.readBytes(Xt);let e="";return A===vn?e=this.readFloat(vn):A===_M?e=Boolean(this.readBytes(t)):A===yI?e=new jA(this.readFloat(ks),this.readFloat(ks),this.readFloat(ks)):A===DI?e=new jA(this.readFloat(Ye),this.readFloat(Ye),this.readFloat(Ye)):A===SI?e=new jA(this.readFloat(Fn),this.readFloat(Fn),this.readFloat(Fn)):Array(t).fill(0).map(n=>e+=String.fromCharCode(this.readBytes(Kr))),e}readFloat(A=Fn){const t=bM[A];if([DI,yI,SI].includes(A)){const r={[DI]:Ye,[yI]:ks,[SI]:Fn}[A];return new jA(this.readFloat(r),this.readFloat(r),this.readFloat(r))}let e=[];if(Array(t.size).fill(0).forEach(()=>{e.unshift(this.readBytes(Kr))}),e=e.map(r=>`00000000${r.toString(2)}`.substr(-8)).join(""),[ks,vn].includes(A))return~~parseInt(e,2);const n=e.slice(0,1)==="1"?-1:1,s=parseInt(e.slice(1,t.exp+1),2)-t.bias,o="1"+e.slice(t.exp+1,A.size);let a=s<0?0:o.substr(0,s+1),g="0."+Array(s<0?-s-1:0).fill("0").join("")+o.substr(s<0?0:s+1);return a=parseInt(a,2),g=parseInt(g.replace(".",""),2)/Math.pow(2,(g.split(".")[1]||"").length),a===0&&g===0?0:n*(a+g)}readVector3(A=Fn){const t=new jA;return t.x=this.readFloat(A),t.y=this.readFloat(A),t.z=this.readFloat(A),t}skip(A){this.offset+=A}}class vM{constructor(){cA(this,"blosc",null);cA(this,"zlib",null)}async prepareModules(){this.blosc=new RM,await this.blosc.prepare(),this.zlib=new mM}}const Pr=new vM;class Ui{static greater(A,t){return A>t}static greaterEq(A,t){return A>=t}static less(A,t){return A<t}static lessEq(A,t){return A<=t}static eq(A,t){return A===t}static between(A,t,e,n,s){return n&&s?A>=t&&A<=e:n?A>=t&&A<e:s?A>t&&A<=e:A>t&&A<e}}class KA{constructor(){cA(this,"bufferIterator",null);cA(this,"compression",null);cA(this,"version",null);cA(this,"valueType",null);cA(this,"useHalf",null)}static tagContext(A,t){A.sharedContext=t}static passContext(A,t){t.sharedContext=A.sharedContext}static cleanContext(A){delete A.sharedContext}static getContext(A){return A.sharedContext}static assert(A){if(!A.sharedContext)throw console.error("GridSharedContext","assert","expected GridSharedContext to exist",{target:A}),0}}const ut={uniformScaleTranslateMap:"UniformScaleTranslateMap",scaleTranslateMap:"ScaleTranslateMap",uniformScaleMap:"UniformScaleMap",scaleMap:"ScaleMap",translationMap:"TranslationMap",unitaryMap:"UnitaryMap",nonlinearFrustumMap:"NonlinearFrustumMap"};class Bo{constructor(){this.transformMap={mapType:null,translation:new jA,scale:new jA,voxelSize:new jA,scaleInverse:new jA,scaleInverseSq:new jA,scaleInverseDouble:new jA}}readTransform(){const{bufferIterator:A,version:t}=KA.getContext(this);this.transformMap.mapType=A.readString(),!Ui.less(t,219)&&([ut.uniformScaleTranslateMap,ut.scaleTranslateMap].includes(this.transformMap.mapType)?this.transformMap={...this.transformMap,translation:A.readVector3(),scale:A.readVector3(),voxelSize:A.readVector3(),scaleInverse:A.readVector3(),scaleInverseSq:A.readVector3(),scaleInverseDouble:A.readVector3()}:[ut.uniformScaleMap,ut.scaleMap].includes(this.transformMap.mapType)?this.transformMap={...this.transformMap,scale:A.readVector3(),voxelSize:A.readVector3(),scaleInverse:A.readVector3(),scaleInverseSq:A.readVector3(),scaleInverseDouble:A.readVector3()}:[ut.translationMap].includes(this.transformMap.mapType)?this.transformMap={...this.transformMap,translation:A.readVector3()}:[ut.unitaryMap].includes(this.transformMap.mapType)||[ut.nonlinearFrustumMap].includes(this.transformMap.mapType),this.applyTransformMap(new jA))}applyTransformMap(A){let t;return[ut.uniformScaleTranslateMap,ut.scaleTranslateMap].includes(this.transformMap.mapType)?t=e=>e.multiply(this.transformMap.scale):[ut.uniformScaleMap,ut.scaleMap].includes(this.transformMap.mapType)?t=e=>e.multiply(this.transformMap.scale).add(this.transformMap.translation):[ut.translationMap].includes(this.transformMap.mapType)?t=e=>e.add(this.transformMap.translation):[ut.unitaryMap].includes(this.transformMap.mapType)?t=e=>e:[ut.nonlinearFrustumMap].includes(this.transformMap.mapType)?t=e=>e:(nh("GridDescriptor::Matrix4x4",this.transformMap.mapType),t=e=>e),this.applyTransformMap=t,t(A)}applyInverseTransformMap(A){let t;return[ut.uniformScaleTranslateMap,ut.scaleTranslateMap].includes(this.transformMap.mapType)?t=e=>e.multiply(this.transformMap.scaleInverse):[ut.uniformScaleMap,ut.scaleMap].includes(this.transformMap.mapType)?t=e=>e.multiply(this.transformMap.scaleInverse):[ut.translationMap].includes(this.transformMap.mapType)?t=e=>e.sub(this.transformMap.translation).sub(this.transformMap.translation):[ut.unitaryMap].includes(this.transformMap.mapType)?t=e=>e:[ut.nonlinearFrustumMap].includes(this.transformMap.mapType)?t=e=>e:(nh("GridDescriptor::Matrix4x4",this.transformMap.mapType),t=e=>e),this.applyInverseTransformMap=t,t(A)}}class wI{constructor(){cA(this,"onIndexCache",null)}readMask(A){const{bufferIterator:t}=KA.getContext(this);this.dim=1<<A.log2dim,this.size=1<<3*A.log2dim,this.wordCount=this.size>>6,this.words=[],Array(this.wordCount).fill(0).forEach(()=>{const e=Array(8).fill("0").join("");let n=Array(8).fill(0).map(()=>`${e}${t.readBytes(1).toString(2).split("-").join("")}`.substr(-8).split("").reverse().join(""));n=n.join(""),this.words.push(`${Array(64).fill("0").join("")}${n}`.substr(-64))}),this.onCache=this.countOn(),this.offCache=this.countOff(),this.forEachOn(),this.forEachOff()}countOn(){if(this.onCache)return this.onCache;let A=0;return this.words.forEach(t=>{A+=t.split("").filter(e=>e==="1").length}),A}countOff(){return this.offCache?this.offCache:this.size-this.countOn()}forEachOn(A){if(this.countOn()===0||!A)return;let t=0,e=0;for(this.onIndexCache||(this.onIndexCache=[]),t=0;t<this.words.length;t++){const n=this.words[t].split("");for(e=0;e<n.length;e++)if(n[e]==="1"){const s=t*64+e;this.onIndexCache[s]=!0,A({wordIndex:t,bitIndex:e,offset:s})===0&&(e=n.length,t=this.words.length)}}}forEachOff(A){if(this.countOff()===0||!A)return;let t=0,e=0;for(this.onIndexCache||(this.onIndexCache=[]),t=0;t<this.words.length;t++){const n=this.words[t].split("");for(e=0;e<n.length;e++)if(n[e]==="0"){const s=t*64+e;this.onIndexCache[s]=!1,A({wordIndex:t,bitIndex:e,offset:s})===0&&(e=n.length,t=this.words.length)}}}isOn(A){return!!this.onIndexCache[A]}isOff(A){return!this.onIndexCache[A]}}const sl=[5,4,3],ol=[4,3,0],kM=["internal","internal","leaf"];class HB{constructor(){cA(this,"valueCache",{});cA(this,"reads",0);cA(this,"readsMiss",0);cA(this,"readsOk",0)}readNode(A=0,t){const{version:e}=KA.getContext(this);Object.assign(this,t),this.depth=A,this.log2dim=sl[A]||1,this.nodeType=kM[A]||"invalid",this.total=this.log2dim+(n=>{let s=0;return ol.forEach((o,a)=>{a>=n&&(s+=o)}),s})(A),this.dim=1<<this.total,this.numValues=1<<3*this.log2dim,this.level=2-A,this.numVoxels=1<<3*this.total,this.background=t.background||0,this.offsetMask=this.dim-1,A<2&&(this.childMask=new wI,KA.passContext(this,this.childMask),this.childMask.readMask(this),KA.cleanContext(this.childMask)),this.valueMask=new wI,KA.passContext(this,this.valueMask),this.valueMask.readMask(this),KA.cleanContext(this.valueMask),this.isLeaf()?this.leavesCount=1:this.leavesCount=0,this.table=[],this.firstChild=null,this.values=[],!Ui.less(e,214)&&this.readValues()}isLeaf(){return this.depth>=2}isInternalNode(){return!this.isLeaf()}getValueCoords(A){const t=new jA;let e=A>>2*this.log2dim;A&=(1<<2*this.log2dim)-1;let n=A>>this.log2dim,s=A&(1<<this.log2dim)-1;return t.set(e,n,s),t.x=t.x<<this.numVoxels,t.y=t.y<<this.numVoxels,t.z=t.z<<this.numVoxels,t}forEachValue(A=()=>{}){this.valueMask.forEachOn(t=>{A({wordIndex:t.wordIndex,bitIndex:t.bitIndex,offset:t.offset,coords:this.getValueCoords(t.offset)})})}readValues(){const{bufferIterator:A,compression:t,version:e}=KA.getContext(this),n=Ui.less(e,222),s=t.activeMask;if(this.isLeaf()){this.values=Array(this.valueMask.size).fill(0),this.valueMask.forEachOn(({offset:r})=>{this.values[r]=1});return}const o=n?this.childMask.countOff():this.numValues;let a=272;Ui.greaterEq(e,222)&&(a=A.readBytes(1)),this.background,[3,4,5].includes(a)&&(this.selectionMask=new wI(this),KA.passContext(this,this.selectionMask),this.selectionMask.readMask(this),KA.cleanContext(this.selectionMask));let g=o;s&&a!==6&&Ui.greaterEq(e,222)&&(g=this.valueMask.countOn()),this.readData(g),this.childMask.forEachOn(r=>{let I=r.offset;const B=new jA;let C=I>>2*this.log2dim;I&=(1<<2*this.log2dim)-1;let Q=I>>this.log2dim,c=I&(1<<this.log2dim)-1;B.set(C,Q,c);const l=new HB;KA.passContext(this,l),l.parent=this,l.readNode(this.depth+1,{id:r.offset,origin:B,indices:r,background:this.background}),B.x=B.x<<l.total,B.y=B.y<<l.total,B.z=B.z<<l.total,this.table[r.offset]=l,this.leavesCount+=l.leavesCount,this.firstChild||(this.firstChild=l),KA.cleanContext(l)})}readCompressedData(A){const{bufferIterator:t,valueType:e,useHalf:n}=KA.getContext(this),s=t.readBytes(8);if(s<=0){Array(-s).fill(0).forEach(()=>{this.values.push(t.readFloat(n?"half":e))});return}else{const o=t.readRawBytes(s);try{this.values.push(A.decode(o))}catch(a){console.warn("readZipData","uncompress","error",{error:a,zippedBytes:o})}}}readData(A){const{bufferIterator:t,valueType:e,useHalf:n,compression:s}=KA.getContext(this);s.blosc?this.readCompressedData(Pr.blosc):s.zip?this.readCompressedData(Pr.zlib):Array(A).fill(0).forEach(()=>{this.values.push(t.readFloat(n?"half":e))})}getLocalBbox(){if(this.localBboxCache)return this.localBboxCache;let A=new jA;const t=n=>{n&&n.origin&&A.add(n.origin),n.parent&&t(n.parent)};t(this);const e=[A,new jA(A.x+this.dim,A.y+this.dim,A.z+this.dim)];return this.localBboxCache=e,e}getFirstChild(){return this.firstChild}contains(A){const[t,e]=this.getLocalBbox();return A.x>=t.x&&A.x<=e.x&&A.y>=t.y&&A.y<=e.y&&A.z>=t.z&&A.z<=e.z}coordToOffset(A){return this.isLeaf()?(A.x&this.offsetMask)<<2*this.log2dim|(A.y&this.offsetMask)<<this.log2dim|A.z&this.offsetMask:(A.x&this.offsetMask)>>this.firstChild.total<<2*this.log2dim|(A.y&this.offsetMask)>>this.firstChild.total<<this.log2dim|(A.z&this.offsetMask)>>this.firstChild.total}getValue(A,t=null){if(!this.contains(A))return 0;if(t&&t.cache(this),this.isLeaf())return this.valueMask.isOn(this.coordToOffset(A))?1:0;const e=this.table[this.coordToOffset(A)];return e?e.getValue(A,t):0}getLeafAt(A,t=null){if(this.reads++,!this.contains(A))return this.readsMiss++,null;if(this.isLeaf())return this.readsOk++,this;t&&t.cache(this);const e=this.table[this.coordToOffset(A)];return e?(this.readsMiss++,e.getLeafAt(A,t)):(this.readsOk++,null)}}class TM{readNode(){const{bufferIterator:A,valueType:t}=KA.getContext(this);this.background=A.readFloat(t),this.numTiles=A.readBytes(Xt),this.numChildren=A.readBytes(Xt),this.table=[],this.origin=new jA,this.readChildren()}readChildren(){this.numTiles===0&&this.numChildren===0||(this.leavesCount=0,Array(this.numTiles).fill(0).forEach(()=>{this.readTile()}),Array(this.numChildren).fill(0).forEach(()=>{this.readInternalNode()}))}readTile(){const{bufferIterator:A,valueType:t}=KA.getContext(this),e=new jA(A.readFloat("int32"),A.readFloat("int32"),A.readFloat("int32")),n=A.readFloat(t),s=readBool();this.push({child:null,tile:{value:n,active:n?s:!1},origin:e,isChild:()=>!!child,isTile:()=>!!tile,isTileOff:()=>tile&&!tile.active,isTileOn:()=>tile&&tile.active})}readInternalNode(){const{bufferIterator:A}=KA.getContext(this),t=new jA(A.readFloat("int32"),A.readFloat("int32"),A.readFloat("int32")),e=new HB;KA.passContext(this,e),e.readNode(0,{id:this.table.length,origin:t,background:this.background}),this.table.push(e),this.leavesCount+=e.leavesCount,KA.cleanContext(e)}getLocalBbox(){return[new jA(0,0,0),new jA(0,0,0)]}isLeaf(){return!1}isRoot(){return!0}getValue(A,t=null){let e=0;for(let n=0;n<this.table.length;n++)e=Math.max(e,this.table[n].getValue(A,t)),e!==0&&(n=this.table.length);return e}getLeafAt(A,t=null){let e=null;for(let n=0;n<this.table.length;n++)e=this.table[n].getLeafAt(A,t),e!==null&&(n=this.table.length);return e}}class HM{constructor(A){cA(this,"stack",[]);cA(this,"grid",null);this.grid=A}getValue(A){return this.probeValues(A)}getLeafAt(A){return this.probeLeaves(A)}probeValues(A){if(this.stack.length){const t=this.stack.pop();if(t.contains(A))return t.getValue(A,this)}else return this.grid.root.getValue(A,this);return this.probeValues(A)}probeLeaves(A){if(this.stack.length){const t=this.stack.pop();if(t.contains(A))return t.getLeafAt(A,this)}else return this.grid.root.getLeafAt(A,this);return this.probeLeaves(A)}cache(A){this.stack.push(A)}}const Vr=class{constructor(){cA(this,"saveAsHalfFloat",!1);cA(this,"leavesCount",0);cA(this,"uniqueName");cA(this,"gridName");cA(this,"gridType");cA(this,"valueCache",{});cA(this,"accessor",new HM(this))}readGrid(){const{bufferIterator:A,version:t}=KA.getContext(this);this.readGridHeader(),ih("Grid buffer position",this.gridBufferPosition,A.offset),this.gridBufferPosition!==A.offset&&(A.offset=this.gridBufferPosition),this.readCompression(),this.readMetadata(),Ui.less(t,216)?(this.readTopology(),this.readGridTransform(),this.readBuffers()):(this.readGridTransform(),this.readTopology(),this.readBuffers()),A.offset=this.endBufferPosition}readGridHeader(){const{bufferIterator:A,version:t}=KA.getContext(this);this.uniqueName=A.readString(),this.gridName=this.uniqueName.split("")[0],this.gridType=A.readString(),this.gridType.indexOf(Vr.halfFloatGridPrefix)!==-1&&(this.saveAsHalfFloat=!0,this.gridType=this.gridType.split(Vr.halfFloatGridPrefix).join("")),Ui.greaterEq(t,216)&&(this.instanceParentName=A.readString()),this.gridBufferPosition=A.readFloat(vn),this.blockBufferPosition=A.readFloat(vn),this.endBufferPosition=A.readFloat(vn)}readCompression(){const{bufferIterator:A,version:t}=KA.getContext(this);if(Ui.greaterEq(t,222)){let e=A.readBytes(Xt);e={none:e&0,zip:e&1,activeMask:e&2,blosc:e&4},KA.getContext(this).compression=e}}readMetadata(){const{bufferIterator:A,version:t}=KA.getContext(this);this.metadata={count:A.readBytes(Xt)},Array(this.metadata.count).fill(0).forEach(()=>{const e=A.readString(),n=A.readString(),s=A.readString(n);this.metadata[e]={type:n,value:s}}),Ui.less(t,219)&&(this.metadata.name=this.gridName)}getGridValueType(){const A=Object.entries(this.metadata).find(([t])=>t==="value_type");return(A?A[1].value:void 0)||Ye}getGridClass(){const A=Object.entries(this.metadata).find(([t])=>t==="class");return(A?A[1].value:void 0)||"level set"}readGridTransform(){this.transform=new Bo,KA.passContext(this,this.transform),this.transform.readTransform(),KA.cleanContext(this.transform)}readTopology(){const{bufferIterator:A}=KA.getContext(this);KA.getContext(this).useHalf=this.saveAsHalfFloat,KA.getContext(this).valueType=this.getGridValueType(),A.readBytes(Xt)===1&&(this.root=new TM,KA.passContext(this,this.root),this.root.readNode(),this.leavesCount=this.root.leavesCount,KA.cleanContext(this.root),ih("Block buffer",this.blockBufferPosition,A.offset))}readBuffers(){}getWorldBbox(A){return(A||this).getLocalBbox().map(e=>e.clone()).map(this.transform.applyTransformMap)}getLocalBbox(){const A=1<<sl[0]+ol.reduce((t,e)=>t+e);return[this.metadata.file_bbox_min.value.subScalar(A-1),this.metadata.file_bbox_max.value.addScalar(A-1)]}getPreciseWorldBbox(){return[this.transform.applyTransformMap(this.metadata.file_bbox_min.value.clone()),this.transform.applyTransformMap(this.metadata.file_bbox_max.value.clone())]}getValue(A){const t=A.clone().round();return this.accessor.getValue(t)}getLeafAt(A){const t=A.clone().round();return this.accessor.getLeafAt(t)}};let jt=Vr;cA(jt,"halfFloatGridPrefix","_HalfFloat");class qM{constructor(){cA(this,"libraryVersion");cA(this,"hasGridOffsets");cA(this,"uuid");cA(this,"metadata");KA.tagContext(this,new KA)}async prepare(){await Pr.prepareModules(),KA.getContext(this).bufferIterator=new Vh(source)}async read(A){if(await Pr.prepareModules(),KA.getContext(this).bufferIterator=new Vh(A),this.validateVDBFile())this.readFileVersion(),this.readHeader(),this.readGrids();else throw"Not a VDB file."}validateVDBFile(){const{bufferIterator:A}=KA.getContext(this);return A.readBytes(Yr)===1447313952}readFileVersion(){const{bufferIterator:A}=KA.getContext(this),t=A.readBytes(Xt);KA.getContext(this).version=t,this.libraryVersion={minor:-1,major:-1},t>211?(this.libraryVersion.major=A.readBytes(Xt),this.libraryVersion.minor=A.readBytes(Xt)):(this.libraryVersion.major=0,this.libraryVersion.minor=0)}readHeader(){const{bufferIterator:A,version:t}=KA.getContext(this);this.hasGridOffsets=A.readBytes(Kr);let e;t>=220&&t<222?(e=A.readBytes(Kr),e={none:e&0,zip:e&1,activeMask:e&2,blosc:e&4}):e={none:!1,zip:!1,activeMask:!0,blosc:!1},KA.getContext(this).compression=e;let n="";Array(36).fill(0).map(a=>n+=String.fromCharCode(A.readBytes(1))),this.uuid=n;const s={},o=A.readBytes(Xt);Array(o).fill(0).forEach(()=>{const a=A.readString(),g=A.readString(),r=A.readString(g);s[a]={type:g,value:r}}),this.metadata=s}readGrids(){const{bufferIterator:A}=KA.getContext(this);let t={};if(this.grids=t,this.hasGridOffsets){const e=A.readBytes(Xt);Array(e).fill(0).forEach(()=>{const n=new jt(A);KA.passContext(this,n),n.readGrid(),KA.cleanContext(n),this.grids[n.uniqueName]=n})}}}const JM=i=>new Promise((A,t)=>{fetch(i).then(async e=>{const n=new Uint8Array(await e.arrayBuffer()),s=new qM;try{await s.read(n),A(s)}catch(o){console.error({error:o}),t("VDB could not be parsed.")}})});class KM extends uD{constructor(A){super(A)}load(A,t,e,n){JM(A).then(s=>{t(s)}).catch(s=>{n(s)})}}const al=Ti,YM=[16711680,65280,255];class PM extends Dc{constructor(t,{color:e,opacity:n}={}){super();cA(this,"processes",[]);let s;t instanceof Array?s=t:typeof t.grids<"u"?s=Object.values(t.grids):s=[t];const o=new Me,a=new al;Object.values(s).forEach((g,r)=>{const I=new QD(new GB(1,1,1),new eg({wireframe:!0,color:e||YM[r],transparent:!0,opacity:n}),g.leavesCount);let B=0;const C=Q=>{var c;Q.isLeaf()&&(a.set(...g.getWorldBbox(Q)),a.getCenter(o.position),a.getSize(o.scale),o.updateMatrix(),I.setMatrixAt(B++,o.matrix)),((c=Q.childMask)==null?void 0:c.countOn())>0&&Q.childMask.forEachOn(({offset:l})=>{C(Q.table[l])})};g.root.table.forEach(Q=>C(Q)),this.add(I)})}}const Co=(i={})=>["VolumeMaterial",i.lights,i.wrap3D,!!i.emissiveMap3D,!!i.baseColorMap3D,!!i.maskMap3D].join(","),lt={useAmbientLights:32,usePointLights:16,useDirectionalLights:8,useSpotLights:4,useHemisphereLights:2,useEnvironment:1},No=new Pt;let Ri,ko,ZI,zh=0,Hs,Xh=-1,Zh=null;class OM extends eg{constructor(t){super(t);cA(this,"name","MeshDistanceMaterial");cA(this,"customProgramCacheKey",()=>"MeshDistanceMaterial");cA(this,"_uniforms",{});this._uniforms=t._uniforms||{},this.onBeforeCompile=e=>{Object.entries(this._uniforms).forEach(([s,o])=>{e.uniforms[s]=o});const n=`
        #define DISTANCE

        varying mat4 mModelMatrix;
        varying mat4 mViewMatrix;
        varying mat4 mProjectionMatrix;
        varying mat4 mModelViewMatrix;
      `;e.vertexShader=e.vertexShader.replace("#include <common>",`
            ${n}

            out vec3 vPosition;

            #include <common>
          `).replace("#include <worldpos_vertex>",`
            #include <worldpos_vertex>

            vPosition = worldPosition.xyz;

            mModelMatrix = modelMatrix;
            mViewMatrix = viewMatrix;
            mProjectionMatrix = projectionMatrix;
            mModelViewMatrix = modelViewMatrix;
          `),e.fragmentShader=e.fragmentShader.replace("#include <common>",`
            precision highp float;

            in vec3 vPosition;

            uniform float cameraNear;
            uniform float cameraFar;

            ${n}

            #include <packing>
            #include <common>
          `).replace("#include <output_fragment>",`
            float dist = length(vPosition - cameraPosition);
            dist = (dist - cameraNear) / (cameraFar - cameraNear);
            dist = saturate(dist);
          
            gl_FragColor = packDepthToRGBA(dist);
          `).replace("#include <tonemapping_fragment>","").replace("#include <encodings_fragment>","").replace("#include <fog_fragment>","").replace("#include <premultiplied_alpha_fragment>","").replace("#include <dithering_fragment>","")}}}const WM=()=>(Ri||(Ri=new AD,Ri.texture.minFilter=eo,Ri.texture.magFilter=eo,Ri.texture.generateMipmaps=!1,Ri.depthTexture=new ED,ZI=Ri.texture,zh=1,ko=new OM({_uniforms:{cameraPosition:{value:new rA(0,0,0)},cameraNear:{value:1},cameraFar:{value:1}}}),Hs=new Zo(.1,1,1,1)),{depthScreenMap:{value:ZI},depthPacking:{value:zh},depthView:{value:Hs}}),jh=(i,A,t,e,n)=>{var a,g;if(!ZI)return;n._uniforms.cameraPosition.value.setFromMatrixPosition(t.matrixWorld),n._uniforms.cameraNear.value=t.near,n._uniforms.cameraFar.value=t.far;const s=((g=(a=i==null?void 0:i.info)==null?void 0:a.render)==null?void 0:g.frame)||0;if(s===Xh&&t===Zh)return;ko._uniforms.cameraPosition.value.setFromMatrixPosition(t.matrixWorld),ko._uniforms.cameraNear.value=t.near,ko._uniforms.cameraFar.value=t.far,i.getSize(No),Ri.setSize(No.x,No.y),Hs.x=t.near,Hs.y=t.far,Hs.z=No.x,Hs.w=No.y;const o=[];A.traverseVisible(r=>{(r instanceof la||r.isFogVolume)&&(r.visible=!1,o.push(r))}),A.overrideMaterial=ko,i.setRenderTarget(Ri),i.render(A,t),i.setRenderTarget(null),A.overrideMaterial=null,o.forEach(r=>{r.visible=!0}),Zh=t,Xh=s};class $h extends cD{constructor(t={}){super();cA(this,"name","VolumeBasicMaterial");cA(this,"isVolumetricFogMaterial",!0);cA(this,"customProgramCacheKey",()=>Co(this));cA(this,"_uniforms",{baseColor:{value:new ki(16777215)},scatterColor:{value:new ki(0)},densityMap3D:{value:null},emissiveMap3D:{value:null},baseColorMap3D:{value:null},maskMap3D:{value:null},steps:{value:100},absorbance:{value:1},roughness:{value:.5},densityScale:{value:1},densityCutoff:{value:0},resolution:{value:100},offset3D:{value:new rA(0,0,0)},wrap3D:{value:ni},lights:{value:lt.useDirectionalLights|lt.usePointLights|lt.useSpotLights|lt.useHemisphereLights|lt.useEnvironment},cameraPosition:{value:new rA(0,0,0)},cameraNear:{value:1},cameraFar:{value:1}});this.side=Qc,this.depthWrite=!1,this.depthTest=!1,this.transparent=!0,Object.keys(this._uniforms).forEach(e=>{typeof t[e]<"u"&&t[e]!==null&&(this[e]=t[e],t[e]instanceof Ve&&(t[e].offset3D=this._uniforms.offset3D.value))}),this.onBeforeCompile=(e,n)=>{const s=WM();Object.entries({...this._uniforms,...s}).forEach(([h,E])=>{e.uniforms[h]=E});const o=`
        #define VOLUME_BBOX_SPAN 0.5
        ${t.emissiveMap3D?"#define USE_EMISSIVE_GRID 1":""}
        ${t.baseColorMap3D?"#define USE_BASE_COLOR_GRID 1":""}
        ${t.maskMap3D?"#define USE_MASK_GRID 1":""}

        #define VOLUME_USE_ENVIRONMENT ${Number(this.useEnvironment)} != 0
        #define VOLUME_USE_HEMI_LIGHTS ${Number(this.useHemisphereLights)} != 0
        #define VOLUME_USE_POINT_LIGHTS ${Number(this.usePointLights)} != 0
        #define VOLUME_USE_DIR_LIGHTS ${Number(this.useDirectionalLights)} != 0
        #define VOLUME_USE_SPOT_LIGHTS ${Number(this.useSpotLights)} != 0
      `,a=`
         varying mat4 mModelMatrix;
         varying mat4 mViewMatrix;
         varying mat4 mProjectionMatrix;
         varying mat4 mModelViewMatrix;
         varying mat4 mInverseModelViewMatrix;
         varying mat3 mInverseNormalMatrix;
      `;e.vertexUvs=!0,e.vertexShader=e.vertexShader.replace("#include <common>",`
            ${a}

            out vec3 vOrigin;
            out vec3 vDirection;
            out vec3 vPosition;

            #include <common>
          `).replace("#include <worldpos_vertex>",`
            #include <worldpos_vertex>

            vOrigin = vec3(inverse(modelMatrix) * vec4(cameraPosition, 1.0)).xyz;
            vDirection = position - vOrigin;
            vPosition = position;

            mModelMatrix = modelMatrix;
            mViewMatrix = viewMatrix;
            mProjectionMatrix = projectionMatrix;
            mModelViewMatrix = modelViewMatrix;
            mInverseModelViewMatrix = inverse(modelViewMatrix);
            mInverseNormalMatrix = inverse(normalMatrix);
          `);const g=`
        float lightMarchLimit = resolution + 2.;
        int iLightMarchLimit = int(lightMarchLimit);

        vec3 vUnit = (mModelMatrix * vec4(1., 0., 0., 0.)).xyz;
        float vUnitLength = length(vUnit);
        
        geometry.position = vPoint;

        vec3 iblIrradiance = vec3(0.0);
      `,r=`
        PointLight pointLight;
        lightAlbedo = vec3(0.);
        
        for (int lightIndex = 0; lightIndex < NUM_POINT_LIGHTS; lightIndex++) {
          pointLight = pointLights[lightIndex];
          getPointLightInfo(pointLight, geometry, directLight);

          vLightProbe = vec3(vPoint);
          lightAbsorbance = 0.;
          stepAccumulation = 1.;

          lightDirection = vPoint - (mInverseModelViewMatrix * vec4(pointLight.position, 1.)).xyz;
          lightDistance = length(lightDirection) * vUnitLength;
          lightDirection = normalize(lightDirection);
          vLightStep = (lightDirection * VOLUME_BBOX_SPAN) / lightMarchLimit;

          for (int lightMarch = 0; lightMarch < iLightMarchLimit; lightMarch++) {
            vLightProbe -= vLightStep;
            stepAccumulation += 1.;

            #ifdef USE_MASK_GRID
              maskSample = clampedMaskTexture(maskMap3D, vLightProbe);
            #endif
            
            lightSample = clampedTexture(densityMap3D, vLightProbe) * sqrt(lightDistance);
            
            lightAbsorbance += blendSample(lightSample) * eInverseAbsorbance;

            if (lightAbsorbance >= 1.) {
              lightAbsorbance = 1.;
              break;
            }
          }

          lightAlbedo += (1. - lightAbsorbance) * pointLight.color;
        }

        lightAlbedo *= density;
        albedo += lightAlbedo * baseColor.rgb * RECIPROCAL_PI;
      `,I=`
        DirectionalLight directionalLight;
        lightAlbedo = vec3(0.);

        for (int lightIndex = 0; lightIndex < NUM_DIR_LIGHTS; lightIndex++) {
          directionalLight = directionalLights[lightIndex];
          getDirectionalLightInfo(directionalLight, geometry, directLight);

          vLightProbe = vec3(vPoint);
          lightAbsorbance = 0.0;
          stepAccumulation = 1.;

          lightDirection = -normalize((vec4(directionalLight.direction, 1.) * viewMatrix).xyz);
          vLightStep = (lightDirection * VOLUME_BBOX_SPAN) / lightMarchLimit;

          for (int lightMarch = 0; lightMarch < iLightMarchLimit; lightMarch++) {
            vLightProbe -= vLightStep;
            stepAccumulation += 1.;

            #ifdef USE_MASK_GRID
              maskSample = clampedMaskTexture(maskMap3D, vLightProbe);
            #endif
            
            float lightSample = clampedTexture(densityMap3D, vLightProbe);

            lightAbsorbance += blendSample(lightSample) * eInverseAbsorbance;

            if (lightAbsorbance >= 1.) {
              lightAbsorbance = 1.;
              break;
            }
          }

          lightAlbedo += (1. - lightAbsorbance) * directionalLight.color;
        }

        lightAlbedo *= density;
        albedo += lightAlbedo * baseColor.rgb * RECIPROCAL_PI;
      `,B=`
        SpotLight spotLight;
        lightAlbedo = vec3(0.);

        float angleCos;
        float spotAttenuation;
        
        for (int lightIndex = 0; lightIndex < NUM_SPOT_LIGHTS; lightIndex++) {
          spotLight = spotLights[lightIndex];
          getSpotLightInfo(spotLight, geometry, directLight);

          vLightProbe = vec3(vPoint);
          lightAbsorbance = 0.0;
          stepAccumulation = 1.;

          lightDirection = vPoint - (mInverseModelViewMatrix * vec4(spotLight.position, 1.)).xyz;
          lightDistance = length(lightDirection) * vUnitLength;
          lightDirection = normalize(lightDirection);
          vLightStep = (lightDirection * VOLUME_BBOX_SPAN) / lightMarchLimit;

          angleCos = dot(normalize(-lightDirection), normalize(mInverseNormalMatrix * spotLight.direction));
          spotAttenuation = smoothstep(spotLight.coneCos, spotLight.penumbraCos, angleCos);

          if (spotAttenuation > 0.) {
            for (int lightMarch = 0; lightMarch < iLightMarchLimit; lightMarch++) {
              vLightProbe -= vLightStep;
              stepAccumulation += 1.;

              #ifdef USE_MASK_GRID
                maskSample = clampedMaskTexture(maskMap3D, vLightProbe);
              #endif
              
              lightSample = clampedTexture(densityMap3D, vLightProbe);
              
              lightAbsorbance += blendSample(lightSample) * eInverseAbsorbance;

              if (lightAbsorbance >= 1.) {
                lightAbsorbance = 1.;
                break;
              }
            }

            lightAlbedo += (1. - lightAbsorbance) * spotAttenuation * spotLight.color;
          }
        }

        lightAlbedo *= density;
        albedo += lightAlbedo * baseColor.rgb * RECIPROCAL_PI;
      `,C=`
        lightAlbedo = vec3(0.);
        vec3 textureProbe;

        float absorbanceUp;
        float absorbanceDown;
        float stepAccumulationUp;
        float stepAccumulationDown;

        for (int lightIndex = 0; lightIndex < NUM_HEMI_LIGHTS; lightIndex++) {

          HemisphereLight hemiLight = hemisphereLights[lightIndex];
          vLightProbe = vec3(vPoint);

          absorbanceUp = 0.0;
          absorbanceDown = 0.0;

          stepAccumulationUp = 0.;
          stepAccumulationDown = 0.;

          lightDirection = -normalize((vec4(hemiLight.direction, 1.) * viewMatrix).xyz);
          vLightStep = (lightDirection * VOLUME_BBOX_SPAN) / lightMarchLimit;

          for (int lightMarch = 1; lightMarch < int(lightMarchLimit / 2.); lightMarch++) {
            if (absorbanceUp < 1.) {
              textureProbe = vLightProbe - float(lightMarch) * vLightStep;

              #ifdef USE_MASK_GRID
                maskSample = clampedMaskTexture(maskMap3D, textureProbe);
              #endif

              lightSample = clampedTexture(densityMap3D, textureProbe);

              absorbanceUp += lightSample * eInverseAbsorbance;
              stepAccumulationUp += 1.;
            }
            
            if (absorbanceDown < 1.) {
              textureProbe = vLightProbe + float(lightMarch) * vLightStep;

              #ifdef USE_MASK_GRID
                maskSample = clampedMaskTexture(maskMap3D, textureProbe);
              #endif

              lightSample = clampedTexture(densityMap3D, textureProbe);

              absorbanceDown += blendSample(lightSample) * eInverseAbsorbance;
              stepAccumulationDown += 1.;
            }
          }

          absorbanceUp = min(1., absorbanceUp);
          absorbanceDown = min(1., absorbanceDown);

          lightAlbedo += mix(
            (1. - absorbanceUp) * hemiLight.skyColor,
            (1. - absorbanceDown) * hemiLight.groundColor,
            0.5
          );
        }

        lightAlbedo *= density;
        albedo += lightAlbedo * baseColor.rgb * RECIPROCAL_PI;
      `,Q=`
        vec3 baseColorSample = baseColor.rgb;

        #ifdef USE_BASE_COLOR_GRID
          baseColorSample *= clampedTextureRGB(baseColorMap3D, vPoint);
        #endif

        albedo += ambientLightColor;
      `,c=`
        vec3 viewDir = isOrthographic ? vec3(0.0, 0.0, 1.0) : normalize(vViewPosition);
        vec3 vUVCoords = normalize(lastNonSolidPoint * mInverseNormalMatrix).xyz;

        #if defined( USE_ENVMAP )
          vEnvMapScatter = getIBLIrradiance(vUVCoords) * RECIPROCAL_PI;

          albedo += density * getIBLRadiance(viewDir, vUVCoords, roughness) * RECIPROCAL_PI;
        #endif
      `,l=`
        vec2 getVolumeBbox(vec3 vPointOfReference) {
          const vec3 vBoxMin = vec3(-0.5);
          const vec3 vBoxMax = vec3(0.5);
          vec3 vInvPointOfReference = 1.0 / vPointOfReference;
          
          vec3 vMinRange = (-vOrigin - VOLUME_BBOX_SPAN) * vInvPointOfReference;
          vec3 vMaxRange = (-vOrigin + VOLUME_BBOX_SPAN) * vInvPointOfReference;
          
          vec3 vMin = min(vMinRange, vMaxRange);
          vec3 vMax = max(vMinRange, vMaxRange);

          return vec2(
            max(vMin.x, max(vMin.y, vMin.z)),
            min(vMax.x, min(vMax.y, vMax.z))
          );
        }

        vec3 radiation = vec3(0.);
        vec3 getBlackBodyRadiation(float temperature) {
          if (temperature == 0.) {
            return vec3(0.);
          }

          #ifndef USE_EMISSIVE_GRID
            return vec3(0.);
          #endif

          // NOTE Blackbody radiation source - https://www.shadertoy.com/view/4tdGWM
          float temperatureScaled = temperature * 1000.;

          radiation.r += 1. / (exp(19E3 * 1. / temperatureScaled) - 1.);
          radiation.g += 3.375 / (exp(19E3 * 1.5 / temperatureScaled) - 1.);
          radiation.b += 8. / (exp(19E3 * 2. / temperatureScaled) - 1.);

          return (radiation / max(radiation.r,max(radiation.g,radiation.b)));
        }

        float loopUV(float x) {
          if (abs(mod(floor(x), 2.)) == 1.) {
            return ceil(x) - x;
          } else {
            return x - floor(x);
          }
        }

        vec3 mapTextureSample0(vec3 position){
          vec3 uv = position + VOLUME_BBOX_SPAN;

          ${this.wrap3D===vr?"return mod(uv, 1.);":""}
          ${this.wrap3D===0||this.wrap3D===ni?"// NOTE Return UV":""}
          ${this.wrap3D===kr?`
            uv.x = loopUV(uv.x);
            uv.y = loopUV(uv.y);
            uv.z = loopUV(uv.z);
          `:""}

          return uv;
        }

        vec3 mapTextureSample(vec3 position, vec3 offset){
          vec3 uv = position + VOLUME_BBOX_SPAN + offset;

          ${this.wrap3D===vr?"return mod(uv, 1.);":""}
          ${this.wrap3D===0||this.wrap3D===ni?"// NOTE Return UV":""}
          ${this.wrap3D===kr?`
            uv.x = loopUV(uv.x);
            uv.y = loopUV(uv.y);
            uv.z = loopUV(uv.z);
          `:""}

          return uv;
        }

        float blendSample(float value) {
          return value * densityScale;
 
          // float fSmoothingThreshold = 0.1;
          // float fSmoothingBlend = 0.1;

          // return smoothstep(
          //   fSmoothingThreshold - fSmoothingBlend,
          //   fSmoothingThreshold + fSmoothingBlend,
          //   value
          // ) * densityScale;
        }

        float clampedTexture(sampler3D source, vec3 position) {
          ${this.wrap3D===0||this.wrap3D===ni?`
            vec3 vAbs = abs(position);

            if (max(vAbs.x, max(vAbs.y, vAbs.z)) > .5) {
              return 0.;
            }
          `:""}

          return texture(source, mapTextureSample(position, offset3D)).r;
        }

        float clampedMaskTexture(sampler3D source, vec3 position) {
          ${this.wrap3D===0||this.wrap3D===ni?`
            vec3 vAbs = abs(position);

            if (max(vAbs.x, max(vAbs.y, vAbs.z)) > .5) {
              return 0.;
            }
          `:""}

          return texture(source, mapTextureSample0(position)).r;
        }

        vec3 clampedTextureRGB(sampler3D source, vec3 position) {
          return texture(source, mapTextureSample(position, offset3D)).rgb;
        }
      `;e.fragmentShader=e.fragmentShader.replace("#include <uv_pars_fragment>","// NOTE Override UV calculations").replace("#include <packing>","").replace("#include <common>",`
            precision highp float;
            precision highp sampler2D;
            precision highp sampler3D;

            in vec3 vOrigin;
            in vec3 vDirection;
            in vec3 vPosition;

            uniform sampler3D densityMap3D;
            uniform sampler3D emissiveMap3D;
            uniform sampler3D baseColorMap3D;
            uniform sampler3D maskMap3D;
            uniform vec3 offset3D;
            uniform int wrap3D;

            uniform float steps;
            uniform float absorbance;
            uniform float densityScale;
            uniform float densityCutoff;
            uniform vec3 baseColor;
            uniform vec3 scatterColor;
            uniform float resolution;

            uniform float cameraNear;
            uniform float cameraFar;
            uniform sampler2D depthScreenMap;
            uniform vec4 depthView;

            ${o}
            ${a}

            #include <common>
            #include <packing>
            #include <uv_pars_fragment>

            ${l}
          `).replace("#include <lights_fragment_begin>","// NOTE Override light calculations").replace("#include <lights_fragment_maps>","// NOTE Override light calculations").replace("#include <lights_fragment_end>","// NOTE Override light calculations").replace("#include <output_fragment>",`
            vec3 vWorld = -vViewPosition;

            vec3 vRayDirection = normalize(vDirection);
            vec2 vBounds = getVolumeBbox(vRayDirection);
            vec2 vMaxBounds = getVolumeBbox(vOrigin);
            
            if (vBounds.x > vBounds.y) {
              discard;
            }

            vBounds.x = max(vBounds.x, 0.0);
            vMaxBounds.x = max(vMaxBounds.x, 0.0);

            // Volume movement

            vec3 vPoint = vOrigin + vBounds.x * vRayDirection;
            vec3 vPointStep = 1.0 / abs(vRayDirection);
            float delta = min(vPointStep.x, min(vPointStep.y, vPointStep.z)) / steps;
            vec3 vDirectionDeltaStep = vRayDirection * delta;

            // Density calculations

            float density = 0.0;
            vec3 albedo = vec3(0.);
            vec3 emissive = vec3(0.);
            GeometricContext geometry;
            float volumeSample;
            float emissiveSample;
            float maskSample = 1.;
            float noiseSample;
            float noiseFactor;
            vec3 fTest;

            // Light calculations
            
            vec3 lightAlbedo = vec3(0.);
            vec3 vLightProbe;
            vec3 lightDirection;
            vec3 vLightStep;
            vec3 vEnvMapScatter = vec3(0.0);
            float lightSample;
            float lightAbsorbance;
            float lightDistance;
            float stepAccumulation;
            
            IncidentLight directLight;

            // Utils

            float absorbanceDensityRatio = min(absorbance, densityScale); // NOTE When reducing densityScale, automatically reduce absorbance
            float inverseAbsorbance = 1.0 / absorbanceDensityRatio;
            float inverseDensityScale = 1.0 / densityScale;
            float eInverseAbsorbance = exp(-1. - inverseAbsorbance); // NOTE Wrong, but looks kinda better than exp(-inverseAbsorbance)
            float eDensityAbsorbance = exp(-absorbanceDensityRatio * delta);
            float eInverseDensityScale = exp(-1. - inverseDensityScale);

            // Depth Testing

            vec2 screenUV = gl_FragCoord.xy / depthView.zw;
            float worldDepth = unpackRGBAToDepth(texture2D(depthScreenMap, screenUV));
            float fogDepth = 0.;
            vec3 vProjPoint;

            ${g}

            vec3 lastNonSolidPoint = vec3(vPoint);

            for (float i = vBounds.x; i < vBounds.y; i += delta) {
              volumeSample = clampedTexture(densityMap3D, vPoint);
              
              #ifdef USE_MASK_GRID
                maskSample = clampedMaskTexture(maskMap3D, vPoint);
              #endif

              density += blendSample(volumeSample) * eDensityAbsorbance * maskSample;

              #ifdef USE_EMISSIVE_GRID
                emissiveSample = clampedTexture(emissiveMap3D, vPoint);
                emissive = max(emissive, density * vec3(emissiveSample));
              #endif

              if (density < 1.) {
                lastNonSolidPoint = vPoint;
              }

              if (density >= 1.) {
                break;
              }

              vProjPoint = (mModelMatrix * vec4(vPoint, 1.0)).xyz;
              fogDepth = length(vProjPoint - cameraPosition);
              fogDepth = (fogDepth - cameraNear) / (cameraFar - cameraNear);
              fogDepth = saturate(fogDepth);
              
              if (worldDepth < fogDepth) {
                break;
              }

              vPoint += vDirectionDeltaStep;
            }

            density = clamp(density, 0.0, 1.0);

            vPoint = lastNonSolidPoint;

            if (density <= densityCutoff) {
              discard;
            }

            if (density > 0.) {

              ${Q}

              #if VOLUME_USE_ENVIRONMENT
                ${c}
              #endif

              #if NUM_HEMI_LIGHTS > 0 && VOLUME_USE_HEMI_LIGHTS
                ${C}
              #endif

              #if NUM_POINT_LIGHTS > 0 && VOLUME_USE_POINT_LIGHTS
                ${r}
              #endif

              #if NUM_DIR_LIGHTS > 0 && VOLUME_USE_DIR_LIGHTS
                ${I}
              #endif

              #if NUM_SPOT_LIGHTS > 0 && VOLUME_USE_SPOT_LIGHTS
                ${B}
              #endif

              albedo *= baseColorSample;
            }
 
            emissive = getBlackBodyRadiation(emissive.r);
            albedo += emissive;

            outgoingLight.rgb = max(max(scatterColor, vEnvMapScatter), albedo);
            diffuseColor.a = saturate(density) * opacity;

            #include <output_fragment>
          `)}}set baseColor(t){this._uniforms.baseColor.value.set(t)}get baseColor(){return this._uniforms.baseColor.value}set scatterColor(t){this._uniforms.scatterColor.value.set(t)}get scatterColor(){return this._uniforms.scatterColor.value}set densityMap3D(t){this._uniforms.densityMap3D.value=t,t.offset3D=this._uniforms.offset3D.value}get densityMap3D(){return this._uniforms.densityMap3D.value}set emissiveMap3D(t){this._uniforms.emissiveMap3D.value=t,t.offset3D=this._uniforms.offset3D.value,this.needsUpdate=!0}get emissiveMap3D(){return this._uniforms.emissiveMap3D.value}set maskMap3D(t){this._uniforms.maskMap3D.value=t,this.needsUpdate=!0}get maskMap3D(){return this._uniforms.maskMap3D.value}set baseColorMap3D(t){this._uniforms.baseColorMap3D.value=t,t.offset3D=this._uniforms.offset3D.value,this.needsUpdate=!0}get baseColorMap3D(){return this._uniforms.baseColorMap3D.value}set steps(t){this._uniforms.steps.value=t}get steps(){return this._uniforms.steps.value}set absorbance(t){this._uniforms.absorbance.value=t}get absorbance(){return this._uniforms.absorbance.value}set roughness(t){this._uniforms&&(this._uniforms.roughness.value=t)}get roughness(){return this._uniforms?this._uniforms.roughness.value:.5}set resolution(t){this._uniforms.resolution.value=t}get resolution(){return this._uniforms.resolution.value}set offset3D(t){this._uniforms.offset3D.value.copy(t)}get offset3D(){return this._uniforms.offset3D.value}set wrap3D(t){this._uniforms.wrap3D.value=t,this.needsUpdate=!0}get wrap3D(){return this._uniforms.wrap3D.value}set densityScale(t){this._uniforms.densityScale.value=t}get densityScale(){return this._uniforms.densityScale.value}set densityCutoff(t){this._uniforms.densityCutoff.value=t}get densityCutoff(){return this._uniforms.densityCutoff.value}set lights(t){this._uniforms.lights.value=t,this.needsUpdate=!0}get lights(){return this._uniforms.lights.value}set useDirectionalLights(t=!0){t?this._uniforms.lights.value|=lt.useDirectionalLights:this._uniforms.lights.value&=~lt.useDirectionalLights,this.needsUpdate=!0}get useDirectionalLights(){return(this._uniforms.lights.value&lt.useDirectionalLights)!==0}set usePointLights(t=!0){t?this._uniforms.lights.value|=lt.usePointLights:this._uniforms.lights.value&=~lt.usePointLights,this.needsUpdate=!0}get usePointLights(){return(this._uniforms.lights.value&lt.usePointLights)!==0}set useHemisphereLights(t=!0){t?this._uniforms.lights.value|=lt.useHemisphereLights:this._uniforms.lights.value&=~lt.useHemisphereLights,this.needsUpdate=!0}get useHemisphereLights(){return(this._uniforms.lights.value&lt.useHemisphereLights)!==0}set useSpotLights(t=!0){t?this._uniforms.lights.value|=lt.useSpotLights:this._uniforms.lights.value&=~lt.useSpotLights,this.needsUpdate=!0}get useSpotLights(){return(this._uniforms.lights.value&lt.useSpotLights)!==0}set useEnvironment(t=!0){t?this._uniforms.lights.value|=lt.useEnvironment:this._uniforms.lights.value&=~lt.useEnvironment,this.needsUpdate=!0}get useEnvironment(){return(this._uniforms.lights.value&lt.useEnvironment)!==0}}class la extends Dc{constructor(t,e,n,s){super();cA(this,"processes",[]);cA(this,"materials",[]);cA(this,"isFogVolume",!0);const{resolution:o,progressive:a,emissiveGrid:g,baseColorGrid:r,maskGrid:I,radius:B}=e;this.frustumCulled=!1;let C;t instanceof Array?C=t:typeof t.grids<"u"?C=Object.values(t.grids):C=[t];let Q,c,l,h,E,f;if(g){if(C=C.filter(p=>p!==g),g instanceof Uint8Array)Q=new Pi(g,o,o,o);else{const p=new Uint8Array(Math.pow(o,3));Q=new Pi(p,o,o,o),c=(R,D,S)=>p[R]=typeof S<"u"?S:g.getValue(D)*255}Q.format=Oa,Q.minFilter=fe,Q.magFilter=fe,Q.unpackAlignment=1,Q.needsUpdate=!0}if(r){if(r instanceof Uint8Array)l=new Pi(r,o,o,o);else{const p=new Uint8Array(Math.pow(o,3)*4);l=new Pi(p,o,o,o);const R=new ki;h=(D,S,F)=>{if(F){p[D*4+0]=F.r*255,p[D*4+1]=F.g*255,p[D*4+2]=F.b*255,p[D*4+3]=255;return}const G=r.getValue(S);return G instanceof ki?R.set(gridValue):G instanceof rA?R.setRGB(G.x,G.y,G.z):R.setRGB(1,0,1),p[D*4+0]=R.r*255,p[D*4+1]=R.g*255,p[D*4+2]=R.b*255,p[D*4+3]=255,{r:R.r,g:R.g,b:R.b,a:R.a}}}l.format=lc,l.minFilter=fe,l.magFilter=fe,l.unpackAlignment=1,l.needsUpdate=!0}if(I){if(I instanceof Uint8Array)E=new Pi(I,o,o,o);else{const p=new Uint8Array(Math.pow(o,3));E=new Pi(p,o,o,o),f=(R,D,S)=>p[R]=typeof S<"u"?S:I.getValue(D)*255}E.format=Oa,E.minFilter=fe,E.magFilter=fe,E.unpackAlignment=1,E.needsUpdate=!0}let d=0,u=0;const m=C.length,y=m*Math.pow(o,3);C.reverse().forEach(async(p,R)=>{if(p instanceof Uint8Array){const K=new Pi(p,o,o,o);K.format=Oa,K.minFilter=fe,K.magFilter=fe,K.unpackAlignment=1,K.needsUpdate=!0;const tA=new Tr(1),nA=new $h({...e,emissiveMap3D:Q,densityMap3D:K,baseColorMap3D:l,maskMap3D:E}),Z=new jo(tA,nA);Z.frustumCulled=!1,Z.onBeforeRender=jh,this.materials.push(nA),this.add(Z);return}if(!(p instanceof jt))return;const D=new Uint8Array(Math.pow(o,3)),S=new Pi(D,o,o,o);S.format=Oa,S.minFilter=fe,S.magFilter=fe,S.unpackAlignment=1,S.needsUpdate=!0;const F=new Tr(1),G=new $h({...e,emissiveMap3D:Q,densityMap3D:S,baseColorMap3D:l,maskMap3D:E}),L=new jo(F,G);L.frustumCulled=!1,L.onBeforeRender=jh,this.materials.push(G);const T=o,b=Math.pow(T,2),V=K=>new Promise(tA=>{const nA=1/K,Z=Math.pow(K,2),CA=Math.pow(K,3),q=new jA(0,0,0),eA=new jA(0,0,0),oA=new jA(0,0,0),aA=new al;aA.set(...p.getPreciseWorldBbox()),aA.getCenter(L.position),aA.getSize(L.scale),aA.getCenter(q),aA.getSize(eA),oA.copy(eA).multiplyScalar(nA),p.transform.applyInverseTransformMap(oA),q.sub(eA.clone().multiplyScalar(.5)),p.transform.applyInverseTransformMap(q),q.add(oA.clone().multiplyScalar(.5));let QA=0,wA=0,NA=0;function*xA(){for(let $=0;$<CA;$++){const JA=QA,MA=wA,FA=NA,SA=JA+MA*K+FA*Z,qA=p.getValue(q),bA=c&&c(SA,q),LA=h&&h(SA,q),PA=f&&f(SA,q),YA=B;if(YA)for(let $A=-YA;$A<YA;$A++)for(let N=-YA;N<YA;N++)for(let M=-YA;M<YA;M++){if(QA+$A<0||QA+$A>=K||wA+N<0||wA+N>=K||NA+M<0||NA+M>=K)continue;const k=SA+$A+N*T+M*b,X=Math.max(0,Math.min(1,1-Math.hypot($A,N,M)/(B/2))),j=X*qA*255;D[k]+=j,D[k]=Math.min(D[k],255),c&&c(k,null,bA*X*255),h&&h(k,null,LA*X),f&&f(k,null,PA*X*255)}else{const $A=qA*255;D[SA]+=$A,D[SA]=Math.min(D[SA],255)}if(u++,a&&(S.needsUpdate=!0,Q&&(Q.needsUpdate=!0),l&&(l.needsUpdate=!0),E&&(E.needsUpdate=!0)),NA>=K){Q.needsUpdate=!0,l.needsUpdate=!0,E.needsUpdate=!0;break}QA++,q.x+=oA.x,QA>=K&&(QA=0,q.x-=oA.x*K,wA++,q.y+=oA.y),wA>=K&&(wA=0,q.y-=oA.y*K,NA++,q.z+=oA.z),yield}}let it=xA();const _A=()=>{let $=window.performance.now();for(;window.performance.now()-$<16&&it;){const{done:JA}=it.next();s&&s({convertedVoxels:u,totalVoxels:y,convertedGrids:d,totalGrids:m}),JA&&(d++,it=null,delete this.processes[R],tA(),d===m&&(a||this.add(L),n&&n()))}it&&this.processes&&(this.processes[R]=setTimeout(_A,0))};_A()});a&&this.add(L),await V(o)})}dispose(){!this.processes||(this.processes.forEach((t,e)=>{cancelAnimationFrame(t),delete this.processes[e]}),this.processes=null)}}class ue{constructor(A,t,e){this.x=A,this.y=t,this.z=e}dot2(A,t){return this.x*A+this.y*t}dot3(A,t,e){return this.x*A+this.y*t+this.z*e}}const VM=[new ue(1,1,0),new ue(-1,1,0),new ue(1,-1,0),new ue(-1,-1,0),new ue(1,0,1),new ue(-1,0,1),new ue(1,0,-1),new ue(-1,0,-1),new ue(0,1,1),new ue(0,-1,1),new ue(0,1,-1),new ue(0,-1,-1)],AQ=[151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180],Gt=new Array(512),Ai=new Array(512);(i=>{i>0&&i<1&&(i*=65536),i=Math.floor(i),i<256&&(i|=i<<8);for(let A=0;A<256;A++){let t;A&1?t=AQ[A]^i&255:t=AQ[A]^i>>8&255,Gt[A]=Gt[A+256]=t,Ai[A]=Ai[A+256]=VM[t%12]}})(0);const MI=i=>i*i*i*(i*(i*6-15)+10),Sn=(i,A,t)=>(1-t)*i+t*A,tQ=(i,A,t)=>{var e=Math.floor(i),n=Math.floor(A),s=Math.floor(t);i=i-e,A=A-n,t=t-s,e=e&255,n=n&255,s=s&255;var o=Ai[e+Gt[n+Gt[s]]].dot3(i,A,t),a=Ai[e+Gt[n+Gt[s+1]]].dot3(i,A,t-1),g=Ai[e+Gt[n+1+Gt[s]]].dot3(i,A-1,t),r=Ai[e+Gt[n+1+Gt[s+1]]].dot3(i,A-1,t-1),I=Ai[e+1+Gt[n+Gt[s]]].dot3(i-1,A,t),B=Ai[e+1+Gt[n+Gt[s+1]]].dot3(i-1,A,t-1),C=Ai[e+1+Gt[n+1+Gt[s]]].dot3(i-1,A-1,t),Q=Ai[e+1+Gt[n+1+Gt[s+1]]].dot3(i-1,A-1,t-1),c=MI(i),l=MI(A),h=MI(t);return Sn(Sn(Sn(o,I,c),Sn(a,B,c),h),Sn(Sn(g,C,c),Sn(r,Q,c),h),l)};class Ce{constructor(A=3e3){this._seedValue=A,this.setSeed=this.setSeed.bind(this),this.noise=this.noise.bind(this),this.Euclidean=this.Euclidean.bind(this),this.Manhattan=this.Manhattan.bind(this)}static xorshift(A){let t=A^A>>12;return t=t^t<<25,t=t^t>>27,t*2}static hash(A,t,e){return(((2166136261^A)*16777619^t)*16777619^e)*16777619&4294967295}static d(A,t){return[A.x-t.x,A.y-t.y,A.z-t.z]}static EuclideanDistance(A,t){return Ce.d(A,t).reduce((e,n)=>e+n*n,0)}static ManhattanDistance(A,t){return Ce.d(A,t).reduce((e,n)=>e+Math.abs(n),0)}static probLookup(A){return A=A&4294967295,A<393325350?1:A<1022645910?2:A<1861739990?3:A<2700834071?4:A<3372109335?5:A<3819626178?6:A<4075350088?7:A<4203212043?8:9}static insert(A,t){let e;for(let n=A.length-1;n>=0&&!(t>A[n]);n--)e=A[n],A[n]=t,n+1<A.length&&(A[n+1]=e)}noise(A,t){let e,n,s={x:0,y:0,z:0},o={x:0,y:0,z:0},a,g,r,I=[9999999,9999999,9999999];for(let B=-1;B<2;++B)for(let C=-1;C<2;++C)for(let Q=-1;Q<2;++Q){a=Math.floor(A.x)+B,g=Math.floor(A.y)+C,r=Math.floor(A.z)+Q,e=Ce.xorshift(Ce.hash(a+this._seedValue&4294967295,g&4294967295,r&4294967295)),n=Ce.probLookup(e);for(let c=0;c<n;++c)e=Ce.xorshift(e),s.X=e/4294967296,e=Ce.xorshift(e),s.Y=e/4294967296,e=Ce.xorshift(e),s.Z=e/4294967296,o={x:s.X+a,y:s.Y+g,z:s.Z+r},Ce.insert(I,t(A,o))}return I.map(B=>B<0?0:B>1?1:B)}setSeed(A=3e3){this._seedValue=A}Euclidean(A,t,e){return this.noise({x:A,y:t,z:e},Ce.EuclideanDistance)[0]}Manhattan(A,t,e){return this.noise({x:A,y:t,z:e},Ce.ManhattanDistance)[0]}}const zM=new Ce,RI=zM.Euclidean;class rl extends jt{constructor({height:t,density:e}={}){super();cA(this,"saveAsHalfFloat",!1);cA(this,"leavesCount",0);cA(this,"uniqueName");cA(this,"gridName");cA(this,"gridType");cA(this,"height",1);cA(this,"density",.01);this.height=t||1,this.density=e||.01,this.readGrid()}readGrid(){this.readGridHeader(),this.readGridTransform()}readGridHeader(){this.uniqueName=`CloudVolume#${Co()}`,this.gridName=this.uniqueName.split("#")[0],this.gridType="fog volume"}readCompression(){}readMetadata(){}getGridValueType(){return Ye}getGridClass(){return"fog volume"}readGridTransform(){this.transform=new Bo}readTopology(){}getWorldBbox(){return this.getLocalBbox()}getLocalBbox(){return[new jA(-.5,-.5,-.5),new jA(.5,.5,.5)]}getPreciseWorldBbox(){return this.getWorldBbox()}getValue(t){const e=new jA(t.x+.5,t.y+.5,t.z+.5),n=(s,o)=>{const a=e.x*s%s,g=e.y*s%s,r=e.z*s%s,I=Math.abs(a-.5),B=Math.abs(g-.5),C=Math.abs(r-.5);return o(I,B,C)};if(e.y<this.height){const s=this.height-e.y;return n(20,RI)+n(100,RI)*.25+n(10,tQ)<this.density?(.5+n(100,tQ)+n(100,RI))*s:0}return 0}getLeafAt(t){return null}}cA(rl,"halfFloatGridPrefix",jt.halfFloatGridPrefix);class XM extends jt{constructor(){super();cA(this,"saveAsHalfFloat",!1);cA(this,"leavesCount",0);cA(this,"uniqueName");cA(this,"gridName");cA(this,"gridType");this.readGrid()}readGrid(){this.readGridHeader(),this.readGridTransform()}readGridHeader(){this.uniqueName=`CubeVolume#${Co()}`,this.gridName=this.uniqueName.split("#")[0],this.gridType="fog volume"}readCompression(){}readMetadata(){}getGridValueType(){return Ye}getGridClass(){return"fog volume"}readGridTransform(){this.transform=new Bo}readTopology(){}getWorldBbox(){return this.getLocalBbox()}getLocalBbox(){return[new jA(-.5,-.5,-.5),new jA(.5,.5,.5)]}getPreciseWorldBbox(){return this.getWorldBbox()}getValue(t){return 1}getLeafAt(t){return null}}cA(XM,"halfFloatGridPrefix",jt.halfFloatGridPrefix);class ZM extends jt{constructor(){super();cA(this,"saveAsHalfFloat",!1);cA(this,"leavesCount",0);cA(this,"uniqueName");cA(this,"gridName");cA(this,"gridType");this.readGrid()}readGrid(){this.readGridHeader(),this.readGridTransform()}readGridHeader(){this.uniqueName=`SphereVolume#${Co()}`,this.gridName=this.uniqueName.split("#")[0],this.gridType="fog volume"}readCompression(){}readMetadata(){}getGridValueType(){return Ye}getGridClass(){return"fog volume"}readGridTransform(){this.transform=new Bo}readTopology(){}getWorldBbox(){return this.getLocalBbox()}getLocalBbox(){return[new jA(-.5,-.5,-.5),new jA(.5,.5,.5)]}getPreciseWorldBbox(){return this.getWorldBbox()}getValue(t){return t.length()<=.5?1:0}getLeafAt(t){return null}}cA(ZM,"halfFloatGridPrefix",jt.halfFloatGridPrefix);class jM extends jt{constructor(t){super();cA(this,"saveAsHalfFloat",!1);cA(this,"leavesCount",0);cA(this,"uniqueName");cA(this,"gridName");cA(this,"gridType");cA(this,"valueFunction");this.readGrid(),this.valueFunction=t}readGrid(){this.readGridHeader(),this.readGridTransform()}readGridHeader(){this.uniqueName=`ParametricVolume#${Co()}`,this.gridName=this.uniqueName.split("#")[0],this.gridType="fog volume"}readCompression(){}readMetadata(){}getGridValueType(){return Ye}getGridClass(){return"fog volume"}readGridTransform(){this.transform=new Bo}readTopology(){}getWorldBbox(){return this.getLocalBbox()}getLocalBbox(){return[new jA(-.5,-.5,-.5),new jA(.5,.5,.5)]}getPreciseWorldBbox(){return this.getWorldBbox()}getValue(t){return this.valueFunction(t)}getLeafAt(t){return null}}cA(jM,"halfFloatGridPrefix",jt.halfFloatGridPrefix);function $M(i,A=!1){const t=i[0].index!==null,e=new Set(Object.keys(i[0].attributes)),n=new Set(Object.keys(i[0].morphAttributes)),s={},o={},a=i[0].morphTargetsRelative,g=new ro;let r=0;for(let I=0;I<i.length;++I){const B=i[I];let C=0;if(t!==(B.index!==null))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+I+". All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them."),null;for(const Q in B.attributes){if(!e.has(Q))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+I+'. All geometries must have compatible attributes; make sure "'+Q+'" attribute exists among all geometries, or in none of them.'),null;s[Q]===void 0&&(s[Q]=[]),s[Q].push(B.attributes[Q]),C++}if(C!==e.size)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+I+". Make sure all geometries have the same number of attributes."),null;if(a!==B.morphTargetsRelative)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+I+". .morphTargetsRelative must be consistent throughout all geometries."),null;for(const Q in B.morphAttributes){if(!n.has(Q))return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+I+".  .morphAttributes must be consistent throughout all geometries."),null;o[Q]===void 0&&(o[Q]=[]),o[Q].push(B.morphAttributes[Q])}if(A){let Q;if(t)Q=B.index.count;else if(B.attributes.position!==void 0)Q=B.attributes.position.count;else return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed with geometry at index "+I+". The geometry must have either an index or a position attribute"),null;g.addGroup(r,Q,I),r+=Q}}if(t){let I=0;const B=[];for(let C=0;C<i.length;++C){const Q=i[C].index;for(let c=0;c<Q.count;++c)B.push(Q.getX(c)+I);I+=i[C].attributes.position.count}g.setIndex(B)}for(const I in s){const B=eQ(s[I]);if(!B)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+I+" attribute."),null;g.setAttribute(I,B)}for(const I in o){const B=o[I][0].length;if(B===0)break;g.morphAttributes=g.morphAttributes||{},g.morphAttributes[I]=[];for(let C=0;C<B;++C){const Q=[];for(let l=0;l<o[I].length;++l)Q.push(o[I][l][C]);const c=eQ(Q);if(!c)return console.error("THREE.BufferGeometryUtils: .mergeGeometries() failed while trying to merge the "+I+" morphAttribute."),null;g.morphAttributes[I].push(c)}}return g}function eQ(i){let A,t,e,n=-1,s=0;for(let r=0;r<i.length;++r){const I=i[r];if(I.isInterleavedBufferAttribute)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. InterleavedBufferAttributes are not supported."),null;if(A===void 0&&(A=I.array.constructor),A!==I.array.constructor)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes."),null;if(t===void 0&&(t=I.itemSize),t!==I.itemSize)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes."),null;if(e===void 0&&(e=I.normalized),e!==I.normalized)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes."),null;if(n===-1&&(n=I.gpuType),n!==I.gpuType)return console.error("THREE.BufferGeometryUtils: .mergeAttributes() failed. BufferAttribute.gpuType must be consistent across matching attributes."),null;s+=I.array.length}const o=new A(s);let a=0;for(let r=0;r<i.length;++r)o.set(i[r].array,a),a+=i[r].array.length;const g=new Se(o,t,e);return n!==void 0&&(g.gpuType=n),g}function AR(i,A=1e-4){A=Math.max(A,Number.EPSILON);const t={},e=i.getIndex(),n=i.getAttribute("position"),s=e?e.count:n.count;let o=0;const a=Object.keys(i.attributes),g={},r={},I=[],B=["getX","getY","getZ","getW"],C=["setX","setY","setZ","setW"];for(let h=0,E=a.length;h<E;h++){const f=a[h],d=i.attributes[f];g[f]=new Se(new d.array.constructor(d.count*d.itemSize),d.itemSize,d.normalized);const u=i.morphAttributes[f];u&&(r[f]=new Se(new u.array.constructor(u.count*u.itemSize),u.itemSize,u.normalized))}const Q=Math.log10(1/A),c=Math.pow(10,Q);for(let h=0;h<s;h++){const E=e?e.getX(h):h;let f="";for(let d=0,u=a.length;d<u;d++){const m=a[d],y=i.getAttribute(m),p=y.itemSize;for(let R=0;R<p;R++)f+=`${~~(y[B[R]](E)*c)},`}if(f in t)I.push(t[f]);else{for(let d=0,u=a.length;d<u;d++){const m=a[d],y=i.getAttribute(m),p=i.morphAttributes[m],R=y.itemSize,D=g[m],S=r[m];for(let F=0;F<R;F++){const G=B[F],L=C[F];if(D[L](o,y[G](E)),p)for(let T=0,b=p.length;T<b;T++)S[T][L](o,p[T][G](E))}}t[f]=o,I.push(o),o++}}const l=i.clone();for(const h in i.attributes){const E=g[h];if(l.setAttribute(h,new Se(E.array.slice(0,o*E.itemSize),E.itemSize,E.normalized)),h in r)for(let f=0;f<r[h].length;f++){const d=r[h][f];l.morphAttributes[h][f]=new Se(d.array.slice(0,o*d.itemSize),d.itemSize,d.normalized)}}return l.setIndex(I),l}function tR(i,A=!1){return console.warn("THREE.BufferGeometryUtils: mergeBufferGeometries() has been renamed to mergeGeometries()."),$M(i,A)}class gl extends jt{constructor(t){super();cA(this,"saveAsHalfFloat",!1);cA(this,"leavesCount",0);cA(this,"uniqueName");cA(this,"gridName");cA(this,"gridType");cA(this,"mesh",new Me);cA(this,"bbox",null);cA(this,"center",null);cA(this,"size",null);cA(this,"target",new rA(0,0,0));cA(this,"raycaster",new fD);cA(this,"rayDirection",new rA(1,0,0));this.readGrid();const e=t.clone(),n=[],s=new rA,o=new ao;e.position.setScalar(0,0,0),e.scale.setScalar(1),e.quaternion.identity(),e.updateMatrix(),e.updateMatrixWorld(),e.updateWorldMatrix(),e.traverse(g=>{if(g.geometry){const r=g.geometry.clone();g.getWorldQuaternion(o),r.applyQuaternion(o),g.getWorldScale(s),r.scale(s.x,s.y,s.z),g.getWorldPosition(s),r.translate(s.x,s.y,s.z),r.attributes={position:r.attributes.position,normal:r.attributes.normal},n.push(r)}});const a=AR(tR(n,!1));this.mesh=new jo(a,new eg({side:Fy})),this.cacheMeshGeometry()}readGrid(){this.readGridHeader(),this.readGridTransform()}readGridHeader(){this.uniqueName=`MeshVolume#${Co()}`,this.gridName=this.uniqueName.split("#")[0],this.gridType="fog volume"}readCompression(){}readMetadata(){}getGridValueType(){return Ye}getGridClass(){return"fog volume"}readGridTransform(){this.transform=new Bo}readTopology(){}getWorldBbox(){return this.getLocalBbox()}getLocalBbox(){return[new jA(-.5,-.5,-.5),new jA(.5,.5,.5)]}getPreciseWorldBbox(){return this.getWorldBbox()}cacheMeshGeometry(){this.bbox=new Ti,this.bbox.expandByObject(this.mesh),this.center=new rA,this.size=new rA,this.bbox.getCenter(this.center),this.bbox.getSize(this.size);const t=Math.max(this.size.x,this.size.y,this.size.z),e=new rA().copy(this.size).divideScalar(t);this.size.divide(e),this.size.addScalar(.1),this.raycaster.near=0,this.raycaster.far=1e3}getValue(t){this.target.copy(t).multiply(this.size).add(this.center),this.rayDirection.copy(t).normalize(),this.raycaster.set(this.target,this.rayDirection);const e=this.raycaster.intersectObjects([this.mesh],!0);return e.length===0||e.length%2===0?0:1}getLeafAt(t){return null}}cA(gl,"halfFloatGridPrefix",jt.halfFloatGridPrefix);/**
 * lil-gui
 * https://lil-gui.georgealways.com
 * @version 0.18.1
 * @author George Michael Brower
 * @license MIT
 */class ai{constructor(A,t,e,n,s="div"){this.parent=A,this.object=t,this.property=e,this._disabled=!1,this._hidden=!1,this.initialValue=this.getValue(),this.domElement=document.createElement("div"),this.domElement.classList.add("controller"),this.domElement.classList.add(n),this.$name=document.createElement("div"),this.$name.classList.add("name"),ai.nextNameID=ai.nextNameID||0,this.$name.id=`lil-gui-name-${++ai.nextNameID}`,this.$widget=document.createElement(s),this.$widget.classList.add("widget"),this.$disable=this.$widget,this.domElement.appendChild(this.$name),this.domElement.appendChild(this.$widget),this.parent.children.push(this),this.parent.controllers.push(this),this.parent.$children.appendChild(this.domElement),this._listenCallback=this._listenCallback.bind(this),this.name(e)}name(A){return this._name=A,this.$name.innerHTML=A,this}onChange(A){return this._onChange=A,this}_callOnChange(){this.parent._callOnChange(this),this._onChange!==void 0&&this._onChange.call(this,this.getValue()),this._changed=!0}onFinishChange(A){return this._onFinishChange=A,this}_callOnFinishChange(){this._changed&&(this.parent._callOnFinishChange(this),this._onFinishChange!==void 0&&this._onFinishChange.call(this,this.getValue())),this._changed=!1}reset(){return this.setValue(this.initialValue),this._callOnFinishChange(),this}enable(A=!0){return this.disable(!A)}disable(A=!0){return A===this._disabled?this:(this._disabled=A,this.domElement.classList.toggle("disabled",A),this.$disable.toggleAttribute("disabled",A),this)}show(A=!0){return this._hidden=!A,this.domElement.style.display=this._hidden?"none":"",this}hide(){return this.show(!1)}options(A){const t=this.parent.add(this.object,this.property,A);return t.name(this._name),this.destroy(),t}min(A){return this}max(A){return this}step(A){return this}decimals(A){return this}listen(A=!0){return this._listening=A,this._listenCallbackID!==void 0&&(cancelAnimationFrame(this._listenCallbackID),this._listenCallbackID=void 0),this._listening&&this._listenCallback(),this}_listenCallback(){this._listenCallbackID=requestAnimationFrame(this._listenCallback);const A=this.save();A!==this._listenPrevValue&&this.updateDisplay(),this._listenPrevValue=A}getValue(){return this.object[this.property]}setValue(A){return this.object[this.property]=A,this._callOnChange(),this.updateDisplay(),this}updateDisplay(){return this}load(A){return this.setValue(A),this._callOnFinishChange(),this}save(){return this.getValue()}destroy(){this.listen(!1),this.parent.children.splice(this.parent.children.indexOf(this),1),this.parent.controllers.splice(this.parent.controllers.indexOf(this),1),this.parent.$children.removeChild(this.domElement)}}class eR extends ai{constructor(A,t,e){super(A,t,e,"boolean","label"),this.$input=document.createElement("input"),this.$input.setAttribute("type","checkbox"),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$widget.appendChild(this.$input),this.$input.addEventListener("change",()=>{this.setValue(this.$input.checked),this._callOnFinishChange()}),this.$disable=this.$input,this.updateDisplay()}updateDisplay(){return this.$input.checked=this.getValue(),this}}function jI(i){let A,t;return(A=i.match(/(#|0x)?([a-f0-9]{6})/i))?t=A[2]:(A=i.match(/rgb\(\s*(\d*)\s*,\s*(\d*)\s*,\s*(\d*)\s*\)/))?t=parseInt(A[1]).toString(16).padStart(2,0)+parseInt(A[2]).toString(16).padStart(2,0)+parseInt(A[3]).toString(16).padStart(2,0):(A=i.match(/^#?([a-f0-9])([a-f0-9])([a-f0-9])$/i))&&(t=A[1]+A[1]+A[2]+A[2]+A[3]+A[3]),t?"#"+t:!1}const iR={isPrimitive:!0,match:i=>typeof i=="string",fromHexString:jI,toHexString:jI},aa={isPrimitive:!0,match:i=>typeof i=="number",fromHexString:i=>parseInt(i.substring(1),16),toHexString:i=>"#"+i.toString(16).padStart(6,0)},nR={isPrimitive:!1,match:i=>Array.isArray(i),fromHexString(i,A,t=1){const e=aa.fromHexString(i);A[0]=(e>>16&255)/255*t,A[1]=(e>>8&255)/255*t,A[2]=(e&255)/255*t},toHexString([i,A,t],e=1){e=255/e;const n=i*e<<16^A*e<<8^t*e<<0;return aa.toHexString(n)}},sR={isPrimitive:!1,match:i=>Object(i)===i,fromHexString(i,A,t=1){const e=aa.fromHexString(i);A.r=(e>>16&255)/255*t,A.g=(e>>8&255)/255*t,A.b=(e&255)/255*t},toHexString({r:i,g:A,b:t},e=1){e=255/e;const n=i*e<<16^A*e<<8^t*e<<0;return aa.toHexString(n)}},oR=[iR,aa,nR,sR];function aR(i){return oR.find(A=>A.match(i))}class rR extends ai{constructor(A,t,e,n){super(A,t,e,"color"),this.$input=document.createElement("input"),this.$input.setAttribute("type","color"),this.$input.setAttribute("tabindex",-1),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$text=document.createElement("input"),this.$text.setAttribute("type","text"),this.$text.setAttribute("spellcheck","false"),this.$text.setAttribute("aria-labelledby",this.$name.id),this.$display=document.createElement("div"),this.$display.classList.add("display"),this.$display.appendChild(this.$input),this.$widget.appendChild(this.$display),this.$widget.appendChild(this.$text),this._format=aR(this.initialValue),this._rgbScale=n,this._initialValueHexString=this.save(),this._textFocused=!1,this.$input.addEventListener("input",()=>{this._setValueFromHexString(this.$input.value)}),this.$input.addEventListener("blur",()=>{this._callOnFinishChange()}),this.$text.addEventListener("input",()=>{const s=jI(this.$text.value);s&&this._setValueFromHexString(s)}),this.$text.addEventListener("focus",()=>{this._textFocused=!0,this.$text.select()}),this.$text.addEventListener("blur",()=>{this._textFocused=!1,this.updateDisplay(),this._callOnFinishChange()}),this.$disable=this.$text,this.updateDisplay()}reset(){return this._setValueFromHexString(this._initialValueHexString),this}_setValueFromHexString(A){if(this._format.isPrimitive){const t=this._format.fromHexString(A);this.setValue(t)}else this._format.fromHexString(A,this.getValue(),this._rgbScale),this._callOnChange(),this.updateDisplay()}save(){return this._format.toHexString(this.getValue(),this._rgbScale)}load(A){return this._setValueFromHexString(A),this._callOnFinishChange(),this}updateDisplay(){return this.$input.value=this._format.toHexString(this.getValue(),this._rgbScale),this._textFocused||(this.$text.value=this.$input.value.substring(1)),this.$display.style.backgroundColor=this.$input.value,this}}class FI extends ai{constructor(A,t,e){super(A,t,e,"function"),this.$button=document.createElement("button"),this.$button.appendChild(this.$name),this.$widget.appendChild(this.$button),this.$button.addEventListener("click",n=>{n.preventDefault(),this.getValue().call(this.object),this._callOnChange()}),this.$button.addEventListener("touchstart",()=>{},{passive:!0}),this.$disable=this.$button}}class gR extends ai{constructor(A,t,e,n,s,o){super(A,t,e,"number"),this._initInput(),this.min(n),this.max(s);const a=o!==void 0;this.step(a?o:this._getImplicitStep(),a),this.updateDisplay()}decimals(A){return this._decimals=A,this.updateDisplay(),this}min(A){return this._min=A,this._onUpdateMinMax(),this}max(A){return this._max=A,this._onUpdateMinMax(),this}step(A,t=!0){return this._step=A,this._stepExplicit=t,this}updateDisplay(){const A=this.getValue();if(this._hasSlider){let t=(A-this._min)/(this._max-this._min);t=Math.max(0,Math.min(t,1)),this.$fill.style.width=t*100+"%"}return this._inputFocused||(this.$input.value=this._decimals===void 0?A:A.toFixed(this._decimals)),this}_initInput(){this.$input=document.createElement("input"),this.$input.setAttribute("type","number"),this.$input.setAttribute("step","any"),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$widget.appendChild(this.$input),this.$disable=this.$input;const A=()=>{let E=parseFloat(this.$input.value);isNaN(E)||(this._stepExplicit&&(E=this._snap(E)),this.setValue(this._clamp(E)))},t=E=>{const f=parseFloat(this.$input.value);isNaN(f)||(this._snapClampSetValue(f+E),this.$input.value=this.getValue())},e=E=>{E.code==="Enter"&&this.$input.blur(),E.code==="ArrowUp"&&(E.preventDefault(),t(this._step*this._arrowKeyMultiplier(E))),E.code==="ArrowDown"&&(E.preventDefault(),t(this._step*this._arrowKeyMultiplier(E)*-1))},n=E=>{this._inputFocused&&(E.preventDefault(),t(this._step*this._normalizeMouseWheel(E)))};let s=!1,o,a,g,r,I;const B=5,C=E=>{o=E.clientX,a=g=E.clientY,s=!0,r=this.getValue(),I=0,window.addEventListener("mousemove",Q),window.addEventListener("mouseup",c)},Q=E=>{if(s){const f=E.clientX-o,d=E.clientY-a;Math.abs(d)>B?(E.preventDefault(),this.$input.blur(),s=!1,this._setDraggingStyle(!0,"vertical")):Math.abs(f)>B&&c()}s||(I-=(E.clientY-g)*this._step*this._arrowKeyMultiplier(E),r+I>this._max?I=this._max-r:r+I<this._min&&(I=this._min-r),this._snapClampSetValue(r+I)),g=E.clientY},c=()=>{this._setDraggingStyle(!1,"vertical"),this._callOnFinishChange(),window.removeEventListener("mousemove",Q),window.removeEventListener("mouseup",c)},l=()=>{this._inputFocused=!0},h=()=>{this._inputFocused=!1,this.updateDisplay(),this._callOnFinishChange()};this.$input.addEventListener("input",A),this.$input.addEventListener("keydown",e),this.$input.addEventListener("wheel",n,{passive:!1}),this.$input.addEventListener("mousedown",C),this.$input.addEventListener("focus",l),this.$input.addEventListener("blur",h)}_initSlider(){this._hasSlider=!0,this.$slider=document.createElement("div"),this.$slider.classList.add("slider"),this.$fill=document.createElement("div"),this.$fill.classList.add("fill"),this.$slider.appendChild(this.$fill),this.$widget.insertBefore(this.$slider,this.$input),this.domElement.classList.add("hasSlider");const A=(E,f,d,u,m)=>(E-f)/(d-f)*(m-u)+u,t=E=>{const f=this.$slider.getBoundingClientRect();let d=A(E,f.left,f.right,this._min,this._max);this._snapClampSetValue(d)},e=E=>{this._setDraggingStyle(!0),t(E.clientX),window.addEventListener("mousemove",n),window.addEventListener("mouseup",s)},n=E=>{t(E.clientX)},s=()=>{this._callOnFinishChange(),this._setDraggingStyle(!1),window.removeEventListener("mousemove",n),window.removeEventListener("mouseup",s)};let o=!1,a,g;const r=E=>{E.preventDefault(),this._setDraggingStyle(!0),t(E.touches[0].clientX),o=!1},I=E=>{E.touches.length>1||(this._hasScrollBar?(a=E.touches[0].clientX,g=E.touches[0].clientY,o=!0):r(E),window.addEventListener("touchmove",B,{passive:!1}),window.addEventListener("touchend",C))},B=E=>{if(o){const f=E.touches[0].clientX-a,d=E.touches[0].clientY-g;Math.abs(f)>Math.abs(d)?r(E):(window.removeEventListener("touchmove",B),window.removeEventListener("touchend",C))}else E.preventDefault(),t(E.touches[0].clientX)},C=()=>{this._callOnFinishChange(),this._setDraggingStyle(!1),window.removeEventListener("touchmove",B),window.removeEventListener("touchend",C)},Q=this._callOnFinishChange.bind(this),c=400;let l;const h=E=>{if(Math.abs(E.deltaX)<Math.abs(E.deltaY)&&this._hasScrollBar)return;E.preventDefault();const d=this._normalizeMouseWheel(E)*this._step;this._snapClampSetValue(this.getValue()+d),this.$input.value=this.getValue(),clearTimeout(l),l=setTimeout(Q,c)};this.$slider.addEventListener("mousedown",e),this.$slider.addEventListener("touchstart",I,{passive:!1}),this.$slider.addEventListener("wheel",h,{passive:!1})}_setDraggingStyle(A,t="horizontal"){this.$slider&&this.$slider.classList.toggle("active",A),document.body.classList.toggle("lil-gui-dragging",A),document.body.classList.toggle(`lil-gui-${t}`,A)}_getImplicitStep(){return this._hasMin&&this._hasMax?(this._max-this._min)/1e3:.1}_onUpdateMinMax(){!this._hasSlider&&this._hasMin&&this._hasMax&&(this._stepExplicit||this.step(this._getImplicitStep(),!1),this._initSlider(),this.updateDisplay())}_normalizeMouseWheel(A){let{deltaX:t,deltaY:e}=A;return Math.floor(A.deltaY)!==A.deltaY&&A.wheelDelta&&(t=0,e=-A.wheelDelta/120,e*=this._stepExplicit?1:10),t+-e}_arrowKeyMultiplier(A){let t=this._stepExplicit?1:10;return A.shiftKey?t*=10:A.altKey&&(t/=10),t}_snap(A){const t=Math.round(A/this._step)*this._step;return parseFloat(t.toPrecision(15))}_clamp(A){return A<this._min&&(A=this._min),A>this._max&&(A=this._max),A}_snapClampSetValue(A){this.setValue(this._clamp(this._snap(A)))}get _hasScrollBar(){const A=this.parent.root.$children;return A.scrollHeight>A.clientHeight}get _hasMin(){return this._min!==void 0}get _hasMax(){return this._max!==void 0}}class IR extends ai{constructor(A,t,e,n){super(A,t,e,"option"),this.$select=document.createElement("select"),this.$select.setAttribute("aria-labelledby",this.$name.id),this.$display=document.createElement("div"),this.$display.classList.add("display"),this._values=Array.isArray(n)?n:Object.values(n),this._names=Array.isArray(n)?n:Object.keys(n),this._names.forEach(s=>{const o=document.createElement("option");o.innerHTML=s,this.$select.appendChild(o)}),this.$select.addEventListener("change",()=>{this.setValue(this._values[this.$select.selectedIndex]),this._callOnFinishChange()}),this.$select.addEventListener("focus",()=>{this.$display.classList.add("focus")}),this.$select.addEventListener("blur",()=>{this.$display.classList.remove("focus")}),this.$widget.appendChild(this.$select),this.$widget.appendChild(this.$display),this.$disable=this.$select,this.updateDisplay()}updateDisplay(){const A=this.getValue(),t=this._values.indexOf(A);return this.$select.selectedIndex=t,this.$display.innerHTML=t===-1?A:this._names[t],this}}class BR extends ai{constructor(A,t,e){super(A,t,e,"string"),this.$input=document.createElement("input"),this.$input.setAttribute("type","text"),this.$input.setAttribute("aria-labelledby",this.$name.id),this.$input.addEventListener("input",()=>{this.setValue(this.$input.value)}),this.$input.addEventListener("keydown",n=>{n.code==="Enter"&&this.$input.blur()}),this.$input.addEventListener("blur",()=>{this._callOnFinishChange()}),this.$widget.appendChild(this.$input),this.$disable=this.$input,this.updateDisplay()}updateDisplay(){return this.$input.value=this.getValue(),this}}const CR=`.lil-gui {
  font-family: var(--font-family);
  font-size: var(--font-size);
  line-height: 1;
  font-weight: normal;
  font-style: normal;
  text-align: left;
  background-color: var(--background-color);
  color: var(--text-color);
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
  --background-color: #1f1f1f;
  --text-color: #ebebeb;
  --title-background-color: #111111;
  --title-text-color: #ebebeb;
  --widget-color: #424242;
  --hover-color: #4f4f4f;
  --focus-color: #595959;
  --number-color: #2cc9ff;
  --string-color: #a2db3c;
  --font-size: 11px;
  --input-font-size: 11px;
  --font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  --font-family-mono: Menlo, Monaco, Consolas, "Droid Sans Mono", monospace;
  --padding: 4px;
  --spacing: 4px;
  --widget-height: 20px;
  --title-height: calc(var(--widget-height) + var(--spacing) * 1.25);
  --name-width: 45%;
  --slider-knob-width: 2px;
  --slider-input-width: 27%;
  --color-input-width: 27%;
  --slider-input-min-width: 45px;
  --color-input-min-width: 45px;
  --folder-indent: 7px;
  --widget-padding: 0 0 0 3px;
  --widget-border-radius: 2px;
  --checkbox-size: calc(0.75 * var(--widget-height));
  --scrollbar-width: 5px;
}
.lil-gui, .lil-gui * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.lil-gui.root {
  width: var(--width, 245px);
  display: flex;
  flex-direction: column;
}
.lil-gui.root > .title {
  background: var(--title-background-color);
  color: var(--title-text-color);
}
.lil-gui.root > .children {
  overflow-x: hidden;
  overflow-y: auto;
}
.lil-gui.root > .children::-webkit-scrollbar {
  width: var(--scrollbar-width);
  height: var(--scrollbar-width);
  background: var(--background-color);
}
.lil-gui.root > .children::-webkit-scrollbar-thumb {
  border-radius: var(--scrollbar-width);
  background: var(--focus-color);
}
@media (pointer: coarse) {
  .lil-gui.allow-touch-styles {
    --widget-height: 28px;
    --padding: 6px;
    --spacing: 6px;
    --font-size: 13px;
    --input-font-size: 16px;
    --folder-indent: 10px;
    --scrollbar-width: 7px;
    --slider-input-min-width: 50px;
    --color-input-min-width: 65px;
  }
}
.lil-gui.force-touch-styles {
  --widget-height: 28px;
  --padding: 6px;
  --spacing: 6px;
  --font-size: 13px;
  --input-font-size: 16px;
  --folder-indent: 10px;
  --scrollbar-width: 7px;
  --slider-input-min-width: 50px;
  --color-input-min-width: 65px;
}
.lil-gui.autoPlace {
  max-height: 100%;
  position: fixed;
  top: 0;
  right: 15px;
  z-index: 1001;
}

.lil-gui .controller {
  display: flex;
  align-items: center;
  padding: 0 var(--padding);
  margin: var(--spacing) 0;
}
.lil-gui .controller.disabled {
  opacity: 0.5;
}
.lil-gui .controller.disabled, .lil-gui .controller.disabled * {
  pointer-events: none !important;
}
.lil-gui .controller > .name {
  min-width: var(--name-width);
  flex-shrink: 0;
  white-space: pre;
  padding-right: var(--spacing);
  line-height: var(--widget-height);
}
.lil-gui .controller .widget {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: var(--widget-height);
}
.lil-gui .controller.string input {
  color: var(--string-color);
}
.lil-gui .controller.boolean .widget {
  cursor: pointer;
}
.lil-gui .controller.color .display {
  width: 100%;
  height: var(--widget-height);
  border-radius: var(--widget-border-radius);
  position: relative;
}
@media (hover: hover) {
  .lil-gui .controller.color .display:hover:before {
    content: " ";
    display: block;
    position: absolute;
    border-radius: var(--widget-border-radius);
    border: 1px solid #fff9;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
  }
}
.lil-gui .controller.color input[type=color] {
  opacity: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}
.lil-gui .controller.color input[type=text] {
  margin-left: var(--spacing);
  font-family: var(--font-family-mono);
  min-width: var(--color-input-min-width);
  width: var(--color-input-width);
  flex-shrink: 0;
}
.lil-gui .controller.option select {
  opacity: 0;
  position: absolute;
  width: 100%;
  max-width: 100%;
}
.lil-gui .controller.option .display {
  position: relative;
  pointer-events: none;
  border-radius: var(--widget-border-radius);
  height: var(--widget-height);
  line-height: var(--widget-height);
  max-width: 100%;
  overflow: hidden;
  word-break: break-all;
  padding-left: 0.55em;
  padding-right: 1.75em;
  background: var(--widget-color);
}
@media (hover: hover) {
  .lil-gui .controller.option .display.focus {
    background: var(--focus-color);
  }
}
.lil-gui .controller.option .display.active {
  background: var(--focus-color);
}
.lil-gui .controller.option .display:after {
  font-family: "lil-gui";
  content: "\u2195";
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  padding-right: 0.375em;
}
.lil-gui .controller.option .widget,
.lil-gui .controller.option select {
  cursor: pointer;
}
@media (hover: hover) {
  .lil-gui .controller.option .widget:hover .display {
    background: var(--hover-color);
  }
}
.lil-gui .controller.number input {
  color: var(--number-color);
}
.lil-gui .controller.number.hasSlider input {
  margin-left: var(--spacing);
  width: var(--slider-input-width);
  min-width: var(--slider-input-min-width);
  flex-shrink: 0;
}
.lil-gui .controller.number .slider {
  width: 100%;
  height: var(--widget-height);
  background-color: var(--widget-color);
  border-radius: var(--widget-border-radius);
  padding-right: var(--slider-knob-width);
  overflow: hidden;
  cursor: ew-resize;
  touch-action: pan-y;
}
@media (hover: hover) {
  .lil-gui .controller.number .slider:hover {
    background-color: var(--hover-color);
  }
}
.lil-gui .controller.number .slider.active {
  background-color: var(--focus-color);
}
.lil-gui .controller.number .slider.active .fill {
  opacity: 0.95;
}
.lil-gui .controller.number .fill {
  height: 100%;
  border-right: var(--slider-knob-width) solid var(--number-color);
  box-sizing: content-box;
}

.lil-gui-dragging .lil-gui {
  --hover-color: var(--widget-color);
}
.lil-gui-dragging * {
  cursor: ew-resize !important;
}

.lil-gui-dragging.lil-gui-vertical * {
  cursor: ns-resize !important;
}

.lil-gui .title {
  height: var(--title-height);
  line-height: calc(var(--title-height) - 4px);
  font-weight: 600;
  padding: 0 var(--padding);
  -webkit-tap-highlight-color: transparent;
  cursor: pointer;
  outline: none;
  text-decoration-skip: objects;
}
.lil-gui .title:before {
  font-family: "lil-gui";
  content: "\u25BE";
  padding-right: 2px;
  display: inline-block;
}
.lil-gui .title:active {
  background: var(--title-background-color);
  opacity: 0.75;
}
@media (hover: hover) {
  body:not(.lil-gui-dragging) .lil-gui .title:hover {
    background: var(--title-background-color);
    opacity: 0.85;
  }
  .lil-gui .title:focus {
    text-decoration: underline var(--focus-color);
  }
}
.lil-gui.root > .title:focus {
  text-decoration: none !important;
}
.lil-gui.closed > .title:before {
  content: "\u25B8";
}
.lil-gui.closed > .children {
  transform: translateY(-7px);
  opacity: 0;
}
.lil-gui.closed:not(.transition) > .children {
  display: none;
}
.lil-gui.transition > .children {
  transition-duration: 300ms;
  transition-property: height, opacity, transform;
  transition-timing-function: cubic-bezier(0.2, 0.6, 0.35, 1);
  overflow: hidden;
  pointer-events: none;
}
.lil-gui .children:empty:before {
  content: "Empty";
  padding: 0 var(--padding);
  margin: var(--spacing) 0;
  display: block;
  height: var(--widget-height);
  font-style: italic;
  line-height: var(--widget-height);
  opacity: 0.5;
}
.lil-gui.root > .children > .lil-gui > .title {
  border: 0 solid var(--widget-color);
  border-width: 1px 0;
  transition: border-color 300ms;
}
.lil-gui.root > .children > .lil-gui.closed > .title {
  border-bottom-color: transparent;
}
.lil-gui + .controller {
  border-top: 1px solid var(--widget-color);
  margin-top: 0;
  padding-top: var(--spacing);
}
.lil-gui .lil-gui .lil-gui > .title {
  border: none;
}
.lil-gui .lil-gui .lil-gui > .children {
  border: none;
  margin-left: var(--folder-indent);
  border-left: 2px solid var(--widget-color);
}
.lil-gui .lil-gui .controller {
  border: none;
}

.lil-gui input {
  -webkit-tap-highlight-color: transparent;
  border: 0;
  outline: none;
  font-family: var(--font-family);
  font-size: var(--input-font-size);
  border-radius: var(--widget-border-radius);
  height: var(--widget-height);
  background: var(--widget-color);
  color: var(--text-color);
  width: 100%;
}
@media (hover: hover) {
  .lil-gui input:hover {
    background: var(--hover-color);
  }
  .lil-gui input:active {
    background: var(--focus-color);
  }
}
.lil-gui input:disabled {
  opacity: 1;
}
.lil-gui input[type=text],
.lil-gui input[type=number] {
  padding: var(--widget-padding);
}
.lil-gui input[type=text]:focus,
.lil-gui input[type=number]:focus {
  background: var(--focus-color);
}
.lil-gui input::-webkit-outer-spin-button,
.lil-gui input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.lil-gui input[type=number] {
  -moz-appearance: textfield;
}
.lil-gui input[type=checkbox] {
  appearance: none;
  -webkit-appearance: none;
  height: var(--checkbox-size);
  width: var(--checkbox-size);
  border-radius: var(--widget-border-radius);
  text-align: center;
  cursor: pointer;
}
.lil-gui input[type=checkbox]:checked:before {
  font-family: "lil-gui";
  content: "\u2713";
  font-size: var(--checkbox-size);
  line-height: var(--checkbox-size);
}
@media (hover: hover) {
  .lil-gui input[type=checkbox]:focus {
    box-shadow: inset 0 0 0 1px var(--focus-color);
  }
}
.lil-gui button {
  -webkit-tap-highlight-color: transparent;
  outline: none;
  cursor: pointer;
  font-family: var(--font-family);
  font-size: var(--font-size);
  color: var(--text-color);
  width: 100%;
  height: var(--widget-height);
  text-transform: none;
  background: var(--widget-color);
  border-radius: var(--widget-border-radius);
  border: 1px solid var(--widget-color);
  text-align: center;
  line-height: calc(var(--widget-height) - 4px);
}
@media (hover: hover) {
  .lil-gui button:hover {
    background: var(--hover-color);
    border-color: var(--hover-color);
  }
  .lil-gui button:focus {
    border-color: var(--focus-color);
  }
}
.lil-gui button:active {
  background: var(--focus-color);
}

@font-face {
  font-family: "lil-gui";
  src: url("data:application/font-woff;charset=utf-8;base64,d09GRgABAAAAAAUsAAsAAAAACJwAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAABHU1VCAAABCAAAAH4AAADAImwmYE9TLzIAAAGIAAAAPwAAAGBKqH5SY21hcAAAAcgAAAD0AAACrukyyJBnbHlmAAACvAAAAF8AAACEIZpWH2hlYWQAAAMcAAAAJwAAADZfcj2zaGhlYQAAA0QAAAAYAAAAJAC5AHhobXR4AAADXAAAABAAAABMAZAAAGxvY2EAAANsAAAAFAAAACgCEgIybWF4cAAAA4AAAAAeAAAAIAEfABJuYW1lAAADoAAAASIAAAIK9SUU/XBvc3QAAATEAAAAZgAAAJCTcMc2eJxVjbEOgjAURU+hFRBK1dGRL+ALnAiToyMLEzFpnPz/eAshwSa97517c/MwwJmeB9kwPl+0cf5+uGPZXsqPu4nvZabcSZldZ6kfyWnomFY/eScKqZNWupKJO6kXN3K9uCVoL7iInPr1X5baXs3tjuMqCtzEuagm/AAlzQgPAAB4nGNgYRBlnMDAysDAYM/gBiT5oLQBAwuDJAMDEwMrMwNWEJDmmsJwgCFeXZghBcjlZMgFCzOiKOIFAB71Bb8AeJy1kjFuwkAQRZ+DwRAwBtNQRUGKQ8OdKCAWUhAgKLhIuAsVSpWz5Bbkj3dEgYiUIszqWdpZe+Z7/wB1oCYmIoboiwiLT2WjKl/jscrHfGg/pKdMkyklC5Zs2LEfHYpjcRoPzme9MWWmk3dWbK9ObkWkikOetJ554fWyoEsmdSlt+uR0pCJR34b6t/TVg1SY3sYvdf8vuiKrpyaDXDISiegp17p7579Gp3p++y7HPAiY9pmTibljrr85qSidtlg4+l25GLCaS8e6rRxNBmsnERunKbaOObRz7N72ju5vdAjYpBXHgJylOAVsMseDAPEP8LYoUHicY2BiAAEfhiAGJgZWBgZ7RnFRdnVJELCQlBSRlATJMoLV2DK4glSYs6ubq5vbKrJLSbGrgEmovDuDJVhe3VzcXFwNLCOILB/C4IuQ1xTn5FPilBTj5FPmBAB4WwoqAHicY2BkYGAA4sk1sR/j+W2+MnAzpDBgAyEMQUCSg4EJxAEAwUgFHgB4nGNgZGBgSGFggJMhDIwMqEAYAByHATJ4nGNgAIIUNEwmAABl3AGReJxjYAACIQYlBiMGJ3wQAEcQBEV4nGNgZGBgEGZgY2BiAAEQyQWEDAz/wXwGAAsPATIAAHicXdBNSsNAHAXwl35iA0UQXYnMShfS9GPZA7T7LgIu03SSpkwzYTIt1BN4Ak/gKTyAeCxfw39jZkjymzcvAwmAW/wgwHUEGDb36+jQQ3GXGot79L24jxCP4gHzF/EIr4jEIe7wxhOC3g2TMYy4Q7+Lu/SHuEd/ivt4wJd4wPxbPEKMX3GI5+DJFGaSn4qNzk8mcbKSR6xdXdhSzaOZJGtdapd4vVPbi6rP+cL7TGXOHtXKll4bY1Xl7EGnPtp7Xy2n00zyKLVHfkHBa4IcJ2oD3cgggWvt/V/FbDrUlEUJhTn/0azVWbNTNr0Ens8de1tceK9xZmfB1CPjOmPH4kitmvOubcNpmVTN3oFJyjzCvnmrwhJTzqzVj9jiSX911FjeAAB4nG3HMRKCMBBA0f0giiKi4DU8k0V2GWbIZDOh4PoWWvq6J5V8If9NVNQcaDhyouXMhY4rPTcG7jwYmXhKq8Wz+p762aNaeYXom2n3m2dLTVgsrCgFJ7OTmIkYbwIbC6vIB7WmFfAAAA==") format("woff");
}`;function ER(i){const A=document.createElement("style");A.innerHTML=i;const t=document.querySelector("head link[rel=stylesheet], head style");t?document.head.insertBefore(A,t):document.head.appendChild(A)}let iQ=!1;class qB{constructor({parent:A,autoPlace:t=A===void 0,container:e,width:n,title:s="Controls",closeFolders:o=!1,injectStyles:a=!0,touchStyles:g=!0}={}){if(this.parent=A,this.root=A?A.root:this,this.children=[],this.controllers=[],this.folders=[],this._closed=!1,this._hidden=!1,this.domElement=document.createElement("div"),this.domElement.classList.add("lil-gui"),this.$title=document.createElement("div"),this.$title.classList.add("title"),this.$title.setAttribute("role","button"),this.$title.setAttribute("aria-expanded",!0),this.$title.setAttribute("tabindex",0),this.$title.addEventListener("click",()=>this.openAnimated(this._closed)),this.$title.addEventListener("keydown",r=>{(r.code==="Enter"||r.code==="Space")&&(r.preventDefault(),this.$title.click())}),this.$title.addEventListener("touchstart",()=>{},{passive:!0}),this.$children=document.createElement("div"),this.$children.classList.add("children"),this.domElement.appendChild(this.$title),this.domElement.appendChild(this.$children),this.title(s),g&&this.domElement.classList.add("allow-touch-styles"),this.parent){this.parent.children.push(this),this.parent.folders.push(this),this.parent.$children.appendChild(this.domElement);return}this.domElement.classList.add("root"),!iQ&&a&&(ER(CR),iQ=!0),e?e.appendChild(this.domElement):t&&(this.domElement.classList.add("autoPlace"),document.body.appendChild(this.domElement)),n&&this.domElement.style.setProperty("--width",n+"px"),this._closeFolders=o,this.domElement.addEventListener("keydown",r=>r.stopPropagation()),this.domElement.addEventListener("keyup",r=>r.stopPropagation())}add(A,t,e,n,s){if(Object(e)===e)return new IR(this,A,t,e);const o=A[t];switch(typeof o){case"number":return new gR(this,A,t,e,n,s);case"boolean":return new eR(this,A,t);case"string":return new BR(this,A,t);case"function":return new FI(this,A,t)}console.error(`gui.add failed
	property:`,t,`
	object:`,A,`
	value:`,o)}addColor(A,t,e=1){return new rR(this,A,t,e)}addFolder(A){const t=new qB({parent:this,title:A});return this.root._closeFolders&&t.close(),t}load(A,t=!0){return A.controllers&&this.controllers.forEach(e=>{e instanceof FI||e._name in A.controllers&&e.load(A.controllers[e._name])}),t&&A.folders&&this.folders.forEach(e=>{e._title in A.folders&&e.load(A.folders[e._title])}),this}save(A=!0){const t={controllers:{},folders:{}};return this.controllers.forEach(e=>{if(!(e instanceof FI)){if(e._name in t.controllers)throw new Error(`Cannot save GUI with duplicate property "${e._name}"`);t.controllers[e._name]=e.save()}}),A&&this.folders.forEach(e=>{if(e._title in t.folders)throw new Error(`Cannot save GUI with duplicate folder "${e._title}"`);t.folders[e._title]=e.save()}),t}open(A=!0){return this._setClosed(!A),this.$title.setAttribute("aria-expanded",!this._closed),this.domElement.classList.toggle("closed",this._closed),this}close(){return this.open(!1)}_setClosed(A){this._closed!==A&&(this._closed=A,this._callOnOpenClose(this))}show(A=!0){return this._hidden=!A,this.domElement.style.display=this._hidden?"none":"",this}hide(){return this.show(!1)}openAnimated(A=!0){return this._setClosed(!A),this.$title.setAttribute("aria-expanded",!this._closed),requestAnimationFrame(()=>{const t=this.$children.clientHeight;this.$children.style.height=t+"px",this.domElement.classList.add("transition");const e=s=>{s.target===this.$children&&(this.$children.style.height="",this.domElement.classList.remove("transition"),this.$children.removeEventListener("transitionend",e))};this.$children.addEventListener("transitionend",e);const n=A?this.$children.scrollHeight:0;this.domElement.classList.toggle("closed",!A),requestAnimationFrame(()=>{this.$children.style.height=n+"px"})}),this}title(A){return this._title=A,this.$title.innerHTML=A,this}reset(A=!0){return(A?this.controllersRecursive():this.controllers).forEach(e=>e.reset()),this}onChange(A){return this._onChange=A,this}_callOnChange(A){this.parent&&this.parent._callOnChange(A),this._onChange!==void 0&&this._onChange.call(this,{object:A.object,property:A.property,value:A.getValue(),controller:A})}onFinishChange(A){return this._onFinishChange=A,this}_callOnFinishChange(A){this.parent&&this.parent._callOnFinishChange(A),this._onFinishChange!==void 0&&this._onFinishChange.call(this,{object:A.object,property:A.property,value:A.getValue(),controller:A})}onOpenClose(A){return this._onOpenClose=A,this}_callOnOpenClose(A){this.parent&&this.parent._callOnOpenClose(A),this._onOpenClose!==void 0&&this._onOpenClose.call(this,A)}destroy(){this.parent&&(this.parent.children.splice(this.parent.children.indexOf(this),1),this.parent.folders.splice(this.parent.folders.indexOf(this),1)),this.domElement.parentElement&&this.domElement.parentElement.removeChild(this.domElement),Array.from(this.children).forEach(A=>A.destroy())}controllersRecursive(){let A=Array.from(this.controllers);return this.folders.forEach(t=>{A=A.concat(t.controllersRecursive())}),A}foldersRecursive(){let A=Array.from(this.folders);return this.folders.forEach(t=>{A=A.concat(t.foldersRecursive())}),A}}const Il=qB;function nQ(i,A){if(A===gd)return console.warn("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles."),i;if(A===kI||A===vQ){let t=i.getIndex();if(t===null){const o=[],a=i.getAttribute("position");if(a!==void 0){for(let g=0;g<a.count;g++)o.push(g);i.setIndex(o),t=i.getIndex()}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible."),i}const e=t.count-2,n=[];if(A===kI)for(let o=1;o<=e;o++)n.push(t.getX(0)),n.push(t.getX(o)),n.push(t.getX(o+1));else for(let o=0;o<e;o++)o%2===0?(n.push(t.getX(o)),n.push(t.getX(o+1)),n.push(t.getX(o+2))):(n.push(t.getX(o+2)),n.push(t.getX(o+1)),n.push(t.getX(o)));n.length/3!==e&&console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.");const s=i.clone();return s.setIndex(n),s.clearGroups(),s}else return console.error("THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:",A),i}class hR extends oo{constructor(A){super(A),this.dracoLoader=null,this.ktx2Loader=null,this.meshoptDecoder=null,this.pluginCallbacks=[],this.register(function(t){return new uR(t)}),this.register(function(t){return new MR(t)}),this.register(function(t){return new RR(t)}),this.register(function(t){return new FR(t)}),this.register(function(t){return new pR(t)}),this.register(function(t){return new mR(t)}),this.register(function(t){return new yR(t)}),this.register(function(t){return new DR(t)}),this.register(function(t){return new dR(t)}),this.register(function(t){return new SR(t)}),this.register(function(t){return new fR(t)}),this.register(function(t){return new wR(t)}),this.register(function(t){return new cR(t)}),this.register(function(t){return new xR(t)}),this.register(function(t){return new NR(t)})}load(A,t,e,n){const s=this;let o;this.resourcePath!==""?o=this.resourcePath:this.path!==""?o=this.path:o=YI.extractUrlBase(A),this.manager.itemStart(A);const a=function(r){n?n(r):console.error(r),s.manager.itemError(A),s.manager.itemEnd(A)},g=new wB(this.manager);g.setPath(this.path),g.setResponseType("arraybuffer"),g.setRequestHeader(this.requestHeader),g.setWithCredentials(this.withCredentials),g.load(A,function(r){try{s.parse(r,o,function(I){t(I),s.manager.itemEnd(A)},a)}catch(I){a(I)}},e,a)}setDRACOLoader(A){return this.dracoLoader=A,this}setDDSLoader(){throw new Error('THREE.GLTFLoader: "MSFT_texture_dds" no longer supported. Please update to "KHR_texture_basisu".')}setKTX2Loader(A){return this.ktx2Loader=A,this}setMeshoptDecoder(A){return this.meshoptDecoder=A,this}register(A){return this.pluginCallbacks.indexOf(A)===-1&&this.pluginCallbacks.push(A),this}unregister(A){return this.pluginCallbacks.indexOf(A)!==-1&&this.pluginCallbacks.splice(this.pluginCallbacks.indexOf(A),1),this}parse(A,t,e,n){let s;const o={},a={},g=new TextDecoder;if(typeof A=="string")s=JSON.parse(A);else if(A instanceof ArrayBuffer)if(g.decode(new Uint8Array(A,0,4))===Bl){try{o[ZA.KHR_BINARY_GLTF]=new _R(A)}catch(B){n&&n(B);return}s=JSON.parse(o[ZA.KHR_BINARY_GLTF].content)}else s=JSON.parse(g.decode(A));else s=A;if(s.asset===void 0||s.asset.version[0]<2){n&&n(new Error("THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported."));return}const r=new PR(s,{path:t||this.resourcePath||"",crossOrigin:this.crossOrigin,requestHeader:this.requestHeader,manager:this.manager,ktx2Loader:this.ktx2Loader,meshoptDecoder:this.meshoptDecoder});r.fileLoader.setRequestHeader(this.requestHeader);for(let I=0;I<this.pluginCallbacks.length;I++){const B=this.pluginCallbacks[I](r);a[B.name]=B,o[B.name]=!0}if(s.extensionsUsed)for(let I=0;I<s.extensionsUsed.length;++I){const B=s.extensionsUsed[I],C=s.extensionsRequired||[];switch(B){case ZA.KHR_MATERIALS_UNLIT:o[B]=new lR;break;case ZA.KHR_DRACO_MESH_COMPRESSION:o[B]=new GR(s,this.dracoLoader);break;case ZA.KHR_TEXTURE_TRANSFORM:o[B]=new LR;break;case ZA.KHR_MESH_QUANTIZATION:o[B]=new UR;break;default:C.indexOf(B)>=0&&a[B]===void 0&&console.warn('THREE.GLTFLoader: Unknown extension "'+B+'".')}}r.setExtensions(o),r.setPlugins(a),r.parse(e,n)}parseAsync(A,t){const e=this;return new Promise(function(n,s){e.parse(A,t,n,s)})}}function QR(){let i={};return{get:function(A){return i[A]},add:function(A,t){i[A]=t},remove:function(A){delete i[A]},removeAll:function(){i={}}}}const ZA={KHR_BINARY_GLTF:"KHR_binary_glTF",KHR_DRACO_MESH_COMPRESSION:"KHR_draco_mesh_compression",KHR_LIGHTS_PUNCTUAL:"KHR_lights_punctual",KHR_MATERIALS_CLEARCOAT:"KHR_materials_clearcoat",KHR_MATERIALS_IOR:"KHR_materials_ior",KHR_MATERIALS_SHEEN:"KHR_materials_sheen",KHR_MATERIALS_SPECULAR:"KHR_materials_specular",KHR_MATERIALS_TRANSMISSION:"KHR_materials_transmission",KHR_MATERIALS_IRIDESCENCE:"KHR_materials_iridescence",KHR_MATERIALS_ANISOTROPY:"KHR_materials_anisotropy",KHR_MATERIALS_UNLIT:"KHR_materials_unlit",KHR_MATERIALS_VOLUME:"KHR_materials_volume",KHR_TEXTURE_BASISU:"KHR_texture_basisu",KHR_TEXTURE_TRANSFORM:"KHR_texture_transform",KHR_MESH_QUANTIZATION:"KHR_mesh_quantization",KHR_MATERIALS_EMISSIVE_STRENGTH:"KHR_materials_emissive_strength",EXT_TEXTURE_WEBP:"EXT_texture_webp",EXT_TEXTURE_AVIF:"EXT_texture_avif",EXT_MESHOPT_COMPRESSION:"EXT_meshopt_compression",EXT_MESH_GPU_INSTANCING:"EXT_mesh_gpu_instancing"};class cR{constructor(A){this.parser=A,this.name=ZA.KHR_LIGHTS_PUNCTUAL,this.cache={refs:{},uses:{}}}_markDefs(){const A=this.parser,t=this.parser.json.nodes||[];for(let e=0,n=t.length;e<n;e++){const s=t[e];s.extensions&&s.extensions[this.name]&&s.extensions[this.name].light!==void 0&&A._addNodeRef(this.cache,s.extensions[this.name].light)}}_loadLight(A){const t=this.parser,e="light:"+A;let n=t.cache.get(e);if(n)return n;const s=t.json,g=((s.extensions&&s.extensions[this.name]||{}).lights||[])[A];let r;const I=new HA(16777215);g.color!==void 0&&I.fromArray(g.color);const B=g.range!==void 0?g.range:0;switch(g.type){case"directional":r=new Ia(I),r.target.position.set(0,0,-1),r.add(r.target);break;case"point":r=new FB(I),r.distance=B;break;case"spot":r=new RB(I),r.distance=B,g.spot=g.spot||{},g.spot.innerConeAngle=g.spot.innerConeAngle!==void 0?g.spot.innerConeAngle:0,g.spot.outerConeAngle=g.spot.outerConeAngle!==void 0?g.spot.outerConeAngle:Math.PI/4,r.angle=g.spot.outerConeAngle,r.penumbra=1-g.spot.innerConeAngle/g.spot.outerConeAngle,r.target.position.set(0,0,-1),r.add(r.target);break;default:throw new Error("THREE.GLTFLoader: Unexpected light type: "+g.type)}return r.position.set(0,0,0),r.decay=2,An(r,g),g.intensity!==void 0&&(r.intensity=g.intensity),r.name=t.createUniqueName(g.name||"light_"+A),n=Promise.resolve(r),t.cache.add(e,n),n}getDependency(A,t){if(A==="light")return this._loadLight(t)}createNodeAttachment(A){const t=this,e=this.parser,s=e.json.nodes[A],a=(s.extensions&&s.extensions[this.name]||{}).light;return a===void 0?null:this._loadLight(a).then(function(g){return e._getNodeRef(t.cache,a,g)})}}class lR{constructor(){this.name=ZA.KHR_MATERIALS_UNLIT}getMaterialType(){return Qe}extendParams(A,t,e){const n=[];A.color=new HA(1,1,1),A.opacity=1;const s=t.pbrMetallicRoughness;if(s){if(Array.isArray(s.baseColorFactor)){const o=s.baseColorFactor;A.color.fromArray(o),A.opacity=o[3]}s.baseColorTexture!==void 0&&n.push(e.assignTexture(A,"map",s.baseColorTexture,kA))}return Promise.all(n)}}class dR{constructor(A){this.parser=A,this.name=ZA.KHR_MATERIALS_EMISSIVE_STRENGTH}extendMaterialParams(A,t){const n=this.parser.json.materials[A];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const s=n.extensions[this.name].emissiveStrength;return s!==void 0&&(t.emissiveIntensity=s),Promise.resolve()}}class uR{constructor(A){this.parser=A,this.name=ZA.KHR_MATERIALS_CLEARCOAT}getMaterialType(A){const e=this.parser.json.materials[A];return!e.extensions||!e.extensions[this.name]?null:hn}extendMaterialParams(A,t){const e=this.parser,n=e.json.materials[A];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const s=[],o=n.extensions[this.name];if(o.clearcoatFactor!==void 0&&(t.clearcoat=o.clearcoatFactor),o.clearcoatTexture!==void 0&&s.push(e.assignTexture(t,"clearcoatMap",o.clearcoatTexture)),o.clearcoatRoughnessFactor!==void 0&&(t.clearcoatRoughness=o.clearcoatRoughnessFactor),o.clearcoatRoughnessTexture!==void 0&&s.push(e.assignTexture(t,"clearcoatRoughnessMap",o.clearcoatRoughnessTexture)),o.clearcoatNormalTexture!==void 0&&(s.push(e.assignTexture(t,"clearcoatNormalMap",o.clearcoatNormalTexture)),o.clearcoatNormalTexture.scale!==void 0)){const a=o.clearcoatNormalTexture.scale;t.clearcoatNormalScale=new TA(a,a)}return Promise.all(s)}}class fR{constructor(A){this.parser=A,this.name=ZA.KHR_MATERIALS_IRIDESCENCE}getMaterialType(A){const e=this.parser.json.materials[A];return!e.extensions||!e.extensions[this.name]?null:hn}extendMaterialParams(A,t){const e=this.parser,n=e.json.materials[A];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const s=[],o=n.extensions[this.name];return o.iridescenceFactor!==void 0&&(t.iridescence=o.iridescenceFactor),o.iridescenceTexture!==void 0&&s.push(e.assignTexture(t,"iridescenceMap",o.iridescenceTexture)),o.iridescenceIor!==void 0&&(t.iridescenceIOR=o.iridescenceIor),t.iridescenceThicknessRange===void 0&&(t.iridescenceThicknessRange=[100,400]),o.iridescenceThicknessMinimum!==void 0&&(t.iridescenceThicknessRange[0]=o.iridescenceThicknessMinimum),o.iridescenceThicknessMaximum!==void 0&&(t.iridescenceThicknessRange[1]=o.iridescenceThicknessMaximum),o.iridescenceThicknessTexture!==void 0&&s.push(e.assignTexture(t,"iridescenceThicknessMap",o.iridescenceThicknessTexture)),Promise.all(s)}}class pR{constructor(A){this.parser=A,this.name=ZA.KHR_MATERIALS_SHEEN}getMaterialType(A){const e=this.parser.json.materials[A];return!e.extensions||!e.extensions[this.name]?null:hn}extendMaterialParams(A,t){const e=this.parser,n=e.json.materials[A];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const s=[];t.sheenColor=new HA(0,0,0),t.sheenRoughness=0,t.sheen=1;const o=n.extensions[this.name];return o.sheenColorFactor!==void 0&&t.sheenColor.fromArray(o.sheenColorFactor),o.sheenRoughnessFactor!==void 0&&(t.sheenRoughness=o.sheenRoughnessFactor),o.sheenColorTexture!==void 0&&s.push(e.assignTexture(t,"sheenColorMap",o.sheenColorTexture,kA)),o.sheenRoughnessTexture!==void 0&&s.push(e.assignTexture(t,"sheenRoughnessMap",o.sheenRoughnessTexture)),Promise.all(s)}}class mR{constructor(A){this.parser=A,this.name=ZA.KHR_MATERIALS_TRANSMISSION}getMaterialType(A){const e=this.parser.json.materials[A];return!e.extensions||!e.extensions[this.name]?null:hn}extendMaterialParams(A,t){const e=this.parser,n=e.json.materials[A];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const s=[],o=n.extensions[this.name];return o.transmissionFactor!==void 0&&(t.transmission=o.transmissionFactor),o.transmissionTexture!==void 0&&s.push(e.assignTexture(t,"transmissionMap",o.transmissionTexture)),Promise.all(s)}}class yR{constructor(A){this.parser=A,this.name=ZA.KHR_MATERIALS_VOLUME}getMaterialType(A){const e=this.parser.json.materials[A];return!e.extensions||!e.extensions[this.name]?null:hn}extendMaterialParams(A,t){const e=this.parser,n=e.json.materials[A];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const s=[],o=n.extensions[this.name];t.thickness=o.thicknessFactor!==void 0?o.thicknessFactor:0,o.thicknessTexture!==void 0&&s.push(e.assignTexture(t,"thicknessMap",o.thicknessTexture)),t.attenuationDistance=o.attenuationDistance||1/0;const a=o.attenuationColor||[1,1,1];return t.attenuationColor=new HA(a[0],a[1],a[2]),Promise.all(s)}}class DR{constructor(A){this.parser=A,this.name=ZA.KHR_MATERIALS_IOR}getMaterialType(A){const e=this.parser.json.materials[A];return!e.extensions||!e.extensions[this.name]?null:hn}extendMaterialParams(A,t){const n=this.parser.json.materials[A];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const s=n.extensions[this.name];return t.ior=s.ior!==void 0?s.ior:1.5,Promise.resolve()}}class SR{constructor(A){this.parser=A,this.name=ZA.KHR_MATERIALS_SPECULAR}getMaterialType(A){const e=this.parser.json.materials[A];return!e.extensions||!e.extensions[this.name]?null:hn}extendMaterialParams(A,t){const e=this.parser,n=e.json.materials[A];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const s=[],o=n.extensions[this.name];t.specularIntensity=o.specularFactor!==void 0?o.specularFactor:1,o.specularTexture!==void 0&&s.push(e.assignTexture(t,"specularIntensityMap",o.specularTexture));const a=o.specularColorFactor||[1,1,1];return t.specularColor=new HA(a[0],a[1],a[2]),o.specularColorTexture!==void 0&&s.push(e.assignTexture(t,"specularColorMap",o.specularColorTexture,kA)),Promise.all(s)}}class wR{constructor(A){this.parser=A,this.name=ZA.KHR_MATERIALS_ANISOTROPY}getMaterialType(A){const e=this.parser.json.materials[A];return!e.extensions||!e.extensions[this.name]?null:hn}extendMaterialParams(A,t){const e=this.parser,n=e.json.materials[A];if(!n.extensions||!n.extensions[this.name])return Promise.resolve();const s=[],o=n.extensions[this.name];return o.anisotropyStrength!==void 0&&(t.anisotropy=o.anisotropyStrength),o.anisotropyRotation!==void 0&&(t.anisotropyRotation=o.anisotropyRotation),o.anisotropyTexture!==void 0&&s.push(e.assignTexture(t,"anisotropyMap",o.anisotropyTexture)),Promise.all(s)}}class MR{constructor(A){this.parser=A,this.name=ZA.KHR_TEXTURE_BASISU}loadTexture(A){const t=this.parser,e=t.json,n=e.textures[A];if(!n.extensions||!n.extensions[this.name])return null;const s=n.extensions[this.name],o=t.options.ktx2Loader;if(!o){if(e.extensionsRequired&&e.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures");return null}return t.loadTextureImage(A,s.source,o)}}class RR{constructor(A){this.parser=A,this.name=ZA.EXT_TEXTURE_WEBP,this.isSupported=null}loadTexture(A){const t=this.name,e=this.parser,n=e.json,s=n.textures[A];if(!s.extensions||!s.extensions[t])return null;const o=s.extensions[t],a=n.images[o.source];let g=e.textureLoader;if(a.uri){const r=e.options.manager.getHandler(a.uri);r!==null&&(g=r)}return this.detectSupport().then(function(r){if(r)return e.loadTextureImage(A,o.source,g);if(n.extensionsRequired&&n.extensionsRequired.indexOf(t)>=0)throw new Error("THREE.GLTFLoader: WebP required by asset but unsupported.");return e.loadTexture(A)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(A){const t=new Image;t.src="data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA",t.onload=t.onerror=function(){A(t.height===1)}})),this.isSupported}}class FR{constructor(A){this.parser=A,this.name=ZA.EXT_TEXTURE_AVIF,this.isSupported=null}loadTexture(A){const t=this.name,e=this.parser,n=e.json,s=n.textures[A];if(!s.extensions||!s.extensions[t])return null;const o=s.extensions[t],a=n.images[o.source];let g=e.textureLoader;if(a.uri){const r=e.options.manager.getHandler(a.uri);r!==null&&(g=r)}return this.detectSupport().then(function(r){if(r)return e.loadTextureImage(A,o.source,g);if(n.extensionsRequired&&n.extensionsRequired.indexOf(t)>=0)throw new Error("THREE.GLTFLoader: AVIF required by asset but unsupported.");return e.loadTexture(A)})}detectSupport(){return this.isSupported||(this.isSupported=new Promise(function(A){const t=new Image;t.src="data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAABcAAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQAMAAAAABNjb2xybmNseAACAAIABoAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAAB9tZGF0EgAKCBgABogQEDQgMgkQAAAAB8dSLfI=",t.onload=t.onerror=function(){A(t.height===1)}})),this.isSupported}}class xR{constructor(A){this.name=ZA.EXT_MESHOPT_COMPRESSION,this.parser=A}loadBufferView(A){const t=this.parser.json,e=t.bufferViews[A];if(e.extensions&&e.extensions[this.name]){const n=e.extensions[this.name],s=this.parser.getDependency("buffer",n.buffer),o=this.parser.options.meshoptDecoder;if(!o||!o.supported){if(t.extensionsRequired&&t.extensionsRequired.indexOf(this.name)>=0)throw new Error("THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files");return null}return s.then(function(a){const g=n.byteOffset||0,r=n.byteLength||0,I=n.count,B=n.byteStride,C=new Uint8Array(a,g,r);return o.decodeGltfBufferAsync?o.decodeGltfBufferAsync(I,B,C,n.mode,n.filter).then(function(Q){return Q.buffer}):o.ready.then(function(){const Q=new ArrayBuffer(I*B);return o.decodeGltfBuffer(new Uint8Array(Q),I,B,C,n.mode,n.filter),Q})})}else return null}}class NR{constructor(A){this.name=ZA.EXT_MESH_GPU_INSTANCING,this.parser=A}createNodeMesh(A){const t=this.parser.json,e=t.nodes[A];if(!e.extensions||!e.extensions[this.name]||e.mesh===void 0)return null;const n=t.meshes[e.mesh];for(const r of n.primitives)if(r.mode!==pe.TRIANGLES&&r.mode!==pe.TRIANGLE_STRIP&&r.mode!==pe.TRIANGLE_FAN&&r.mode!==void 0)return null;const o=e.extensions[this.name].attributes,a=[],g={};for(const r in o)a.push(this.parser.getDependency("accessor",o[r]).then(I=>(g[r]=I,g[r])));return a.length<1?null:(a.push(this.parser.createNodeMesh(A)),Promise.all(a).then(r=>{const I=r.pop(),B=I.isGroup?I.children:[I],C=r[0].count,Q=[];for(const c of B){const l=new zA,h=new P,E=new gi,f=new P(1,1,1),d=new zm(c.geometry,c.material,C);for(let u=0;u<C;u++)g.TRANSLATION&&h.fromBufferAttribute(g.TRANSLATION,u),g.ROTATION&&E.fromBufferAttribute(g.ROTATION,u),g.SCALE&&f.fromBufferAttribute(g.SCALE,u),d.setMatrixAt(u,l.compose(h,E,f));for(const u in g)u!=="TRANSLATION"&&u!=="ROTATION"&&u!=="SCALE"&&c.geometry.setAttribute(u,g[u]);Qt.prototype.copy.call(d,c),this.parser.assignFinalMaterial(d),Q.push(d)}return I.isGroup?(I.clear(),I.add(...Q),I):Q[0]}))}}const Bl="glTF",_o=12,sQ={JSON:1313821514,BIN:5130562};class _R{constructor(A){this.name=ZA.KHR_BINARY_GLTF,this.content=null,this.body=null;const t=new DataView(A,0,_o),e=new TextDecoder;if(this.header={magic:e.decode(new Uint8Array(A.slice(0,4))),version:t.getUint32(4,!0),length:t.getUint32(8,!0)},this.header.magic!==Bl)throw new Error("THREE.GLTFLoader: Unsupported glTF-Binary header.");if(this.header.version<2)throw new Error("THREE.GLTFLoader: Legacy binary file detected.");const n=this.header.length-_o,s=new DataView(A,_o);let o=0;for(;o<n;){const a=s.getUint32(o,!0);o+=4;const g=s.getUint32(o,!0);if(o+=4,g===sQ.JSON){const r=new Uint8Array(A,_o+o,a);this.content=e.decode(r)}else if(g===sQ.BIN){const r=_o+o;this.body=A.slice(r,r+a)}o+=a}if(this.content===null)throw new Error("THREE.GLTFLoader: JSON content not found.")}}class GR{constructor(A,t){if(!t)throw new Error("THREE.GLTFLoader: No DRACOLoader instance provided.");this.name=ZA.KHR_DRACO_MESH_COMPRESSION,this.json=A,this.dracoLoader=t,this.dracoLoader.preload()}decodePrimitive(A,t){const e=this.json,n=this.dracoLoader,s=A.extensions[this.name].bufferView,o=A.extensions[this.name].attributes,a={},g={},r={};for(const I in o){const B=$I[I]||I.toLowerCase();a[B]=o[I]}for(const I in A.attributes){const B=$I[I]||I.toLowerCase();if(o[I]!==void 0){const C=e.accessors[A.attributes[I]],Q=Os[C.componentType];r[B]=Q.name,g[B]=C.normalized===!0}}return t.getDependency("bufferView",s).then(function(I){return new Promise(function(B){n.decodeDracoFile(I,function(C){for(const Q in C.attributes){const c=C.attributes[Q],l=g[Q];l!==void 0&&(c.normalized=l)}B(C)},a,r)})})}}class LR{constructor(){this.name=ZA.KHR_TEXTURE_TRANSFORM}extendTexture(A,t){return(t.texCoord===void 0||t.texCoord===A.channel)&&t.offset===void 0&&t.rotation===void 0&&t.scale===void 0||(A=A.clone(),t.texCoord!==void 0&&(A.channel=t.texCoord),t.offset!==void 0&&A.offset.fromArray(t.offset),t.rotation!==void 0&&(A.rotation=t.rotation),t.scale!==void 0&&A.repeat.fromArray(t.scale),A.needsUpdate=!0),A}}class UR{constructor(){this.name=ZA.KHR_MESH_QUANTIZATION}}class Cl extends ga{constructor(A,t,e,n){super(A,t,e,n)}copySampleValue_(A){const t=this.resultBuffer,e=this.sampleValues,n=this.valueSize,s=A*n*3+n;for(let o=0;o!==n;o++)t[o]=e[s+o];return t}interpolate_(A,t,e,n){const s=this.resultBuffer,o=this.sampleValues,a=this.valueSize,g=a*2,r=a*3,I=n-t,B=(e-t)/I,C=B*B,Q=C*B,c=A*r,l=c-r,h=-2*Q+3*C,E=Q-C,f=1-h,d=E-C+B;for(let u=0;u!==a;u++){const m=o[l+u+a],y=o[l+u+g]*I,p=o[c+u+a],R=o[c+u]*I;s[u]=f*m+d*y+h*p+E*R}return s}}const bR=new gi;class vR extends Cl{interpolate_(A,t,e,n){const s=super.interpolate_(A,t,e,n);return bR.fromArray(s).normalize().toArray(s),s}}const pe={FLOAT:5126,FLOAT_MAT3:35675,FLOAT_MAT4:35676,FLOAT_VEC2:35664,FLOAT_VEC3:35665,FLOAT_VEC4:35666,LINEAR:9729,REPEAT:10497,SAMPLER_2D:35678,POINTS:0,LINES:1,LINE_LOOP:2,LINE_STRIP:3,TRIANGLES:4,TRIANGLE_STRIP:5,TRIANGLE_FAN:6,UNSIGNED_BYTE:5121,UNSIGNED_SHORT:5123},Os={5120:Int8Array,5121:Uint8Array,5122:Int16Array,5123:Uint16Array,5125:Uint32Array,5126:Float32Array},oQ={9728:Ut,9729:Dt,9984:vI,9985:xQ,9986:pr,9987:En},aQ={33071:Yt,33648:Cn,10497:Bn},xI={SCALAR:1,VEC2:2,VEC3:3,VEC4:4,MAT2:4,MAT3:9,MAT4:16},$I={POSITION:"position",NORMAL:"normal",TANGENT:"tangent",TEXCOORD_0:"uv",TEXCOORD_1:"uv1",TEXCOORD_2:"uv2",TEXCOORD_3:"uv3",COLOR_0:"color",WEIGHTS_0:"skinWeight",JOINTS_0:"skinIndex"},Xi={scale:"scale",translation:"position",rotation:"quaternion",weights:"morphTargetInfluences"},kR={CUBICSPLINE:void 0,LINEAR:Zs,STEP:Wo},NI={OPAQUE:"OPAQUE",MASK:"MASK",BLEND:"BLEND"};function TR(i){return i.DefaultMaterial===void 0&&(i.DefaultMaterial=new Ao({color:16777215,emissive:0,metalness:1,roughness:1,transparent:!1,depthTest:!0,side:vi})),i.DefaultMaterial}function wn(i,A,t){for(const e in t.extensions)i[e]===void 0&&(A.userData.gltfExtensions=A.userData.gltfExtensions||{},A.userData.gltfExtensions[e]=t.extensions[e])}function An(i,A){A.extras!==void 0&&(typeof A.extras=="object"?Object.assign(i.userData,A.extras):console.warn("THREE.GLTFLoader: Ignoring primitive type .extras, "+A.extras))}function HR(i,A,t){let e=!1,n=!1,s=!1;for(let r=0,I=A.length;r<I;r++){const B=A[r];if(B.POSITION!==void 0&&(e=!0),B.NORMAL!==void 0&&(n=!0),B.COLOR_0!==void 0&&(s=!0),e&&n&&s)break}if(!e&&!n&&!s)return Promise.resolve(i);const o=[],a=[],g=[];for(let r=0,I=A.length;r<I;r++){const B=A[r];if(e){const C=B.POSITION!==void 0?t.getDependency("accessor",B.POSITION):i.attributes.position;o.push(C)}if(n){const C=B.NORMAL!==void 0?t.getDependency("accessor",B.NORMAL):i.attributes.normal;a.push(C)}if(s){const C=B.COLOR_0!==void 0?t.getDependency("accessor",B.COLOR_0):i.attributes.color;g.push(C)}}return Promise.all([Promise.all(o),Promise.all(a),Promise.all(g)]).then(function(r){const I=r[0],B=r[1],C=r[2];return e&&(i.morphAttributes.position=I),n&&(i.morphAttributes.normal=B),s&&(i.morphAttributes.color=C),i.morphTargetsRelative=!0,i})}function qR(i,A){if(i.updateMorphTargets(),A.weights!==void 0)for(let t=0,e=A.weights.length;t<e;t++)i.morphTargetInfluences[t]=A.weights[t];if(A.extras&&Array.isArray(A.extras.targetNames)){const t=A.extras.targetNames;if(i.morphTargetInfluences.length===t.length){i.morphTargetDictionary={};for(let e=0,n=t.length;e<n;e++)i.morphTargetDictionary[t[e]]=e}else console.warn("THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.")}}function JR(i){let A;const t=i.extensions&&i.extensions[ZA.KHR_DRACO_MESH_COMPRESSION];if(t?A="draco:"+t.bufferView+":"+t.indices+":"+_I(t.attributes):A=i.indices+":"+_I(i.attributes)+":"+i.mode,i.targets!==void 0)for(let e=0,n=i.targets.length;e<n;e++)A+=":"+_I(i.targets[e]);return A}function _I(i){let A="";const t=Object.keys(i).sort();for(let e=0,n=t.length;e<n;e++)A+=t[e]+":"+i[t[e]]+";";return A}function AB(i){switch(i){case Int8Array:return 1/127;case Uint8Array:return 1/255;case Int16Array:return 1/32767;case Uint16Array:return 1/65535;default:throw new Error("THREE.GLTFLoader: Unsupported normalized accessor component type.")}}function KR(i){return i.search(/\.jpe?g($|\?)/i)>0||i.search(/^data\:image\/jpeg/)===0?"image/jpeg":i.search(/\.webp($|\?)/i)>0||i.search(/^data\:image\/webp/)===0?"image/webp":"image/png"}const YR=new zA;class PR{constructor(A={},t={}){this.json=A,this.extensions={},this.plugins={},this.options=t,this.cache=new QR,this.associations=new Map,this.primitiveCache={},this.nodeCache={},this.meshCache={refs:{},uses:{}},this.cameraCache={refs:{},uses:{}},this.lightCache={refs:{},uses:{}},this.sourceCache={},this.textureCache={},this.nodeNamesUsed={};let e=!1,n=!1,s=-1;typeof navigator<"u"&&(e=/^((?!chrome|android).)*safari/i.test(navigator.userAgent)===!0,n=navigator.userAgent.indexOf("Firefox")>-1,s=n?navigator.userAgent.match(/Firefox\/([0-9]+)\./)[1]:-1),typeof createImageBitmap>"u"||e||n&&s<98?this.textureLoader=new Bc(this.options.manager):this.textureLoader=new cy(this.options.manager),this.textureLoader.setCrossOrigin(this.options.crossOrigin),this.textureLoader.setRequestHeader(this.options.requestHeader),this.fileLoader=new wB(this.options.manager),this.fileLoader.setResponseType("arraybuffer"),this.options.crossOrigin==="use-credentials"&&this.fileLoader.setWithCredentials(!0)}setExtensions(A){this.extensions=A}setPlugins(A){this.plugins=A}parse(A,t){const e=this,n=this.json,s=this.extensions;this.cache.removeAll(),this.nodeCache={},this._invokeAll(function(o){return o._markDefs&&o._markDefs()}),Promise.all(this._invokeAll(function(o){return o.beforeRoot&&o.beforeRoot()})).then(function(){return Promise.all([e.getDependencies("scene"),e.getDependencies("animation"),e.getDependencies("camera")])}).then(function(o){const a={scene:o[0][n.scene||0],scenes:o[0],animations:o[1],cameras:o[2],asset:n.asset,parser:e,userData:{}};wn(s,a,n),An(a,n),Promise.all(e._invokeAll(function(g){return g.afterRoot&&g.afterRoot(a)})).then(function(){A(a)})}).catch(t)}_markDefs(){const A=this.json.nodes||[],t=this.json.skins||[],e=this.json.meshes||[];for(let n=0,s=t.length;n<s;n++){const o=t[n].joints;for(let a=0,g=o.length;a<g;a++)A[o[a]].isBone=!0}for(let n=0,s=A.length;n<s;n++){const o=A[n];o.mesh!==void 0&&(this._addNodeRef(this.meshCache,o.mesh),o.skin!==void 0&&(e[o.mesh].isSkinnedMesh=!0)),o.camera!==void 0&&this._addNodeRef(this.cameraCache,o.camera)}}_addNodeRef(A,t){t!==void 0&&(A.refs[t]===void 0&&(A.refs[t]=A.uses[t]=0),A.refs[t]++)}_getNodeRef(A,t,e){if(A.refs[t]<=1)return e;const n=e.clone(),s=(o,a)=>{const g=this.associations.get(o);g!=null&&this.associations.set(a,g);for(const[r,I]of o.children.entries())s(I,a.children[r])};return s(e,n),n.name+="_instance_"+A.uses[t]++,n}_invokeOne(A){const t=Object.values(this.plugins);t.push(this);for(let e=0;e<t.length;e++){const n=A(t[e]);if(n)return n}return null}_invokeAll(A){const t=Object.values(this.plugins);t.unshift(this);const e=[];for(let n=0;n<t.length;n++){const s=A(t[n]);s&&e.push(s)}return e}getDependency(A,t){const e=A+":"+t;let n=this.cache.get(e);if(!n){switch(A){case"scene":n=this.loadScene(t);break;case"node":n=this._invokeOne(function(s){return s.loadNode&&s.loadNode(t)});break;case"mesh":n=this._invokeOne(function(s){return s.loadMesh&&s.loadMesh(t)});break;case"accessor":n=this.loadAccessor(t);break;case"bufferView":n=this._invokeOne(function(s){return s.loadBufferView&&s.loadBufferView(t)});break;case"buffer":n=this.loadBuffer(t);break;case"material":n=this._invokeOne(function(s){return s.loadMaterial&&s.loadMaterial(t)});break;case"texture":n=this._invokeOne(function(s){return s.loadTexture&&s.loadTexture(t)});break;case"skin":n=this.loadSkin(t);break;case"animation":n=this._invokeOne(function(s){return s.loadAnimation&&s.loadAnimation(t)});break;case"camera":n=this.loadCamera(t);break;default:if(n=this._invokeOne(function(s){return s!=this&&s.getDependency&&s.getDependency(A,t)}),!n)throw new Error("Unknown type: "+A);break}this.cache.add(e,n)}return n}getDependencies(A){let t=this.cache.get(A);if(!t){const e=this,n=this.json[A+(A==="mesh"?"es":"s")]||[];t=Promise.all(n.map(function(s,o){return e.getDependency(A,o)})),this.cache.add(A,t)}return t}loadBuffer(A){const t=this.json.buffers[A],e=this.fileLoader;if(t.type&&t.type!=="arraybuffer")throw new Error("THREE.GLTFLoader: "+t.type+" buffer type is not supported.");if(t.uri===void 0&&A===0)return Promise.resolve(this.extensions[ZA.KHR_BINARY_GLTF].body);const n=this.options;return new Promise(function(s,o){e.load(YI.resolveURL(t.uri,n.path),s,void 0,function(){o(new Error('THREE.GLTFLoader: Failed to load buffer "'+t.uri+'".'))})})}loadBufferView(A){const t=this.json.bufferViews[A];return this.getDependency("buffer",t.buffer).then(function(e){const n=t.byteLength||0,s=t.byteOffset||0;return e.slice(s,s+n)})}loadAccessor(A){const t=this,e=this.json,n=this.json.accessors[A];if(n.bufferView===void 0&&n.sparse===void 0){const o=xI[n.type],a=Os[n.componentType],g=n.normalized===!0,r=new a(n.count*o);return Promise.resolve(new Zt(r,o,g))}const s=[];return n.bufferView!==void 0?s.push(this.getDependency("bufferView",n.bufferView)):s.push(null),n.sparse!==void 0&&(s.push(this.getDependency("bufferView",n.sparse.indices.bufferView)),s.push(this.getDependency("bufferView",n.sparse.values.bufferView))),Promise.all(s).then(function(o){const a=o[0],g=xI[n.type],r=Os[n.componentType],I=r.BYTES_PER_ELEMENT,B=I*g,C=n.byteOffset||0,Q=n.bufferView!==void 0?e.bufferViews[n.bufferView].byteStride:void 0,c=n.normalized===!0;let l,h;if(Q&&Q!==B){const E=Math.floor(C/Q),f="InterleavedBuffer:"+n.bufferView+":"+n.componentType+":"+E+":"+n.count;let d=t.cache.get(f);d||(l=new r(a,E*Q,n.count*Q/I),d=new Ym(l,Q/I),t.cache.add(f,d)),h=new yB(d,g,C%Q/I,c)}else a===null?l=new r(n.count*g):l=new r(a,C,n.count*g),h=new Zt(l,g,c);if(n.sparse!==void 0){const E=xI.SCALAR,f=Os[n.sparse.indices.componentType],d=n.sparse.indices.byteOffset||0,u=n.sparse.values.byteOffset||0,m=new f(o[1],d,n.sparse.count*E),y=new r(o[2],u,n.sparse.count*g);a!==null&&(h=new Zt(h.array.slice(),h.itemSize,h.normalized));for(let p=0,R=m.length;p<R;p++){const D=m[p];if(h.setX(D,y[p*g]),g>=2&&h.setY(D,y[p*g+1]),g>=3&&h.setZ(D,y[p*g+2]),g>=4&&h.setW(D,y[p*g+3]),g>=5)throw new Error("THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.")}}return h})}loadTexture(A){const t=this.json,e=this.options,s=t.textures[A].source,o=t.images[s];let a=this.textureLoader;if(o.uri){const g=e.manager.getHandler(o.uri);g!==null&&(a=g)}return this.loadTextureImage(A,s,a)}loadTextureImage(A,t,e){const n=this,s=this.json,o=s.textures[A],a=s.images[t],g=(a.uri||a.bufferView)+":"+o.sampler;if(this.textureCache[g])return this.textureCache[g];const r=this.loadImageSource(t,e).then(function(I){I.flipY=!1,I.name=o.name||a.name||"",I.name===""&&typeof a.uri=="string"&&a.uri.startsWith("data:image/")===!1&&(I.name=a.uri);const C=(s.samplers||{})[o.sampler]||{};return I.magFilter=oQ[C.magFilter]||Dt,I.minFilter=oQ[C.minFilter]||En,I.wrapS=aQ[C.wrapS]||Bn,I.wrapT=aQ[C.wrapT]||Bn,n.associations.set(I,{textures:A}),I}).catch(function(){return null});return this.textureCache[g]=r,r}loadImageSource(A,t){const e=this,n=this.json,s=this.options;if(this.sourceCache[A]!==void 0)return this.sourceCache[A].then(B=>B.clone());const o=n.images[A],a=self.URL||self.webkitURL;let g=o.uri||"",r=!1;if(o.bufferView!==void 0)g=e.getDependency("bufferView",o.bufferView).then(function(B){r=!0;const C=new Blob([B],{type:o.mimeType});return g=a.createObjectURL(C),g});else if(o.uri===void 0)throw new Error("THREE.GLTFLoader: Image "+A+" is missing URI and bufferView");const I=Promise.resolve(g).then(function(B){return new Promise(function(C,Q){let c=C;t.isImageBitmapLoader===!0&&(c=function(l){const h=new Tt(l);h.needsUpdate=!0,C(h)}),t.load(YI.resolveURL(B,s.path),c,void 0,Q)})}).then(function(B){return r===!0&&a.revokeObjectURL(g),B.userData.mimeType=o.mimeType||KR(o.uri),B}).catch(function(B){throw console.error("THREE.GLTFLoader: Couldn't load texture",g),B});return this.sourceCache[A]=I,I}assignTexture(A,t,e,n){const s=this;return this.getDependency("texture",e.index).then(function(o){if(!o)return null;if(e.texCoord!==void 0&&e.texCoord>0&&(o=o.clone(),o.channel=e.texCoord),s.extensions[ZA.KHR_TEXTURE_TRANSFORM]){const a=e.extensions!==void 0?e.extensions[ZA.KHR_TEXTURE_TRANSFORM]:void 0;if(a){const g=s.associations.get(o);o=s.extensions[ZA.KHR_TEXTURE_TRANSFORM].extendTexture(o,a),s.associations.set(o,g)}}return n!==void 0&&(o.colorSpace=n),A[t]=o,o})}assignFinalMaterial(A){const t=A.geometry;let e=A.material;const n=t.attributes.tangent===void 0,s=t.attributes.color!==void 0,o=t.attributes.normal===void 0;if(A.isPoints){const a="PointsMaterial:"+e.uuid;let g=this.cache.get(a);g||(g=new ac,We.prototype.copy.call(g,e),g.color.copy(e.color),g.map=e.map,g.sizeAttenuation=!1,this.cache.add(a,g)),e=g}else if(A.isLine){const a="LineBasicMaterial:"+e.uuid;let g=this.cache.get(a);g||(g=new oc,We.prototype.copy.call(g,e),g.color.copy(e.color),g.map=e.map,this.cache.add(a,g)),e=g}if(n||s||o){let a="ClonedMaterial:"+e.uuid+":";n&&(a+="derivative-tangents:"),s&&(a+="vertex-colors:"),o&&(a+="flat-shading:");let g=this.cache.get(a);g||(g=e.clone(),s&&(g.vertexColors=!0),o&&(g.flatShading=!0),n&&(g.normalScale&&(g.normalScale.y*=-1),g.clearcoatNormalScale&&(g.clearcoatNormalScale.y*=-1)),this.cache.add(a,g),this.associations.set(g,this.associations.get(e))),e=g}A.material=e}getMaterialType(){return Ao}loadMaterial(A){const t=this,e=this.json,n=this.extensions,s=e.materials[A];let o;const a={},g=s.extensions||{},r=[];if(g[ZA.KHR_MATERIALS_UNLIT]){const B=n[ZA.KHR_MATERIALS_UNLIT];o=B.getMaterialType(),r.push(B.extendParams(a,s,t))}else{const B=s.pbrMetallicRoughness||{};if(a.color=new HA(1,1,1),a.opacity=1,Array.isArray(B.baseColorFactor)){const C=B.baseColorFactor;a.color.fromArray(C),a.opacity=C[3]}B.baseColorTexture!==void 0&&r.push(t.assignTexture(a,"map",B.baseColorTexture,kA)),a.metalness=B.metallicFactor!==void 0?B.metallicFactor:1,a.roughness=B.roughnessFactor!==void 0?B.roughnessFactor:1,B.metallicRoughnessTexture!==void 0&&(r.push(t.assignTexture(a,"metalnessMap",B.metallicRoughnessTexture)),r.push(t.assignTexture(a,"roughnessMap",B.metallicRoughnessTexture))),o=this._invokeOne(function(C){return C.getMaterialType&&C.getMaterialType(A)}),r.push(Promise.all(this._invokeAll(function(C){return C.extendMaterialParams&&C.extendMaterialParams(A,a)})))}s.doubleSided===!0&&(a.side=ii);const I=s.alphaMode||NI.OPAQUE;if(I===NI.BLEND?(a.transparent=!0,a.depthWrite=!1):(a.transparent=!1,I===NI.MASK&&(a.alphaTest=s.alphaCutoff!==void 0?s.alphaCutoff:.5)),s.normalTexture!==void 0&&o!==Qe&&(r.push(t.assignTexture(a,"normalMap",s.normalTexture)),a.normalScale=new TA(1,1),s.normalTexture.scale!==void 0)){const B=s.normalTexture.scale;a.normalScale.set(B,B)}return s.occlusionTexture!==void 0&&o!==Qe&&(r.push(t.assignTexture(a,"aoMap",s.occlusionTexture)),s.occlusionTexture.strength!==void 0&&(a.aoMapIntensity=s.occlusionTexture.strength)),s.emissiveFactor!==void 0&&o!==Qe&&(a.emissive=new HA().fromArray(s.emissiveFactor)),s.emissiveTexture!==void 0&&o!==Qe&&r.push(t.assignTexture(a,"emissiveMap",s.emissiveTexture,kA)),Promise.all(r).then(function(){const B=new o(a);return s.name&&(B.name=s.name),An(B,s),t.associations.set(B,{materials:A}),s.extensions&&wn(n,B,s),B})}createUniqueName(A){const t=st.sanitizeNodeName(A||"");return t in this.nodeNamesUsed?t+"_"+ ++this.nodeNamesUsed[t]:(this.nodeNamesUsed[t]=0,t)}loadGeometries(A){const t=this,e=this.extensions,n=this.primitiveCache;function s(a){return e[ZA.KHR_DRACO_MESH_COMPRESSION].decodePrimitive(a,t).then(function(g){return rQ(g,a,t)})}const o=[];for(let a=0,g=A.length;a<g;a++){const r=A[a],I=JR(r),B=n[I];if(B)o.push(B.promise);else{let C;r.extensions&&r.extensions[ZA.KHR_DRACO_MESH_COMPRESSION]?C=s(r):C=rQ(new Ze,r,t),n[I]={primitive:r,promise:C},o.push(C)}}return Promise.all(o)}loadMesh(A){const t=this,e=this.json,n=this.extensions,s=e.meshes[A],o=s.primitives,a=[];for(let g=0,r=o.length;g<r;g++){const I=o[g].material===void 0?TR(this.cache):this.getDependency("material",o[g].material);a.push(I)}return a.push(t.loadGeometries(o)),Promise.all(a).then(function(g){const r=g.slice(0,g.length-1),I=g[g.length-1],B=[];for(let Q=0,c=I.length;Q<c;Q++){const l=I[Q],h=o[Q];let E;const f=r[Q];if(h.mode===pe.TRIANGLES||h.mode===pe.TRIANGLE_STRIP||h.mode===pe.TRIANGLE_FAN||h.mode===void 0)E=s.isSkinnedMesh===!0?new Om(l,f):new dt(l,f),E.isSkinnedMesh===!0&&E.normalizeSkinWeights(),h.mode===pe.TRIANGLE_STRIP?E.geometry=nQ(E.geometry,vQ):h.mode===pe.TRIANGLE_FAN&&(E.geometry=nQ(E.geometry,kI));else if(h.mode===pe.LINES)E=new Xm(l,f);else if(h.mode===pe.LINE_STRIP)E=new SB(l,f);else if(h.mode===pe.LINE_LOOP)E=new Zm(l,f);else if(h.mode===pe.POINTS)E=new jm(l,f);else throw new Error("THREE.GLTFLoader: Primitive mode unsupported: "+h.mode);Object.keys(E.geometry.morphAttributes).length>0&&qR(E,s),E.name=t.createUniqueName(s.name||"mesh_"+A),An(E,s),h.extensions&&wn(n,E,h),t.assignFinalMaterial(E),B.push(E)}for(let Q=0,c=B.length;Q<c;Q++)t.associations.set(B[Q],{meshes:A,primitives:Q});if(B.length===1)return s.extensions&&wn(n,B[0],s),B[0];const C=new Ke;s.extensions&&wn(n,C,s),t.associations.set(C,{meshes:A});for(let Q=0,c=B.length;Q<c;Q++)C.add(B[Q]);return C})}loadCamera(A){let t;const e=this.json.cameras[A],n=e[e.type];if(!n){console.warn("THREE.GLTFLoader: Missing camera parameters.");return}return e.type==="perspective"?t=new zt(Ud.radToDeg(n.yfov),n.aspectRatio||1,n.znear||1,n.zfar||2e6):e.type==="orthographic"&&(t=new pB(-n.xmag,n.xmag,n.ymag,-n.ymag,n.znear,n.zfar)),e.name&&(t.name=this.createUniqueName(e.name)),An(t,e),Promise.resolve(t)}loadSkin(A){const t=this.json.skins[A],e=[];for(let n=0,s=t.joints.length;n<s;n++)e.push(this._loadNodeShallow(t.joints[n]));return t.inverseBindMatrices!==void 0?e.push(this.getDependency("accessor",t.inverseBindMatrices)):e.push(null),Promise.all(e).then(function(n){const s=n.pop(),o=n,a=[],g=[];for(let r=0,I=o.length;r<I;r++){const B=o[r];if(B){a.push(B);const C=new zA;s!==null&&C.fromArray(s.array,r*16),g.push(C)}else console.warn('THREE.GLTFLoader: Joint "%s" could not be found.',t.joints[r])}return new DB(a,g)})}loadAnimation(A){const e=this.json.animations[A],n=e.name?e.name:"animation_"+A,s=[],o=[],a=[],g=[],r=[];for(let I=0,B=e.channels.length;I<B;I++){const C=e.channels[I],Q=e.samplers[C.sampler],c=C.target,l=c.node,h=e.parameters!==void 0?e.parameters[Q.input]:Q.input,E=e.parameters!==void 0?e.parameters[Q.output]:Q.output;c.node!==void 0&&(s.push(this.getDependency("node",l)),o.push(this.getDependency("accessor",h)),a.push(this.getDependency("accessor",E)),g.push(Q),r.push(c))}return Promise.all([Promise.all(s),Promise.all(o),Promise.all(a),Promise.all(g),Promise.all(r)]).then(function(I){const B=I[0],C=I[1],Q=I[2],c=I[3],l=I[4],h=[];for(let E=0,f=B.length;E<f;E++){const d=B[E],u=C[E],m=Q[E],y=c[E],p=l[E];if(d===void 0)continue;d.updateMatrix();let R;switch(Xi[p.path]){case Xi.weights:R=zo;break;case Xi.rotation:R=Jn;break;case Xi.position:case Xi.scale:default:R=Xo;break}const D=d.name?d.name:d.uuid,S=y.interpolation!==void 0?kR[y.interpolation]:Zs,F=[];Xi[p.path]===Xi.weights?d.traverse(function(L){L.morphTargetInfluences&&F.push(L.name?L.name:L.uuid)}):F.push(D);let G=m.array;if(m.normalized){const L=AB(G.constructor),T=new Float32Array(G.length);for(let b=0,V=G.length;b<V;b++)T[b]=G[b]*L;G=T}for(let L=0,T=F.length;L<T;L++){const b=new R(F[L]+"."+Xi[p.path],u.array,G,S);y.interpolation==="CUBICSPLINE"&&(b.createInterpolant=function(K){const tA=this instanceof Jn?vR:Cl;return new tA(this.times,this.values,this.getValueSize()/3,K)},b.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline=!0),h.push(b)}}return new sy(n,void 0,h)})}createNodeMesh(A){const t=this.json,e=this,n=t.nodes[A];return n.mesh===void 0?null:e.getDependency("mesh",n.mesh).then(function(s){const o=e._getNodeRef(e.meshCache,n.mesh,s);return n.weights!==void 0&&o.traverse(function(a){if(!!a.isMesh)for(let g=0,r=n.weights.length;g<r;g++)a.morphTargetInfluences[g]=n.weights[g]}),o})}loadNode(A){const t=this.json,e=this,n=t.nodes[A],s=e._loadNodeShallow(A),o=[],a=n.children||[];for(let r=0,I=a.length;r<I;r++)o.push(e.getDependency("node",a[r]));const g=n.skin===void 0?Promise.resolve(null):e.getDependency("skin",n.skin);return Promise.all([s,Promise.all(o),g]).then(function(r){const I=r[0],B=r[1],C=r[2];C!==null&&I.traverse(function(Q){!Q.isSkinnedMesh||Q.bind(C,YR)});for(let Q=0,c=B.length;Q<c;Q++)I.add(B[Q]);return I})}_loadNodeShallow(A){const t=this.json,e=this.extensions,n=this;if(this.nodeCache[A]!==void 0)return this.nodeCache[A];const s=t.nodes[A],o=s.name?n.createUniqueName(s.name):"",a=[],g=n._invokeOne(function(r){return r.createNodeMesh&&r.createNodeMesh(A)});return g&&a.push(g),s.camera!==void 0&&a.push(n.getDependency("camera",s.camera).then(function(r){return n._getNodeRef(n.cameraCache,s.camera,r)})),n._invokeAll(function(r){return r.createNodeAttachment&&r.createNodeAttachment(A)}).forEach(function(r){a.push(r)}),this.nodeCache[A]=Promise.all(a).then(function(r){let I;if(s.isBone===!0?I=new nc:r.length>1?I=new Ke:r.length===1?I=r[0]:I=new Qt,I!==r[0])for(let B=0,C=r.length;B<C;B++)I.add(r[B]);if(s.name&&(I.userData.name=s.name,I.name=o),An(I,s),s.extensions&&wn(e,I,s),s.matrix!==void 0){const B=new zA;B.fromArray(s.matrix),I.applyMatrix4(B)}else s.translation!==void 0&&I.position.fromArray(s.translation),s.rotation!==void 0&&I.quaternion.fromArray(s.rotation),s.scale!==void 0&&I.scale.fromArray(s.scale);return n.associations.has(I)||n.associations.set(I,{}),n.associations.get(I).nodes=A,I}),this.nodeCache[A]}loadScene(A){const t=this.extensions,e=this.json.scenes[A],n=this,s=new Ke;e.name&&(s.name=n.createUniqueName(e.name)),An(s,e),e.extensions&&wn(t,s,e);const o=e.nodes||[],a=[];for(let g=0,r=o.length;g<r;g++)a.push(n.getDependency("node",o[g]));return Promise.all(a).then(function(g){for(let I=0,B=g.length;I<B;I++)s.add(g[I]);const r=I=>{const B=new Map;for(const[C,Q]of n.associations)(C instanceof We||C instanceof Tt)&&B.set(C,Q);return I.traverse(C=>{const Q=n.associations.get(C);Q!=null&&B.set(C,Q)}),B};return n.associations=r(s),s})}}function OR(i,A,t){const e=A.attributes,n=new xe;if(e.POSITION!==void 0){const a=t.json.accessors[e.POSITION],g=a.min,r=a.max;if(g!==void 0&&r!==void 0){if(n.set(new P(g[0],g[1],g[2]),new P(r[0],r[1],r[2])),a.normalized){const I=AB(Os[a.componentType]);n.min.multiplyScalar(I),n.max.multiplyScalar(I)}}else{console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.");return}}else return;const s=A.targets;if(s!==void 0){const a=new P,g=new P;for(let r=0,I=s.length;r<I;r++){const B=s[r];if(B.POSITION!==void 0){const C=t.json.accessors[B.POSITION],Q=C.min,c=C.max;if(Q!==void 0&&c!==void 0){if(g.setX(Math.max(Math.abs(Q[0]),Math.abs(c[0]))),g.setY(Math.max(Math.abs(Q[1]),Math.abs(c[1]))),g.setZ(Math.max(Math.abs(Q[2]),Math.abs(c[2]))),C.normalized){const l=AB(Os[C.componentType]);g.multiplyScalar(l)}a.max(g)}else console.warn("THREE.GLTFLoader: Missing min/max properties for accessor POSITION.")}}n.expandByVector(a)}i.boundingBox=n;const o=new Ii;n.getCenter(o.center),o.radius=n.min.distanceTo(n.max)/2,i.boundingSphere=o}function rQ(i,A,t){const e=A.attributes,n=[];function s(o,a){return t.getDependency("accessor",o).then(function(g){i.setAttribute(a,g)})}for(const o in e){const a=$I[o]||o.toLowerCase();a in i.attributes||n.push(s(e[o],a))}if(A.indices!==void 0&&!i.index){const o=t.getDependency("accessor",A.indices).then(function(a){i.setIndex(a)});n.push(o)}return An(i,A),OR(i,A,t),Promise.all(n).then(function(){return A.targets!==void 0?HR(i,A.targets,t):i})}class WR extends Cy{constructor(A){super(A),this.type=_i}parse(A){const a=function(d,u){switch(d){case 1:console.error("THREE.RGBELoader Read Error: "+(u||""));break;case 2:console.error("THREE.RGBELoader Write Error: "+(u||""));break;case 3:console.error("THREE.RGBELoader Bad File Format: "+(u||""));break;default:case 4:console.error("THREE.RGBELoader: Error: "+(u||""))}return-1},B=`
`,C=function(d,u,m){u=u||1024;let p=d.pos,R=-1,D=0,S="",F=String.fromCharCode.apply(null,new Uint16Array(d.subarray(p,p+128)));for(;0>(R=F.indexOf(B))&&D<u&&p<d.byteLength;)S+=F,D+=F.length,p+=128,F+=String.fromCharCode.apply(null,new Uint16Array(d.subarray(p,p+128)));return-1<R?(m!==!1&&(d.pos+=D+R+1),S+F.slice(0,R)):!1},Q=function(d){const u=/^#\?(\S+)/,m=/^\s*GAMMA\s*=\s*(\d+(\.\d+)?)\s*$/,y=/^\s*EXPOSURE\s*=\s*(\d+(\.\d+)?)\s*$/,p=/^\s*FORMAT=(\S+)\s*$/,R=/^\s*\-Y\s+(\d+)\s+\+X\s+(\d+)\s*$/,D={valid:0,string:"",comments:"",programtype:"RGBE",format:"",gamma:1,exposure:1,width:0,height:0};let S,F;if(d.pos>=d.byteLength||!(S=C(d)))return a(1,"no header found");if(!(F=S.match(u)))return a(3,"bad initial token");for(D.valid|=1,D.programtype=F[1],D.string+=S+`
`;S=C(d),S!==!1;){if(D.string+=S+`
`,S.charAt(0)==="#"){D.comments+=S+`
`;continue}if((F=S.match(m))&&(D.gamma=parseFloat(F[1])),(F=S.match(y))&&(D.exposure=parseFloat(F[1])),(F=S.match(p))&&(D.valid|=2,D.format=F[1]),(F=S.match(R))&&(D.valid|=4,D.height=parseInt(F[1],10),D.width=parseInt(F[2],10)),D.valid&2&&D.valid&4)break}return D.valid&2?D.valid&4?D:a(3,"missing image size specifier"):a(3,"missing format specifier")},c=function(d,u,m){const y=u;if(y<8||y>32767||d[0]!==2||d[1]!==2||d[2]&128)return new Uint8Array(d);if(y!==(d[2]<<8|d[3]))return a(3,"wrong scanline width");const p=new Uint8Array(4*u*m);if(!p.length)return a(4,"unable to allocate buffer space");let R=0,D=0;const S=4*y,F=new Uint8Array(4),G=new Uint8Array(S);let L=m;for(;L>0&&D<d.byteLength;){if(D+4>d.byteLength)return a(1);if(F[0]=d[D++],F[1]=d[D++],F[2]=d[D++],F[3]=d[D++],F[0]!=2||F[1]!=2||(F[2]<<8|F[3])!=y)return a(3,"bad rgbe scanline format");let T=0,b;for(;T<S&&D<d.byteLength;){b=d[D++];const K=b>128;if(K&&(b-=128),b===0||T+b>S)return a(3,"bad scanline data");if(K){const tA=d[D++];for(let nA=0;nA<b;nA++)G[T++]=tA}else G.set(d.subarray(D,D+b),T),T+=b,D+=b}const V=y;for(let K=0;K<V;K++){let tA=0;p[R]=G[K+tA],tA+=y,p[R+1]=G[K+tA],tA+=y,p[R+2]=G[K+tA],tA+=y,p[R+3]=G[K+tA],R+=4}L--}return p},l=function(d,u,m,y){const p=d[u+3],R=Math.pow(2,p-128)/255;m[y+0]=d[u+0]*R,m[y+1]=d[u+1]*R,m[y+2]=d[u+2]*R,m[y+3]=1},h=function(d,u,m,y){const p=d[u+3],R=Math.pow(2,p-128)/255;m[y+0]=Ra.toHalfFloat(Math.min(d[u+0]*R,65504)),m[y+1]=Ra.toHalfFloat(Math.min(d[u+1]*R,65504)),m[y+2]=Ra.toHalfFloat(Math.min(d[u+2]*R,65504)),m[y+3]=Ra.toHalfFloat(1)},E=new Uint8Array(A);E.pos=0;const f=Q(E);if(f!==-1){const d=f.width,u=f.height,m=c(E.subarray(E.pos),d,u);if(m!==-1){let y,p,R;switch(this.type){case De:R=m.length/4;const D=new Float32Array(R*4);for(let F=0;F<R;F++)l(m,F*4,D,F*4);y=D,p=De;break;case _i:R=m.length/4;const S=new Uint16Array(R*4);for(let F=0;F<R;F++)h(m,F*4,S,F*4);y=S,p=_i;break;default:console.error("THREE.RGBELoader: unsupported type: ",this.type);break}return{width:d,height:u,data:y,header:f.string,gamma:f.gamma,exposure:f.exposure,type:p}}}return null}setDataType(A){return this.type=A,this}load(A,t,e,n){function s(o,a){switch(o.type){case De:case _i:o.colorSpace=Xe,o.minFilter=Dt,o.magFilter=Dt,o.generateMipmaps=!1,o.flipY=!0;break}t&&t(o,a)}return super.load(A,s,e,n)}}const GI={},JB=async(i,A)=>{if(!GI[A]){const t=await new Promise(e=>{new KM().load(A,n=>{e(n)},null,()=>{alert("Could not load the VDB file."),console.error("Could not load the VDB file.",{name:i,file:A})})});GI[A]={name:i,vdb:t}}return GI[A].vdb},ri={texture:new Bc,rgbe:new WR,gltf:new hR},VR=({scene:i})=>{JB("bunny_cloud.vdb","./assets/bunny_cloud.vdb").then(A=>{const t=new PM(A),e=A.grids[Object.keys(A.grids)[0]],n=new xe;n.set(...e.getPreciseWorldBbox());const s=new P;n.getSize(s).multiplyScalar(.5),t.position.y-=s.y,i.add(t),da([{folder:"Bbox",children:[{id:"color",name:"Color",defaultValue:"#ff0000",onChange:o=>{t.children[0].material.color.set(o)}},{id:"opacity",name:"Opacity",defaultValue:.1,min:0,max:1,onChange:o=>{t.children.forEach(a=>{a.material.opacity=o})}}]}])})},zR=({scene:i})=>{JB("bunny_cloud.vdb","./assets/bunny_cloud.vdb").then(A=>{const t=new dt(new ye(20,32,32),new Ao({color:16777215,metalness:0,roughness:.5}));i.add(t);const e=new dt(new ye(20,32,32),new Ao({color:16777215,metalness:0,roughness:.5}));e.position.set(-200,0,200),i.add(e);const n=new la(A,{resolution:100,steps:1e4,absorbance:1,progressive:!0,radius:2}),s=A.grids[Object.keys(A.grids)[0]],o=new xe;o.set(...s.getPreciseWorldBbox());const a=new P;o.getSize(a).multiplyScalar(.5),n.position.y-=a.y,i.add(n);const g=(p,R,D,S)=>{const F=new Ke,G=new FB(p,.5);return G.position.set(R,D,S),G.add(new dt(new ye(1,32,32),new Qe({color:p}))),F.add(G),i.add(F),[G,F]},r=(p,R,D,S)=>{const F=new Ke,G=new RB(p,.5,null,.2,.6);return G.position.set(R,D,S),G.add(new dt(new ye(1,32,32),new Qe({color:p}))),F.add(G),i.add(F),[G,F]},I=(p,R,D,S)=>{const F=new Ia(p,.5);F.position.set(R,D,S);const G=new dt(new ye(1,32,32),new Qe({color:p}));return G.position.set(R,D,S),i.add(F),i.add(G),[F,G]},[B,C]=r(16711935,50,80,0),[Q]=r(16711680,0,80,0),[c,l]=g(16711935,50,80,0),[h]=g(16711680,0,80,0),[E,f]=g(16777096,0,0,0);e.add(f);const[d]=g(16711935,0,-10,0);d.children=[];const[u,m]=I(16711680,0,0,-80),y=new Cc(16711680,255,1);i.add(y),setInterval(()=>{C.rotateY(.005),l.rotateX(.005)},1),da([{folder:"Scene",children:[{id:"showMesh",name:"Show Debug Mesh",defaultValue:!1,onChange:p=>{n.visible=!p,t.visible=!!p}},{id:"environment",name:"EnvMap",defaultValue:"uv-1",options:{"Fiery Sky":"fiery-sky-1","Magic Forest":"magic-forest-5",UV:"uv-1"},onChange:p=>{ri.rgbe.load(`./assets/${p}-HDR.hdr`,R=>{R.mapping=kn,i.environment=R}),ri.texture.load(`./assets/${p}-8K.jpg`,R=>{R.mapping=Tn,R.encoding=Pe,i.background=R})}},{id:"lightSetup",name:"Lights",defaultValue:"hemi",options:{"Hemisphere Light":"hemi","Spot Lights":"spot","Point Lights":"point","Directional Light":"dir",Sun:"sun",Glow:"glow",None:"none"},onChange:p=>{c.visible=p==="point",h.visible=p==="point",B.visible=p==="spot",Q.visible=p==="spot",u.visible=p==="dir",y.visible=p==="dir",y.visible=p==="hemi",E.visible=p==="sun",d.visible=p==="glow",n.materials.forEach(R=>R.useEnvironment=p!=="none"),n.materials.forEach(R=>R.usePointLights=["point","sun","glow"].includes(p)),n.materials.forEach(R=>R.useDirectionalLights=p==="dir"),n.materials.forEach(R=>R.useSpotLights=p==="spot"),n.materials.forEach(R=>R.useHemisphereLights=p==="hemi")}},{id:"lightColor",name:"Light Color",defaultValue:"#ff00ff",onChange:p=>{B.color.set(p),B.children[0].material.color.set(p),u.color.set(p),m.material.color.set(p),c.color.set(p),c.children[0].material.color.set(p),d.color.set(p)}},{id:"lightIntensity",name:"Light Intensity",defaultValue:1,min:0,max:1,onChange:p=>{B.intensity=p,Q.intensity=p,u.intensity=p,y.intensity=p,c.intensity=p,h.intensity=p,d.intensity=p}}]},{folder:"Fog Volume",children:[{id:"fogColor",name:"Fog Color",defaultValue:"#ffffff",onChange:p=>{n.materials.forEach(R=>R.baseColor=p),t.material.color.set(p)}},{id:"scatterColor",name:"Scatter Color",defaultValue:"#000000",onChange:p=>{n.materials.forEach(R=>R.scatterColor=p)}},{id:"absorbance",name:"Absorbance",defaultValue:1,min:0,max:1,onChange:p=>{n.materials.forEach(R=>R.absorbance=p)}},{id:"densityScale",name:"Density Scale",defaultValue:1,min:0,max:1,onChange:p=>{n.materials.forEach(R=>R.densityScale=p)}},{id:"opacity",name:"Opacity",defaultValue:1,min:0,max:1,onChange:p=>{n.materials.forEach(R=>R.opacity=p)}},{id:"steps",name:"Steps",defaultValue:1e3,min:10,max:1e3,onChange:p=>{n.materials.forEach(R=>R.steps=p)}}]}])})},El=({scene:i})=>{const A=new la(new rl({height:.2,density:.3}),{resolution:100,progressive:!0,steps:100,absorbance:1,baseColor:0,lights:lt.useEnvironment|lt.useDirectionalLights,densityCutoff:0});A.scale.setScalar(1e3),A.position.y+=300,i.add(A);const t=new P(0,0,1);new P(1,0,1).multiplyScalar(5e-5),setInterval(()=>{const n=t.clone().normalize().multiplyScalar(1e-4);A.materials.forEach(s=>{s.densityMap3D.offset3D.x+=n.x,s.densityMap3D.offset3D.z+=n.z})},1/60);const e=new Ia(13421823,.2);e.position.set(1e3,1e3,1e3),ri.gltf.load("./assets/airbus.glb",({scene:n})=>{const s=n;s.scale.setScalar(10),s.traverse(o=>{o.isPointLight&&(o.intensity=1,o.distance=.1)}),i.add(s)}),da([{folder:"Scene",children:[{id:"lightIntensity",name:"Light Intensity",defaultValue:e.intensity,min:0,max:1,onChange:n=>{e.intensity=n}},{id:"environment",name:"EnvMap",defaultValue:"night",options:{"Night Realistic":"night","Fiery Sky":"fiery-sky-1","Magic Forest":"magic-forest-5",UV:"uv-1"},onChange:n=>{ri.rgbe.load(`./assets/${n}-HDR.hdr`,s=>{s.mapping=kn,i.environment=s,i.background=s}),ri.texture.load(`./assets/${n}-8K.jpg`,s=>{s.mapping=Tn,s.encoding=Pe,i.background=s})}}]},{folder:"Fog Volume",children:[{id:"wrap3D",name:"3D Wrapping",defaultValue:Cn,options:{"Three.ClampToEdgeWrapping":Yt,"Three.RepeatWrapping":Bn,"Three.MirroredRepeatWrapping":Cn},onChange:n=>{A.materials.forEach(s=>s.wrap3D=n)}},{id:"fogColor",name:"Fog Color",defaultValue:"#ffffff",onChange:n=>{A.materials.forEach(s=>s.baseColor=n)}},{id:"scatterColor",name:"Scatter Color",defaultValue:"#000000",onChange:n=>{A.materials.forEach(s=>s.scatterColor=n)}},{id:"absorbance",name:"Absorbance",defaultValue:.98,min:0,max:1,onChange:n=>{A.materials.forEach(s=>s.absorbance=n)}},{id:"densityScale",name:"Density Scale",defaultValue:1,min:0,max:1,onChange:n=>{A.materials.forEach(s=>s.densityScale=n)}},{id:"roughness",name:"Roughness",defaultValue:.9,min:0,max:1,onChange:n=>{A.materials.forEach(s=>s.roughness=n)}},{id:"opacity",name:"Opacity",defaultValue:1,min:0,max:1,onChange:n=>{A.materials.forEach(s=>s.opacity=n)}},{id:"steps",name:"Steps",defaultValue:500,min:10,max:1e3,onChange:n=>{A.materials.forEach(s=>s.steps=n)}}]}])},XR=({scene:i})=>{const A=e=>{da([{folder:"Scene",children:[{id:"environment",name:"EnvMap",defaultValue:"uv-1",options:{"Fiery Sky":"fiery-sky-1","Magic Forest":"magic-forest-5",UV:"uv-1"},onChange:n=>{ri.rgbe.load(`./assets/${n}-HDR.hdr`,s=>{s.mapping=kn,i.environment=s}),ri.texture.load(`./assets/${n}-8K.jpg`,s=>{s.mapping=Tn,s.encoding=Pe,i.background=s})}}]},{folder:"Fog Volume",children:[{id:"fogColor",name:"Fog Color",defaultValue:"#ffffff",onChange:n=>{e.materials.forEach(s=>s.baseColor=n)}},{id:"scatterColor",name:"Scatter Color",defaultValue:"#000000",onChange:n=>{e.materials.forEach(s=>s.scatterColor=n)}},{id:"absorbance",name:"Absorbance",defaultValue:1,min:0,max:1,onChange:n=>{e.materials.forEach(s=>s.absorbance=n)}},{id:"densityScale",name:"Density Scale",defaultValue:1,min:0,max:1,onChange:n=>{e.materials.forEach(s=>s.densityScale=n)}},{id:"opacity",name:"Opacity",defaultValue:1,min:0,max:1,onChange:n=>{e.materials.forEach(s=>s.opacity=n)}},{id:"steps",name:"Steps",defaultValue:1e3,min:10,max:1e3,onChange:n=>{e.materials.forEach(s=>s.steps=n)}}]}])};ri.gltf.load("./assets/car.glb",({scene:e})=>{const n=e;n.position.x+=2,n.scale.setScalar(.8),i.add(n);const s=new la(new gl(n),{baseColor:16711935,resolution:100,progressive:!0,steps:1e3,radius:5});i.add(s),i.scale.setScalar(100),A(s)});const t=new Ia(16777215,.1);t.position.set(1,.8,1),i.add(t)};let Go=new Il;const Wn=document.querySelector("#dropzone");let xr="vdb";const ZR=i=>{xr=i},jR=()=>[{folder:"General",children:[{id:"demo",name:"Example",options:{Bunny:"bunny",Clouds:"clouds",Bbox:"bbox","GLTF to Volume":"gltf","Custom VDB":"vdb"},defaultValue:xr,onChange:i=>{if(i!==xr)switch(xr=i,ti.traverse(A=>{A.material&&A.material.dispose(),A.geometry&&A.geometry.dispose()}),ti.children=[],Wn.style.display=i==="vdb"?"":"none",i){case"bbox":return VR({scene:ti});case"bunny":return zR({scene:ti});case"clouds":return El({scene:ti});case"vdb":return cF({scene:ti});case"gltf":return XR({scene:ti})}}}]}];let hl=[];const da=i=>{hl=i,$R()},$R=()=>{Go.destroy(),Go=new Il;const i={},A=(t,e)=>{e.forEach(n=>{n.folder||(i[n.id]=n.defaultValue)}),e.forEach(n=>{if(n.folder)A(Go.addFolder(n.folder),n.children);else{let s;i[n.id]&&i[n.id][0]==="#"?s=t.addColor(i,n.id):s=t.add(i,n.id,n.options||n.min,n.max),s.name(n.name).onChange(o=>{n.onChange&&n.onChange(o)}),n.onChange&&n.onChange(n.defaultValue)}})};A(Go,jR()),A(Go,hl)};var gQ=[0,1,2,3,4,4,5,5,6,6,6,6,7,7,7,7,8,8,8,8,8,8,8,8,9,9,9,9,9,9,9,9,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,10,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,11,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,12,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,13,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,14,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,15,0,0,16,17,18,18,19,19,20,20,20,20,21,21,21,21,22,22,22,22,22,22,22,22,23,23,23,23,23,23,23,23,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29,29];function Ct(){var i=this;function A(t,e){var n=0;do n|=1&t,t>>>=1,n<<=1;while(--e>0);return n>>>1}i.build_tree=function(t){var e,n,s,o=i.dyn_tree,a=i.stat_desc.static_tree,g=i.stat_desc.elems,r=-1;for(t.heap_len=0,t.heap_max=573,e=0;e<g;e++)o[2*e]!==0?(t.heap[++t.heap_len]=r=e,t.depth[e]=0):o[2*e+1]=0;for(;t.heap_len<2;)o[2*(s=t.heap[++t.heap_len]=r<2?++r:0)]=1,t.depth[s]=0,t.opt_len--,a&&(t.static_len-=a[2*s+1]);for(i.max_code=r,e=Math.floor(t.heap_len/2);e>=1;e--)t.pqdownheap(o,e);s=g;do e=t.heap[1],t.heap[1]=t.heap[t.heap_len--],t.pqdownheap(o,1),n=t.heap[1],t.heap[--t.heap_max]=e,t.heap[--t.heap_max]=n,o[2*s]=o[2*e]+o[2*n],t.depth[s]=Math.max(t.depth[e],t.depth[n])+1,o[2*e+1]=o[2*n+1]=s,t.heap[1]=s++,t.pqdownheap(o,1);while(t.heap_len>=2);t.heap[--t.heap_max]=t.heap[1],function(I){var B,C,Q,c,l,h,E=i.dyn_tree,f=i.stat_desc.static_tree,d=i.stat_desc.extra_bits,u=i.stat_desc.extra_base,m=i.stat_desc.max_length,y=0;for(c=0;c<=15;c++)I.bl_count[c]=0;for(E[2*I.heap[I.heap_max]+1]=0,B=I.heap_max+1;B<573;B++)(c=E[2*E[2*(C=I.heap[B])+1]+1]+1)>m&&(c=m,y++),E[2*C+1]=c,C>i.max_code||(I.bl_count[c]++,l=0,C>=u&&(l=d[C-u]),I.opt_len+=(h=E[2*C])*(c+l),f&&(I.static_len+=h*(f[2*C+1]+l)));if(y!==0){do{for(c=m-1;I.bl_count[c]===0;)c--;I.bl_count[c]--,I.bl_count[c+1]+=2,I.bl_count[m]--,y-=2}while(y>0);for(c=m;c!==0;c--)for(C=I.bl_count[c];C!==0;)(Q=I.heap[--B])>i.max_code||(E[2*Q+1]!=c&&(I.opt_len+=(c-E[2*Q+1])*E[2*Q],E[2*Q+1]=c),C--)}}(t),function(I,B,C){var Q,c,l,h=[],E=0;for(Q=1;Q<=15;Q++)h[Q]=E=E+C[Q-1]<<1;for(c=0;c<=B;c++)(l=I[2*c+1])!==0&&(I[2*c]=A(h[l]++,l))}(o,i.max_code,t.bl_count)}}function vt(i,A,t,e,n){var s=this;s.static_tree=i,s.extra_bits=A,s.extra_base=t,s.elems=e,s.max_length=n}function $e(i,A,t,e,n){var s=this;s.good_length=i,s.max_lazy=A,s.nice_length=t,s.max_chain=e,s.func=n}Ct._length_code=[0,1,2,3,4,5,6,7,8,8,9,9,10,10,11,11,12,12,12,12,13,13,13,13,14,14,14,14,15,15,15,15,16,16,16,16,16,16,16,16,17,17,17,17,17,17,17,17,18,18,18,18,18,18,18,18,19,19,19,19,19,19,19,19,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,20,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,21,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,22,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,23,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,24,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,25,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,26,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,27,28],Ct.base_length=[0,1,2,3,4,5,6,7,8,10,12,14,16,20,24,28,32,40,48,56,64,80,96,112,128,160,192,224,0],Ct.base_dist=[0,1,2,3,4,6,8,12,16,24,32,48,64,96,128,192,256,384,512,768,1024,1536,2048,3072,4096,6144,8192,12288,16384,24576],Ct.d_code=function(i){return i<256?gQ[i]:gQ[256+(i>>>7)]},Ct.extra_lbits=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0],Ct.extra_dbits=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13],Ct.extra_blbits=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,3,7],Ct.bl_order=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],vt.static_ltree=[12,8,140,8,76,8,204,8,44,8,172,8,108,8,236,8,28,8,156,8,92,8,220,8,60,8,188,8,124,8,252,8,2,8,130,8,66,8,194,8,34,8,162,8,98,8,226,8,18,8,146,8,82,8,210,8,50,8,178,8,114,8,242,8,10,8,138,8,74,8,202,8,42,8,170,8,106,8,234,8,26,8,154,8,90,8,218,8,58,8,186,8,122,8,250,8,6,8,134,8,70,8,198,8,38,8,166,8,102,8,230,8,22,8,150,8,86,8,214,8,54,8,182,8,118,8,246,8,14,8,142,8,78,8,206,8,46,8,174,8,110,8,238,8,30,8,158,8,94,8,222,8,62,8,190,8,126,8,254,8,1,8,129,8,65,8,193,8,33,8,161,8,97,8,225,8,17,8,145,8,81,8,209,8,49,8,177,8,113,8,241,8,9,8,137,8,73,8,201,8,41,8,169,8,105,8,233,8,25,8,153,8,89,8,217,8,57,8,185,8,121,8,249,8,5,8,133,8,69,8,197,8,37,8,165,8,101,8,229,8,21,8,149,8,85,8,213,8,53,8,181,8,117,8,245,8,13,8,141,8,77,8,205,8,45,8,173,8,109,8,237,8,29,8,157,8,93,8,221,8,61,8,189,8,125,8,253,8,19,9,275,9,147,9,403,9,83,9,339,9,211,9,467,9,51,9,307,9,179,9,435,9,115,9,371,9,243,9,499,9,11,9,267,9,139,9,395,9,75,9,331,9,203,9,459,9,43,9,299,9,171,9,427,9,107,9,363,9,235,9,491,9,27,9,283,9,155,9,411,9,91,9,347,9,219,9,475,9,59,9,315,9,187,9,443,9,123,9,379,9,251,9,507,9,7,9,263,9,135,9,391,9,71,9,327,9,199,9,455,9,39,9,295,9,167,9,423,9,103,9,359,9,231,9,487,9,23,9,279,9,151,9,407,9,87,9,343,9,215,9,471,9,55,9,311,9,183,9,439,9,119,9,375,9,247,9,503,9,15,9,271,9,143,9,399,9,79,9,335,9,207,9,463,9,47,9,303,9,175,9,431,9,111,9,367,9,239,9,495,9,31,9,287,9,159,9,415,9,95,9,351,9,223,9,479,9,63,9,319,9,191,9,447,9,127,9,383,9,255,9,511,9,0,7,64,7,32,7,96,7,16,7,80,7,48,7,112,7,8,7,72,7,40,7,104,7,24,7,88,7,56,7,120,7,4,7,68,7,36,7,100,7,20,7,84,7,52,7,116,7,3,8,131,8,67,8,195,8,35,8,163,8,99,8,227,8],vt.static_dtree=[0,5,16,5,8,5,24,5,4,5,20,5,12,5,28,5,2,5,18,5,10,5,26,5,6,5,22,5,14,5,30,5,1,5,17,5,9,5,25,5,5,5,21,5,13,5,29,5,3,5,19,5,11,5,27,5,7,5,23,5],vt.static_l_desc=new vt(vt.static_ltree,Ct.extra_lbits,257,286,15),vt.static_d_desc=new vt(vt.static_dtree,Ct.extra_dbits,0,30,15),vt.static_bl_desc=new vt(null,Ct.extra_blbits,0,19,7);var He=[new $e(0,0,0,0,0),new $e(4,4,8,4,1),new $e(4,5,16,8,1),new $e(4,6,32,32,1),new $e(4,4,16,16,2),new $e(8,16,32,32,2),new $e(8,16,128,128,2),new $e(8,32,128,256,2),new $e(32,128,258,1024,2),new $e(32,258,258,4096,2)],ur=["need dictionary","stream end","","","stream error","data error","","buffer error","",""];function IQ(i,A,t,e){var n=i[2*A],s=i[2*t];return n<s||n==s&&e[A]<=e[t]}function AF(){var i,A,t,e,n,s,o,a,g,r,I,B,C,Q,c,l,h,E,f,d,u,m,y,p,R,D,S,F,G,L,T,b,V,K,tA,nA,Z,CA,q,eA,oA,aA=this,QA=new Ct,wA=new Ct,NA=new Ct;function xA(){var M;for(M=0;M<286;M++)T[2*M]=0;for(M=0;M<30;M++)b[2*M]=0;for(M=0;M<19;M++)V[2*M]=0;T[512]=1,aA.opt_len=aA.static_len=0,nA=CA=0}function it(M,k){var X,j,x=-1,AA=M[1],sA=0,z=7,IA=4;for(AA===0&&(z=138,IA=3),M[2*(k+1)+1]=65535,X=0;X<=k;X++)j=AA,AA=M[2*(X+1)+1],++sA<z&&j==AA||(sA<IA?V[2*j]+=sA:j!==0?(j!=x&&V[2*j]++,V[32]++):sA<=10?V[34]++:V[36]++,sA=0,x=j,AA===0?(z=138,IA=3):j==AA?(z=6,IA=3):(z=7,IA=4))}function _A(M){aA.pending_buf[aA.pending++]=M}function $(M){_A(255&M),_A(M>>>8&255)}function JA(M,k){var X,j=k;oA>16-j?($(eA|=(X=M)<<oA&65535),eA=X>>>16-oA,oA+=j-16):(eA|=M<<oA&65535,oA+=j)}function MA(M,k){var X=2*M;JA(65535&k[X],65535&k[X+1])}function FA(M,k){var X,j,x=-1,AA=M[1],sA=0,z=7,IA=4;for(AA===0&&(z=138,IA=3),X=0;X<=k;X++)if(j=AA,AA=M[2*(X+1)+1],!(++sA<z&&j==AA)){if(sA<IA)do MA(j,V);while(--sA!=0);else j!==0?(j!=x&&(MA(j,V),sA--),MA(16,V),JA(sA-3,2)):sA<=10?(MA(17,V),JA(sA-3,3)):(MA(18,V),JA(sA-11,7));sA=0,x=j,AA===0?(z=138,IA=3):j==AA?(z=6,IA=3):(z=7,IA=4)}}function SA(){oA==16?($(eA),eA=0,oA=0):oA>=8&&(_A(255&eA),eA>>>=8,oA-=8)}function qA(M,k){var X,j,x;if(aA.pending_buf[Z+2*nA]=M>>>8&255,aA.pending_buf[Z+2*nA+1]=255&M,aA.pending_buf[K+nA]=255&k,nA++,M===0?T[2*k]++:(CA++,M--,T[2*(Ct._length_code[k]+256+1)]++,b[2*Ct.d_code(M)]++),(8191&nA)==0&&S>2){for(X=8*nA,j=u-h,x=0;x<30;x++)X+=b[2*x]*(5+Ct.extra_dbits[x]);if(X>>>=3,CA<Math.floor(nA/2)&&X<Math.floor(j/2))return!0}return nA==tA-1}function bA(M,k){var X,j,x,AA,sA=0;if(nA!==0)do X=aA.pending_buf[Z+2*sA]<<8&65280|255&aA.pending_buf[Z+2*sA+1],j=255&aA.pending_buf[K+sA],sA++,X===0?MA(j,M):(MA((x=Ct._length_code[j])+256+1,M),(AA=Ct.extra_lbits[x])!==0&&JA(j-=Ct.base_length[x],AA),X--,MA(x=Ct.d_code(X),k),(AA=Ct.extra_dbits[x])!==0&&JA(X-=Ct.base_dist[x],AA));while(sA<nA);MA(256,M),q=M[513]}function LA(){oA>8?$(eA):oA>0&&_A(255&eA),eA=0,oA=0}function PA(M,k,X){JA(0+(X?1:0),3),function(j,x,AA){LA(),q=8,$(x),$(~x),aA.pending_buf.set(a.subarray(j,j+x),aA.pending),aA.pending+=x}(M,k)}function YA(M){(function(k,X,j){var x,AA,sA=0;S>0?(QA.build_tree(aA),wA.build_tree(aA),sA=function(){var z;for(it(T,QA.max_code),it(b,wA.max_code),NA.build_tree(aA),z=18;z>=3&&V[2*Ct.bl_order[z]+1]===0;z--);return aA.opt_len+=3*(z+1)+5+5+4,z}(),(AA=aA.static_len+3+7>>>3)<=(x=aA.opt_len+3+7>>>3)&&(x=AA)):x=AA=X+5,X+4<=x&&k!=-1?PA(k,X,j):AA==x?(JA(2+(j?1:0),3),bA(vt.static_ltree,vt.static_dtree)):(JA(4+(j?1:0),3),function(z,IA,lA){var EA;for(JA(z-257,5),JA(IA-1,5),JA(lA-4,4),EA=0;EA<lA;EA++)JA(V[2*Ct.bl_order[EA]+1],3);FA(T,z-1),FA(b,IA-1)}(QA.max_code+1,wA.max_code+1,sA+1),bA(T,b)),xA(),j&&LA()})(h>=0?h:-1,u-h,M),h=u,i.flush_pending()}function $A(){var M,k,X,j;do{if((j=g-y-u)==0&&u===0&&y===0)j=n;else if(j==-1)j--;else if(u>=n+n-262){a.set(a.subarray(n,n+n),0),m-=n,u-=n,h-=n,X=M=C;do k=65535&I[--X],I[X]=k>=n?k-n:0;while(--M!=0);X=M=n;do k=65535&r[--X],r[X]=k>=n?k-n:0;while(--M!=0);j+=n}if(i.avail_in===0)return;M=i.read_buf(a,u+y,j),(y+=M)>=3&&(B=((B=255&a[u])<<l^255&a[u+1])&c)}while(y<262&&i.avail_in!==0)}function N(M){var k,X,j=R,x=u,AA=p,sA=u>n-262?u-(n-262):0,z=L,IA=o,lA=u+258,EA=a[x+AA-1],DA=a[x+AA];p>=G&&(j>>=2),z>y&&(z=y);do if(a[(k=M)+AA]==DA&&a[k+AA-1]==EA&&a[k]==a[x]&&a[++k]==a[x+1]){x+=2,k++;do;while(a[++x]==a[++k]&&a[++x]==a[++k]&&a[++x]==a[++k]&&a[++x]==a[++k]&&a[++x]==a[++k]&&a[++x]==a[++k]&&a[++x]==a[++k]&&a[++x]==a[++k]&&x<lA);if(X=258-(lA-x),x=lA-258,X>AA){if(m=M,AA=X,X>=z)break;EA=a[x+AA-1],DA=a[x+AA]}}while((M=65535&r[M&IA])>sA&&--j!=0);return AA<=y?AA:y}aA.depth=[],aA.bl_count=[],aA.heap=[],T=[],b=[],V=[],aA.pqdownheap=function(M,k){for(var X=aA.heap,j=X[k],x=k<<1;x<=aA.heap_len&&(x<aA.heap_len&&IQ(M,X[x+1],X[x],aA.depth)&&x++,!IQ(M,j,X[x],aA.depth));)X[k]=X[x],k=x,x<<=1;X[k]=j},aA.deflateInit=function(M,k,X,j,x,AA){return j||(j=8),x||(x=8),AA||(AA=0),M.msg=null,k==-1&&(k=6),x<1||x>9||j!=8||X<9||X>15||k<0||k>9||AA<0||AA>2?-2:(M.dstate=aA,o=(n=1<<(s=X))-1,c=(C=1<<(Q=x+7))-1,l=Math.floor((Q+3-1)/3),a=new Uint8Array(2*n),r=[],I=[],tA=1<<x+6,aA.pending_buf=new Uint8Array(4*tA),t=4*tA,Z=Math.floor(tA/2),K=3*tA,S=k,F=AA,function(sA){return sA.total_in=sA.total_out=0,sA.msg=null,aA.pending=0,aA.pending_out=0,A=113,e=0,QA.dyn_tree=T,QA.stat_desc=vt.static_l_desc,wA.dyn_tree=b,wA.stat_desc=vt.static_d_desc,NA.dyn_tree=V,NA.stat_desc=vt.static_bl_desc,eA=0,oA=0,q=8,xA(),function(){var z;for(g=2*n,I[C-1]=0,z=0;z<C-1;z++)I[z]=0;D=He[S].max_lazy,G=He[S].good_length,L=He[S].nice_length,R=He[S].max_chain,u=0,h=0,y=0,E=p=2,d=0,B=0}(),0}(M))},aA.deflateEnd=function(){return A!=42&&A!=113&&A!=666?-2:(aA.pending_buf=null,I=null,r=null,a=null,aA.dstate=null,A==113?-3:0)},aA.deflateParams=function(M,k,X){var j=0;return k==-1&&(k=6),k<0||k>9||X<0||X>2?-2:(He[S].func!=He[k].func&&M.total_in!==0&&(j=M.deflate(1)),S!=k&&(D=He[S=k].max_lazy,G=He[S].good_length,L=He[S].nice_length,R=He[S].max_chain),F=X,j)},aA.deflateSetDictionary=function(M,k,X){var j,x=X,AA=0;if(!k||A!=42)return-2;if(x<3)return 0;for(x>n-262&&(AA=X-(x=n-262)),a.set(k.subarray(AA,AA+x),0),u=x,h=x,B=((B=255&a[0])<<l^255&a[1])&c,j=0;j<=x-3;j++)r[j&o]=I[B=(B<<l^255&a[j+2])&c],I[B]=j;return 0},aA.deflate=function(M,k){var X,j,x,AA,sA,z;if(k>4||k<0)return-2;if(!M.next_out||!M.next_in&&M.avail_in!==0||A==666&&k!=4)return M.msg=ur[4],-2;if(M.avail_out===0)return M.msg=ur[7],-5;if(i=M,AA=e,e=k,A==42&&(j=8+(s-8<<4)<<8,(x=(S-1&255)>>1)>3&&(x=3),j|=x<<6,u!==0&&(j|=32),A=113,_A((z=j+=31-j%31)>>8&255),_A(255&z)),aA.pending!==0){if(i.flush_pending(),i.avail_out===0)return e=-1,0}else if(i.avail_in===0&&k<=AA&&k!=4)return i.msg=ur[7],-5;if(A==666&&i.avail_in!==0)return M.msg=ur[7],-5;if(i.avail_in!==0||y!==0||k!=0&&A!=666){switch(sA=-1,He[S].func){case 0:sA=function(IA){var lA,EA=65535;for(EA>t-5&&(EA=t-5);;){if(y<=1){if($A(),y===0&&IA==0)return 0;if(y===0)break}if(u+=y,y=0,lA=h+EA,(u===0||u>=lA)&&(y=u-lA,u=lA,YA(!1),i.avail_out===0)||u-h>=n-262&&(YA(!1),i.avail_out===0))return 0}return YA(IA==4),i.avail_out===0?IA==4?2:0:IA==4?3:1}(k);break;case 1:sA=function(IA){for(var lA,EA=0;;){if(y<262){if($A(),y<262&&IA==0)return 0;if(y===0)break}if(y>=3&&(EA=65535&I[B=(B<<l^255&a[u+2])&c],r[u&o]=I[B],I[B]=u),EA!==0&&(u-EA&65535)<=n-262&&F!=2&&(E=N(EA)),E>=3)if(lA=qA(u-m,E-3),y-=E,E<=D&&y>=3){E--;do u++,EA=65535&I[B=(B<<l^255&a[u+2])&c],r[u&o]=I[B],I[B]=u;while(--E!=0);u++}else u+=E,E=0,B=((B=255&a[u])<<l^255&a[u+1])&c;else lA=qA(0,255&a[u]),y--,u++;if(lA&&(YA(!1),i.avail_out===0))return 0}return YA(IA==4),i.avail_out===0?IA==4?2:0:IA==4?3:1}(k);break;case 2:sA=function(IA){for(var lA,EA,DA=0;;){if(y<262){if($A(),y<262&&IA==0)return 0;if(y===0)break}if(y>=3&&(DA=65535&I[B=(B<<l^255&a[u+2])&c],r[u&o]=I[B],I[B]=u),p=E,f=m,E=2,DA!==0&&p<D&&(u-DA&65535)<=n-262&&(F!=2&&(E=N(DA)),E<=5&&(F==1||E==3&&u-m>4096)&&(E=2)),p>=3&&E<=p){EA=u+y-3,lA=qA(u-1-f,p-3),y-=p-1,p-=2;do++u<=EA&&(DA=65535&I[B=(B<<l^255&a[u+2])&c],r[u&o]=I[B],I[B]=u);while(--p!=0);if(d=0,E=2,u++,lA&&(YA(!1),i.avail_out===0))return 0}else if(d!==0){if((lA=qA(0,255&a[u-1]))&&YA(!1),u++,y--,i.avail_out===0)return 0}else d=1,u++,y--}return d!==0&&(lA=qA(0,255&a[u-1]),d=0),YA(IA==4),i.avail_out===0?IA==4?2:0:IA==4?3:1}(k)}if(sA!=2&&sA!=3||(A=666),sA==0||sA==2)return i.avail_out===0&&(e=-1),0;if(sA==1){if(k==1)JA(2,3),MA(256,vt.static_ltree),SA(),1+q+10-oA<9&&(JA(2,3),MA(256,vt.static_ltree),SA()),q=7;else if(PA(0,0,!1),k==3)for(X=0;X<C;X++)I[X]=0;if(i.flush_pending(),i.avail_out===0)return e=-1,0}}return k!=4?0:1}}function Ql(){var i=this;i.next_in_index=0,i.next_out_index=0,i.avail_in=0,i.total_in=0,i.avail_out=0,i.total_out=0}function cl(i){var A=new Ql,t=512,e=new Uint8Array(t),n=i?i.level:-1;n===void 0&&(n=-1),A.deflateInit(n),A.next_out=e,this.append=function(s,o){var a,g=[],r=0,I=0,B=0;if(s.length){A.next_in_index=0,A.next_in=s,A.avail_in=s.length;do{if(A.next_out_index=0,A.avail_out=t,A.deflate(0)!=0)throw new Error("deflating: "+A.msg);A.next_out_index&&g.push(A.next_out_index==t?new Uint8Array(e):new Uint8Array(e.subarray(0,A.next_out_index))),B+=A.next_out_index,o&&A.next_in_index>0&&A.next_in_index!=r&&(o(A.next_in_index),r=A.next_in_index)}while(A.avail_in>0||A.avail_out===0);return a=new Uint8Array(B),g.forEach(function(C){a.set(C,I),I+=C.length}),a}},this.flush=function(){var s,o,a=[],g=0,r=0;do{if(A.next_out_index=0,A.avail_out=t,(s=A.deflate(4))!=1&&s!=0)throw new Error("deflating: "+A.msg);t-A.avail_out>0&&a.push(new Uint8Array(e.subarray(0,A.next_out_index))),r+=A.next_out_index}while(A.avail_in>0||A.avail_out===0);return A.deflateEnd(),o=new Uint8Array(r),a.forEach(function(I){o.set(I,g),g+=I.length}),o}}Ql.prototype={deflateInit:function(i,A){var t=this;return t.dstate=new AF,A||(A=15),t.dstate.deflateInit(t,i,A)},deflate:function(i){var A=this;return A.dstate?A.dstate.deflate(A,i):-2},deflateEnd:function(){var i=this;if(!i.dstate)return-2;var A=i.dstate.deflateEnd();return i.dstate=null,A},deflateParams:function(i,A){var t=this;return t.dstate?t.dstate.deflateParams(t,i,A):-2},deflateSetDictionary:function(i,A){var t=this;return t.dstate?t.dstate.deflateSetDictionary(t,i,A):-2},read_buf:function(i,A,t){var e=this,n=e.avail_in;return n>t&&(n=t),n===0?0:(e.avail_in-=n,i.set(e.next_in.subarray(e.next_in_index,e.next_in_index+n),A),e.next_in_index+=n,e.total_in+=n,n)},flush_pending:function(){var i=this,A=i.dstate.pending;A>i.avail_out&&(A=i.avail_out),A!==0&&(i.next_out.set(i.dstate.pending_buf.subarray(i.dstate.pending_out,i.dstate.pending_out+A),i.next_out_index),i.next_out_index+=A,i.dstate.pending_out+=A,i.total_out+=A,i.avail_out-=A,i.dstate.pending-=A,i.dstate.pending===0&&(i.dstate.pending_out=0))}},self._zipjs_Deflater=cl;var Ee=[0,1,3,7,15,31,63,127,255,511,1023,2047,4095,8191,16383,32767,65535],tF=[96,7,256,0,8,80,0,8,16,84,8,115,82,7,31,0,8,112,0,8,48,0,9,192,80,7,10,0,8,96,0,8,32,0,9,160,0,8,0,0,8,128,0,8,64,0,9,224,80,7,6,0,8,88,0,8,24,0,9,144,83,7,59,0,8,120,0,8,56,0,9,208,81,7,17,0,8,104,0,8,40,0,9,176,0,8,8,0,8,136,0,8,72,0,9,240,80,7,4,0,8,84,0,8,20,85,8,227,83,7,43,0,8,116,0,8,52,0,9,200,81,7,13,0,8,100,0,8,36,0,9,168,0,8,4,0,8,132,0,8,68,0,9,232,80,7,8,0,8,92,0,8,28,0,9,152,84,7,83,0,8,124,0,8,60,0,9,216,82,7,23,0,8,108,0,8,44,0,9,184,0,8,12,0,8,140,0,8,76,0,9,248,80,7,3,0,8,82,0,8,18,85,8,163,83,7,35,0,8,114,0,8,50,0,9,196,81,7,11,0,8,98,0,8,34,0,9,164,0,8,2,0,8,130,0,8,66,0,9,228,80,7,7,0,8,90,0,8,26,0,9,148,84,7,67,0,8,122,0,8,58,0,9,212,82,7,19,0,8,106,0,8,42,0,9,180,0,8,10,0,8,138,0,8,74,0,9,244,80,7,5,0,8,86,0,8,22,192,8,0,83,7,51,0,8,118,0,8,54,0,9,204,81,7,15,0,8,102,0,8,38,0,9,172,0,8,6,0,8,134,0,8,70,0,9,236,80,7,9,0,8,94,0,8,30,0,9,156,84,7,99,0,8,126,0,8,62,0,9,220,82,7,27,0,8,110,0,8,46,0,9,188,0,8,14,0,8,142,0,8,78,0,9,252,96,7,256,0,8,81,0,8,17,85,8,131,82,7,31,0,8,113,0,8,49,0,9,194,80,7,10,0,8,97,0,8,33,0,9,162,0,8,1,0,8,129,0,8,65,0,9,226,80,7,6,0,8,89,0,8,25,0,9,146,83,7,59,0,8,121,0,8,57,0,9,210,81,7,17,0,8,105,0,8,41,0,9,178,0,8,9,0,8,137,0,8,73,0,9,242,80,7,4,0,8,85,0,8,21,80,8,258,83,7,43,0,8,117,0,8,53,0,9,202,81,7,13,0,8,101,0,8,37,0,9,170,0,8,5,0,8,133,0,8,69,0,9,234,80,7,8,0,8,93,0,8,29,0,9,154,84,7,83,0,8,125,0,8,61,0,9,218,82,7,23,0,8,109,0,8,45,0,9,186,0,8,13,0,8,141,0,8,77,0,9,250,80,7,3,0,8,83,0,8,19,85,8,195,83,7,35,0,8,115,0,8,51,0,9,198,81,7,11,0,8,99,0,8,35,0,9,166,0,8,3,0,8,131,0,8,67,0,9,230,80,7,7,0,8,91,0,8,27,0,9,150,84,7,67,0,8,123,0,8,59,0,9,214,82,7,19,0,8,107,0,8,43,0,9,182,0,8,11,0,8,139,0,8,75,0,9,246,80,7,5,0,8,87,0,8,23,192,8,0,83,7,51,0,8,119,0,8,55,0,9,206,81,7,15,0,8,103,0,8,39,0,9,174,0,8,7,0,8,135,0,8,71,0,9,238,80,7,9,0,8,95,0,8,31,0,9,158,84,7,99,0,8,127,0,8,63,0,9,222,82,7,27,0,8,111,0,8,47,0,9,190,0,8,15,0,8,143,0,8,79,0,9,254,96,7,256,0,8,80,0,8,16,84,8,115,82,7,31,0,8,112,0,8,48,0,9,193,80,7,10,0,8,96,0,8,32,0,9,161,0,8,0,0,8,128,0,8,64,0,9,225,80,7,6,0,8,88,0,8,24,0,9,145,83,7,59,0,8,120,0,8,56,0,9,209,81,7,17,0,8,104,0,8,40,0,9,177,0,8,8,0,8,136,0,8,72,0,9,241,80,7,4,0,8,84,0,8,20,85,8,227,83,7,43,0,8,116,0,8,52,0,9,201,81,7,13,0,8,100,0,8,36,0,9,169,0,8,4,0,8,132,0,8,68,0,9,233,80,7,8,0,8,92,0,8,28,0,9,153,84,7,83,0,8,124,0,8,60,0,9,217,82,7,23,0,8,108,0,8,44,0,9,185,0,8,12,0,8,140,0,8,76,0,9,249,80,7,3,0,8,82,0,8,18,85,8,163,83,7,35,0,8,114,0,8,50,0,9,197,81,7,11,0,8,98,0,8,34,0,9,165,0,8,2,0,8,130,0,8,66,0,9,229,80,7,7,0,8,90,0,8,26,0,9,149,84,7,67,0,8,122,0,8,58,0,9,213,82,7,19,0,8,106,0,8,42,0,9,181,0,8,10,0,8,138,0,8,74,0,9,245,80,7,5,0,8,86,0,8,22,192,8,0,83,7,51,0,8,118,0,8,54,0,9,205,81,7,15,0,8,102,0,8,38,0,9,173,0,8,6,0,8,134,0,8,70,0,9,237,80,7,9,0,8,94,0,8,30,0,9,157,84,7,99,0,8,126,0,8,62,0,9,221,82,7,27,0,8,110,0,8,46,0,9,189,0,8,14,0,8,142,0,8,78,0,9,253,96,7,256,0,8,81,0,8,17,85,8,131,82,7,31,0,8,113,0,8,49,0,9,195,80,7,10,0,8,97,0,8,33,0,9,163,0,8,1,0,8,129,0,8,65,0,9,227,80,7,6,0,8,89,0,8,25,0,9,147,83,7,59,0,8,121,0,8,57,0,9,211,81,7,17,0,8,105,0,8,41,0,9,179,0,8,9,0,8,137,0,8,73,0,9,243,80,7,4,0,8,85,0,8,21,80,8,258,83,7,43,0,8,117,0,8,53,0,9,203,81,7,13,0,8,101,0,8,37,0,9,171,0,8,5,0,8,133,0,8,69,0,9,235,80,7,8,0,8,93,0,8,29,0,9,155,84,7,83,0,8,125,0,8,61,0,9,219,82,7,23,0,8,109,0,8,45,0,9,187,0,8,13,0,8,141,0,8,77,0,9,251,80,7,3,0,8,83,0,8,19,85,8,195,83,7,35,0,8,115,0,8,51,0,9,199,81,7,11,0,8,99,0,8,35,0,9,167,0,8,3,0,8,131,0,8,67,0,9,231,80,7,7,0,8,91,0,8,27,0,9,151,84,7,67,0,8,123,0,8,59,0,9,215,82,7,19,0,8,107,0,8,43,0,9,183,0,8,11,0,8,139,0,8,75,0,9,247,80,7,5,0,8,87,0,8,23,192,8,0,83,7,51,0,8,119,0,8,55,0,9,207,81,7,15,0,8,103,0,8,39,0,9,175,0,8,7,0,8,135,0,8,71,0,9,239,80,7,9,0,8,95,0,8,31,0,9,159,84,7,99,0,8,127,0,8,63,0,9,223,82,7,27,0,8,111,0,8,47,0,9,191,0,8,15,0,8,143,0,8,79,0,9,255],eF=[80,5,1,87,5,257,83,5,17,91,5,4097,81,5,5,89,5,1025,85,5,65,93,5,16385,80,5,3,88,5,513,84,5,33,92,5,8193,82,5,9,90,5,2049,86,5,129,192,5,24577,80,5,2,87,5,385,83,5,25,91,5,6145,81,5,7,89,5,1537,85,5,97,93,5,24577,80,5,4,88,5,769,84,5,49,92,5,12289,82,5,13,90,5,3073,86,5,193,192,5,24577],iF=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0],nF=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,112,112],sF=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577],oF=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,13];function tB(){var i,A,t,e,n,s;function o(g,r,I,B,C,Q,c,l,h,E,f){var d,u,m,y,p,R,D,S,F,G,L,T,b,V,K;G=0,p=I;do t[g[r+G]]++,G++,p--;while(p!==0);if(t[0]==I)return c[0]=-1,l[0]=0,0;for(S=l[0],R=1;R<=15&&t[R]===0;R++);for(D=R,S<R&&(S=R),p=15;p!==0&&t[p]===0;p--);for(m=p,S>p&&(S=p),l[0]=S,V=1<<R;R<p;R++,V<<=1)if((V-=t[R])<0)return-3;if((V-=t[p])<0)return-3;for(t[p]+=V,s[1]=R=0,G=1,b=2;--p!=0;)s[b]=R+=t[G],b++,G++;p=0,G=0;do(R=g[r+G])!==0&&(f[s[R]++]=p),G++;while(++p<I);for(I=s[m],s[0]=p=0,G=0,y=-1,T=-S,n[0]=0,L=0,K=0;D<=m;D++)for(d=t[D];d--!=0;){for(;D>T+S;){if(y++,K=(K=m-(T+=S))>S?S:K,(u=1<<(R=D-T))>d+1&&(u-=d+1,b=D,R<K))for(;++R<K&&!((u<<=1)<=t[++b]);)u-=t[b];if(E[0]+(K=1<<R)>1440)return-3;n[y]=L=E[0],E[0]+=K,y!==0?(s[y]=p,e[0]=R,e[1]=S,e[2]=L-n[y-1]-(R=p>>>T-S),h.set(e,3*(n[y-1]+R))):c[0]=L}for(e[1]=D-T,G>=I?e[0]=192:f[G]<B?(e[0]=f[G]<256?0:96,e[2]=f[G++]):(e[0]=Q[f[G]-B]+16+64,e[2]=C[f[G++]-B]),u=1<<D-T,R=p>>>T;R<K;R+=u)h.set(e,3*(L+R));for(R=1<<D-1;(p&R)!=0;R>>>=1)p^=R;for(p^=R,F=(1<<T)-1;(p&F)!=s[y];)y--,F=(1<<(T-=S))-1}return V!==0&&m!=1?-5:0}function a(g){var r;for(i||(i=[],A=[],t=new Int32Array(16),e=[],n=new Int32Array(15),s=new Int32Array(16)),A.length<g&&(A=[]),r=0;r<g;r++)A[r]=0;for(r=0;r<16;r++)t[r]=0;for(r=0;r<3;r++)e[r]=0;n.set(t.subarray(0,15),0),s.set(t.subarray(0,16),0)}this.inflate_trees_bits=function(g,r,I,B,C){var Q;return a(19),i[0]=0,(Q=o(g,0,19,19,null,null,I,r,B,i,A))==-3?C.msg="oversubscribed dynamic bit lengths tree":Q!=-5&&r[0]!==0||(C.msg="incomplete dynamic bit lengths tree",Q=-3),Q},this.inflate_trees_dynamic=function(g,r,I,B,C,Q,c,l,h){var E;return a(288),i[0]=0,(E=o(I,0,g,257,iF,nF,Q,B,l,i,A))!=0||B[0]===0?(E==-3?h.msg="oversubscribed literal/length tree":E!=-4&&(h.msg="incomplete literal/length tree",E=-3),E):(a(288),(E=o(I,g,r,0,sF,oF,c,C,l,i,A))!=0||C[0]===0&&g>257?(E==-3?h.msg="oversubscribed distance tree":E==-5?(h.msg="incomplete distance tree",E=-3):E!=-4&&(h.msg="empty distance tree with lengths",E=-3),E):0)}}function aF(){var i,A,t,e,n=this,s=0,o=0,a=0,g=0,r=0,I=0,B=0,C=0,Q=0,c=0;function l(h,E,f,d,u,m,y,p){var R,D,S,F,G,L,T,b,V,K,tA,nA,Z,CA,q,eA;T=p.next_in_index,b=p.avail_in,G=y.bitb,L=y.bitk,K=(V=y.write)<y.read?y.read-V-1:y.end-V,tA=Ee[h],nA=Ee[E];do{for(;L<20;)b--,G|=(255&p.read_byte(T++))<<L,L+=8;if((F=(D=f)[eA=3*((S=d)+(R=G&tA))])!==0)for(;;){if(G>>=D[eA+1],L-=D[eA+1],(16&F)!=0){for(Z=D[eA+2]+(G&Ee[F&=15]),G>>=F,L-=F;L<15;)b--,G|=(255&p.read_byte(T++))<<L,L+=8;for(F=(D=u)[eA=3*((S=m)+(R=G&nA))];;){if(G>>=D[eA+1],L-=D[eA+1],(16&F)!=0){for(F&=15;L<F;)b--,G|=(255&p.read_byte(T++))<<L,L+=8;if(CA=D[eA+2]+(G&Ee[F]),G>>=F,L-=F,K-=Z,V>=CA)V-(q=V-CA)>0&&2>V-q?(y.window[V++]=y.window[q++],y.window[V++]=y.window[q++],Z-=2):(y.window.set(y.window.subarray(q,q+2),V),V+=2,q+=2,Z-=2);else{q=V-CA;do q+=y.end;while(q<0);if(Z>(F=y.end-q)){if(Z-=F,V-q>0&&F>V-q)do y.window[V++]=y.window[q++];while(--F!=0);else y.window.set(y.window.subarray(q,q+F),V),V+=F,q+=F,F=0;q=0}}if(V-q>0&&Z>V-q)do y.window[V++]=y.window[q++];while(--Z!=0);else y.window.set(y.window.subarray(q,q+Z),V),V+=Z,q+=Z,Z=0;break}if((64&F)!=0)return p.msg="invalid distance code",b+=Z=L>>3<(Z=p.avail_in-b)?L>>3:Z,T-=Z,L-=Z<<3,y.bitb=G,y.bitk=L,p.avail_in=b,p.total_in+=T-p.next_in_index,p.next_in_index=T,y.write=V,-3;R+=D[eA+2],F=D[eA=3*(S+(R+=G&Ee[F]))]}break}if((64&F)!=0)return(32&F)!=0?(b+=Z=L>>3<(Z=p.avail_in-b)?L>>3:Z,T-=Z,L-=Z<<3,y.bitb=G,y.bitk=L,p.avail_in=b,p.total_in+=T-p.next_in_index,p.next_in_index=T,y.write=V,1):(p.msg="invalid literal/length code",b+=Z=L>>3<(Z=p.avail_in-b)?L>>3:Z,T-=Z,L-=Z<<3,y.bitb=G,y.bitk=L,p.avail_in=b,p.total_in+=T-p.next_in_index,p.next_in_index=T,y.write=V,-3);if(R+=D[eA+2],(F=D[eA=3*(S+(R+=G&Ee[F]))])===0){G>>=D[eA+1],L-=D[eA+1],y.window[V++]=D[eA+2],K--;break}}else G>>=D[eA+1],L-=D[eA+1],y.window[V++]=D[eA+2],K--}while(K>=258&&b>=10);return b+=Z=L>>3<(Z=p.avail_in-b)?L>>3:Z,T-=Z,L-=Z<<3,y.bitb=G,y.bitk=L,p.avail_in=b,p.total_in+=T-p.next_in_index,p.next_in_index=T,y.write=V,0}n.init=function(h,E,f,d,u,m){i=0,B=h,C=E,t=f,Q=d,e=u,c=m,A=null},n.proc=function(h,E,f){var d,u,m,y,p,R,D,S=0,F=0,G=0;for(G=E.next_in_index,y=E.avail_in,S=h.bitb,F=h.bitk,R=(p=h.write)<h.read?h.read-p-1:h.end-p;;)switch(i){case 0:if(R>=258&&y>=10&&(h.bitb=S,h.bitk=F,E.avail_in=y,E.total_in+=G-E.next_in_index,E.next_in_index=G,h.write=p,f=l(B,C,t,Q,e,c,h,E),G=E.next_in_index,y=E.avail_in,S=h.bitb,F=h.bitk,R=(p=h.write)<h.read?h.read-p-1:h.end-p,f!=0)){i=f==1?7:9;break}a=B,A=t,o=Q,i=1;case 1:for(d=a;F<d;){if(y===0)return h.bitb=S,h.bitk=F,E.avail_in=y,E.total_in+=G-E.next_in_index,E.next_in_index=G,h.write=p,h.inflate_flush(E,f);f=0,y--,S|=(255&E.read_byte(G++))<<F,F+=8}if(S>>>=A[1+(u=3*(o+(S&Ee[d])))],F-=A[u+1],(m=A[u])===0){g=A[u+2],i=6;break}if((16&m)!=0){r=15&m,s=A[u+2],i=2;break}if((64&m)==0){a=m,o=u/3+A[u+2];break}if((32&m)!=0){i=7;break}return i=9,E.msg="invalid literal/length code",f=-3,h.bitb=S,h.bitk=F,E.avail_in=y,E.total_in+=G-E.next_in_index,E.next_in_index=G,h.write=p,h.inflate_flush(E,f);case 2:for(d=r;F<d;){if(y===0)return h.bitb=S,h.bitk=F,E.avail_in=y,E.total_in+=G-E.next_in_index,E.next_in_index=G,h.write=p,h.inflate_flush(E,f);f=0,y--,S|=(255&E.read_byte(G++))<<F,F+=8}s+=S&Ee[d],S>>=d,F-=d,a=C,A=e,o=c,i=3;case 3:for(d=a;F<d;){if(y===0)return h.bitb=S,h.bitk=F,E.avail_in=y,E.total_in+=G-E.next_in_index,E.next_in_index=G,h.write=p,h.inflate_flush(E,f);f=0,y--,S|=(255&E.read_byte(G++))<<F,F+=8}if(S>>=A[1+(u=3*(o+(S&Ee[d])))],F-=A[u+1],(16&(m=A[u]))!=0){r=15&m,I=A[u+2],i=4;break}if((64&m)==0){a=m,o=u/3+A[u+2];break}return i=9,E.msg="invalid distance code",f=-3,h.bitb=S,h.bitk=F,E.avail_in=y,E.total_in+=G-E.next_in_index,E.next_in_index=G,h.write=p,h.inflate_flush(E,f);case 4:for(d=r;F<d;){if(y===0)return h.bitb=S,h.bitk=F,E.avail_in=y,E.total_in+=G-E.next_in_index,E.next_in_index=G,h.write=p,h.inflate_flush(E,f);f=0,y--,S|=(255&E.read_byte(G++))<<F,F+=8}I+=S&Ee[d],S>>=d,F-=d,i=5;case 5:for(D=p-I;D<0;)D+=h.end;for(;s!==0;){if(R===0&&(p==h.end&&h.read!==0&&(R=(p=0)<h.read?h.read-p-1:h.end-p),R===0&&(h.write=p,f=h.inflate_flush(E,f),R=(p=h.write)<h.read?h.read-p-1:h.end-p,p==h.end&&h.read!==0&&(R=(p=0)<h.read?h.read-p-1:h.end-p),R===0)))return h.bitb=S,h.bitk=F,E.avail_in=y,E.total_in+=G-E.next_in_index,E.next_in_index=G,h.write=p,h.inflate_flush(E,f);h.window[p++]=h.window[D++],R--,D==h.end&&(D=0),s--}i=0;break;case 6:if(R===0&&(p==h.end&&h.read!==0&&(R=(p=0)<h.read?h.read-p-1:h.end-p),R===0&&(h.write=p,f=h.inflate_flush(E,f),R=(p=h.write)<h.read?h.read-p-1:h.end-p,p==h.end&&h.read!==0&&(R=(p=0)<h.read?h.read-p-1:h.end-p),R===0)))return h.bitb=S,h.bitk=F,E.avail_in=y,E.total_in+=G-E.next_in_index,E.next_in_index=G,h.write=p,h.inflate_flush(E,f);f=0,h.window[p++]=g,R--,i=0;break;case 7:if(F>7&&(F-=8,y++,G--),h.write=p,f=h.inflate_flush(E,f),R=(p=h.write)<h.read?h.read-p-1:h.end-p,h.read!=h.write)return h.bitb=S,h.bitk=F,E.avail_in=y,E.total_in+=G-E.next_in_index,E.next_in_index=G,h.write=p,h.inflate_flush(E,f);i=8;case 8:return f=1,h.bitb=S,h.bitk=F,E.avail_in=y,E.total_in+=G-E.next_in_index,E.next_in_index=G,h.write=p,h.inflate_flush(E,f);case 9:return f=-3,h.bitb=S,h.bitk=F,E.avail_in=y,E.total_in+=G-E.next_in_index,E.next_in_index=G,h.write=p,h.inflate_flush(E,f);default:return f=-2,h.bitb=S,h.bitk=F,E.avail_in=y,E.total_in+=G-E.next_in_index,E.next_in_index=G,h.write=p,h.inflate_flush(E,f)}},n.free=function(){}}tB.inflate_trees_fixed=function(i,A,t,e){return i[0]=9,A[0]=5,t[0]=tF,e[0]=eF,0};var BQ=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15];function rF(i,A){var t,e=this,n=0,s=0,o=0,a=0,g=[0],r=[0],I=new aF,B=0,C=new Int32Array(4320),Q=new tB;e.bitk=0,e.bitb=0,e.window=new Uint8Array(A),e.end=A,e.read=0,e.write=0,e.reset=function(c,l){l&&(l[0]=0),n==6&&I.free(c),n=0,e.bitk=0,e.bitb=0,e.read=e.write=0},e.reset(i,null),e.inflate_flush=function(c,l){var h,E,f;return E=c.next_out_index,(h=((f=e.read)<=e.write?e.write:e.end)-f)>c.avail_out&&(h=c.avail_out),h!==0&&l==-5&&(l=0),c.avail_out-=h,c.total_out+=h,c.next_out.set(e.window.subarray(f,f+h),E),E+=h,(f+=h)==e.end&&(f=0,e.write==e.end&&(e.write=0),(h=e.write-f)>c.avail_out&&(h=c.avail_out),h!==0&&l==-5&&(l=0),c.avail_out-=h,c.total_out+=h,c.next_out.set(e.window.subarray(f,f+h),E),E+=h,f+=h),c.next_out_index=E,e.read=f,l},e.proc=function(c,l){var h,E,f,d,u,m,y,p;for(d=c.next_in_index,u=c.avail_in,E=e.bitb,f=e.bitk,y=(m=e.write)<e.read?e.read-m-1:e.end-m;;)switch(n){case 0:for(;f<3;){if(u===0)return e.bitb=E,e.bitk=f,c.avail_in=u,c.total_in+=d-c.next_in_index,c.next_in_index=d,e.write=m,e.inflate_flush(c,l);l=0,u--,E|=(255&c.read_byte(d++))<<f,f+=8}switch(B=1&(h=7&E),h>>>1){case 0:E>>>=3,E>>>=h=7&(f-=3),f-=h,n=1;break;case 1:var R=[],D=[],S=[[]],F=[[]];tB.inflate_trees_fixed(R,D,S,F),I.init(R[0],D[0],S[0],0,F[0],0),E>>>=3,f-=3,n=6;break;case 2:E>>>=3,f-=3,n=3;break;case 3:return E>>>=3,f-=3,n=9,c.msg="invalid block type",l=-3,e.bitb=E,e.bitk=f,c.avail_in=u,c.total_in+=d-c.next_in_index,c.next_in_index=d,e.write=m,e.inflate_flush(c,l)}break;case 1:for(;f<32;){if(u===0)return e.bitb=E,e.bitk=f,c.avail_in=u,c.total_in+=d-c.next_in_index,c.next_in_index=d,e.write=m,e.inflate_flush(c,l);l=0,u--,E|=(255&c.read_byte(d++))<<f,f+=8}if((~E>>>16&65535)!=(65535&E))return n=9,c.msg="invalid stored block lengths",l=-3,e.bitb=E,e.bitk=f,c.avail_in=u,c.total_in+=d-c.next_in_index,c.next_in_index=d,e.write=m,e.inflate_flush(c,l);s=65535&E,E=f=0,n=s!==0?2:B!==0?7:0;break;case 2:if(u===0||y===0&&(m==e.end&&e.read!==0&&(y=(m=0)<e.read?e.read-m-1:e.end-m),y===0&&(e.write=m,l=e.inflate_flush(c,l),y=(m=e.write)<e.read?e.read-m-1:e.end-m,m==e.end&&e.read!==0&&(y=(m=0)<e.read?e.read-m-1:e.end-m),y===0)))return e.bitb=E,e.bitk=f,c.avail_in=u,c.total_in+=d-c.next_in_index,c.next_in_index=d,e.write=m,e.inflate_flush(c,l);if(l=0,(h=s)>u&&(h=u),h>y&&(h=y),e.window.set(c.read_buf(d,h),m),d+=h,u-=h,m+=h,y-=h,(s-=h)!=0)break;n=B!==0?7:0;break;case 3:for(;f<14;){if(u===0)return e.bitb=E,e.bitk=f,c.avail_in=u,c.total_in+=d-c.next_in_index,c.next_in_index=d,e.write=m,e.inflate_flush(c,l);l=0,u--,E|=(255&c.read_byte(d++))<<f,f+=8}if(o=h=16383&E,(31&h)>29||(h>>5&31)>29)return n=9,c.msg="too many length or distance symbols",l=-3,e.bitb=E,e.bitk=f,c.avail_in=u,c.total_in+=d-c.next_in_index,c.next_in_index=d,e.write=m,e.inflate_flush(c,l);if(h=258+(31&h)+(h>>5&31),!t||t.length<h)t=[];else for(p=0;p<h;p++)t[p]=0;E>>>=14,f-=14,a=0,n=4;case 4:for(;a<4+(o>>>10);){for(;f<3;){if(u===0)return e.bitb=E,e.bitk=f,c.avail_in=u,c.total_in+=d-c.next_in_index,c.next_in_index=d,e.write=m,e.inflate_flush(c,l);l=0,u--,E|=(255&c.read_byte(d++))<<f,f+=8}t[BQ[a++]]=7&E,E>>>=3,f-=3}for(;a<19;)t[BQ[a++]]=0;if(g[0]=7,(h=Q.inflate_trees_bits(t,g,r,C,c))!=0)return(l=h)==-3&&(t=null,n=9),e.bitb=E,e.bitk=f,c.avail_in=u,c.total_in+=d-c.next_in_index,c.next_in_index=d,e.write=m,e.inflate_flush(c,l);a=0,n=5;case 5:for(;!(a>=258+(31&(h=o))+(h>>5&31));){var G,L;for(h=g[0];f<h;){if(u===0)return e.bitb=E,e.bitk=f,c.avail_in=u,c.total_in+=d-c.next_in_index,c.next_in_index=d,e.write=m,e.inflate_flush(c,l);l=0,u--,E|=(255&c.read_byte(d++))<<f,f+=8}if((L=C[3*(r[0]+(E&Ee[h=C[3*(r[0]+(E&Ee[h]))+1]]))+2])<16)E>>>=h,f-=h,t[a++]=L;else{for(p=L==18?7:L-14,G=L==18?11:3;f<h+p;){if(u===0)return e.bitb=E,e.bitk=f,c.avail_in=u,c.total_in+=d-c.next_in_index,c.next_in_index=d,e.write=m,e.inflate_flush(c,l);l=0,u--,E|=(255&c.read_byte(d++))<<f,f+=8}if(f-=h,G+=(E>>>=h)&Ee[p],E>>>=p,f-=p,(p=a)+G>258+(31&(h=o))+(h>>5&31)||L==16&&p<1)return t=null,n=9,c.msg="invalid bit length repeat",l=-3,e.bitb=E,e.bitk=f,c.avail_in=u,c.total_in+=d-c.next_in_index,c.next_in_index=d,e.write=m,e.inflate_flush(c,l);L=L==16?t[p-1]:0;do t[p++]=L;while(--G!=0);a=p}}r[0]=-1;var T=[],b=[],V=[],K=[];if(T[0]=9,b[0]=6,(h=Q.inflate_trees_dynamic(257+(31&(h=o)),1+(h>>5&31),t,T,b,V,K,C,c))!=0)return h==-3&&(t=null,n=9),l=h,e.bitb=E,e.bitk=f,c.avail_in=u,c.total_in+=d-c.next_in_index,c.next_in_index=d,e.write=m,e.inflate_flush(c,l);I.init(T[0],b[0],C,V[0],C,K[0]),n=6;case 6:if(e.bitb=E,e.bitk=f,c.avail_in=u,c.total_in+=d-c.next_in_index,c.next_in_index=d,e.write=m,(l=I.proc(e,c,l))!=1)return e.inflate_flush(c,l);if(l=0,I.free(c),d=c.next_in_index,u=c.avail_in,E=e.bitb,f=e.bitk,y=(m=e.write)<e.read?e.read-m-1:e.end-m,B===0){n=0;break}n=7;case 7:if(e.write=m,l=e.inflate_flush(c,l),y=(m=e.write)<e.read?e.read-m-1:e.end-m,e.read!=e.write)return e.bitb=E,e.bitk=f,c.avail_in=u,c.total_in+=d-c.next_in_index,c.next_in_index=d,e.write=m,e.inflate_flush(c,l);n=8;case 8:return l=1,e.bitb=E,e.bitk=f,c.avail_in=u,c.total_in+=d-c.next_in_index,c.next_in_index=d,e.write=m,e.inflate_flush(c,l);case 9:return l=-3,e.bitb=E,e.bitk=f,c.avail_in=u,c.total_in+=d-c.next_in_index,c.next_in_index=d,e.write=m,e.inflate_flush(c,l);default:return l=-2,e.bitb=E,e.bitk=f,c.avail_in=u,c.total_in+=d-c.next_in_index,c.next_in_index=d,e.write=m,e.inflate_flush(c,l)}},e.free=function(c){e.reset(c,null),e.window=null,C=null},e.set_dictionary=function(c,l,h){e.window.set(c.subarray(l,l+h),0),e.read=e.write=h},e.sync_point=function(){return n==1?1:0}}var gF=[0,0,255,255];function IF(){var i=this;function A(t){return t&&t.istate?(t.total_in=t.total_out=0,t.msg=null,t.istate.mode=7,t.istate.blocks.reset(t,null),0):-2}i.mode=0,i.method=0,i.was=[0],i.need=0,i.marker=0,i.wbits=0,i.inflateEnd=function(t){return i.blocks&&i.blocks.free(t),i.blocks=null,0},i.inflateInit=function(t,e){return t.msg=null,i.blocks=null,e<8||e>15?(i.inflateEnd(t),-2):(i.wbits=e,t.istate.blocks=new rF(t,1<<e),A(t),0)},i.inflate=function(t,e){var n,s;if(!t||!t.istate||!t.next_in)return-2;for(e=e==4?-5:0,n=-5;;)switch(t.istate.mode){case 0:if(t.avail_in===0)return n;if(n=e,t.avail_in--,t.total_in++,(15&(t.istate.method=t.read_byte(t.next_in_index++)))!=8){t.istate.mode=13,t.msg="unknown compression method",t.istate.marker=5;break}if(8+(t.istate.method>>4)>t.istate.wbits){t.istate.mode=13,t.msg="invalid window size",t.istate.marker=5;break}t.istate.mode=1;case 1:if(t.avail_in===0)return n;if(n=e,t.avail_in--,t.total_in++,s=255&t.read_byte(t.next_in_index++),((t.istate.method<<8)+s)%31!=0){t.istate.mode=13,t.msg="incorrect header check",t.istate.marker=5;break}if((32&s)==0){t.istate.mode=7;break}t.istate.mode=2;case 2:if(t.avail_in===0)return n;n=e,t.avail_in--,t.total_in++,t.istate.need=(255&t.read_byte(t.next_in_index++))<<24&4278190080,t.istate.mode=3;case 3:if(t.avail_in===0)return n;n=e,t.avail_in--,t.total_in++,t.istate.need+=(255&t.read_byte(t.next_in_index++))<<16&16711680,t.istate.mode=4;case 4:if(t.avail_in===0)return n;n=e,t.avail_in--,t.total_in++,t.istate.need+=(255&t.read_byte(t.next_in_index++))<<8&65280,t.istate.mode=5;case 5:return t.avail_in===0?n:(n=e,t.avail_in--,t.total_in++,t.istate.need+=255&t.read_byte(t.next_in_index++),t.istate.mode=6,2);case 6:return t.istate.mode=13,t.msg="need dictionary",t.istate.marker=0,-2;case 7:if((n=t.istate.blocks.proc(t,n))==-3){t.istate.mode=13,t.istate.marker=0;break}if(n==0&&(n=e),n!=1)return n;n=e,t.istate.blocks.reset(t,t.istate.was),t.istate.mode=12;case 12:return 1;case 13:return-3;default:return-2}},i.inflateSetDictionary=function(t,e,n){var s=0,o=n;return t&&t.istate&&t.istate.mode==6?(o>=1<<t.istate.wbits&&(s=n-(o=(1<<t.istate.wbits)-1)),t.istate.blocks.set_dictionary(e,s,o),t.istate.mode=7,0):-2},i.inflateSync=function(t){var e,n,s,o,a;if(!t||!t.istate)return-2;if(t.istate.mode!=13&&(t.istate.mode=13,t.istate.marker=0),(e=t.avail_in)===0)return-5;for(n=t.next_in_index,s=t.istate.marker;e!==0&&s<4;)t.read_byte(n)==gF[s]?s++:s=t.read_byte(n)!==0?0:4-s,n++,e--;return t.total_in+=n-t.next_in_index,t.next_in_index=n,t.avail_in=e,t.istate.marker=s,s!=4?-3:(o=t.total_in,a=t.total_out,A(t),t.total_in=o,t.total_out=a,t.istate.mode=7,0)},i.inflateSyncPoint=function(t){return t&&t.istate&&t.istate.blocks?t.istate.blocks.sync_point():-2}}function ll(){}function dl(){var i=new ll,A=new Uint8Array(512),t=!1;i.inflateInit(),i.next_out=A,this.append=function(e,n){var s,o,a=[],g=0,r=0,I=0;if(e.length!==0){i.next_in_index=0,i.next_in=e,i.avail_in=e.length;do{if(i.next_out_index=0,i.avail_out=512,i.avail_in!==0||t||(i.next_in_index=0,t=!0),s=i.inflate(0),t&&s===-5){if(i.avail_in!==0)throw new Error("inflating: bad input")}else if(s!==0&&s!==1)throw new Error("inflating: "+i.msg);if((t||s===1)&&i.avail_in===e.length)throw new Error("inflating: bad input");i.next_out_index&&a.push(i.next_out_index===512?new Uint8Array(A):new Uint8Array(A.subarray(0,i.next_out_index))),I+=i.next_out_index,n&&i.next_in_index>0&&i.next_in_index!=g&&(n(i.next_in_index),g=i.next_in_index)}while(i.avail_in>0||i.avail_out===0);return o=new Uint8Array(I),a.forEach(function(B){o.set(B,r),r+=B.length}),o}},this.flush=function(){i.inflateEnd()}}ll.prototype={inflateInit:function(i){var A=this;return A.istate=new IF,i||(i=15),A.istate.inflateInit(A,i)},inflate:function(i){var A=this;return A.istate?A.istate.inflate(A,i):-2},inflateEnd:function(){var i=this;if(!i.istate)return-2;var A=i.istate.inflateEnd(i);return i.istate=null,A},inflateSync:function(){var i=this;return i.istate?i.istate.inflateSync(i):-2},inflateSetDictionary:function(i,A){var t=this;return t.istate?t.istate.inflateSetDictionary(t,i,A):-2},read_byte:function(i){return this.next_in.subarray(i,i+1)[0]},read_buf:function(i,A){return this.next_in.subarray(i,i+A)}},self._zipjs_Inflater=dl;var KB,Lo="File format is not recognized.",CQ="Error while reading zip file.";try{KB=new Blob([new DataView(new ArrayBuffer(0))]).size===0}catch{}function Nr(){this.crc=-1}function eB(){}function ji(i,A){var t,e;return t=new ArrayBuffer(i),e=new Uint8Array(t),A&&e.set(A,0),{buffer:t,array:e,view:new DataView(t)}}function _r(){}function iB(i){var A,t=this;t.size=0,t.init=function(e,n){var s=new Blob([i],{type:"text/plain"});(A=new Or(s)).init(function(){t.size=A.size,e()},n)},t.readUint8Array=function(e,n,s,o){A.readUint8Array(e,n,s,o)}}function nB(i){var A,t=this;t.size=0,t.init=function(e){for(var n=i.length;i.charAt(n-1)=="=";)n--;A=i.indexOf(",")+1,t.size=Math.floor(.75*(n-A)),e()},t.readUint8Array=function(e,n,s){var o,a=ji(n),g=4*Math.floor(e/3),r=4*Math.ceil((e+n)/3),I=self.atob(i.substring(g+A,r+A)),B=e-3*Math.floor(g/4);for(o=B;o<B+n;o++)a.array[o-B]=I.charCodeAt(o);s(a.array)}}function Or(i){var A=this;A.size=0,A.init=function(t){A.size=i.size,t()},A.readUint8Array=function(t,e,n,s){var o=new FileReader;o.onload=function(a){n(new Uint8Array(a.target.result))},o.onerror=s;try{o.readAsArrayBuffer(function(a,g,r){if(g<0||r<0||g+r>a.size)throw new RangeError("offset:"+g+", length:"+r+", size:"+a.size);return a.slice?a.slice(g,g+r):a.webkitSlice?a.webkitSlice(g,g+r):a.mozSlice?a.mozSlice(g,g+r):a.msSlice?a.msSlice(g,g+r):void 0}(i,t,e))}catch(a){s(a)}}}function To(){}function sB(i){var A,t=this;t.init=function(e){A=new Blob([],{type:"text/plain"}),e()},t.writeUint8Array=function(e,n){A=new Blob([A,KB?e:e.buffer],{type:"text/plain"}),n()},t.getData=function(e,n){var s=new FileReader;s.onload=function(o){e(o.target.result)},s.onerror=n,s.readAsText(A,i)}}function oB(i){var A=this,t="",e="";A.init=function(n){t+="data:"+(i||"")+";base64,",n()},A.writeUint8Array=function(n,s){var o,a=e.length,g=e;for(e="",o=0;o<3*Math.floor((a+n.length)/3)-a;o++)g+=String.fromCharCode(n[o]);for(;o<n.length;o++)e+=String.fromCharCode(n[o]);g.length>2?t+=self.btoa(g):e=g,s()},A.getData=function(n){n(t+self.btoa(e))}}function aB(i){var A,t=this;t.init=function(e){A=new Blob([],{type:i}),e()},t.writeUint8Array=function(e,n){A=new Blob([A,KB?e:e.buffer],{type:i}),n()},t.getData=function(e){e(A)}}function rB(i,A,t,e,n,s,o,a,g,r){var I,B,C,Q=0,c=A.sn;function l(){i.removeEventListener("message",h,!1),a(B,C)}function h(f){var d=f.data,u=d.data,m=d.error;if(m)return m.toString=function(){return"Error: "+this.message},void g(m);if(d.sn===c)switch(typeof d.codecTime=="number"&&(i.codecTime+=d.codecTime),typeof d.crcTime=="number"&&(i.crcTime+=d.crcTime),d.type){case"append":u?(B+=u.length,e.writeUint8Array(u,function(){E()},r)):E();break;case"flush":C=d.crc,u?(B+=u.length,e.writeUint8Array(u,function(){l()},r)):l();break;case"progress":o&&o(I+d.loaded,s);break;case"importScripts":case"newTask":case"echo":break;default:console.warn("zip.js:launchWorkerProcess: unknown message: ",d)}}function E(){(I=524288*Q)<=s?t.readUint8Array(n+I,Math.min(524288,s-I),function(f){o&&o(I,s);var d=I===0?A:{sn:c};d.type="append",d.data=f;try{i.postMessage(d,[f.buffer])}catch{i.postMessage(d)}Q++},g):i.postMessage({sn:c,type:"flush"})}B=0,i.addEventListener("message",h,!1),E()}function gB(i,A,t,e,n,s,o,a,g,r){var I,B=0,C=0,Q=s==="input",c=s==="output",l=new Nr;(function h(){var E;if((I=524288*B)<n)A.readUint8Array(e+I,Math.min(524288,n-I),function(f){var d;try{d=i.append(f,function(u){o&&o(I+u,n)})}catch(u){return void g(u)}d?(C+=d.length,t.writeUint8Array(d,function(){B++,setTimeout(h,1)},r),c&&l.append(d)):(B++,setTimeout(h,1)),Q&&l.append(f),o&&o(I,n)},g);else{try{E=i.flush()}catch(f){return void g(f)}E?(c&&l.append(E),C+=E.length,t.writeUint8Array(E,function(){a(C,l.get())},r)):a(C,l.get())}})()}function EQ(i,A,t,e,n,s,o,a,g,r,I){var B="input";gt.useWebWorkers&&o?rB(i,{sn:A,codecClass:"_zipjs_NOOP",crcType:B},t,e,n,s,g,a,r,I):gB(new eB,t,e,n,s,B,g,a,r,I)}function hQ(i){var A,t,e="",n=["\xC7","\xFC","\xE9","\xE2","\xE4","\xE0","\xE5","\xE7","\xEA","\xEB","\xE8","\xEF","\xEE","\xEC","\xC4","\xC5","\xC9","\xE6","\xC6","\xF4","\xF6","\xF2","\xFB","\xF9","\xFF","\xD6","\xDC","\xF8","\xA3","\xD8","\xD7","\u0192","\xE1","\xED","\xF3","\xFA","\xF1","\xD1","\xAA","\xBA","\xBF","\xAE","\xAC","\xBD","\xBC","\xA1","\xAB","\xBB","_","_","_","\xA6","\xA6","\xC1","\xC2","\xC0","\xA9","\xA6","\xA6","+","+","\xA2","\xA5","+","+","-","-","+","-","+","\xE3","\xC3","+","+","-","-","\xA6","-","+","\xA4","\xF0","\xD0","\xCA","\xCB","\xC8","i","\xCD","\xCE","\xCF","+","+","_","_","\xA6","\xCC","_","\xD3","\xDF","\xD4","\xD2","\xF5","\xD5","\xB5","\xFE","\xDE","\xDA","\xDB","\xD9","\xFD","\xDD","\xAF","\xB4","\xAD","\xB1","_","\xBE","\xB6","\xA7","\xF7","\xB8","\xB0","\xA8","\xB7","\xB9","\xB3","\xB2","_"," "];for(A=0;A<i.length;A++)e+=(t=255&i.charCodeAt(A))>127?n[t-128]:String.fromCharCode(t);return e}function QQ(i){return decodeURIComponent(escape(i))}function cQ(i){var A,t="";for(A=0;A<i.length;A++)t+=String.fromCharCode(i[A]);return t}function lQ(i,A,t,e,n){i.version=A.view.getUint16(t,!0),i.bitFlag=A.view.getUint16(t+2,!0),i.compressionMethod=A.view.getUint16(t+4,!0),i.lastModDateRaw=A.view.getUint32(t+6,!0),i.lastModDate=function(s){var o=(4294901760&s)>>16,a=65535&s;try{return new Date(1980+((65024&o)>>9),((480&o)>>5)-1,31&o,(63488&a)>>11,(2016&a)>>5,2*(31&a),0)}catch{}}(i.lastModDateRaw),(1&i.bitFlag)!=1?((e||(8&i.bitFlag)!=8)&&(i.crc32=A.view.getUint32(t+10,!0),i.compressedSize=A.view.getUint32(t+14,!0),i.uncompressedSize=A.view.getUint32(t+18,!0)),i.compressedSize!==4294967295&&i.uncompressedSize!==4294967295?(i.filenameLength=A.view.getUint16(t+22,!0),i.extraFieldLength=A.view.getUint16(t+24,!0)):n("File is using Zip64 (4gb+ file size).")):n("File contains encrypted entry.")}function dQ(i){return unescape(encodeURIComponent(i))}function uQ(i){var A,t=[];for(A=0;A<i.length;A++)t.push(i.charCodeAt(A));return t}Nr.prototype.append=function(i){for(var A=0|this.crc,t=this.table,e=0,n=0|i.length;e<n;e++)A=A>>>8^t[255&(A^i[e])];this.crc=A},Nr.prototype.get=function(){return~this.crc},Nr.prototype.table=function(){var i,A,t,e=[];for(i=0;i<256;i++){for(t=i,A=0;A<8;A++)1&t?t=t>>>1^3988292384:t>>>=1;e[i]=t}return e}(),eB.prototype.append=function(i,A){return i},eB.prototype.flush=function(){},(iB.prototype=new _r).constructor=iB,(nB.prototype=new _r).constructor=nB,(Or.prototype=new _r).constructor=Or,To.prototype.getData=function(i){i(this.data)},(sB.prototype=new To).constructor=sB,(oB.prototype=new To).constructor=oB,(aB.prototype=new To).constructor=aB;var BF={deflater:["z-worker.js","deflate.js"],inflater:["z-worker.js","inflate.js"]};function fQ(i,A,t){if(gt.workerScripts===null||gt.workerScriptsPath===null){var e,n,s;if(gt.workerScripts){if(e=gt.workerScripts[i],!Array.isArray(e))return void t(new Error("zip.workerScripts."+i+" is not an array!"));n=e,s=document.createElement("a"),e=n.map(function(g){return s.href=g,s.href})}else(e=BF[i].slice(0))[0]=(gt.workerScriptsPath||"")+e[0];var o=new Worker(e[0]);o.codecTime=o.crcTime=0,o.postMessage({type:"importScripts",scripts:e.slice(1)}),o.addEventListener("message",function g(r){var I=r.data;if(I.error)return o.terminate(),void t(I.error);I.type==="importScripts"&&(o.removeEventListener("message",g),o.removeEventListener("error",a),A(o))}),o.addEventListener("error",a)}else t(new Error("Either zip.workerScripts or zip.workerScriptsPath may be set, not both."));function a(g){o.terminate(),t(g)}}function pQ(i){console.error(i)}const gt={Reader:_r,Writer:To,BlobReader:Or,Data64URIReader:nB,TextReader:iB,BlobWriter:aB,Data64URIWriter:oB,TextWriter:sB,createReader:function(i,A,t){i.init(function(){(function(e,n,s){var o=0;function a(){}a.prototype.getData=function(r,I,B,C){var Q=this;function c(E,f){C&&!function(d){var u=ji(4);return u.view.setUint32(0,d),Q.crc32==u.view.getUint32(0)}(f)?s("CRC failed."):r.getData(function(d){I(d)})}function l(E){s(E||"Error while reading file data.")}function h(E){s(E||"Error while writing file data.")}e.readUint8Array(Q.offset,30,function(E){var f,d=ji(E.length,E);d.view.getUint32(0)==1347093252?(lQ(Q,d,4,!1,s),f=Q.offset+30+Q.filenameLength+Q.extraFieldLength,r.init(function(){Q.compressionMethod===0?EQ(Q._worker,o++,e,r,f,Q.compressedSize,C,c,B,l,h):function(u,m,y,p,R,D,S,F,G,L,T){var b=S?"output":"none";gt.useWebWorkers?rB(u,{sn:m,codecClass:"_zipjs_Inflater",crcType:b},y,p,R,D,G,F,L,T):gB(new dl,y,p,R,D,b,G,F,L,T)}(Q._worker,o++,e,r,f,Q.compressedSize,C,c,B,l,h)},h)):s(Lo)},l)};var g={getEntries:function(r){var I=this._worker;(function(B){function C(Q,c){e.readUint8Array(e.size-Q,Q,function(l){for(var h=l.length-22;h>=0;h--)if(l[h]===80&&l[h+1]===75&&l[h+2]===5&&l[h+3]===6)return void B(new DataView(l.buffer,h,22));c()},function(){s(CQ)})}e.size<22?s(Lo):C(22,function(){C(Math.min(65558,e.size),function(){s(Lo)})})})(function(B){var C,Q;C=B.getUint32(16,!0),Q=B.getUint16(8,!0),C<0||C>=e.size?s(Lo):e.readUint8Array(C,e.size-C,function(c){var l,h,E,f,d=0,u=[],m=ji(c.length,c);for(l=0;l<Q;l++){if((h=new a)._worker=I,m.view.getUint32(d)!=1347092738)return void s(Lo);lQ(h,m,d+6,!0,s),h.commentLength=m.view.getUint16(d+32,!0),h.directory=(16&m.view.getUint8(d+38))==16,h.offset=m.view.getUint32(d+42,!0),E=cQ(m.array.subarray(d+46,d+46+h.filenameLength)),h.filename=(2048&h.bitFlag)==2048?QQ(E):hQ(E),h.directory||h.filename.charAt(h.filename.length-1)!="/"||(h.directory=!0),f=cQ(m.array.subarray(d+46+h.filenameLength+h.extraFieldLength,d+46+h.filenameLength+h.extraFieldLength+h.commentLength)),h.comment=(2048&h.bitFlag)==2048?QQ(f):hQ(f),u.push(h),d+=46+h.filenameLength+h.extraFieldLength+h.commentLength}r(u)},function(){s(CQ)})})},close:function(r){this._worker&&(this._worker.terminate(),this._worker=null),r&&r()},_worker:null};gt.useWebWorkers?fQ("inflater",function(r){g._worker=r,n(g)},function(r){s(r)}):n(g)})(i,A,t)},t=t||pQ)},createWriter:function(i,A,t,e){e=!!e,i.init(function(){(function(n,s,o,a){var g={},r=[],I=0,B=0;function C(l){o(l||"Error while writing zip file.")}function Q(l){o(l||"Error while reading file data.")}var c={add:function(l,h,E,f,d){var u,m,y,p=this._worker;function R(S,F){var G=ji(16);I+=S||0,G.view.setUint32(0,1347094280),F!==void 0&&(u.view.setUint32(10,F,!0),G.view.setUint32(4,F,!0)),h&&(G.view.setUint32(8,S,!0),u.view.setUint32(14,S,!0),G.view.setUint32(12,h.size,!0),u.view.setUint32(18,h.size,!0)),n.writeUint8Array(G.array,function(){I+=16,E()},C)}function D(){var S;d=d||{},l=l.trim(),d.directory&&l.charAt(l.length-1)!="/"&&(l+="/"),g.hasOwnProperty(l)?o("File already exists."):(m=uQ(dQ(l)),r.push(l),y=d.lastModDate||new Date,u=ji(26),g[l]={headerArray:u.array,directory:d.directory,filename:m,offset:I,comment:uQ(dQ(d.comment||""))},u.view.setUint32(0,335546376),d.version&&u.view.setUint8(0,d.version),a||d.level===0||d.directory||u.view.setUint16(4,2048),u.view.setUint16(6,(y.getHours()<<6|y.getMinutes())<<5|y.getSeconds()/2,!0),u.view.setUint16(8,(y.getFullYear()-1980<<4|y.getMonth()+1)<<5|y.getDate(),!0),u.view.setUint16(22,m.length,!0),(S=ji(30+m.length)).view.setUint32(0,1347093252),S.array.set(u.array,4),S.array.set(m,30),I+=S.array.length,n.writeUint8Array(S.array,function(){h?a||d.level===0?EQ(p,B++,h,n,0,h.size,!0,R,f,Q,C):function(F,G,L,T,b,V,K,tA,nA){var Z="input";gt.useWebWorkers?rB(F,{sn:G,options:{level:b},codecClass:"_zipjs_Deflater",crcType:Z},L,T,0,L.size,K,V,tA,nA):gB(new cl,L,T,0,L.size,Z,K,V,tA,nA)}(p,B++,h,n,d.level,R,f,Q,C):R()},C))}h?h.init(D,Q):D()},close:function(l){this._worker&&(this._worker.terminate(),this._worker=null);var h,E,f,d=0,u=0;for(E=0;E<r.length;E++)d+=46+(f=g[r[E]]).filename.length+f.comment.length;for(h=ji(d+22),E=0;E<r.length;E++)f=g[r[E]],h.view.setUint32(u,1347092738),h.view.setUint16(u+4,5120),h.array.set(f.headerArray,u+6),h.view.setUint16(u+32,f.comment.length,!0),f.directory&&h.view.setUint8(u+38,16),h.view.setUint32(u+42,f.offset,!0),h.array.set(f.filename,u+46),h.array.set(f.comment,u+46+f.filename.length),u+=46+f.filename.length+f.comment.length;h.view.setUint32(u,1347093766),h.view.setUint16(u+8,r.length,!0),h.view.setUint16(u+10,r.length,!0),h.view.setUint32(u+12,d,!0),h.view.setUint32(u+16,I,!0),n.writeUint8Array(h.array,function(){n.getData(l)},C)},_worker:null};gt.useWebWorkers?fQ("deflater",function(l){c._worker=l,s(c)},function(l){o(l)}):s(c)})(i,A,t,e)},t=t||pQ)},useWebWorkers:!0,workerScriptsPath:null,workerScripts:null};var Us,_t,LI=gt.TextWriter,Gr=gt.BlobWriter,UI=gt.Data64URIWriter,mQ=gt.TextReader,IB=gt.BlobReader,yQ=gt.Data64URIReader,CF=gt.createReader,EF=gt.createWriter;function fr(i){var A,t=this;t.size=0,t.init=function(e){t.size=i.uncompressedSize,e()},t.readUint8Array=function(e,n,s,o){(function(a){t.data?a():i.getData(new Gr,function(g){t.data=g,A=new IB(g),a()},null,t.checkCrc32)})(function(){A.readUint8Array(e,n,s,o)})}}function DQ(i){var A=0;return function t(e){A+=e.uncompressedSize||0,e.children.forEach(t)}(i),A}function BB(i,A,t){var e=0;function n(){++e<i.children.length?s(i.children[e]):A()}function s(o){o.directory?BB(o,n,t):(o.reader=new o.Reader(o.data,t),o.reader.init(function(){o.uncompressedSize=o.reader.size,n()}))}i.children.length?s(i.children[e]):A()}function SQ(i){var A=i.parent.children;A.forEach(function(t,e){t.id==i.id&&A.splice(e,1)})}function Lr(i){i.entries=[],i.root=new Ws(i)}function bs(i,A,t,e){if(i.directory)return e?new Ws(i.fs,A,t,i):new Wr(i.fs,A,t,i);throw"Parent entry is not a directory."}function qs(){}function Wr(i,A,t,e){var n=this;qs.prototype.init.call(n,i,A,t,e),n.Reader=t.Reader,n.Writer=t.Writer,n.data=t.data,t.getData&&(n.getData=t.getData)}function Ws(i,A,t,e){qs.prototype.init.call(this,i,A,t,e),this.directory=!0}function ul(){Lr(this)}(fr.prototype=new gt.Reader).constructor=fr,fr.prototype.checkCrc32=!1,(qs.prototype={init:function(i,A,t,e){var n=this;if(i.root&&e&&e.getChildByName(A))throw"Entry filename already exists.";t||(t={}),n.fs=i,n.name=A,n.id=i.entries.length,n.parent=e,n.children=[],n.zipVersion=t.zipVersion||20,n.uncompressedSize=0,i.entries.push(n),e&&n.parent.children.push(n)},getFileEntry:function(i,A,t,e,n){var s=this;BB(s,function(){(function(o,a,g,r,I,B,C){var Q=0;a.directory?function c(l,h,E,f,d,u){var m=0;(function y(){var p=h.children[m];p?function(R){function D(S){Q+=R.uncompressedSize||0,c(S,R,function(){m++,y()},f,d,u)}R.directory?l.getDirectory(R.name,{create:!0},D,d):l.getFile(R.name,{create:!0},function(S){R.getData(new gt.FileWriter(S,gt.getMimeType(R.name)),D,function(F){f&&f(Q+F,u)},C)},d)}(p):E()})()}(o,a,g,r,I,B):a.getData(new gt.FileWriter(o,gt.getMimeType(a.name)),g,r,C)})(i,s,A,t,e,DQ(s),n)},e)},moveTo:function(i){var A=this;if(!i.directory)throw"Target entry is not a directory.";if(i.isDescendantOf(A))throw"Entry is a ancestor of target entry.";if(A!=i){if(i.getChildByName(A.name))throw"Entry filename already exists.";SQ(A),A.parent=i,i.children.push(A)}},getFullname:function(){for(var i=this.name,A=this.parent;A;)i=(A.name?A.name+"/":"")+i,A=A.parent;return i},isDescendantOf:function(i){for(var A=this.parent;A&&A.id!=i.id;)A=A.parent;return!!A}}).constructor=qs,Wr.prototype=Us=new qs,Us.constructor=Wr,Us.getData=function(i,A,t,e){var n=this;!i||i.constructor==n.Writer&&n.data?A(n.data):(n.reader||(n.reader=new n.Reader(n.data,e)),n.reader.init(function(){i.init(function(){(function(s,o,a,g,r){var I=0;(function B(){var C=524288*I;g&&g(C,s.size),C<s.size?s.readUint8Array(C,Math.min(524288,s.size-C),function(Q){o.writeUint8Array(new Uint8Array(Q),function(){I++,B()})},r):o.getData(a)})()})(n.reader,i,A,t,e)},e)}))},Us.getText=function(i,A,t,e){this.getData(new LI(e),i,A,t)},Us.getBlob=function(i,A,t,e){this.getData(new Gr(i),A,t,e)},Us.getData64URI=function(i,A,t,e){this.getData(new UI(i),A,t,e)},Ws.prototype=_t=new qs,_t.constructor=Ws,_t.addDirectory=function(i){return bs(this,i,null,!0)},_t.addText=function(i,A){return bs(this,i,{data:A,Reader:mQ,Writer:LI})},_t.addBlob=function(i,A){return bs(this,i,{data:A,Reader:IB,Writer:Gr})},_t.addData64URI=function(i,A){return bs(this,i,{data:A,Reader:yQ,Writer:UI})},_t.addFileEntry=function(i,A,t){(function(e,n,s,o){n.isDirectory?function a(g,r,I){(function(B,C){B.isDirectory&&B.createReader().readEntries(C),B.isFile&&C([])})(r,function(B){var C=0;(function Q(){var c=B[C];c?function(l){function h(E){a(E,l,function(){C++,Q()})}l.isDirectory&&h(g.addDirectory(l.name)),l.isFile&&l.file(function(E){var f=g.addBlob(l.name,E);f.uncompressedSize=E.size,h(f)},o)}(c):I()})()})}(e,n,s):n.file(function(a){e.addBlob(n.name,a),s()},o)})(this,i,A,t)},_t.addData=function(i,A){return bs(this,i,A)},_t.importBlob=function(i,A,t){this.importZip(new IB(i),A,t)},_t.importText=function(i,A,t){this.importZip(new mQ(i),A,t)},_t.importData64URI=function(i,A,t){this.importZip(new yQ(i),A,t)},_t.exportBlob=function(i,A,t){this.exportZip(new Gr("application/zip"),i,A,t)},_t.exportText=function(i,A,t){this.exportZip(new LI,i,A,t)},_t.exportFileEntry=function(i,A,t,e){this.exportZip(new gt.FileWriter(i,"application/zip"),A,t,e)},_t.exportData64URI=function(i,A,t){this.exportZip(new UI("application/zip"),i,A,t)},_t.importZip=function(i,A,t){var e=this;CF(i,function(n){n.getEntries(function(s){s.forEach(function(o){var a=e,g=o.filename.split("/"),r=g.pop();g.forEach(function(I){a=a.getChildByName(I)||new Ws(e.fs,I,null,a)}),o.directory||bs(a,r,{data:o,Reader:fr})}),A()})},t)},_t.exportZip=function(i,A,t,e){var n=this;BB(n,function(){EF(i,function(s){(function(o,a,g,r,I){var B=0;(function C(Q,c,l,h,E){var f=0;(function d(){var u=c.children[f];u?Q.add(u.getFullname(),u.reader,function(){B+=u.uncompressedSize||0,C(Q,u,function(){f++,d()},h,E)},function(m){h&&h(B+m,E)},{directory:u.directory,version:u.zipVersion}):l()})()})(o,a,g,r,I)})(s,n,function(){s.close(A)},t,DQ(n))},e)},e)},_t.getChildByName=function(i){var A,t;for(A=0;A<this.children.length;A++)if((t=this.children[A]).name==i)return t},ul.prototype={remove:function(i){SQ(i),this.entries[i.id]=null},find:function(i){var A,t=i.split("/"),e=this.root;for(A=0;e&&A<t.length;A++)e=e.getChildByName(t[A]);return e},getById:function(i){return this.entries[i]},importBlob:function(i,A,t){Lr(this),this.root.importBlob(i,A,t)},importText:function(i,A,t){Lr(this),this.root.importText(i,A,t)},importData64URI:function(i,A,t){Lr(this),this.root.importData64URI(i,A,t)},exportBlob:function(i,A,t){this.root.exportBlob(i,A,t)},exportText:function(i,A,t){this.root.exportText(i,A,t)},exportFileEntry:function(i,A,t,e){this.root.exportFileEntry(i,A,t,e)},exportData64URI:function(i,A,t){this.root.exportData64URI(i,A,t)}},gt.getMimeType=function(){return"application/octet-stream"};var hF={FS:ul,ZipDirectoryEntry:Ws,ZipFileEntry:Wr};gt.useWebWorkers=!1;var QF=function(){function i(t,e){this.el=t,this.inputEl=e,this.listeners={drop:[],dropstart:[],droperror:[]},this._onDragover=this._onDragover.bind(this),this._onDrop=this._onDrop.bind(this),this._onSelect=this._onSelect.bind(this),t.addEventListener("dragover",this._onDragover,!1),t.addEventListener("drop",this._onDrop,!1),e.addEventListener("change",this._onSelect)}var A=i.prototype;return A.on=function(t,e){return this.listeners[t].push(e),this},A._emit=function(t,e){return this.listeners[t].forEach(function(n){return n(e)}),this},A.destroy=function(){var t=this.el,e=this.inputEl;t.removeEventListener("dragover",this._onDragover,!1),t.removeEventListener("drop",this._onDrop,!1),e.removeEventListener("change",this._onSelect),delete this.el,delete this.inputEl,delete this.listeners},A._onDrop=function(t){t.stopPropagation(),t.preventDefault(),this._emit("dropstart");var e=Array.from(t.dataTransfer.files||[]),n=Array.from(t.dataTransfer.items||[]);if(e.length!==0||n.length!==0)if(n.length>0){var s=n.map(function(o){return o.webkitGetAsEntry()});s[0].name.match(/\.zip$/)?this._loadZip(n[0].getAsFile()):this._loadNextEntry(new Map,s)}else e.length===1&&e[0].name.match(/\.zip$/)&&this._loadZip(e[0]),this._emit("drop",{files:new Map(e.map(function(o){return[o.name,o]}))});else this._fail("Required drag-and-drop APIs are not supported in this browser.")},A._onDragover=function(t){t.stopPropagation(),t.preventDefault(),t.dataTransfer.dropEffect="copy"},A._onSelect=function(t){this._emit("dropstart");var e=[].slice.call(this.inputEl.files);if(e.length===1&&this._isZip(e[0]))this._loadZip(e[0]);else{var n=new Map;e.forEach(function(s){return n.set(s.webkitRelativePath||s.name,s)}),this._emit("drop",{files:n})}},A._loadNextEntry=function(t,e){var n=this,s=e.pop();if(s)if(s.isFile)s.file(function(a){t.set(s.fullPath,a),n._loadNextEntry(t,e)},function(){return console.error("Could not load file: %s",s.fullPath)});else if(s.isDirectory){var o=s.createReader();o.readEntries(function a(g){g.length?(e=e.concat(g),o.readEntries(a)):n._loadNextEntry(t,e)})}else console.warn("Unknown asset type: "+s.fullPath),this._loadNextEntry(t,e);else this._emit("drop",{files:t})},A._loadZip=function(t){var e=this,n=[],s=new Map,o=new hF.FS,a=function g(r){r.directory?r.children.forEach(g):r.name[0]!=="."&&n.push(new Promise(function(I){r.getData(new gt.BlobWriter,function(B){B.name=r.name,s.set(r.getFullname(),B),I()})}))};o.importBlob(t,function(){a(o.root),Promise.all(n).then(function(){e._emit("drop",{files:s,archive:t})})})},A._isZip=function(t){return t.type==="application/zip"||t.name.match(/\.zip$/)},A._fail=function(t){this._emit("droperror",{message:t})},i}();let at,CB;const YB=new QF(Wn,document.createElement("input"));Wn.innerHTML="[Drop .VDB / .ZIP here]";YB.on("drop",({files:i})=>{let A=[...i];const t=A[0][0],e=URL.createObjectURL(A[0][1]);Wn.innerHTML="[Loaded! Parsing...]",JB(t,e).then(n=>{var g;Wn.innerHTML="[Drop .VDB / .ZIP here]",at=new la(n,{resolution:200,steps:1e3,baseColor:16777215,absorbance:1,progressive:!0,emissiveGrid:(g=n.grids)==null?void 0:g.temperature,radius:2});const s=n.grids[Object.keys(n.grids)[0]],o=new xe;o.set(...s.getPreciseWorldBbox());const a=new P;o.getSize(a).multiplyScalar(.5),at.position.y-=a.y,CB&&CB.add(at)})});YB.on("dropstart",()=>{at&&(at.parent&&at.parent.remove(at),at.geometry.dispose(),at.materials.forEach(i=>{i.densityMap3D.dispose(),i.emissiveMap3D&&i.emissiveMap3D.dispose()}),at.dispose(),at=null),Wn.innerHTML="[Loading VDB file - please wait...]"});YB.on("droperror",({message:i})=>{Wn.innerHTML="[Error - please try again]",console.error({message:i})});const cF=({scene:i})=>{CB=i;const A=new dt(new ye(20,32,32),new Ao({color:16777215}));i.add(A);const t=new dt(new ye(20,32,32),new $m({color:16777215}));t.position.set(-200,0,200),i.add(t);const e=(f,d,u,m)=>{const y=new Ke,p=new FB(f,.5);return p.position.set(d,u,m),p.add(new dt(new ye(1,32,32),new Qe({color:f}))),y.add(p),i.add(y),[p,y]},n=(f,d,u,m)=>{const y=new Ke,p=new RB(f,.5,null,.2,.6);return p.position.set(d,u,m),p.add(new dt(new ye(1,32,32),new Qe({color:f}))),y.add(p),i.add(y),[p,y]},s=(f,d,u,m)=>{const y=new Ia(f,.5);y.position.set(d,u,m);const p=new dt(new ye(1,32,32),new Qe({color:f}));return p.position.set(d,u,m),i.add(y),i.add(p),[y,p]},[o,a]=n(16711935,50,80,0),[g]=n(16711680,0,80,0),[r,I]=e(16711935,50,80,0),[B]=e(16711680,0,80,0),[C,Q]=e(16777096,0,0,0);t.add(Q);const[c]=e(16711935,0,-10,0);c.children=[];const[l,h]=s(16711680,0,0,-80),E=new Cc(16711680,255,1);i.add(E),setInterval(()=>{a.rotateY(.005),I.rotateX(.005)},1),da([{folder:"Scene",children:[{id:"showMesh",name:"Show Debug Mesh",defaultValue:!1,onChange:f=>{at&&(at.visible=!f),A.visible=!!f}},{id:"environment",name:"EnvMap",defaultValue:"uv-1",options:{"Fiery Sky":"fiery-sky-1","Magic Forest":"magic-forest-5",UV:"uv-1"},onChange:f=>{ri.rgbe.load(`./assets/${f}-HDR.hdr`,d=>{d.mapping=kn,i.environment=d}),ri.texture.load(`./assets/${f}-8K.jpg`,d=>{d.mapping=Tn,d.encoding=Pe,i.background=d})}},{id:"lightSetup",name:"Lights",defaultValue:"hemi",options:{"Hemisphere Light":"hemi","Spot Lights":"spot","Point Lights":"point","Directional Light":"dir",Sun:"sun",Glow:"glow",None:"none"},onChange:f=>{r.visible=f==="point",B.visible=f==="point",o.visible=f==="spot",g.visible=f==="spot",l.visible=f==="dir",E.visible=f==="dir",E.visible=f==="hemi",C.visible=f==="sun",c.visible=f==="glow"}},{id:"lightColor",name:"Light Color",defaultValue:"#ff00ff",onChange:f=>{o.color.set(f),o.children[0].material.color.set(f),l.color.set(f),h.material.color.set(f),r.color.set(f),r.children[0].material.color.set(f),c.color.set(f)}},{id:"lightIntensity",name:"Light Intensity",defaultValue:1,min:0,max:1,onChange:f=>{o.intensity=f,g.intensity=f,l.intensity=f,E.intensity=f,r.intensity=f,B.intensity=f,c.intensity=f}}]},{folder:"Fog Volume",children:[{id:"wrap3D",name:"3D Wrapping",defaultValue:Cn,options:{"Three.ClampToEdgeWrapping":Yt,"Three.RepeatWrapping":Bn,"Three.MirroredRepeatWrapping":Cn},onChange:f=>{!at||(at.material.wrap3D=f)}},{id:"fogColor",name:"Fog Color",defaultValue:"#ffffff",onChange:f=>{at&&at.materials.forEach(d=>d.baseColor=f),A.material.color.set(f)}},{id:"scatterColor",name:"Scatter Color",defaultValue:"#000000",onChange:f=>{at&&at.materials.forEach(d=>d.scatterColor=f)}},{id:"absorbance",name:"Absorbance",defaultValue:.98,min:0,max:1,onChange:f=>{at&&at.materials.forEach(d=>d.absorbance=f)}},{id:"densityScale",name:"Density Scale",defaultValue:1,min:0,max:1,onChange:f=>{at&&at.materials.forEach(d=>d.densityScale=f)}},{id:"opacity",name:"Opacity",defaultValue:1,min:0,max:1,onChange:f=>{at&&at.materials.forEach(d=>d.opacity=f)}},{id:"steps",name:"Steps",defaultValue:1e3,min:10,max:1e3,onChange:f=>{at&&at.materials.forEach(d=>d.steps=f)}}]}])},lF="openvdb",dF="0.3.0",uF="This project indirectly ports OpenVDB file format and tools to JavaScript, TypeScript, and Node. Specific 3D library implementations can be found in sub-directories.",fF="./index.js",pF={".":"./index.js","./three":"./three/index.js"},mF={three:"src/three"},yF=["openvdb","vdb","threejs","babylonjs","webgl","houdini","fluid"],DF={build:"rollup --config ./rollup.config.js && cd build && npm pack","build:examples":"cd examples && npm run build",dev:"cd examples && npm run dev",publish:"npm run build && cd ./build && npm publish"},SF={name:"mjurczyk",url:"https://discourse.threejs.org/u/mjurczyk"},wF=[{name:"mjurczyk",url:"https://discourse.threejs.org/u/mjurczyk"},{name:"notchris",url:"https://discourse.threejs.org/u/notchris"}],MF="MIT",RF={three:"^0.153.0"},FF={"@lopatnov/rollup-plugin-uglify":"^2.1.5","@rollup/plugin-node-resolve":"^14.1.0",rollup:"^2.79.1","rollup-plugin-copy":"^3.4.0","rollup-plugin-delete":"^2.0.0","rollup-plugin-peer-deps-external":"^2.2.4","stats.js":"^0.17.0"},xF={name:lF,version:dF,description:uF,main:fF,exports:pF,directories:mF,keywords:yF,scripts:DF,author:SF,contributors:wF,license:MF,peerDependencies:RF,devDependencies:FF},Ho=new zt(60,window.innerWidth/window.innerHeight,.01,1e4),ti=new Km,$i=new ic({antialias:!0});document.querySelector(".package-version").innerHTML=`v${xF.version}`;const EB=new Ry;document.body.appendChild(EB.dom);const NF=()=>{Ho.position.set(-100,80,80),ti.background=new HA(5869311),$i.outputColorSpace=kA,$i.physicallyCorrectLights=!0,$i.setSize(window.innerWidth,window.innerHeight),$i.shadowMap.enabled=!0,new wy(Ho,$i.domElement),document.body.appendChild($i.domElement),window.addEventListener("resize",()=>{Ho.aspect=window.innerWidth/window.innerHeight,Ho.updateProjectionMatrix(),$i.setSize(window.innerWidth,window.innerHeight)})},fl=()=>{requestAnimationFrame(fl),EB.begin(),$i.render(ti,Ho),EB.end()};ZR("clouds");NF();fl();El({scene:ti});