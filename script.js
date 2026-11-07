const input=document.getElementById("marksInput"),error=document.getElementById("error");
let formatting=false; const classResults={};
let customSelectedClasses=[];
input.addEventListener("input",()=>{if(formatting)return;formatting=true;let raw=input.value,out="",digits="";for(const ch of raw){if(/[0-9]/.test(ch)){digits+=ch;if(digits.length===2){out+=digits+", ";digits=""}}else if(ch==="-"){if(digits){out+=digits+", ";digits=""}out+="-,"}else if(ch===","||/\s/.test(ch)){if(digits){out+=digits+", ";digits=""}}}if(digits)out+=digits;input.value=out.replace(/,\s*$/,"");formatting=false});
function err(t){error.textContent=t;error.style.display="block"}
function getResult(){
 const total=Number(document.getElementById("totalMarks").value),text=input.value.trim();
 if(!total||total<1){err("براہ کرم کل نمبر درست درج کریں۔");return null}
 if(!text){err("براہ کرم طلبہ کے نمبر درج کریں۔");return null}
 const tokens=text.split(",").map(x=>x.trim()).filter(Boolean),vals=[];
 for(const t of tokens){if(t==="-"){vals.push(null);continue}if(!/^\d+(\.\d+)?$/.test(t)){err("غلط اندراج: "+t);return null}const n=Number(t);if(n>total){err("نمبر "+t+" کل نمبروں "+total+" سے زیادہ ہیں۔");return null}if(n<0){err("منفی نمبر درست نہیں ہیں۔");return null}vals.push(n)}
 const part=vals.filter(v=>v!==null),absent=vals.length-part.length;
 if(!part.length){err("کم از کم ایک طالب علم کے نمبر درج کریں۔");return null}
 const counts=[0,0,0,0];part.forEach(n=>{const p=n/total*100;if(p>=90)counts[0]++;else if(p>=85)counts[1]++;else if(p>=75)counts[2]++;else counts[3]++});
 const raw=counts.map(n=>n/part.length*100),pct=raw.map(Math.floor);let rem=100-pct.reduce((a,b)=>a+b,0);
 raw.map((v,i)=>({i,f:v-Math.floor(v)})).sort((a,b)=>b.f-a.f).forEach((x,i)=>{if(i<rem)pct[x.i]++});
 return {total,entries:vals.length,part:part.length,absent,counts,pct}
}
function renderResult(r){
 document.getElementById("outTotal").textContent=r.total;document.getElementById("outEntries").textContent=r.entries;document.getElementById("outPart").textContent=r.part;document.getElementById("outAbsent").textContent=r.absent;
 for(let i=0;i<4;i++){document.getElementById("s"+(i+1)).textContent=r.counts[i];document.getElementById("c"+(i+1)).textContent=r.counts[i];document.getElementById("p"+(i+1)).textContent=r.pct[i]+"٪";document.getElementById("t"+(i+1)).textContent=r.counts[i]}
 document.getElementById("totalCount").textContent=r.part;document.getElementById("totalPct").textContent=r.pct.reduce((a,b)=>a+b,0)+"٪";document.getElementById("result").style.display="block";
}
function getNextAvailableClass(currentClass){
 const current=Number(currentClass)||0;
 for(let n=current+1;n<=21;n++) if(!classResults[n]) return n;
 for(let n=1;n<=21;n++) if(!classResults[n]) return n;
 return null;
}
function prepareNextClass(currentClass){
 const next=getNextAvailableClass(currentClass);
 const select=document.getElementById("classSelect");
 const result=document.getElementById("result");
 document.getElementById("totalMarks").value="";
 input.value="";
 result.style.display="none";
 if(next){
   select.value=String(next);
   document.getElementById("addClassBtn").textContent="مکمل کلاسز کے میزان میں شامل کریں";
 }else{
   select.value="";
   document.getElementById("addClassBtn").textContent="تمام 21 کلاسیں شامل ہو چکی ہیں";
 }
}
function analyze(){
 error.style.display="none";
 const cls=document.getElementById("classSelect").value;
 if(!cls)return err("براہ کرم پہلے کلاس منتخب کریں۔");
 const r=getResult();
 if(!r)return;
 renderResult(r);
 saveMizanState(r);
 document.getElementById("addClassBtn").textContent=classResults[cls]?"یہ کلاس پہلے ہی مجموعی میزان میں شامل ہے":"مجموعی میزان میں شامل کریں";
 document.getElementById("result").scrollIntoView({behavior:"smooth"});
}
function addCurrentClass(){
 error.style.display="none";
 const cls=document.getElementById("classSelect").value;
 if(!cls)return err("براہ کرم پہلے کلاس منتخب کریں۔");
 if(classResults[cls]){
   return err("کلاس "+cls+" کا رزلٹ پہلے ہی مجموعی فہرست میں شامل کیا جا چکا ہے۔ اس کلاس کا رزلٹ دوبارہ تبدیل نہیں کیا جا سکتا۔ اگر کوئی غلطی ہے تو پہلے درست کلاس منتخب کریں۔");
 }
 const r=getResult();
 if(!r)return;
 classResults[cls]={classNo:Number(cls),eligible:r.entries,participated:r.part,counts:[...r.counts]};
 renderConsolidated();
 prepareNextClass(cls);
 saveMizanState();
 document.getElementById("consolidated").scrollIntoView({behavior:"smooth"});
}
function renderCustomClassSelector(){
 const box=document.getElementById("customClassSelector");
 if(!box)return;
 box.innerHTML="";
 for(let n=1;n<=21;n++){
   const available=!!classResults[n];
   const label=document.createElement("label");
   label.className="custom-class-option"+(available?"":" disabled");
   const cb=document.createElement("input");
   cb.type="checkbox"; cb.value=String(n); cb.checked=available&&customSelectedClasses.includes(n); cb.disabled=!available;
   cb.addEventListener("change",()=>{
     const num=Number(cb.value);
     if(cb.checked){if(!customSelectedClasses.includes(num))customSelectedClasses.push(num)}
     else customSelectedClasses=customSelectedClasses.filter(v=>v!==num);
     customSelectedClasses.sort((a,b)=>a-b);
     renderCustomTotals(); saveMizanState();
   });
   label.appendChild(cb);
   label.appendChild(document.createTextNode("کلاس "+n));
   box.appendChild(label);
 }
}
function renderCustomTotals(){
 customSelectedClasses=customSelectedClasses.filter(n=>!!classResults[n]);
 const t=customSelectedClasses.reduce((a,n)=>{const r=classResults[n];a.e+=Number(r.eligible)||0;a.p+=Number(r.participated)||0;r.counts.forEach((v,i)=>a.c[i]+=(Number(v)||0));return a},{e:0,p:0,c:[0,0,0,0]});
 document.getElementById("customClassCount").textContent=customSelectedClasses.length;
 document.getElementById("customEligible").textContent=t.e;
 document.getElementById("customParticipated").textContent=t.p;
 for(let i=0;i<4;i++)document.getElementById("custom"+(i+1)).textContent=t.c[i];
 document.getElementById("customTotalStatus").textContent=customSelectedClasses.length?"منتخب کلاسیں: "+customSelectedClasses.map(n=>"کلاس "+n).join("، "):"ابھی کوئی کلاس منتخب نہیں کی گئی۔";
 renderCustomClassSelector();
}
function selectAllCustomClasses(){
 customSelectedClasses=Object.keys(classResults).map(Number).sort((a,b)=>a-b);
 renderCustomTotals(); saveMizanState();
}
function clearCustomClasses(){
 customSelectedClasses=[];
 renderCustomTotals(); saveMizanState();
}

