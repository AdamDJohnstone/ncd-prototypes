/* Host helper: load as a module, then mountPlayground(iframe, options). */
export function mountPlayground(iframe, {src, language='en', surveyTarget, id='pot-plant-playground'}) {
  if(!/^[a-zA-Z0-9_-]{1,80}$/.test(id))throw new Error('Invalid playground instance ID');
  const url=new URL(src,location.href);
  if(!['https:','http:'].includes(url.protocol))throw new Error('An HTTP(S) playground URL is required');
  url.searchParams.set('lang',language);
  url.searchParams.set('parentOrigin',location.origin);
  url.searchParams.set('embedId',id);
  iframe.style.cssText+=';width:100%;border:0;display:block;height:1000px';
  const listener=event=>{
    const data=event.data;
    if(event.origin!==url.origin || event.source!==iframe.contentWindow || !data ||
       data.namespace!=='ncd-pot-plant-playground' || data.version!==1 || data.id!==id)return;
    if(data.type==='resize' && Number.isFinite(data.height) && data.height>=200 && data.height<=20000)
      iframe.style.height=`${Math.ceil(data.height)}px`;
    if(data.type==='discover'){
      const target=typeof surveyTarget==='string'?document.querySelector(surveyTarget):surveyTarget;
      if(target){target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});target.focus({preventScroll:true})}
    }
  };
  window.addEventListener('message',listener);
  iframe.src=url.href;
  return ()=>window.removeEventListener('message',listener);
}
