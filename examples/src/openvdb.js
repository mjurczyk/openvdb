const assert = (text, assumed, found) => {
  console.info(assumed === found ? 'OK\t' : 'NOT\t', '\t', text, 'Assumed', { assumed }, 'equal to', { found });
};

const unsupported$1 = (description) => {
  console.warn('Unsupported feature', description);
};

// NOTE Keep static dependencies here to not bloat package.json
 
/*! pako 2.0.4 https://github.com/nodeca/pako @license (MIT AND Zlib) */
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?t(exports):"function"==typeof define&&define.amd?define(["exports"],t):t((e="undefined"!=typeof globalThis?globalThis:e||self).pako={});}(undefined,(function(e){var t=function(e,t,i,n){for(var a=65535&e|0,r=e>>>16&65535|0,o=0;0!==i;){i-=o=i>2e3?2e3:i;do{r=r+(a=a+t[n++]|0)|0;}while(--o);a%=65521,r%=65521;}return a|r<<16|0},i=new Uint32Array(function(){for(var e,t=[],i=0;i<256;i++){e=i;for(var n=0;n<8;n++)e=1&e?3988292384^e>>>1:e>>>1;t[i]=e;}return t}()),n=function(e,t,n,a){var r=i,o=a+n;e^=-1;for(var s=a;s<o;s++)e=e>>>8^r[255&(e^t[s])];return -1^e},a=function(e,t){var i,n,a,r,o,s,l,f,d,h,c,u,w,b,m,k,_,v,g,p,y,x,E,R,A=e.state;i=e.next_in,E=e.input,n=i+(e.avail_in-5),a=e.next_out,R=e.output,r=a-(t-e.avail_out),o=a+(e.avail_out-257),s=A.dmax,l=A.wsize,f=A.whave,d=A.wnext,h=A.window,c=A.hold,u=A.bits,w=A.lencode,b=A.distcode,m=(1<<A.lenbits)-1,k=(1<<A.distbits)-1;e:do{u<15&&(c+=E[i++]<<u,u+=8,c+=E[i++]<<u,u+=8),_=w[c&m];t:for(;;){if(c>>>=v=_>>>24,u-=v,0===(v=_>>>16&255))R[a++]=65535&_;else {if(!(16&v)){if(0==(64&v)){_=w[(65535&_)+(c&(1<<v)-1)];continue t}if(32&v){A.mode=12;break e}e.msg="invalid literal/length code",A.mode=30;break e}g=65535&_,(v&=15)&&(u<v&&(c+=E[i++]<<u,u+=8),g+=c&(1<<v)-1,c>>>=v,u-=v),u<15&&(c+=E[i++]<<u,u+=8,c+=E[i++]<<u,u+=8),_=b[c&k];i:for(;;){if(c>>>=v=_>>>24,u-=v,!(16&(v=_>>>16&255))){if(0==(64&v)){_=b[(65535&_)+(c&(1<<v)-1)];continue i}e.msg="invalid distance code",A.mode=30;break e}if(p=65535&_,u<(v&=15)&&(c+=E[i++]<<u,(u+=8)<v&&(c+=E[i++]<<u,u+=8)),(p+=c&(1<<v)-1)>s){e.msg="invalid distance too far back",A.mode=30;break e}if(c>>>=v,u-=v,p>(v=a-r)){if((v=p-v)>f&&A.sane){e.msg="invalid distance too far back",A.mode=30;break e}if(y=0,x=h,0===d){if(y+=l-v,v<g){g-=v;do{R[a++]=h[y++];}while(--v);y=a-p,x=R;}}else if(d<v){if(y+=l+d-v,(v-=d)<g){g-=v;do{R[a++]=h[y++];}while(--v);if(y=0,d<g){g-=v=d;do{R[a++]=h[y++];}while(--v);y=a-p,x=R;}}}else if(y+=d-v,v<g){g-=v;do{R[a++]=h[y++];}while(--v);y=a-p,x=R;}for(;g>2;)R[a++]=x[y++],R[a++]=x[y++],R[a++]=x[y++],g-=3;g&&(R[a++]=x[y++],g>1&&(R[a++]=x[y++]));}else {y=a-p;do{R[a++]=R[y++],R[a++]=R[y++],R[a++]=R[y++],g-=3;}while(g>2);g&&(R[a++]=R[y++],g>1&&(R[a++]=R[y++]));}break}}break}}while(i<n&&a<o);i-=g=u>>3,c&=(1<<(u-=g<<3))-1,e.next_in=i,e.next_out=a,e.avail_in=i<n?n-i+5:5-(i-n),e.avail_out=a<o?o-a+257:257-(a-o),A.hold=c,A.bits=u;},r=15,o=new Uint16Array([3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,0,0]),s=new Uint8Array([16,16,16,16,16,16,16,16,17,17,17,17,18,18,18,18,19,19,19,19,20,20,20,20,21,21,21,21,16,72,78]),l=new Uint16Array([1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577,0,0]),f=new Uint8Array([16,16,16,16,17,17,18,18,19,19,20,20,21,21,22,22,23,23,24,24,25,25,26,26,27,27,28,28,29,29,64,64]),d=function(e,t,i,n,a,d,h,c){var u,w,b,m,k,_,v,g,p,y=c.bits,x=0,E=0,R=0,A=0,Z=0,S=0,T=0,O=0,U=0,D=0,I=null,B=0,N=new Uint16Array(16),C=new Uint16Array(16),z=null,F=0;for(x=0;x<=r;x++)N[x]=0;for(E=0;E<n;E++)N[t[i+E]]++;for(Z=y,A=r;A>=1&&0===N[A];A--);if(Z>A&&(Z=A),0===A)return a[d++]=20971520,a[d++]=20971520,c.bits=1,0;for(R=1;R<A&&0===N[R];R++);for(Z<R&&(Z=R),O=1,x=1;x<=r;x++)if(O<<=1,(O-=N[x])<0)return -1;if(O>0&&(0===e||1!==A))return -1;for(C[1]=0,x=1;x<r;x++)C[x+1]=C[x]+N[x];for(E=0;E<n;E++)0!==t[i+E]&&(h[C[t[i+E]]++]=E);if(0===e?(I=z=h,_=19):1===e?(I=o,B-=257,z=s,F-=257,_=256):(I=l,z=f,_=-1),D=0,E=0,x=R,k=d,S=Z,T=0,b=-1,m=(U=1<<Z)-1,1===e&&U>852||2===e&&U>592)return 1;for(;;){v=x-T,h[E]<_?(g=0,p=h[E]):h[E]>_?(g=z[F+h[E]],p=I[B+h[E]]):(g=96,p=0),u=1<<x-T,R=w=1<<S;do{a[k+(D>>T)+(w-=u)]=v<<24|g<<16|p|0;}while(0!==w);for(u=1<<x-1;D&u;)u>>=1;if(0!==u?(D&=u-1,D+=u):D=0,E++,0==--N[x]){if(x===A)break;x=t[i+h[E]];}if(x>Z&&(D&m)!==b){for(0===T&&(T=Z),k+=R,O=1<<(S=x-T);S+T<A&&!((O-=N[S+T])<=0);)S++,O<<=1;if(U+=1<<S,1===e&&U>852||2===e&&U>592)return 1;a[b=D&m]=Z<<24|S<<16|k-d|0;}}return 0!==D&&(a[k+D]=x-T<<24|64<<16|0),c.bits=Z,0},h={Z_NO_FLUSH:0,Z_PARTIAL_FLUSH:1,Z_SYNC_FLUSH:2,Z_FULL_FLUSH:3,Z_FINISH:4,Z_BLOCK:5,Z_TREES:6,Z_OK:0,Z_STREAM_END:1,Z_NEED_DICT:2,Z_ERRNO:-1,Z_STREAM_ERROR:-2,Z_DATA_ERROR:-3,Z_MEM_ERROR:-4,Z_BUF_ERROR:-5,Z_NO_COMPRESSION:0,Z_BEST_SPEED:1,Z_BEST_COMPRESSION:9,Z_DEFAULT_COMPRESSION:-1,Z_FILTERED:1,Z_HUFFMAN_ONLY:2,Z_RLE:3,Z_FIXED:4,Z_DEFAULT_STRATEGY:0,Z_BINARY:0,Z_TEXT:1,Z_UNKNOWN:2,Z_DEFLATED:8},c=h.Z_FINISH,u=h.Z_BLOCK,w=h.Z_TREES,b=h.Z_OK,m=h.Z_STREAM_END,k=h.Z_NEED_DICT,_=h.Z_STREAM_ERROR,v=h.Z_DATA_ERROR,g=h.Z_MEM_ERROR,p=h.Z_BUF_ERROR,y=h.Z_DEFLATED,x=12,E=30,R=function(e){return (e>>>24&255)+(e>>>8&65280)+((65280&e)<<8)+((255&e)<<24)};function A(){this.mode=0,this.last=!1,this.wrap=0,this.havedict=!1,this.flags=0,this.dmax=0,this.check=0,this.total=0,this.head=null,this.wbits=0,this.wsize=0,this.whave=0,this.wnext=0,this.window=null,this.hold=0,this.bits=0,this.length=0,this.offset=0,this.extra=0,this.lencode=null,this.distcode=null,this.lenbits=0,this.distbits=0,this.ncode=0,this.nlen=0,this.ndist=0,this.have=0,this.next=null,this.lens=new Uint16Array(320),this.work=new Uint16Array(288),this.lendyn=null,this.distdyn=null,this.sane=0,this.back=0,this.was=0;}var Z,S,T=function(e){if(!e||!e.state)return _;var t=e.state;return e.total_in=e.total_out=t.total=0,e.msg="",t.wrap&&(e.adler=1&t.wrap),t.mode=1,t.last=0,t.havedict=0,t.dmax=32768,t.head=null,t.hold=0,t.bits=0,t.lencode=t.lendyn=new Int32Array(852),t.distcode=t.distdyn=new Int32Array(592),t.sane=1,t.back=-1,b},O=function(e){if(!e||!e.state)return _;var t=e.state;return t.wsize=0,t.whave=0,t.wnext=0,T(e)},U=function(e,t){var i;if(!e||!e.state)return _;var n=e.state;return t<0?(i=0,t=-t):(i=1+(t>>4),t<48&&(t&=15)),t&&(t<8||t>15)?_:(null!==n.window&&n.wbits!==t&&(n.window=null),n.wrap=i,n.wbits=t,O(e))},D=function(e,t){if(!e)return _;var i=new A;e.state=i,i.window=null;var n=U(e,t);return n!==b&&(e.state=null),n},I=!0,B=function(e){if(I){Z=new Int32Array(512),S=new Int32Array(32);for(var t=0;t<144;)e.lens[t++]=8;for(;t<256;)e.lens[t++]=9;for(;t<280;)e.lens[t++]=7;for(;t<288;)e.lens[t++]=8;for(d(1,e.lens,0,288,Z,0,e.work,{bits:9}),t=0;t<32;)e.lens[t++]=5;d(2,e.lens,0,32,S,0,e.work,{bits:5}),I=!1;}e.lencode=Z,e.lenbits=9,e.distcode=S,e.distbits=5;},N=function(e,t,i,n){var a,r=e.state;return null===r.window&&(r.wsize=1<<r.wbits,r.wnext=0,r.whave=0,r.window=new Uint8Array(r.wsize)),n>=r.wsize?(r.window.set(t.subarray(i-r.wsize,i),0),r.wnext=0,r.whave=r.wsize):((a=r.wsize-r.wnext)>n&&(a=n),r.window.set(t.subarray(i-n,i-n+a),r.wnext),(n-=a)?(r.window.set(t.subarray(i-n,i),0),r.wnext=n,r.whave=r.wsize):(r.wnext+=a,r.wnext===r.wsize&&(r.wnext=0),r.whave<r.wsize&&(r.whave+=a))),0},C={inflateReset:O,inflateReset2:U,inflateResetKeep:T,inflateInit:function(e){return D(e,15)},inflateInit2:D,inflate:function(e,i){var r,o,s,l,f,h,A,Z,S,T,O,U,D,I,C,z,F,L,M,H,j,K,P,Y,G=0,X=new Uint8Array(4),W=new Uint8Array([16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15]);if(!e||!e.state||!e.output||!e.input&&0!==e.avail_in)return _;(r=e.state).mode===x&&(r.mode=13),f=e.next_out,s=e.output,A=e.avail_out,l=e.next_in,o=e.input,h=e.avail_in,Z=r.hold,S=r.bits,T=h,O=A,K=b;e:for(;;)switch(r.mode){case 1:if(0===r.wrap){r.mode=13;break}for(;S<16;){if(0===h)break e;h--,Z+=o[l++]<<S,S+=8;}if(2&r.wrap&&35615===Z){r.check=0,X[0]=255&Z,X[1]=Z>>>8&255,r.check=n(r.check,X,2,0),Z=0,S=0,r.mode=2;break}if(r.flags=0,r.head&&(r.head.done=!1),!(1&r.wrap)||(((255&Z)<<8)+(Z>>8))%31){e.msg="incorrect header check",r.mode=E;break}if((15&Z)!==y){e.msg="unknown compression method",r.mode=E;break}if(S-=4,j=8+(15&(Z>>>=4)),0===r.wbits)r.wbits=j;else if(j>r.wbits){e.msg="invalid window size",r.mode=E;break}r.dmax=1<<r.wbits,e.adler=r.check=1,r.mode=512&Z?10:x,Z=0,S=0;break;case 2:for(;S<16;){if(0===h)break e;h--,Z+=o[l++]<<S,S+=8;}if(r.flags=Z,(255&r.flags)!==y){e.msg="unknown compression method",r.mode=E;break}if(57344&r.flags){e.msg="unknown header flags set",r.mode=E;break}r.head&&(r.head.text=Z>>8&1),512&r.flags&&(X[0]=255&Z,X[1]=Z>>>8&255,r.check=n(r.check,X,2,0)),Z=0,S=0,r.mode=3;case 3:for(;S<32;){if(0===h)break e;h--,Z+=o[l++]<<S,S+=8;}r.head&&(r.head.time=Z),512&r.flags&&(X[0]=255&Z,X[1]=Z>>>8&255,X[2]=Z>>>16&255,X[3]=Z>>>24&255,r.check=n(r.check,X,4,0)),Z=0,S=0,r.mode=4;case 4:for(;S<16;){if(0===h)break e;h--,Z+=o[l++]<<S,S+=8;}r.head&&(r.head.xflags=255&Z,r.head.os=Z>>8),512&r.flags&&(X[0]=255&Z,X[1]=Z>>>8&255,r.check=n(r.check,X,2,0)),Z=0,S=0,r.mode=5;case 5:if(1024&r.flags){for(;S<16;){if(0===h)break e;h--,Z+=o[l++]<<S,S+=8;}r.length=Z,r.head&&(r.head.extra_len=Z),512&r.flags&&(X[0]=255&Z,X[1]=Z>>>8&255,r.check=n(r.check,X,2,0)),Z=0,S=0;}else r.head&&(r.head.extra=null);r.mode=6;case 6:if(1024&r.flags&&((U=r.length)>h&&(U=h),U&&(r.head&&(j=r.head.extra_len-r.length,r.head.extra||(r.head.extra=new Uint8Array(r.head.extra_len)),r.head.extra.set(o.subarray(l,l+U),j)),512&r.flags&&(r.check=n(r.check,o,U,l)),h-=U,l+=U,r.length-=U),r.length))break e;r.length=0,r.mode=7;case 7:if(2048&r.flags){if(0===h)break e;U=0;do{j=o[l+U++],r.head&&j&&r.length<65536&&(r.head.name+=String.fromCharCode(j));}while(j&&U<h);if(512&r.flags&&(r.check=n(r.check,o,U,l)),h-=U,l+=U,j)break e}else r.head&&(r.head.name=null);r.length=0,r.mode=8;case 8:if(4096&r.flags){if(0===h)break e;U=0;do{j=o[l+U++],r.head&&j&&r.length<65536&&(r.head.comment+=String.fromCharCode(j));}while(j&&U<h);if(512&r.flags&&(r.check=n(r.check,o,U,l)),h-=U,l+=U,j)break e}else r.head&&(r.head.comment=null);r.mode=9;case 9:if(512&r.flags){for(;S<16;){if(0===h)break e;h--,Z+=o[l++]<<S,S+=8;}if(Z!==(65535&r.check)){e.msg="header crc mismatch",r.mode=E;break}Z=0,S=0;}r.head&&(r.head.hcrc=r.flags>>9&1,r.head.done=!0),e.adler=r.check=0,r.mode=x;break;case 10:for(;S<32;){if(0===h)break e;h--,Z+=o[l++]<<S,S+=8;}e.adler=r.check=R(Z),Z=0,S=0,r.mode=11;case 11:if(0===r.havedict)return e.next_out=f,e.avail_out=A,e.next_in=l,e.avail_in=h,r.hold=Z,r.bits=S,k;e.adler=r.check=1,r.mode=x;case x:if(i===u||i===w)break e;case 13:if(r.last){Z>>>=7&S,S-=7&S,r.mode=27;break}for(;S<3;){if(0===h)break e;h--,Z+=o[l++]<<S,S+=8;}switch(r.last=1&Z,S-=1,3&(Z>>>=1)){case 0:r.mode=14;break;case 1:if(B(r),r.mode=20,i===w){Z>>>=2,S-=2;break e}break;case 2:r.mode=17;break;case 3:e.msg="invalid block type",r.mode=E;}Z>>>=2,S-=2;break;case 14:for(Z>>>=7&S,S-=7&S;S<32;){if(0===h)break e;h--,Z+=o[l++]<<S,S+=8;}if((65535&Z)!=(Z>>>16^65535)){e.msg="invalid stored block lengths",r.mode=E;break}if(r.length=65535&Z,Z=0,S=0,r.mode=15,i===w)break e;case 15:r.mode=16;case 16:if(U=r.length){if(U>h&&(U=h),U>A&&(U=A),0===U)break e;s.set(o.subarray(l,l+U),f),h-=U,l+=U,A-=U,f+=U,r.length-=U;break}r.mode=x;break;case 17:for(;S<14;){if(0===h)break e;h--,Z+=o[l++]<<S,S+=8;}if(r.nlen=257+(31&Z),Z>>>=5,S-=5,r.ndist=1+(31&Z),Z>>>=5,S-=5,r.ncode=4+(15&Z),Z>>>=4,S-=4,r.nlen>286||r.ndist>30){e.msg="too many length or distance symbols",r.mode=E;break}r.have=0,r.mode=18;case 18:for(;r.have<r.ncode;){for(;S<3;){if(0===h)break e;h--,Z+=o[l++]<<S,S+=8;}r.lens[W[r.have++]]=7&Z,Z>>>=3,S-=3;}for(;r.have<19;)r.lens[W[r.have++]]=0;if(r.lencode=r.lendyn,r.lenbits=7,P={bits:r.lenbits},K=d(0,r.lens,0,19,r.lencode,0,r.work,P),r.lenbits=P.bits,K){e.msg="invalid code lengths set",r.mode=E;break}r.have=0,r.mode=19;case 19:for(;r.have<r.nlen+r.ndist;){for(;z=(G=r.lencode[Z&(1<<r.lenbits)-1])>>>16&255,F=65535&G,!((C=G>>>24)<=S);){if(0===h)break e;h--,Z+=o[l++]<<S,S+=8;}if(F<16)Z>>>=C,S-=C,r.lens[r.have++]=F;else {if(16===F){for(Y=C+2;S<Y;){if(0===h)break e;h--,Z+=o[l++]<<S,S+=8;}if(Z>>>=C,S-=C,0===r.have){e.msg="invalid bit length repeat",r.mode=E;break}j=r.lens[r.have-1],U=3+(3&Z),Z>>>=2,S-=2;}else if(17===F){for(Y=C+3;S<Y;){if(0===h)break e;h--,Z+=o[l++]<<S,S+=8;}S-=C,j=0,U=3+(7&(Z>>>=C)),Z>>>=3,S-=3;}else {for(Y=C+7;S<Y;){if(0===h)break e;h--,Z+=o[l++]<<S,S+=8;}S-=C,j=0,U=11+(127&(Z>>>=C)),Z>>>=7,S-=7;}if(r.have+U>r.nlen+r.ndist){e.msg="invalid bit length repeat",r.mode=E;break}for(;U--;)r.lens[r.have++]=j;}}if(r.mode===E)break;if(0===r.lens[256]){e.msg="invalid code -- missing end-of-block",r.mode=E;break}if(r.lenbits=9,P={bits:r.lenbits},K=d(1,r.lens,0,r.nlen,r.lencode,0,r.work,P),r.lenbits=P.bits,K){e.msg="invalid literal/lengths set",r.mode=E;break}if(r.distbits=6,r.distcode=r.distdyn,P={bits:r.distbits},K=d(2,r.lens,r.nlen,r.ndist,r.distcode,0,r.work,P),r.distbits=P.bits,K){e.msg="invalid distances set",r.mode=E;break}if(r.mode=20,i===w)break e;case 20:r.mode=21;case 21:if(h>=6&&A>=258){e.next_out=f,e.avail_out=A,e.next_in=l,e.avail_in=h,r.hold=Z,r.bits=S,a(e,O),f=e.next_out,s=e.output,A=e.avail_out,l=e.next_in,o=e.input,h=e.avail_in,Z=r.hold,S=r.bits,r.mode===x&&(r.back=-1);break}for(r.back=0;z=(G=r.lencode[Z&(1<<r.lenbits)-1])>>>16&255,F=65535&G,!((C=G>>>24)<=S);){if(0===h)break e;h--,Z+=o[l++]<<S,S+=8;}if(z&&0==(240&z)){for(L=C,M=z,H=F;z=(G=r.lencode[H+((Z&(1<<L+M)-1)>>L)])>>>16&255,F=65535&G,!(L+(C=G>>>24)<=S);){if(0===h)break e;h--,Z+=o[l++]<<S,S+=8;}Z>>>=L,S-=L,r.back+=L;}if(Z>>>=C,S-=C,r.back+=C,r.length=F,0===z){r.mode=26;break}if(32&z){r.back=-1,r.mode=x;break}if(64&z){e.msg="invalid literal/length code",r.mode=E;break}r.extra=15&z,r.mode=22;case 22:if(r.extra){for(Y=r.extra;S<Y;){if(0===h)break e;h--,Z+=o[l++]<<S,S+=8;}r.length+=Z&(1<<r.extra)-1,Z>>>=r.extra,S-=r.extra,r.back+=r.extra;}r.was=r.length,r.mode=23;case 23:for(;z=(G=r.distcode[Z&(1<<r.distbits)-1])>>>16&255,F=65535&G,!((C=G>>>24)<=S);){if(0===h)break e;h--,Z+=o[l++]<<S,S+=8;}if(0==(240&z)){for(L=C,M=z,H=F;z=(G=r.distcode[H+((Z&(1<<L+M)-1)>>L)])>>>16&255,F=65535&G,!(L+(C=G>>>24)<=S);){if(0===h)break e;h--,Z+=o[l++]<<S,S+=8;}Z>>>=L,S-=L,r.back+=L;}if(Z>>>=C,S-=C,r.back+=C,64&z){e.msg="invalid distance code",r.mode=E;break}r.offset=F,r.extra=15&z,r.mode=24;case 24:if(r.extra){for(Y=r.extra;S<Y;){if(0===h)break e;h--,Z+=o[l++]<<S,S+=8;}r.offset+=Z&(1<<r.extra)-1,Z>>>=r.extra,S-=r.extra,r.back+=r.extra;}if(r.offset>r.dmax){e.msg="invalid distance too far back",r.mode=E;break}r.mode=25;case 25:if(0===A)break e;if(U=O-A,r.offset>U){if((U=r.offset-U)>r.whave&&r.sane){e.msg="invalid distance too far back",r.mode=E;break}U>r.wnext?(U-=r.wnext,D=r.wsize-U):D=r.wnext-U,U>r.length&&(U=r.length),I=r.window;}else I=s,D=f-r.offset,U=r.length;U>A&&(U=A),A-=U,r.length-=U;do{s[f++]=I[D++];}while(--U);0===r.length&&(r.mode=21);break;case 26:if(0===A)break e;s[f++]=r.length,A--,r.mode=21;break;case 27:if(r.wrap){for(;S<32;){if(0===h)break e;h--,Z|=o[l++]<<S,S+=8;}if(O-=A,e.total_out+=O,r.total+=O,O&&(e.adler=r.check=r.flags?n(r.check,s,O,f-O):t(r.check,s,O,f-O)),O=A,(r.flags?Z:R(Z))!==r.check){e.msg="incorrect data check",r.mode=E;break}Z=0,S=0;}r.mode=28;case 28:if(r.wrap&&r.flags){for(;S<32;){if(0===h)break e;h--,Z+=o[l++]<<S,S+=8;}if(Z!==(4294967295&r.total)){e.msg="incorrect length check",r.mode=E;break}Z=0,S=0;}r.mode=29;case 29:K=m;break e;case E:K=v;break e;case 31:return g;case 32:default:return _}return e.next_out=f,e.avail_out=A,e.next_in=l,e.avail_in=h,r.hold=Z,r.bits=S,(r.wsize||O!==e.avail_out&&r.mode<E&&(r.mode<27||i!==c))&&N(e,e.output,e.next_out,O-e.avail_out),T-=e.avail_in,O-=e.avail_out,e.total_in+=T,e.total_out+=O,r.total+=O,r.wrap&&O&&(e.adler=r.check=r.flags?n(r.check,s,O,e.next_out-O):t(r.check,s,O,e.next_out-O)),e.data_type=r.bits+(r.last?64:0)+(r.mode===x?128:0)+(20===r.mode||15===r.mode?256:0),(0===T&&0===O||i===c)&&K===b&&(K=p),K},inflateEnd:function(e){if(!e||!e.state)return _;var t=e.state;return t.window&&(t.window=null),e.state=null,b},inflateGetHeader:function(e,t){if(!e||!e.state)return _;var i=e.state;return 0==(2&i.wrap)?_:(i.head=t,t.done=!1,b)},inflateSetDictionary:function(e,i){var n,a=i.length;return e&&e.state?0!==(n=e.state).wrap&&11!==n.mode?_:11===n.mode&&t(1,i,a,0)!==n.check?v:N(e,i,a,a)?(n.mode=31,g):(n.havedict=1,b):_},inflateInfo:"pako inflate (from Nodeca project)"};function z(e){return (z="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}var F=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},L=function(e){for(var t=Array.prototype.slice.call(arguments,1);t.length;){var i=t.shift();if(i){if("object"!==z(i))throw new TypeError(i+"must be non-object");for(var n in i)F(i,n)&&(e[n]=i[n]);}}return e},M=function(e){for(var t=0,i=0,n=e.length;i<n;i++)t+=e[i].length;for(var a=new Uint8Array(t),r=0,o=0,s=e.length;r<s;r++){var l=e[r];a.set(l,o),o+=l.length;}return a},H=!0;try{String.fromCharCode.apply(null,new Uint8Array(1));}catch(e){H=!1;}for(var j=new Uint8Array(256),K=0;K<256;K++)j[K]=K>=252?6:K>=248?5:K>=240?4:K>=224?3:K>=192?2:1;j[254]=j[254]=1;var P=function(e){if("function"==typeof TextEncoder&&TextEncoder.prototype.encode)return (new TextEncoder).encode(e);var t,i,n,a,r,o=e.length,s=0;for(a=0;a<o;a++)55296==(64512&(i=e.charCodeAt(a)))&&a+1<o&&56320==(64512&(n=e.charCodeAt(a+1)))&&(i=65536+(i-55296<<10)+(n-56320),a++),s+=i<128?1:i<2048?2:i<65536?3:4;for(t=new Uint8Array(s),r=0,a=0;r<s;a++)55296==(64512&(i=e.charCodeAt(a)))&&a+1<o&&56320==(64512&(n=e.charCodeAt(a+1)))&&(i=65536+(i-55296<<10)+(n-56320),a++),i<128?t[r++]=i:i<2048?(t[r++]=192|i>>>6,t[r++]=128|63&i):i<65536?(t[r++]=224|i>>>12,t[r++]=128|i>>>6&63,t[r++]=128|63&i):(t[r++]=240|i>>>18,t[r++]=128|i>>>12&63,t[r++]=128|i>>>6&63,t[r++]=128|63&i);return t},Y=function(e,t){var i,n,a=t||e.length;if("function"==typeof TextDecoder&&TextDecoder.prototype.decode)return (new TextDecoder).decode(e.subarray(0,t));var r=new Array(2*a);for(n=0,i=0;i<a;){var o=e[i++];if(o<128)r[n++]=o;else {var s=j[o];if(s>4)r[n++]=65533,i+=s-1;else {for(o&=2===s?31:3===s?15:7;s>1&&i<a;)o=o<<6|63&e[i++],s--;s>1?r[n++]=65533:o<65536?r[n++]=o:(o-=65536,r[n++]=55296|o>>10&1023,r[n++]=56320|1023&o);}}}return function(e,t){if(t<65534&&e.subarray&&H)return String.fromCharCode.apply(null,e.length===t?e:e.subarray(0,t));for(var i="",n=0;n<t;n++)i+=String.fromCharCode(e[n]);return i}(r,n)},G=function(e,t){(t=t||e.length)>e.length&&(t=e.length);for(var i=t-1;i>=0&&128==(192&e[i]);)i--;return i<0||0===i?t:i+j[e[i]]>t?i:t},X={2:"need dictionary",1:"stream end",0:"","-1":"file error","-2":"stream error","-3":"data error","-4":"insufficient memory","-5":"buffer error","-6":"incompatible version"};var W=function(){this.input=null,this.next_in=0,this.avail_in=0,this.total_in=0,this.output=null,this.next_out=0,this.avail_out=0,this.total_out=0,this.msg="",this.state=null,this.data_type=2,this.adler=0;};var q=function(){this.text=0,this.time=0,this.xflags=0,this.os=0,this.extra=null,this.extra_len=0,this.name="",this.comment="",this.hcrc=0,this.done=!1;},J=Object.prototype.toString,Q=h.Z_NO_FLUSH,V=h.Z_FINISH,$=h.Z_OK,ee=h.Z_STREAM_END,te=h.Z_NEED_DICT,ie=h.Z_STREAM_ERROR,ne=h.Z_DATA_ERROR,ae=h.Z_MEM_ERROR;function re(e){this.options=L({chunkSize:65536,windowBits:15,to:""},e||{});var t=this.options;t.raw&&t.windowBits>=0&&t.windowBits<16&&(t.windowBits=-t.windowBits,0===t.windowBits&&(t.windowBits=-15)),!(t.windowBits>=0&&t.windowBits<16)||e&&e.windowBits||(t.windowBits+=32),t.windowBits>15&&t.windowBits<48&&0==(15&t.windowBits)&&(t.windowBits|=15),this.err=0,this.msg="",this.ended=!1,this.chunks=[],this.strm=new W,this.strm.avail_out=0;var i=C.inflateInit2(this.strm,t.windowBits);if(i!==$)throw new Error(X[i]);if(this.header=new q,C.inflateGetHeader(this.strm,this.header),t.dictionary&&("string"==typeof t.dictionary?t.dictionary=P(t.dictionary):"[object ArrayBuffer]"===J.call(t.dictionary)&&(t.dictionary=new Uint8Array(t.dictionary)),t.raw&&(i=C.inflateSetDictionary(this.strm,t.dictionary))!==$))throw new Error(X[i])}function oe(e,t){var i=new re(t);if(i.push(e),i.err)throw i.msg||X[i.err];return i.result}re.prototype.push=function(e,t){var i,n,a,r=this.strm,o=this.options.chunkSize,s=this.options.dictionary;if(this.ended)return !1;for(n=t===~~t?t:!0===t?V:Q,"[object ArrayBuffer]"===J.call(e)?r.input=new Uint8Array(e):r.input=e,r.next_in=0,r.avail_in=r.input.length;;){for(0===r.avail_out&&(r.output=new Uint8Array(o),r.next_out=0,r.avail_out=o),(i=C.inflate(r,n))===te&&s&&((i=C.inflateSetDictionary(r,s))===$?i=C.inflate(r,n):i===ne&&(i=te));r.avail_in>0&&i===ee&&r.state.wrap>0&&0!==e[r.next_in];)C.inflateReset(r),i=C.inflate(r,n);switch(i){case ie:case ne:case te:case ae:return this.onEnd(i),this.ended=!0,!1}if(a=r.avail_out,r.next_out&&(0===r.avail_out||i===ee))if("string"===this.options.to){var l=G(r.output,r.next_out),f=r.next_out-l,d=Y(r.output,l);r.next_out=f,r.avail_out=o-f,f&&r.output.set(r.output.subarray(l,l+f),0),this.onData(d);}else this.onData(r.output.length===r.next_out?r.output:r.output.subarray(0,r.next_out));if(i!==$||0!==a){if(i===ee)return i=C.inflateEnd(this.strm),this.onEnd(i),this.ended=!0,!0;if(0===r.avail_in)break}}return !0},re.prototype.onData=function(e){this.chunks.push(e);},re.prototype.onEnd=function(e){e===$&&("string"===this.options.to?this.result=this.chunks.join(""):this.result=M(this.chunks)),this.chunks=[],this.err=e,this.msg=this.strm.msg;};var se=re,le=oe,fe=function(e,t){return (t=t||{}).raw=!0,oe(e,t)},de=oe,he=h,ce={Inflate:se,inflate:le,inflateRaw:fe,ungzip:de,constants:he};e.Inflate=se,e.constants=he,e.default=ce,e.inflate=le,e.inflateRaw=fe,e.ungzip=de,Object.defineProperty(e,"__esModule",{value:!0});}));

const charSize = 1;
const boolSize = 1;
const uint32Size = 4;
const uint64Size = 8;
const doubleSize = uint64Size;

const stringType = 'string';
const int32Type = 'int32';
const int64Type = 'int64';
const boolType = 'bool';
const halfFloatType = 'half';
const floatType = 'float';
const doubleType = 'double';
const vec3iType = 'vec3i';
const vec3sType = 'vec3s';
const vec3dType = 'vec3d';

 // NOTE https://www.appinf.com/download/FPIssues.pdf
const floatingPointPrecisionLUT = {
  [doubleType]: {
    exp: 11,
    bias: (1 << (11 - 1)) - 1,
    size: doubleSize
  },
  [floatType]: {
    exp: 8,
    bias: (1 << (8 - 1)) - 1,
    size: uint32Size
  },
  [int32Type]: {
    size: uint32Size
  },
  [int64Type]: {
    size: uint64Size
  },
  [halfFloatType]: {
    size: uint32Size / 2,
    exp: 5,
    bias: (1 << (5 - 1)) - 1
  }
};

/**
 * @license
 * Copyright 2010-2022 Three.js Authors
 * SPDX-License-Identifier: MIT
 */
const REVISION = '145';

function clamp( value, min, max ) {

	return Math.max( min, Math.min( max, value ) );

}

class Quaternion {

	constructor( x = 0, y = 0, z = 0, w = 1 ) {

		this.isQuaternion = true;

		this._x = x;
		this._y = y;
		this._z = z;
		this._w = w;

	}

	static slerpFlat( dst, dstOffset, src0, srcOffset0, src1, srcOffset1, t ) {

		// fuzz-free, array-based Quaternion SLERP operation

		let x0 = src0[ srcOffset0 + 0 ],
			y0 = src0[ srcOffset0 + 1 ],
			z0 = src0[ srcOffset0 + 2 ],
			w0 = src0[ srcOffset0 + 3 ];

		const x1 = src1[ srcOffset1 + 0 ],
			y1 = src1[ srcOffset1 + 1 ],
			z1 = src1[ srcOffset1 + 2 ],
			w1 = src1[ srcOffset1 + 3 ];

		if ( t === 0 ) {

			dst[ dstOffset + 0 ] = x0;
			dst[ dstOffset + 1 ] = y0;
			dst[ dstOffset + 2 ] = z0;
			dst[ dstOffset + 3 ] = w0;
			return;

		}

		if ( t === 1 ) {

			dst[ dstOffset + 0 ] = x1;
			dst[ dstOffset + 1 ] = y1;
			dst[ dstOffset + 2 ] = z1;
			dst[ dstOffset + 3 ] = w1;
			return;

		}

		if ( w0 !== w1 || x0 !== x1 || y0 !== y1 || z0 !== z1 ) {

			let s = 1 - t;
			const cos = x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1,
				dir = ( cos >= 0 ? 1 : - 1 ),
				sqrSin = 1 - cos * cos;

			// Skip the Slerp for tiny steps to avoid numeric problems:
			if ( sqrSin > Number.EPSILON ) {

				const sin = Math.sqrt( sqrSin ),
					len = Math.atan2( sin, cos * dir );

				s = Math.sin( s * len ) / sin;
				t = Math.sin( t * len ) / sin;

			}

			const tDir = t * dir;

			x0 = x0 * s + x1 * tDir;
			y0 = y0 * s + y1 * tDir;
			z0 = z0 * s + z1 * tDir;
			w0 = w0 * s + w1 * tDir;

			// Normalize in case we just did a lerp:
			if ( s === 1 - t ) {

				const f = 1 / Math.sqrt( x0 * x0 + y0 * y0 + z0 * z0 + w0 * w0 );

				x0 *= f;
				y0 *= f;
				z0 *= f;
				w0 *= f;

			}

		}

		dst[ dstOffset ] = x0;
		dst[ dstOffset + 1 ] = y0;
		dst[ dstOffset + 2 ] = z0;
		dst[ dstOffset + 3 ] = w0;

	}

	static multiplyQuaternionsFlat( dst, dstOffset, src0, srcOffset0, src1, srcOffset1 ) {

		const x0 = src0[ srcOffset0 ];
		const y0 = src0[ srcOffset0 + 1 ];
		const z0 = src0[ srcOffset0 + 2 ];
		const w0 = src0[ srcOffset0 + 3 ];

		const x1 = src1[ srcOffset1 ];
		const y1 = src1[ srcOffset1 + 1 ];
		const z1 = src1[ srcOffset1 + 2 ];
		const w1 = src1[ srcOffset1 + 3 ];

		dst[ dstOffset ] = x0 * w1 + w0 * x1 + y0 * z1 - z0 * y1;
		dst[ dstOffset + 1 ] = y0 * w1 + w0 * y1 + z0 * x1 - x0 * z1;
		dst[ dstOffset + 2 ] = z0 * w1 + w0 * z1 + x0 * y1 - y0 * x1;
		dst[ dstOffset + 3 ] = w0 * w1 - x0 * x1 - y0 * y1 - z0 * z1;

		return dst;

	}

	get x() {

		return this._x;

	}

	set x( value ) {

		this._x = value;
		this._onChangeCallback();

	}

	get y() {

		return this._y;

	}

	set y( value ) {

		this._y = value;
		this._onChangeCallback();

	}

	get z() {

		return this._z;

	}

	set z( value ) {

		this._z = value;
		this._onChangeCallback();

	}

	get w() {

		return this._w;

	}

	set w( value ) {

		this._w = value;
		this._onChangeCallback();

	}

	set( x, y, z, w ) {

		this._x = x;
		this._y = y;
		this._z = z;
		this._w = w;

		this._onChangeCallback();

		return this;

	}

	clone() {

		return new this.constructor( this._x, this._y, this._z, this._w );

	}

	copy( quaternion ) {

		this._x = quaternion.x;
		this._y = quaternion.y;
		this._z = quaternion.z;
		this._w = quaternion.w;

		this._onChangeCallback();

		return this;

	}

	setFromEuler( euler, update ) {

		const x = euler._x, y = euler._y, z = euler._z, order = euler._order;

		// http://www.mathworks.com/matlabcentral/fileexchange/
		// 	20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/
		//	content/SpinCalc.m

		const cos = Math.cos;
		const sin = Math.sin;

		const c1 = cos( x / 2 );
		const c2 = cos( y / 2 );
		const c3 = cos( z / 2 );

		const s1 = sin( x / 2 );
		const s2 = sin( y / 2 );
		const s3 = sin( z / 2 );

		switch ( order ) {

			case 'XYZ':
				this._x = s1 * c2 * c3 + c1 * s2 * s3;
				this._y = c1 * s2 * c3 - s1 * c2 * s3;
				this._z = c1 * c2 * s3 + s1 * s2 * c3;
				this._w = c1 * c2 * c3 - s1 * s2 * s3;
				break;

			case 'YXZ':
				this._x = s1 * c2 * c3 + c1 * s2 * s3;
				this._y = c1 * s2 * c3 - s1 * c2 * s3;
				this._z = c1 * c2 * s3 - s1 * s2 * c3;
				this._w = c1 * c2 * c3 + s1 * s2 * s3;
				break;

			case 'ZXY':
				this._x = s1 * c2 * c3 - c1 * s2 * s3;
				this._y = c1 * s2 * c3 + s1 * c2 * s3;
				this._z = c1 * c2 * s3 + s1 * s2 * c3;
				this._w = c1 * c2 * c3 - s1 * s2 * s3;
				break;

			case 'ZYX':
				this._x = s1 * c2 * c3 - c1 * s2 * s3;
				this._y = c1 * s2 * c3 + s1 * c2 * s3;
				this._z = c1 * c2 * s3 - s1 * s2 * c3;
				this._w = c1 * c2 * c3 + s1 * s2 * s3;
				break;

			case 'YZX':
				this._x = s1 * c2 * c3 + c1 * s2 * s3;
				this._y = c1 * s2 * c3 + s1 * c2 * s3;
				this._z = c1 * c2 * s3 - s1 * s2 * c3;
				this._w = c1 * c2 * c3 - s1 * s2 * s3;
				break;

			case 'XZY':
				this._x = s1 * c2 * c3 - c1 * s2 * s3;
				this._y = c1 * s2 * c3 - s1 * c2 * s3;
				this._z = c1 * c2 * s3 + s1 * s2 * c3;
				this._w = c1 * c2 * c3 + s1 * s2 * s3;
				break;

			default:
				console.warn( 'THREE.Quaternion: .setFromEuler() encountered an unknown order: ' + order );

		}

		if ( update !== false ) this._onChangeCallback();

		return this;

	}

	setFromAxisAngle( axis, angle ) {

		// http://www.euclideanspace.com/maths/geometry/rotations/conversions/angleToQuaternion/index.htm

		// assumes axis is normalized

		const halfAngle = angle / 2, s = Math.sin( halfAngle );

		this._x = axis.x * s;
		this._y = axis.y * s;
		this._z = axis.z * s;
		this._w = Math.cos( halfAngle );

		this._onChangeCallback();

		return this;

	}

	setFromRotationMatrix( m ) {

		// http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm

		// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

		const te = m.elements,

			m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ],
			m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ],
			m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ],

			trace = m11 + m22 + m33;

		if ( trace > 0 ) {

			const s = 0.5 / Math.sqrt( trace + 1.0 );

			this._w = 0.25 / s;
			this._x = ( m32 - m23 ) * s;
			this._y = ( m13 - m31 ) * s;
			this._z = ( m21 - m12 ) * s;

		} else if ( m11 > m22 && m11 > m33 ) {

			const s = 2.0 * Math.sqrt( 1.0 + m11 - m22 - m33 );

			this._w = ( m32 - m23 ) / s;
			this._x = 0.25 * s;
			this._y = ( m12 + m21 ) / s;
			this._z = ( m13 + m31 ) / s;

		} else if ( m22 > m33 ) {

			const s = 2.0 * Math.sqrt( 1.0 + m22 - m11 - m33 );

			this._w = ( m13 - m31 ) / s;
			this._x = ( m12 + m21 ) / s;
			this._y = 0.25 * s;
			this._z = ( m23 + m32 ) / s;

		} else {

			const s = 2.0 * Math.sqrt( 1.0 + m33 - m11 - m22 );

			this._w = ( m21 - m12 ) / s;
			this._x = ( m13 + m31 ) / s;
			this._y = ( m23 + m32 ) / s;
			this._z = 0.25 * s;

		}

		this._onChangeCallback();

		return this;

	}

	setFromUnitVectors( vFrom, vTo ) {

		// assumes direction vectors vFrom and vTo are normalized

		let r = vFrom.dot( vTo ) + 1;

		if ( r < Number.EPSILON ) {

			// vFrom and vTo point in opposite directions

			r = 0;

			if ( Math.abs( vFrom.x ) > Math.abs( vFrom.z ) ) {

				this._x = - vFrom.y;
				this._y = vFrom.x;
				this._z = 0;
				this._w = r;

			} else {

				this._x = 0;
				this._y = - vFrom.z;
				this._z = vFrom.y;
				this._w = r;

			}

		} else {

			// crossVectors( vFrom, vTo ); // inlined to avoid cyclic dependency on Vector3

			this._x = vFrom.y * vTo.z - vFrom.z * vTo.y;
			this._y = vFrom.z * vTo.x - vFrom.x * vTo.z;
			this._z = vFrom.x * vTo.y - vFrom.y * vTo.x;
			this._w = r;

		}

		return this.normalize();

	}

	angleTo( q ) {

		return 2 * Math.acos( Math.abs( clamp( this.dot( q ), - 1, 1 ) ) );

	}

	rotateTowards( q, step ) {

		const angle = this.angleTo( q );

		if ( angle === 0 ) return this;

		const t = Math.min( 1, step / angle );

		this.slerp( q, t );

		return this;

	}

	identity() {

		return this.set( 0, 0, 0, 1 );

	}

	invert() {

		// quaternion is assumed to have unit length

		return this.conjugate();

	}

	conjugate() {

		this._x *= - 1;
		this._y *= - 1;
		this._z *= - 1;

		this._onChangeCallback();

		return this;

	}

	dot( v ) {

		return this._x * v._x + this._y * v._y + this._z * v._z + this._w * v._w;

	}

	lengthSq() {

		return this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w;

	}

	length() {

		return Math.sqrt( this._x * this._x + this._y * this._y + this._z * this._z + this._w * this._w );

	}

	normalize() {

		let l = this.length();

		if ( l === 0 ) {

			this._x = 0;
			this._y = 0;
			this._z = 0;
			this._w = 1;

		} else {

			l = 1 / l;

			this._x = this._x * l;
			this._y = this._y * l;
			this._z = this._z * l;
			this._w = this._w * l;

		}

		this._onChangeCallback();

		return this;

	}

	multiply( q ) {

		return this.multiplyQuaternions( this, q );

	}

	premultiply( q ) {

		return this.multiplyQuaternions( q, this );

	}

	multiplyQuaternions( a, b ) {

		// from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm

		const qax = a._x, qay = a._y, qaz = a._z, qaw = a._w;
		const qbx = b._x, qby = b._y, qbz = b._z, qbw = b._w;

		this._x = qax * qbw + qaw * qbx + qay * qbz - qaz * qby;
		this._y = qay * qbw + qaw * qby + qaz * qbx - qax * qbz;
		this._z = qaz * qbw + qaw * qbz + qax * qby - qay * qbx;
		this._w = qaw * qbw - qax * qbx - qay * qby - qaz * qbz;

		this._onChangeCallback();

		return this;

	}

	slerp( qb, t ) {

		if ( t === 0 ) return this;
		if ( t === 1 ) return this.copy( qb );

		const x = this._x, y = this._y, z = this._z, w = this._w;

		// http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/

		let cosHalfTheta = w * qb._w + x * qb._x + y * qb._y + z * qb._z;

		if ( cosHalfTheta < 0 ) {

			this._w = - qb._w;
			this._x = - qb._x;
			this._y = - qb._y;
			this._z = - qb._z;

			cosHalfTheta = - cosHalfTheta;

		} else {

			this.copy( qb );

		}

		if ( cosHalfTheta >= 1.0 ) {

			this._w = w;
			this._x = x;
			this._y = y;
			this._z = z;

			return this;

		}

		const sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;

		if ( sqrSinHalfTheta <= Number.EPSILON ) {

			const s = 1 - t;
			this._w = s * w + t * this._w;
			this._x = s * x + t * this._x;
			this._y = s * y + t * this._y;
			this._z = s * z + t * this._z;

			this.normalize();
			this._onChangeCallback();

			return this;

		}

		const sinHalfTheta = Math.sqrt( sqrSinHalfTheta );
		const halfTheta = Math.atan2( sinHalfTheta, cosHalfTheta );
		const ratioA = Math.sin( ( 1 - t ) * halfTheta ) / sinHalfTheta,
			ratioB = Math.sin( t * halfTheta ) / sinHalfTheta;

		this._w = ( w * ratioA + this._w * ratioB );
		this._x = ( x * ratioA + this._x * ratioB );
		this._y = ( y * ratioA + this._y * ratioB );
		this._z = ( z * ratioA + this._z * ratioB );

		this._onChangeCallback();

		return this;

	}

	slerpQuaternions( qa, qb, t ) {

		return this.copy( qa ).slerp( qb, t );

	}

	random() {

		// Derived from http://planning.cs.uiuc.edu/node198.html
		// Note, this source uses w, x, y, z ordering,
		// so we swap the order below.

		const u1 = Math.random();
		const sqrt1u1 = Math.sqrt( 1 - u1 );
		const sqrtu1 = Math.sqrt( u1 );

		const u2 = 2 * Math.PI * Math.random();

		const u3 = 2 * Math.PI * Math.random();

		return this.set(
			sqrt1u1 * Math.cos( u2 ),
			sqrtu1 * Math.sin( u3 ),
			sqrtu1 * Math.cos( u3 ),
			sqrt1u1 * Math.sin( u2 ),
		);

	}

	equals( quaternion ) {

		return ( quaternion._x === this._x ) && ( quaternion._y === this._y ) && ( quaternion._z === this._z ) && ( quaternion._w === this._w );

	}

	fromArray( array, offset = 0 ) {

		this._x = array[ offset ];
		this._y = array[ offset + 1 ];
		this._z = array[ offset + 2 ];
		this._w = array[ offset + 3 ];

		this._onChangeCallback();

		return this;

	}

	toArray( array = [], offset = 0 ) {

		array[ offset ] = this._x;
		array[ offset + 1 ] = this._y;
		array[ offset + 2 ] = this._z;
		array[ offset + 3 ] = this._w;

		return array;

	}

	fromBufferAttribute( attribute, index ) {

		this._x = attribute.getX( index );
		this._y = attribute.getY( index );
		this._z = attribute.getZ( index );
		this._w = attribute.getW( index );

		return this;

	}

	_onChange( callback ) {

		this._onChangeCallback = callback;

		return this;

	}

	_onChangeCallback() {}

	*[ Symbol.iterator ]() {

		yield this._x;
		yield this._y;
		yield this._z;
		yield this._w;

	}

}

class Vector3$1 {

	constructor( x = 0, y = 0, z = 0 ) {

		Vector3$1.prototype.isVector3 = true;

		this.x = x;
		this.y = y;
		this.z = z;

	}

	set( x, y, z ) {

		if ( z === undefined ) z = this.z; // sprite.scale.set(x,y)

		this.x = x;
		this.y = y;
		this.z = z;

		return this;

	}

	setScalar( scalar ) {

		this.x = scalar;
		this.y = scalar;
		this.z = scalar;

		return this;

	}

	setX( x ) {

		this.x = x;

		return this;

	}

	setY( y ) {

		this.y = y;

		return this;

	}

	setZ( z ) {

		this.z = z;

		return this;

	}

	setComponent( index, value ) {

		switch ( index ) {

			case 0: this.x = value; break;
			case 1: this.y = value; break;
			case 2: this.z = value; break;
			default: throw new Error( 'index is out of range: ' + index );

		}

		return this;

	}

	getComponent( index ) {

		switch ( index ) {

			case 0: return this.x;
			case 1: return this.y;
			case 2: return this.z;
			default: throw new Error( 'index is out of range: ' + index );

		}

	}

	clone() {

		return new this.constructor( this.x, this.y, this.z );

	}

	copy( v ) {

		this.x = v.x;
		this.y = v.y;
		this.z = v.z;

		return this;

	}

	add( v ) {

		this.x += v.x;
		this.y += v.y;
		this.z += v.z;

		return this;

	}

	addScalar( s ) {

		this.x += s;
		this.y += s;
		this.z += s;

		return this;

	}

	addVectors( a, b ) {

		this.x = a.x + b.x;
		this.y = a.y + b.y;
		this.z = a.z + b.z;

		return this;

	}

	addScaledVector( v, s ) {

		this.x += v.x * s;
		this.y += v.y * s;
		this.z += v.z * s;

		return this;

	}

	sub( v ) {

		this.x -= v.x;
		this.y -= v.y;
		this.z -= v.z;

		return this;

	}

	subScalar( s ) {

		this.x -= s;
		this.y -= s;
		this.z -= s;

		return this;

	}

	subVectors( a, b ) {

		this.x = a.x - b.x;
		this.y = a.y - b.y;
		this.z = a.z - b.z;

		return this;

	}

	multiply( v ) {

		this.x *= v.x;
		this.y *= v.y;
		this.z *= v.z;

		return this;

	}

	multiplyScalar( scalar ) {

		this.x *= scalar;
		this.y *= scalar;
		this.z *= scalar;

		return this;

	}

	multiplyVectors( a, b ) {

		this.x = a.x * b.x;
		this.y = a.y * b.y;
		this.z = a.z * b.z;

		return this;

	}

	applyEuler( euler ) {

		return this.applyQuaternion( _quaternion$4.setFromEuler( euler ) );

	}

	applyAxisAngle( axis, angle ) {

		return this.applyQuaternion( _quaternion$4.setFromAxisAngle( axis, angle ) );

	}

	applyMatrix3( m ) {

		const x = this.x, y = this.y, z = this.z;
		const e = m.elements;

		this.x = e[ 0 ] * x + e[ 3 ] * y + e[ 6 ] * z;
		this.y = e[ 1 ] * x + e[ 4 ] * y + e[ 7 ] * z;
		this.z = e[ 2 ] * x + e[ 5 ] * y + e[ 8 ] * z;

		return this;

	}

	applyNormalMatrix( m ) {

		return this.applyMatrix3( m ).normalize();

	}

	applyMatrix4( m ) {

		const x = this.x, y = this.y, z = this.z;
		const e = m.elements;

		const w = 1 / ( e[ 3 ] * x + e[ 7 ] * y + e[ 11 ] * z + e[ 15 ] );

		this.x = ( e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z + e[ 12 ] ) * w;
		this.y = ( e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z + e[ 13 ] ) * w;
		this.z = ( e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z + e[ 14 ] ) * w;

		return this;

	}

	applyQuaternion( q ) {

		const x = this.x, y = this.y, z = this.z;
		const qx = q.x, qy = q.y, qz = q.z, qw = q.w;

		// calculate quat * vector

		const ix = qw * x + qy * z - qz * y;
		const iy = qw * y + qz * x - qx * z;
		const iz = qw * z + qx * y - qy * x;
		const iw = - qx * x - qy * y - qz * z;

		// calculate result * inverse quat

		this.x = ix * qw + iw * - qx + iy * - qz - iz * - qy;
		this.y = iy * qw + iw * - qy + iz * - qx - ix * - qz;
		this.z = iz * qw + iw * - qz + ix * - qy - iy * - qx;

		return this;

	}

	project( camera ) {

		return this.applyMatrix4( camera.matrixWorldInverse ).applyMatrix4( camera.projectionMatrix );

	}

	unproject( camera ) {

		return this.applyMatrix4( camera.projectionMatrixInverse ).applyMatrix4( camera.matrixWorld );

	}

	transformDirection( m ) {

		// input: THREE.Matrix4 affine matrix
		// vector interpreted as a direction

		const x = this.x, y = this.y, z = this.z;
		const e = m.elements;

		this.x = e[ 0 ] * x + e[ 4 ] * y + e[ 8 ] * z;
		this.y = e[ 1 ] * x + e[ 5 ] * y + e[ 9 ] * z;
		this.z = e[ 2 ] * x + e[ 6 ] * y + e[ 10 ] * z;

		return this.normalize();

	}

	divide( v ) {

		this.x /= v.x;
		this.y /= v.y;
		this.z /= v.z;

		return this;

	}

	divideScalar( scalar ) {

		return this.multiplyScalar( 1 / scalar );

	}

	min( v ) {

		this.x = Math.min( this.x, v.x );
		this.y = Math.min( this.y, v.y );
		this.z = Math.min( this.z, v.z );

		return this;

	}

	max( v ) {

		this.x = Math.max( this.x, v.x );
		this.y = Math.max( this.y, v.y );
		this.z = Math.max( this.z, v.z );

		return this;

	}

	clamp( min, max ) {

		// assumes min < max, componentwise

		this.x = Math.max( min.x, Math.min( max.x, this.x ) );
		this.y = Math.max( min.y, Math.min( max.y, this.y ) );
		this.z = Math.max( min.z, Math.min( max.z, this.z ) );

		return this;

	}

	clampScalar( minVal, maxVal ) {

		this.x = Math.max( minVal, Math.min( maxVal, this.x ) );
		this.y = Math.max( minVal, Math.min( maxVal, this.y ) );
		this.z = Math.max( minVal, Math.min( maxVal, this.z ) );

		return this;

	}

	clampLength( min, max ) {

		const length = this.length();

		return this.divideScalar( length || 1 ).multiplyScalar( Math.max( min, Math.min( max, length ) ) );

	}

	floor() {

		this.x = Math.floor( this.x );
		this.y = Math.floor( this.y );
		this.z = Math.floor( this.z );

		return this;

	}

	ceil() {

		this.x = Math.ceil( this.x );
		this.y = Math.ceil( this.y );
		this.z = Math.ceil( this.z );

		return this;

	}

	round() {

		this.x = Math.round( this.x );
		this.y = Math.round( this.y );
		this.z = Math.round( this.z );

		return this;

	}

	roundToZero() {

		this.x = ( this.x < 0 ) ? Math.ceil( this.x ) : Math.floor( this.x );
		this.y = ( this.y < 0 ) ? Math.ceil( this.y ) : Math.floor( this.y );
		this.z = ( this.z < 0 ) ? Math.ceil( this.z ) : Math.floor( this.z );

		return this;

	}

	negate() {

		this.x = - this.x;
		this.y = - this.y;
		this.z = - this.z;

		return this;

	}

	dot( v ) {

		return this.x * v.x + this.y * v.y + this.z * v.z;

	}

	// TODO lengthSquared?

	lengthSq() {

		return this.x * this.x + this.y * this.y + this.z * this.z;

	}

	length() {

		return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );

	}

	manhattanLength() {

		return Math.abs( this.x ) + Math.abs( this.y ) + Math.abs( this.z );

	}

	normalize() {

		return this.divideScalar( this.length() || 1 );

	}

	setLength( length ) {

		return this.normalize().multiplyScalar( length );

	}

	lerp( v, alpha ) {

		this.x += ( v.x - this.x ) * alpha;
		this.y += ( v.y - this.y ) * alpha;
		this.z += ( v.z - this.z ) * alpha;

		return this;

	}

	lerpVectors( v1, v2, alpha ) {

		this.x = v1.x + ( v2.x - v1.x ) * alpha;
		this.y = v1.y + ( v2.y - v1.y ) * alpha;
		this.z = v1.z + ( v2.z - v1.z ) * alpha;

		return this;

	}

	cross( v ) {

		return this.crossVectors( this, v );

	}

	crossVectors( a, b ) {

		const ax = a.x, ay = a.y, az = a.z;
		const bx = b.x, by = b.y, bz = b.z;

		this.x = ay * bz - az * by;
		this.y = az * bx - ax * bz;
		this.z = ax * by - ay * bx;

		return this;

	}

	projectOnVector( v ) {

		const denominator = v.lengthSq();

		if ( denominator === 0 ) return this.set( 0, 0, 0 );

		const scalar = v.dot( this ) / denominator;

		return this.copy( v ).multiplyScalar( scalar );

	}

	projectOnPlane( planeNormal ) {

		_vector$c.copy( this ).projectOnVector( planeNormal );

		return this.sub( _vector$c );

	}

	reflect( normal ) {

		// reflect incident vector off plane orthogonal to normal
		// normal is assumed to have unit length

		return this.sub( _vector$c.copy( normal ).multiplyScalar( 2 * this.dot( normal ) ) );

	}

	angleTo( v ) {

		const denominator = Math.sqrt( this.lengthSq() * v.lengthSq() );

		if ( denominator === 0 ) return Math.PI / 2;

		const theta = this.dot( v ) / denominator;

		// clamp, to handle numerical problems

		return Math.acos( clamp( theta, - 1, 1 ) );

	}

	distanceTo( v ) {

		return Math.sqrt( this.distanceToSquared( v ) );

	}

	distanceToSquared( v ) {

		const dx = this.x - v.x, dy = this.y - v.y, dz = this.z - v.z;

		return dx * dx + dy * dy + dz * dz;

	}

	manhattanDistanceTo( v ) {

		return Math.abs( this.x - v.x ) + Math.abs( this.y - v.y ) + Math.abs( this.z - v.z );

	}

	setFromSpherical( s ) {

		return this.setFromSphericalCoords( s.radius, s.phi, s.theta );

	}

	setFromSphericalCoords( radius, phi, theta ) {

		const sinPhiRadius = Math.sin( phi ) * radius;

		this.x = sinPhiRadius * Math.sin( theta );
		this.y = Math.cos( phi ) * radius;
		this.z = sinPhiRadius * Math.cos( theta );

		return this;

	}

	setFromCylindrical( c ) {

		return this.setFromCylindricalCoords( c.radius, c.theta, c.y );

	}

	setFromCylindricalCoords( radius, theta, y ) {

		this.x = radius * Math.sin( theta );
		this.y = y;
		this.z = radius * Math.cos( theta );

		return this;

	}

	setFromMatrixPosition( m ) {

		const e = m.elements;

		this.x = e[ 12 ];
		this.y = e[ 13 ];
		this.z = e[ 14 ];

		return this;

	}

	setFromMatrixScale( m ) {

		const sx = this.setFromMatrixColumn( m, 0 ).length();
		const sy = this.setFromMatrixColumn( m, 1 ).length();
		const sz = this.setFromMatrixColumn( m, 2 ).length();

		this.x = sx;
		this.y = sy;
		this.z = sz;

		return this;

	}

	setFromMatrixColumn( m, index ) {

		return this.fromArray( m.elements, index * 4 );

	}

	setFromMatrix3Column( m, index ) {

		return this.fromArray( m.elements, index * 3 );

	}

	setFromEuler( e ) {

		this.x = e._x;
		this.y = e._y;
		this.z = e._z;

		return this;

	}

	equals( v ) {

		return ( ( v.x === this.x ) && ( v.y === this.y ) && ( v.z === this.z ) );

	}

	fromArray( array, offset = 0 ) {

		this.x = array[ offset ];
		this.y = array[ offset + 1 ];
		this.z = array[ offset + 2 ];

		return this;

	}

	toArray( array = [], offset = 0 ) {

		array[ offset ] = this.x;
		array[ offset + 1 ] = this.y;
		array[ offset + 2 ] = this.z;

		return array;

	}

	fromBufferAttribute( attribute, index ) {

		this.x = attribute.getX( index );
		this.y = attribute.getY( index );
		this.z = attribute.getZ( index );

		return this;

	}

	random() {

		this.x = Math.random();
		this.y = Math.random();
		this.z = Math.random();

		return this;

	}

	randomDirection() {

		// Derived from https://mathworld.wolfram.com/SpherePointPicking.html

		const u = ( Math.random() - 0.5 ) * 2;
		const t = Math.random() * Math.PI * 2;
		const f = Math.sqrt( 1 - u ** 2 );

		this.x = f * Math.cos( t );
		this.y = f * Math.sin( t );
		this.z = u;

		return this;

	}

	*[ Symbol.iterator ]() {

		yield this.x;
		yield this.y;
		yield this.z;

	}

}

const _vector$c = /*@__PURE__*/ new Vector3$1();
const _quaternion$4 = /*@__PURE__*/ new Quaternion();

if ( typeof __THREE_DEVTOOLS__ !== 'undefined' ) {

	__THREE_DEVTOOLS__.dispatchEvent( new CustomEvent( 'register', { detail: {
		revision: REVISION,
	} } ) );

}

if ( typeof window !== 'undefined' ) {

	if ( window.__THREE__ ) {

		console.warn( 'WARNING: Multiple instances of Three.js being imported.' );

	} else {

		window.__THREE__ = REVISION;

	}

}

// NOTE Make independent of three.js

const Vector3 = Vector3$1;

class BufferIterator {
  source = null;
  offset = 0;

  constructor(source) {
    if (!(source instanceof Uint8Array)) {
      console.error('BufferIterator', 'constructor', 'source must be an Uint8Array buffer.');
      throw 0;
    }

    this.source = source;
  }

  reset() {
    this.offset = 0;
  }

  readBytes(count) {
    let buffer = 0;

    this.source.slice(this.offset, this.offset + count).forEach((byte, index) => {
      buffer = buffer | (byte << (8 * index));
    });

    this.offset += count;

    return buffer;
  }

  readRawBytes(count) {
    const raw = [];

    this.source.slice(this.offset, this.offset + count).forEach((byte, index) => {
      raw.push(byte);
    });

    this.offset += count;

    return Uint8Array.from(raw);
  }

  readBool() {
    return Boolean(this.readBytes(boolSize));
  }

  // NOTE VDB String format
  //      0123 0............M
  //      ^    ^
  //      | string length
  //           | string value
  // TODO Rename to readString
  readString(castTo = stringType) {
    const nameSize = this.readBytes(uint32Size);
    let name = '';

    if (castTo === int64Type) {
      name = this.readFloat(int64Type);
    } else if (castTo === boolType) {
      name = Boolean(this.readBytes(nameSize));
    } else if (castTo === vec3iType) {
      name = new Vector3(
        this.readFloat(int32Type),
        this.readFloat(int32Type),
        this.readFloat(int32Type),
      );
    } else if (castTo === vec3sType) {
      name = new Vector3(
        this.readFloat(floatType),
        this.readFloat(floatType),
        this.readFloat(floatType),
      );
    } else if (castTo === vec3dType) {
      name = new Vector3(
        this.readFloat(doubleType),
        this.readFloat(doubleType),
        this.readFloat(doubleType),
      );
    } else {
      Array(nameSize).fill(0).map((_) => name += String.fromCharCode(this.readBytes(charSize)));
    }

    return name;
  }

  readFloat(precision = doubleType) {
    const precisionLUT = floatingPointPrecisionLUT[precision];

    if (!precisionLUT) {
      unsupported$1(`Unknown value type: ${precision}`);
    }

    if ([ vec3sType, vec3iType, vec3dType ].includes(precision)) {
      const valueType = ({
        [vec3sType]: floatType,
        [vec3iType]: int32Type,
        [vec3dType]: doubleType,
      })[precision];

      return new Vector3(
        this.readFloat(valueType),
        this.readFloat(valueType),
        this.readFloat(valueType),
      );
    }

    let binary = [];
    Array(precisionLUT.size).fill(0).forEach(() => {
      binary.unshift(this.readBytes(charSize));
    });
    binary = binary.map(i => `00000000${i.toString(2)}`.substr(-8)).join('');

    if ([ int32Type, int64Type ].includes(precision)) {
      // NOTE https://stackoverflow.com/questions/37022434/how-do-i-parse-a-twos-complement-string-to-a-number
      return ~~parseInt(binary, 2);
    }

    const sign = binary.slice(0, 1) === '1' ? -1 : 1;
    const exponent = parseInt(binary.slice(1, precisionLUT.exp + 1), 2) - precisionLUT.bias;
    const mantissa = '1' + binary.slice(precisionLUT.exp + 1, precision.size);

    // NOTE https://stackoverflow.com/questions/37109968/how-to-convert-binary-fraction-to-decimal
    let v1 = exponent < 0 ? 0.0 : mantissa.substr(0, exponent + 1);
    let v2 = '0.' + (Array(exponent < 0 ? -exponent - 1 : 0).fill('0').join('')) + mantissa.substr(exponent < 0 ? 0.0 : exponent + 1);
    
    v1 = parseInt(v1, 2);
    v2 = parseInt(v2.replace('.', ''), 2) / Math.pow(2, (v2.split('.')[1] || '').length);

    if (v1 === 0 && v2 === 0) {
      return 0;
    }

    return sign * (v1 + v2);
  }

  readVector3(precision = doubleType) {
    const vector = new Vector3();

    vector.x = this.readFloat(precision);
    vector.y = this.readFloat(precision);
    vector.z = this.readFloat(precision);

    return vector;
  }
}

class Version {
  static greater(version, min) {
    return version > min;
  }

  static greaterEq(version, min) {
    return version >= min;
  }

  static less(version, max) {
    return version < max;
  }

  static lessEq(version, max) {
    return version <= max;
  }

  static eq(version, exact) {
    return version === exact;
  }

  static between(version, min, max, includeMin, includeMax) {
    if (includeMin && includeMax) {
      return version >= min && version <= max;
    } else if (includeMin) {
      return version >= min && version < max;
    } else if (includeMax) {
      return version > min && version <= max;
    } else {
      return version > min && version < max;
    }
  }
}

class GridSharedContext {
  // NOTE Buffer
  bufferIterator = null;

  // NOTE GridCompression
  compression = null;

  // NOTE GridVersion
  version = null;

  // NOTE Grid value settings
  valueType = null;
  useHalf = null;

  static tagContext(target, context) {
    target.sharedContext = context;
  }

  static passContext(from, to) {
    to.sharedContext = from.sharedContext;
  }

  static cleanContext(target) {
    delete target.sharedContext;
  }

  static getContext(target) {
    return target.sharedContext;
  }

  static assert(target) {
    if (!target.sharedContext) {
      console.error('GridSharedContext', 'assert', 'expected GridSharedContext to exist', { target });
      throw 0;
    }
  }
}

const transformMapType = {
  uniformScaleTranslateMap: 'UniformScaleTranslateMap',
  scaleTranslateMap: 'ScaleTranslateMap',
  uniformScaleMap: 'UniformScaleMap',
  scaleMap: 'ScaleMap',
  translationMap: 'TranslationMap',
  unitaryMap: 'UnitaryMap',
  nonlinearFrustumMap: 'NonlinearFrustumMap',
};

class GridTransform {
  readTransform() {
    const { bufferIterator, version } = GridSharedContext.getContext(this);

    this.transformMap = {
      mapType: bufferIterator.readString(),
      translation: new Vector3(),
      scale: new Vector3(),
      voxelSize: new Vector3(),
      scaleInverse: new Vector3(),
      scaleInverseSq: new Vector3(),
      scaleInverseDouble: new Vector3(),
    };

    if (Version.less(version, 219)) {
      unsupported$1('GridDescriptor::getGridTransform old-style transforms currently not supported. Fallback to identity transform.');
      return;
    }

    if ([transformMapType.uniformScaleTranslateMap, transformMapType.scaleTranslateMap].includes(this.transformMap.mapType)) {
      this.transformMap = {
        ...this.transformMap,
        translation: bufferIterator.readVector3(),
        scale: bufferIterator.readVector3(),
        voxelSize: bufferIterator.readVector3(),
        scaleInverse: bufferIterator.readVector3(),
        scaleInverseSq: bufferIterator.readVector3(),
        scaleInverseDouble: bufferIterator.readVector3(),
      };
    } else if ([transformMapType.uniformScaleMap, transformMapType.scaleMap].includes(this.transformMap.mapType)) {
      this.transformMap = {
        ...this.transformMap,
        scale: bufferIterator.readVector3(),
        voxelSize: bufferIterator.readVector3(),
        scaleInverse: bufferIterator.readVector3(),
        scaleInverseSq: bufferIterator.readVector3(),
        scaleInverseDouble: bufferIterator.readVector3(),
      };
    } else if ([transformMapType.translationMap].includes(this.transformMap.mapType)) {
      this.transformMap = {
        ...this.transformMap,
        translation: bufferIterator.readVector3()
      };
    } else if ([transformMapType.unitaryMap].includes(this.transformMap.mapType)) {
      // TODO https://github.com/AcademySoftwareFoundation/openvdb/blob/master/openvdb/openvdb/math/Maps.h#L1809
      unsupported$1('GridDescriptor::UnitaryMap');
    } else if ([transformMapType.nonlinearFrustumMap].includes(this.transformMap.mapType)) {
      // TODO https://github.com/AcademySoftwareFoundation/openvdb/blob/master/openvdb/openvdb/math/Maps.h#L2418
      unsupported$1('GridDescriptor::NonlinearFrustumMap');
    } else {
      // NOTE Support for any magical map types from https://github.com/AcademySoftwareFoundation/openvdb/blob/master/openvdb/openvdb/math/Maps.h#L538 to be added
      unsupported$1('GridDescriptor::Matrix4x4');
      // 4x4 transformation matrix
    }

    // NOTE Trigger cache
    this.applyTransformMap(new Vector3());
  }

  applyTransformMap(vector) {
    let implementation;

    if ([transformMapType.uniformScaleTranslateMap, transformMapType.scaleTranslateMap].includes(this.transformMap.mapType)) {
      implementation = (vector) => vector.multiply(this.transformMap.scale).add(this.transformMap.translation);
    } else if ([transformMapType.uniformScaleMap, transformMapType.scaleMap].includes(this.transformMap.mapType)) {
      implementation = (vector) => vector.multiply(this.transformMap.scale);
    } else if ([transformMapType.translationMap].includes(this.transformMap.mapType)) {
      implementation = (vector) => vector.add(this.transformMap.translation);
    } else if ([transformMapType.unitaryMap].includes(this.transformMap.mapType)) {
      unsupported$1('GridDescriptor::UnitaryMap');
      implementation = (vector) => vector;
    } else if ([transformMapType.nonlinearFrustumMap].includes(this.transformMap.mapType)) {
      unsupported$1('GridDescriptor::NonlinearFrustumMap');
      implementation = (vector) => vector;
    } else {
      unsupported$1('GridDescriptor::Matrix4x4');
      implementation = (vector) => vector;
    }

    // NOTE Cache implementation since transform type is static
    this.applyTransformMap = implementation;

    return implementation(vector);
  }
}

class Mask {
  readMask(targetNode) {
    const { bufferIterator } = GridSharedContext.getContext(this);

    this.dim = 1 << targetNode.log2dim;
    this.size = 1 << 3 * targetNode.log2dim;
    this.wordCount = this.size >> 6;
    this.words = [];

    Array(this.wordCount).fill(0).forEach(() => {
      const fillShift = Array(8).fill('0').join('');
      let byte = Array(8).fill(0)
        .map(() =>
          `${fillShift}${bufferIterator.readBytes(1).toString(2).split('-').join('')}`.substr(-8).split('').reverse().join('')
        );

      byte = byte.join('');
      this.words.push(`${Array(64).fill('0').join('')}${byte}`.substr(-64));
    });

    this.onCache = this.countOn();
    this.offCache = this.countOff();
  }

  countOn() {
    if (this.onCache) {
      return this.onCache;
    }

    let count = 0;

    this.words.forEach(word => {
      count += word.split('').filter(bit => bit === '1').length;
    });

    return count;
  }

  countOff() {
    if (this.offCache) {
      return this.offCache;
    }

    return this.size - this.countOn();
  }

  forEachOn(callback) {
    if (this.countOn() === 0) {
      return;
    }

    this.words.forEach((word, wordIndex) => {
      word.split('').forEach((value, bitIndex) => {
        if (value === '1') {
          const offset = wordIndex * 64 + bitIndex;

          callback({ wordIndex, bitIndex, offset });
        }
      });
    });
  }

  forEachOff(callback) {
    if (this.countOff() === 0) {
      return;
    }

    this.words.forEach((word, wordIndex) => {
      word.split('').forEach((value, bitIndex) => {
        if (value === '0') {
          const offset = wordIndex * 64 + bitIndex;

          callback({ wordIndex, bitIndex, offset });
        }
      });
    }); 
  }
}

// NOTE Assuming 5_4_3 tree
const log2dimMap = [
  5,
  4,
  3
];

const totalMap = [
  4,
  3,
  0
];

const nodeTypeMap = [
  'internal',
  'internal',
  'leaf',
];

class ChildNode {
  readNode(depth = 0, props) {
    const { version } = GridSharedContext.getContext(this);

    Object.assign(this, props);

    this.depth = depth;
    this.log2dim = log2dimMap[depth] || 1,
    this.nodeType = nodeTypeMap[depth] || 'invalid';
    this.total = this.log2dim + ((depth) => {
      let sum = 0;

      totalMap.forEach((value, index) => {
        if (index >= depth) {
          sum += value;
        }
      });

      return sum;
    })(depth);
    this.dim = 1 << this.total;
    this.numValues = 1 << (3 * this.log2dim);
    this.level = 2 - depth;
    this.numVoxels = Number(1n << (3n * BigInt(this.total)));
    this.background = props.background || 0.0;

    if (depth < 2) {
      this.childMask = new Mask();
      GridSharedContext.passContext(this, this.childMask);
      this.childMask.readMask(this);
      GridSharedContext.cleanContext(this.childMask);
    }
    this.valueMask = new Mask();
    GridSharedContext.passContext(this, this.valueMask);
    this.valueMask.readMask(this);
    GridSharedContext.cleanContext(this.valueMask);

    if (this.isLeaf()) {
      this.leavesCount = 1;
    } else {
      this.leavesCount = 0;
    }

    this.table = [];
    this.firstChild = null;

    this.values = [];

    if (Version.less(version, 214)) {
      unsupported$1('Internal-node compression');
      return;
    }

    this.readValues();
  }

  isLeaf() {
    return this.depth >= 2;
  }

  isInternalNode() {
    return !this.isLeaf()
  }

  getValueCoords(offset) {
    const vec = new Vector3();

    let x = offset >> 2 * this.log2dim;
    offset &= ((1 << 2 * this.log2dim) - 1);
    let y = offset >> this.log2dim;
    let z = offset & ((1 << this.log2dim) - 1);

    vec.set(x, y, z);

    vec.x = vec.x << this.numVoxels;
    vec.y = vec.y << this.numVoxels;
    vec.z = vec.z << this.numVoxels;

    return vec;
  }

  forEachValue(callback = () => {}) {
    this.valueMask.forEachOn((indices) => {
      callback({
        wordIndex: indices.wordIndex,
        bitIndex: indices.bitIndex,
        offset: indices.offset,
        coords: this.getValueCoords(indices.offset)
      });
    });
  }

  readValues() {
    const { bufferIterator, compression, version } = GridSharedContext.getContext(this);
    const oldVersion = Version.less(version, 222);
    const useCompression = compression.activeMask;

    if (this.isLeaf()) {
      this.values = Array(this.valueMask.size).fill(0.0);

      this.valueMask.forEachOn(({ offset }) => {
        this.values[offset] = 1.0;
      });

      return;
    }

    const numValues = oldVersion ? this.childMask.countOff() : this.numValues;
    let metadata = 0x110;

    if (Version.greaterEq(version, 222)) {
      metadata = bufferIterator.readBytes(1);
    }

    this.background;

    if ([ 2, 4, 5 ].includes(metadata)) {
      unsupported$1('Compression::readCompressedValues first conditional');
      // Read one of at most two distinct inactive values.
      //     if (seek) {
      //         is.seekg(/*bytes=*/sizeof(ValueT), std::ios_base::cur);
      //     } else {
      //         is.read(reinterpret_cast<char*>(&inactiveVal0), /*bytes=*/sizeof(ValueT));
      //     }
      //     if (metadata == MASK_AND_TWO_INACTIVE_VALS) {
      //         // Read the second of two distinct inactive values.
      //         if (seek) {
      //             is.seekg(/*bytes=*/sizeof(ValueT), std::ios_base::cur);
      //         } else {
      //             is.read(reinterpret_cast<char*>(&inactiveVal1), /*bytes=*/sizeof(ValueT));
      //         }
      //     }
    }
    
    if ([ 3, 4, 5 ].includes(metadata)) {
      this.selectionMask = new Mask(this);
      GridSharedContext.passContext(this, this.selectionMask);
      this.selectionMask.readMask(this);
      GridSharedContext.cleanContext(this.selectionMask);
    }

    let tempCount = numValues;

    if (useCompression && metadata !== 6 && Version.greaterEq(version, 222)) {
      tempCount = this.valueMask.countOn();
    }

    this.readData(tempCount);

    if (useCompression && tempCount !== numValues) {
      unsupported$1('Inactive values');
      // Restore inactive values, using the background value and, if available,
      //     // the inside/outside mask.  (For fog volumes, the destination buffer is assumed
      //     // to be initialized to background value zero, so inactive values can be ignored.)
      //     for (Index destIdx = 0, tempIdx = 0; destIdx < MaskT::SIZE; ++destIdx) {
      //         if (valueMask.isOn(destIdx)) {
      //             // Copy a saved active value into this node's buffer.
      //             destBuf[destIdx] = tempBuf[tempIdx];
      //             ++tempIdx;
      //         } else {
      //             // Reconstruct an unsaved inactive value and copy it into this node's buffer.
      //             destBuf[destIdx] = (selectionMask.isOn(destIdx) ? inactiveVal1 : inactiveVal0);
      //         }
      //     }
    }

    this.childMask.forEachOn((indices) => {
      let n = indices.offset;
      const vec = new Vector3();

      let x = n >> 2 * this.log2dim;
      n &= ((1 << 2 * this.log2dim) - 1);
      let y = n >> this.log2dim;
      let z = n & ((1 << this.log2dim) - 1);

      vec.set(x, y, z);

      const child = new ChildNode();
      GridSharedContext.passContext(this, child);

      child.parent = this;
      child.readNode(this.depth + 1, {
        id: indices.offset,
        origin: vec,
        indices: indices,
        background: this.background
      });

      vec.x = vec.x << child.total;
      vec.y = vec.y << child.total;
      vec.z = vec.z << child.total;
      
      this.table[indices.offset] = child;
      this.leavesCount += child.leavesCount;

      if (!this.firstChild) {
        this.firstChild = child;
      }

      GridSharedContext.cleanContext(child);
    });
  }

  readZipData() {
    const { bufferIterator, valueType, useHalf } = GridSharedContext.getContext(this);
    const zippedBytesCount = bufferIterator.readBytes(8);

    if (zippedBytesCount <= 0) {
      Array(-zippedBytesCount).fill(0).forEach(() => {
        this.values.push(bufferIterator.readFloat(useHalf ? 'half' : valueType));
      });
      
      return;
    } else {
      const zippedBytes = bufferIterator.readRawBytes(zippedBytesCount);
      
      try {
        this.values.push(window.pako.inflate(zippedBytes));
      } catch (error) {
        console.warn('readZipData', 'uncompress', 'error', {error, zippedBytes});
      }
    }
  }

  readData(count) {
    const { bufferIterator, valueType, useHalf, compression } = GridSharedContext.getContext(this);

    if (compression.blosc) {
      unsupported$1('Compression::BLOSC');
    } else if (compression.zip) {
      this.readZipData();
    } else {
      Array(count).fill(0).forEach(() => {
        this.values.push(bufferIterator.readFloat(useHalf ? 'half' : valueType));
      });
    } 
  }

  getLocalBbox() {
    if (this.localBboxCache) {
      return this.localBboxCache;
    }

    let sumParentOffset = new Vector3();

    const traverseOffset = (node) => {
      if (node && node.origin) {
        sumParentOffset.add(node.origin);
      }

      if (node.parent) {
        traverseOffset(node.parent);
      }
    };
    traverseOffset(this);

    const localBbox = [
      sumParentOffset,
      new Vector3(
        sumParentOffset.x + this.dim,
        sumParentOffset.y + this.dim,
        sumParentOffset.z + this.dim,
      )
    ];

    this.localBboxCache = localBbox;

    return localBbox;
  }

  getFirstChild() {
    return this.firstChild;
  }

  valueCache = {};

  getValue(position) {
    const positionKey = JSON.stringify(position);

    if (this.valueCache[positionKey]) {
      return this.valueCache[positionKey];
    }

    const [ min, max ] = this.getLocalBbox();

    const contained = (
      position.x >= min.x && position.x <= max.x &&
      position.y >= min.y && position.y <= max.y &&
      position.z >= min.z && position.z <= max.z
    );

    if (!contained) {
      this.valueCache[positionKey] = 0;
      return 0;
    }

    if (this.isLeaf()) {
      this.valueCache[positionKey] = this.valueMask.countOn() > 0;
      return this.valueMask.countOn() > 0;
    }

    let maxValue = 0;

    this.childMask.forEachOn(({ offset }) => {
      maxValue = Math.max(maxValue, this.table[offset].getValue(position));
    });

    this.valueCache[positionKey] = maxValue;
    return maxValue;
  }
}

class RootNode {
  readNode() {
    const { bufferIterator, valueType } = GridSharedContext.getContext(this);

    this.background = bufferIterator.readFloat(valueType);
    this.numTiles = bufferIterator.readBytes(uint32Size);
    this.numChildren = bufferIterator.readBytes(uint32Size);
    this.table = [];
    this.origin = new Vector3();

    this.readChildren();
  }

  readChildren() {
    if (this.numTiles === 0 && this.numChildren === 0) {
      unsupported('Empty root node');
      return;
    }

    this.leavesCount = 0;

    Array(this.numTiles).fill(0).forEach(() => {
      this.readTile();
    });

    Array(this.numChildren).fill(0).forEach(() => {
      this.readInternalNode();
    });
  }

  readTile() {
    unsupported('Tile nodes');
    
    const { bufferIterator, valueType } = GridSharedContext.getContext(this);

    const vec = new Vector3(
      bufferIterator.readFloat('int32'),
      bufferIterator.readFloat('int32'),
      bufferIterator.readFloat('int32'),
    );
    const value = bufferIterator.readFloat(valueType);
    const active = readBool();

    this.push({
      child: null,
      tile: {
        value,
        active: !value ? false : active
      },
      origin: vec,
      isChild: () => !!child,
      isTile: () => !!tile,
      isTileOff: () => tile && !tile.active,
      isTileOn: () => tile && tile.active,
    });
  }

  readInternalNode() {
    const { bufferIterator } = GridSharedContext.getContext(this);

    const vec = new Vector3(
      bufferIterator.readFloat('int32'),
      bufferIterator.readFloat('int32'),
      bufferIterator.readFloat('int32'),
    );

    const child = new ChildNode();
    GridSharedContext.passContext(this, child);

    child.readNode(0, {
      id: this.table.length,
      origin: vec,
      background: this.background
    });

    this.table.push(child);
    this.leavesCount += child.leavesCount;

    GridSharedContext.cleanContext(child);
  }

  getLocalBbox() {
    // NOTE Ignore bbox for root nodes
    return [
      new Vector3(0.0, 0.0, 0.0),
      new Vector3(0.0, 0.0, 0.0),
    ];
  }

  isLeaf() {
    return false;
  }

  isRoot() {
    return true;
  }
  
  valueCache = {};

  getValue(position) {
    const positionKey = JSON.stringify(position);

    if (this.valueCache[positionKey]) {
      return this.valueCache[positionKey];
    }

    let max = 0;

    this.table.forEach(child => {
      max = Math.max(max, child.getValue(position));
    });

    this.valueCache[positionKey] = max;

    return max;
  }
}

class GridDescriptor {
  static halfFloatGridPrefix = '_HalfFloat';

  saveAsHalfFloat = false;
  leavesCount = 0;

  uniqueName;
  gridName;
  gridType;
  
  readGrid() {
    const { bufferIterator, version } = GridSharedContext.getContext(this);

    this.readGridHeader();
    assert('Grid buffer position', this.gridBufferPosition, bufferIterator.offset);

    this.readCompression();
    this.readMetadata();

    if (Version.less(version, 216)) {
      this.readTopology();
      this.readGridTransform();
      this.readBuffers();
    } else {
      this.readGridTransform();
      this.readTopology();
      this.readBuffers();
    }
  }

  readGridHeader() {
    const { bufferIterator, version } = GridSharedContext.getContext(this);

    this.uniqueName = bufferIterator.readString();
    this.gridName = this.uniqueName.split('\x1e')[0];
    this.gridType = bufferIterator.readString();

    if (this.gridType.indexOf(GridDescriptor.halfFloatGridPrefix) !== -1) {
      this.saveAsHalfFloat = true;
      this.gridType = this.gridType.split(GridDescriptor.halfFloatGridPrefix).join('');
    }

    if (Version.greaterEq(version, 216)) {
      this.instanceParentName = bufferIterator.readString();
    }

    // NOTE Buffer offset at which grid description ends
    this.gridBufferPosition = bufferIterator.readFloat(int64Type);
     // NOTE Buffer offset at which grid blocks end
    this.blockBufferPosition = bufferIterator.readFloat(int64Type);
     // NOTE Buffer offset at which the file ends
    this.endBufferPosition = bufferIterator.readFloat(int64Type);
  }

  readCompression() {
    const { bufferIterator, version } = GridSharedContext.getContext(this);

    if (Version.greaterEq(version, 222)) {
      let compression = bufferIterator.readBytes(uint32Size);
      compression = {
        none: compression & 0x0,
        zip: compression & 0x1,
        activeMask: compression & 0x2,
        blosc: compression & 0x4,
      };

      GridSharedContext.getContext(this).compression = compression;
    }
  }

  readMetadata() {
    const { bufferIterator, version} = GridSharedContext.getContext(this);

    this.metadata = {
      count: bufferIterator.readBytes(uint32Size)
    };
  
    Array(this.metadata.count).fill(0).forEach(() => {
      const name = bufferIterator.readString();
      const type = bufferIterator.readString();
      const value = bufferIterator.readString(type);
  
      this.metadata[name] = { type, value };
    });

    if (Version.less(version, 219)) {
      this.metadata.name = this.gridName;
    }
  }

  getGridValueType() {
    const value = Object.entries(this.metadata).find(([ id ]) => id === 'value_type');

    return (value ? value[1].value : undefined) || floatType;
  }

  readGridTransform() {
    this.transform = new GridTransform();
    GridSharedContext.passContext(this, this.transform);

    this.transform.readTransform();

    GridSharedContext.cleanContext(this.transform);
  }

  readTopology() {
    const { bufferIterator } = GridSharedContext.getContext(this);

    GridSharedContext.getContext(this).useHalf = this.saveAsHalfFloat;
    GridSharedContext.getContext(this).valueType = this.getGridValueType();

    const topologyBufferCount = bufferIterator.readBytes(uint32Size);

    if (topologyBufferCount !== 1) {
      // NOTE https://github.com/AcademySoftwareFoundation/openvdb/blob/master/openvdb/openvdb/tree/Tree.h#L1120
      unsupported$1('Multi-buffer trees');
      return;
    }

    this.root = new RootNode();
    GridSharedContext.passContext(this, this.root);

    this.root.readNode();
    this.leavesCount = this.root.leavesCount;

    GridSharedContext.cleanContext(this.root);

    assert('Block buffer', this.blockBufferPosition, bufferIterator.offset);
  }

  readBuffers() {
    // TODO
  }

  getWorldBbox(child) {
    const localBbox = (child || this).getLocalBbox();

    return localBbox.map(vector => vector.clone()).map(this.transform.applyTransformMap);
  }

  getLocalBbox() {
    const maxLog2Dim = 1 << (log2dimMap[0] + totalMap.reduce((total, next) => total + next));

    return [
      this.metadata.file_bbox_min.value.subScalar(maxLog2Dim - 1),
      this.metadata.file_bbox_max.value.addScalar(maxLog2Dim - 1),
    ];
  }

  getPreciseWorldBbox() {
    return [
      this.transform.applyTransformMap(this.metadata.file_bbox_min.value.clone()),
      this.transform.applyTransformMap(this.metadata.file_bbox_max.value.clone()),
    ];
  }

  valueCache = {};

  getValue(position) {
    const positionKey = JSON.stringify(position);

    if (this.valueCache[positionKey]) {
      return this.valueCache[positionKey];
    }

    const value = this.root.getValue(position);
    this.valueCache[positionKey] = value;

    return value;
  }
}

class OpenVDBReader {
  libraryVersion;
  hasGridOffsets;
  uuid;
  metadata;

  constructor() {
    GridSharedContext.tagContext(this, new GridSharedContext());
  }

  prepare() {
    // TODO Pre-fill VDB structure without reading actual values
    GridSharedContext.getContext(this).bufferIterator = new BufferIterator(source);
  }

  read(source) {
    GridSharedContext.getContext(this).bufferIterator = new BufferIterator(source);

    this.validateVDBFile();

    this.readFileVersion();
    this.readHeader();
    this.readGrids();
  }

  validateVDBFile() {
    const { bufferIterator } = GridSharedContext.getContext(this);

    const magic = bufferIterator.readBytes(uint64Size);

    assert('VDB magic number', 0x56444220, magic);
  }

  readFileVersion() {
    const { bufferIterator } = GridSharedContext.getContext(this);

    const version = bufferIterator.readBytes(uint32Size);
    GridSharedContext.getContext(this).version = version;

    this.libraryVersion = {
      minor: -1,
      major: -1
    };

    if (version > 211) {
      this.libraryVersion.major = bufferIterator.readBytes(uint32Size);
      this.libraryVersion.minor = bufferIterator.readBytes(uint32Size);
    } else {
      this.libraryVersion.major = 0.0;
      this.libraryVersion.minor = 0.0;
    }
  }

  readHeader() {
    const { bufferIterator, version } = GridSharedContext.getContext(this);
    this.hasGridOffsets = bufferIterator.readBytes(charSize);

    let compression;

    if (version >= 220 && version < 222) {
      compression = bufferIterator.readBytes(charSize);
      compression = {
        none: compression & 0x0,
        zip: compression & 0x1,
        activeMask: compression & 0x2,
        blosc: compression & 0x4,
      };
    } else {
      compression = {
        none: false,
        zip: false,
        activeMask: true,
        blosc: false
      };
    }

    GridSharedContext.getContext(this).compression = compression;

    let uuid = '';
    Array(36).fill(0).map((_) => uuid += String.fromCharCode(bufferIterator.readBytes(1)));

    this.uuid = uuid;

    const metadata = {};
    const metadataCount = bufferIterator.readBytes(uint32Size);
    Array(metadataCount).fill(0).forEach(() => {
      const name = bufferIterator.readString();
      const type = bufferIterator.readString();
      const value = bufferIterator.readString(type);

      metadata[name] = { type, value };
    });

    this.metadata = metadata;
  }

  readGrids() {
    const { bufferIterator } = GridSharedContext.getContext(this);

    let grids = {};

    this.grids = grids;

    if (!this.hasGridOffsets) {
      // TODO Handle case without grid offsets
      // File.cc:364
      unsupported$1('VDB without grid offsets');
    } else {
      const gridCount = bufferIterator.readBytes(uint32Size);

      Array(gridCount).fill(0).forEach(() => {
        const gridDescriptor = new GridDescriptor(bufferIterator);
        GridSharedContext.passContext(this, gridDescriptor);

        gridDescriptor.readGrid();

        GridSharedContext.cleanContext(gridDescriptor);

        this.grids[gridDescriptor.uniqueName] = gridDescriptor;
      });
    }
  }
}

const loadVDB = (url) => new Promise((resolve) => {
  fetch(url).then(async (vdb) => {
    const source = new Uint8Array(await vdb.arrayBuffer());
    const vdbReader = new OpenVDBReader();
    vdbReader.read(source);

    resolve(vdbReader);
  });
});

export { loadVDB };