function renderConsolidated(){
 const body=document.getElementById("consolidatedBody");body.innerHTML="";const rows=Object.values(classResults).sort((a,b)=>a.classNo-b.classNo);
 rows.forEach(r=>{const tr=document.createElement("tr");const categoryCells=r.counts.map(count=>{const pct=r.participated?Math.round(count/r.participated*100):0;return "<td><b>"+count+"</b><br><span class=\"row-pct\">"+pct+"٪</span></td>"}).join("");
tr.innerHTML="<td>کلاس "+r.classNo+"</td><td>"+r.eligible+"</td><td>"+r.participated+"</td>"+categoryCells;body.appendChild(tr)});
 const t=rows.reduce((a,r)=>{a.e+=r.eligible;a.p+=r.participated;r.counts.forEach((v,i)=>a.c[i]+=v);return a},{e:0,p:0,c:[0,0,0,0]});
 document.getElementById("classCount").textContent=rows.length;document.getElementById("grandEligible").textContent=t.e;document.getElementById("grandPart").textContent=t.p;for(let i=0;i<4;i++)document.getElementById("grand"+(i+1)).textContent=t.c[i];
 document.getElementById("consolidatedStatus").textContent=!rows.length?"ابھی کوئی کلاس شامل نہیں کی گئی۔":(t.c.reduce((a,b)=>a+b,0)===t.p?"✓ تمام شامل شدہ کلاسوں کے category counts شریک طلبہ کے برابر ہیں۔":"⚠ مجموعی category counts اور شریک طلبہ میں فرق موجود ہے۔");
 renderCustomTotals();
}
function printConsolidatedReport(){
 const rows=Object.keys(classResults);
 if(!rows.length){
   document.getElementById("consolidatedStatus").textContent="⚠ پہلے کم از کم ایک کلاس کا نتیجہ مجموعی میزان میں شامل کریں۔";
   return;
 }
 document.body.classList.add("print-consolidated");
 setTimeout(()=>window.print(),50);
}

/* Generate a real PDF from the complete consolidated report.
   Rendering through html2canvas preserves the existing Urdu/Nastaleeq appearance. */
/* Store/load the latest PDF generated by this app on this device. */
const MIZAN_PDF_DB_NAME="mizanAcademicPDF_v1";
const MIZAN_PDF_STORE="reports";
function openMizanPDFDB(){
  return new Promise((resolve,reject)=>{
    if(!("indexedDB" in window)){reject(new Error("IndexedDB دستیاب نہیں ہے۔"));return}
    const req=indexedDB.open(MIZAN_PDF_DB_NAME,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(MIZAN_PDF_STORE))req.result.createObjectStore(MIZAN_PDF_STORE)};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error||new Error("Database error"));
  });
}
async function saveLatestMizanPDF(blob){
  try{
    const db=await openMizanPDFDB();
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(MIZAN_PDF_STORE,"readwrite");
      tx.objectStore(MIZAN_PDF_STORE).put({blob,savedAt:new Date().toISOString(),classResults:JSON.parse(JSON.stringify(classResults))},"latest");
      tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
    });
    db.close();
    const el=document.getElementById("savedPdfStatus");
    if(el)el.textContent="موجودہ مجموعی PDF اسی ڈیوائس کے Browser میں محفوظ کر دی گئی ہے۔";
  }catch(e){console.warn("PDF local save failed",e)}
}
async function loadLatestMizanPDFBlob(){
  const db=await openMizanPDFDB();
  return await new Promise((resolve,reject)=>{
    const tx=db.transaction(MIZAN_PDF_STORE,"readonly");
    const req=tx.objectStore(MIZAN_PDF_STORE).get("latest");
    req.onsuccess=()=>{db.close();resolve(req.result?.blob||null)};
    req.onerror=()=>{db.close();reject(req.error)};
  });
}
async function loadSavedMizanPDF(){
  const status=document.getElementById("savedPdfStatus");
  try{
    status.textContent="محفوظ شدہ PDF تلاش کی جا رہی ہے...";
    const blob=await loadLatestMizanPDFBlob();
    if(!blob){
      status.textContent="اس ڈیوائس پر ابھی اس سسٹم کی کوئی محفوظ PDF موجود نہیں ہے۔";
      return;
    }
    await importMizanPDF(blob);
  }catch(e){
    console.error(e);
    status.textContent="محفوظ PDF نہیں کھولی جا سکی۔";
  }
}
function bytesToBase64(bytes){
  let binary="";
  const chunk=0x8000;
  for(let i=0;i<bytes.length;i+=chunk)binary+=String.fromCharCode(...bytes.subarray(i,Math.min(i+chunk,bytes.length)));
  return btoa(binary);
}
function base64ToUtf8(b64){
  const binary=atob(b64);
  const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return new TextDecoder("utf-8").decode(bytes);
}
function encodeMizanPDFData(){
  const payload={
    marker:"MIZAN_RESULT_DATA_V1",
    classes:Object.values(classResults).sort((a,b)=>a.classNo-b.classNo).map(r=>({
      classNo:Number(r.classNo),eligible:Number(r.eligible)||0,participated:Number(r.participated)||0,
      counts:Array.isArray(r.counts)?r.counts.map(Number):[0,0,0,0]
    }))
  };
  return bytesToBase64(new TextEncoder().encode(JSON.stringify(payload)));
}
async function extractMizanPDFData(fileOrBlob){
  if(!window.pdfjsLib)throw new Error("PDF reader دستیاب نہیں ہے۔");
  const buffer=await fileOrBlob.arrayBuffer();
  const pdf=await pdfjsLib.getDocument({data:new Uint8Array(buffer)}).promise;
  let allText="";
  for(let i=1;i<=pdf.numPages;i++){
    const page=await pdf.getPage(i);
    const content=await page.getTextContent();
    allText+=content.items.map(item=>item.str||"").join("")+"\n";
  }
  const marker="MIZAN_DATA_V1:";
  const pos=allText.indexOf(marker);
  if(pos<0)throw new Error("یہ PDF اس Mizan سسٹم کی بنائی ہوئی محفوظ PDF نہیں ہے۔");
  let b64=allText.slice(pos+marker.length).replace(/\s+/g,"");
  // Ignore anything after our end marker if present.
  const end=b64.indexOf("MIZAN_DATA_END");
  if(end>=0)b64=b64.slice(0,end);
  const payload=JSON.parse(base64ToUtf8(b64));
  if(payload.marker!=="MIZAN_RESULT_DATA_V1" || !Array.isArray(payload.classes))throw new Error("PDF کا محفوظ ڈیٹا درست نہیں ہے۔");
  return payload.classes;
}
async function importMizanPDF(file){
  const status=document.getElementById("savedPdfStatus");
  if(!file)return;
  try{
    status.textContent="PDF پڑھ رہی ہے، براہ کرم انتظار کریں...";
    const classes=await extractMizanPDFData(file);
    Object.keys(classResults).forEach(k=>delete classResults[k]);
    classes.forEach(r=>{
      const n=Number(r.classNo);
      if(n>=1&&n<=21)classResults[n]={
        classNo:n,eligible:Number(r.eligible)||0,participated:Number(r.participated)||0,
        counts:Array.isArray(r.counts)?r.counts.slice(0,4).map(v=>Number(v)||0):[0,0,0,0]
      };
    });
    customSelectedClasses=[];
    renderConsolidated();
    saveMizanState();
    status.textContent="محفوظ شدہ PDF سے "+classes.length+" کلاسوں کا رزلٹ کامیابی سے کھول لیا گیا ہے۔ اب مطلوبہ کلاسیں منتخب کریں۔";
    document.getElementById("customTotalCard").scrollIntoView({behavior:"smooth",block:"start"});
  }catch(e){
    console.error(e);
    status.textContent=e.message||"PDF سے رزلٹ نہیں پڑھا جا سکا۔";
  }
}

async function createConsolidatedPDF(){
  const report=document.getElementById("consolidated");
  if(!report) throw new Error("رپورٹ نہیں ملی۔");

  const sourceRows=[...report.querySelectorAll("#consolidatedBody > tr")];
  if(!sourceRows.length) throw new Error("رپورٹ میں کوئی کلاس موجود نہیں۔");

  const rowsPerPage=11;
  const {jsPDF}=window.jspdf;
  const pdf=new jsPDF({orientation:"landscape",unit:"mm",format:"a4",compress:true});
  const pageWidth=297,pageHeight=210,margin=7;
  const usableWidth=pageWidth-(margin*2);
  const usableHeight=pageHeight-(margin*2);

  for(let start=0,pageNo=0; start<sourceRows.length; start+=rowsPerPage,pageNo++){
    const end=Math.min(start+rowsPerPage,sourceRows.length);
    const isLast=end===sourceRows.length;

    const clone=report.cloneNode(true);
    clone.querySelectorAll(".no-print").forEach(el=>el.remove());

    const status=clone.querySelector("#consolidatedStatus");
    if(status) status.remove();

    const tbody=clone.querySelector("#consolidatedBody");
    const clonedRows=[...tbody.querySelectorAll("tr")];
    clonedRows.forEach((row,index)=>{
      if(index<start || index>=end) row.remove();
    });

    if(!isLast){
      const foot=clone.querySelector("tfoot");
      if(foot) foot.remove();
    }

    clone.style.position="fixed";
    clone.style.left="-100000px";
    clone.style.top="0";
    clone.classList.add("pdf-compact");
    clone.style.width="1120px";
    clone.style.background="#fff";
    clone.style.padding="7px 8px";
    clone.style.boxSizing="border-box";
    clone.style.display="block";
    document.body.appendChild(clone);

    try{
      const canvas=await html2canvas(clone,{
        scale:2,
        useCORS:true,
        backgroundColor:"#ffffff",
        logging:false,
        windowWidth:1120
      });

      const fitScale=Math.min(
        usableWidth/canvas.width,
        usableHeight/canvas.height
      );
      const renderWidth=canvas.width*fitScale;
      const renderHeight=canvas.height*fitScale;

      /* Keep the larger font size; only scale down when a page is too tall. */
      const x=margin+(usableWidth-renderWidth)/2;
      const y=margin+(usableHeight-renderHeight)/2;

      if(pageNo>0) pdf.addPage();
      pdf.addImage(
        canvas.toDataURL("image/jpeg",0.94),
        "JPEG",
        x,y,renderWidth,renderHeight
      );
      if(pageNo===0){
        const dataText="MIZAN_DATA_V1:"+encodeMizanPDFData()+":MIZAN_DATA_END";
        pdf.setFont("helvetica","normal");
        pdf.setFontSize(1);
        pdf.setTextColor(255,255,255);
        const hiddenChunkSize=240;
        for(let h=0;h<dataText.length;h+=hiddenChunkSize){
          pdf.text(dataText.slice(h,h+hiddenChunkSize),1,pageHeight-0.7-(h/hiddenChunkSize)*0.28);
        }
        pdf.setTextColor(0,0,0);
      }
    }finally{
      clone.remove();
    }
  }

  const blob=pdf.output("blob");
  await saveLatestMizanPDF(blob);
  return blob;
}
async function shareConsolidatedPDF(){
 const rows=Object.keys(classResults);
 if(!rows.length){
   document.getElementById("consolidatedStatus").textContent="⚠ پہلے کم از کم ایک کلاس کا نتیجہ مجموعی میزان میں شامل کریں۔";
   return;
 }

 const btn=document.querySelector('button[onclick="shareConsolidatedPDF()"]');
 const originalText=btn?btn.textContent:"";
 if(btn){btn.disabled=true;btn.textContent="PDF تیار ہو رہی ہے...";}

 try{
   const blob=await createConsolidatedPDF();
   const file=new File([blob],"مجموعی-میزان.pdf",{type:"application/pdf"});

   if(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))){
     await navigator.share({
       title:"مجموعی میزان",
       text:"مجموعی کلاسز کا میزان PDF",
       files:[file]
     });
   }else{
     const url=URL.createObjectURL(blob);
     const a=document.createElement("a");
     a.href=url;
     a.download="مجموعی-میزان.pdf";
     document.body.appendChild(a);
     a.click();
     a.remove();
     setTimeout(()=>URL.revokeObjectURL(url),1000);
     document.getElementById("consolidatedStatus").textContent="PDF تیار ہو گئی ہے۔ اسے محفوظ کرکے WhatsApp یا کسی بھی طریقے سے شیئر کریں۔";
   }
 }catch(e){
   if(e && e.name==="AbortError") return;
   console.error(e);
   document.getElementById("consolidatedStatus").textContent="⚠ PDF شیئر نہیں ہو سکی۔ براہ کرم دوبارہ کوشش کریں۔";
 }finally{
   if(btn){btn.disabled=false;btn.textContent=originalText;}
 }
}
window.addEventListener("afterprint",()=>document.body.classList.remove("print-consolidated"));

/* Automatic local backup: keeps the current work on this browser/device. */
const MIZAN_STORAGE_KEY="mizanAcademicResultAnalysis_v1";
let restoredResult=null;
function saveMizanState(resultOverride){
  try{
    const resultValue=arguments.length?resultOverride:null;
    const state={
      version:2,
      customSelectedClasses:[...customSelectedClasses],
      classResults:JSON.parse(JSON.stringify(classResults)),
      selectedClass:document.getElementById("classSelect").value,
      totalMarks:document.getElementById("totalMarks").value,
      marksInput:input.value,
      result:resultValue,
      resultVisible:document.getElementById("result").style.display!=="none",
      savedAt:new Date().toISOString()
    };
    localStorage.setItem(MIZAN_STORAGE_KEY,JSON.stringify(state));
  }catch(e){
    console.warn("Local save failed",e);
  }
}
function restoreMizanState(){
  try{
    const raw=localStorage.getItem(MIZAN_STORAGE_KEY);
    if(!raw)return false;
    const state=JSON.parse(raw);
    if(!state || ![1,2].includes(state.version))return false;

    Object.keys(classResults).forEach(k=>delete classResults[k]);
    if(state.classResults && typeof state.classResults==="object"){
      Object.entries(state.classResults).forEach(([k,v])=>{
        const n=Number(k);
        if(n>=1 && n<=21 && v) classResults[n]=v;
      });
    }

    customSelectedClasses=Array.isArray(state.customSelectedClasses)?state.customSelectedClasses.map(Number).filter(n=>n>=1&&n<=21):[];
    document.getElementById("classSelect").value=state.selectedClass||"";
    document.getElementById("totalMarks").value=state.totalMarks||"";
    input.value=state.marksInput||"";
    renderConsolidated();

    if(state.resultVisible && state.result){
      renderResult(state.result);
    }else{
      document.getElementById("result").style.display="none";
    }
    return true;
  }catch(e){
    console.warn("Local restore failed",e);
    return false;
  }
}
function clearSavedMizanData(){
  try{localStorage.removeItem(MIZAN_STORAGE_KEY);customSelectedClasses=[];renderCustomTotals()}catch(e){console.warn("Local clear failed",e)}
}

/* Save continuously while the user works. */
input.addEventListener("input",()=>saveMizanState());
document.getElementById("totalMarks").addEventListener("input",()=>saveMizanState());
document.getElementById("classSelect").addEventListener("change",()=>saveMizanState());
window.addEventListener("beforeunload",()=>saveMizanState());

function clearForm(){
  document.getElementById("classSelect").value="";
  document.getElementById("totalMarks").value="";
  input.value="";
  error.style.display="none";
  document.getElementById("result").style.display="none";
  saveMizanState(null);
}

renderConsolidated();
restoreMizanState();