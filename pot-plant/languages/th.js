window.NCD_POT_PLANT_LANGUAGES =
  window.NCD_POT_PLANT_LANGUAGES || {};

/* Only activate Thai document shaping when Thai is the requested language.
   This lets CSS provide a Thai-capable font stack without affecting other languages. */
if (new URLSearchParams(window.location.search).get("lang") === "th") {
  document.documentElement.setAttribute("lang", "th");
}

window.NCD_POT_PLANT_LANGUAGES.th = {
  code: "th",
  name: "ไทย",
  labelScale: 0.69,
  labelLanguage: "th",
  labelFontFamily: 'Tahoma, "Noto Sans Thai", "Leelawadee UI", sans-serif',
  labelLetterSpacing: 0,

  interface: {
    playgroundTitle: "พื้นที่ทดลอง NCD Pot Plant",
    surveyScores: "คะแนนแบบสำรวจ",
    replaySpiral: "เล่นเกลียวอีกครั้ง",
    randomResult: "ผลลัพธ์แบบสุ่ม",
    closeScoresTest: "ทดสอบคะแนนที่ใกล้เคียงกัน",
    balancedResult: "ผลลัพธ์ที่สมดุล",
    maximumFactor: "ปัจจัยสูงสุด",
    minimumFactor: "ปัจจัยต่ำสุด",
    watchGrow: "ดูการเติบโต",
    watchAgain: "ดูอีกครั้ง",
    close: "ปิด",
    language: "ภาษา"
  },

  qcs: {
    LR: {name:"ความสัมพันธ์ที่เปี่ยมด้วยความรัก",lines:[{text:"ความสัมพันธ์",emphasis:false},{text:"ที่เปี่ยมด้วยความรัก",emphasis:true}],heartQuestion:"ฉันเป็นส่วนหนึ่งของที่นี่จริง ๆ หรือไม่?",description:"ความสัมพันธ์ที่เปี่ยมด้วยความรักสร้างชุมชนที่ผู้คนสัมผัสได้ถึงการยอมรับ การเอาใจใส่ และการเป็นส่วนหนึ่งอย่างแท้จริง"},
    EL: {name:"ภาวะผู้นำที่เสริมสร้างพลัง",lines:[{text:"ภาวะผู้นำ",emphasis:false},{text:"ที่เสริมสร้างพลัง",emphasis:true}],heartQuestion:"คุณเชื่อมั่นในตัวฉันจริง ๆ หรือไม่?",description:"ภาวะผู้นำที่เสริมสร้างพลังมองเห็นศักยภาพที่พระเจ้าประทานแก่แต่ละคน และช่วยให้พวกเขาเติบโตสู่ความรับผิดชอบที่มีความหมาย"},
    ES: {name:"โครงสร้างที่เกิดผล",lines:[{text:"โครงสร้าง",emphasis:false},{text:"ที่เกิดผล",emphasis:true}],heartQuestion:"ฉันมีพื้นที่ให้เติบโตจริง ๆ หรือไม่?",description:"โครงสร้างที่เกิดผลสร้างเสรีภาพ ความชัดเจน และการสนับสนุนที่ผู้คนต้องการเพื่อเติบโตและมีส่วนร่วมอย่างเกิดผล"},
    GBM:{name:"การรับใช้ตามของประทาน",lines:[{text:"การรับใช้",emphasis:false},{text:"ตามของประทาน",emphasis:true}],heartQuestion:"ฉันมีบางสิ่งที่จะมีส่วนร่วมจริง ๆ หรือไม่?",description:"การรับใช้ตามของประทานช่วยให้ผู้คนค้นพบว่าพระเจ้าทรงประทานความสามารถเฉพาะแก่พวกเขาอย่างไร และพบวิธีที่มีความหมายในการมีส่วนร่วม"},
    NOE:{name:"การประกาศข่าวประเสริฐที่เข้าถึงความต้องการของผู้คน",lines:[{text:"การประกาศข่าวประเสริฐ",emphasis:false},{text:"ที่เข้าถึงความต้องการ",emphasis:true},{text:"ของผู้คน",emphasis:true}],heartQuestion:"คุณใส่ใจฉันจริง ๆ หรือไม่?",description:"การประกาศข่าวประเสริฐที่เข้าถึงความต้องการของผู้คนเริ่มต้นจากการมองเห็นผู้คนที่พระเจ้าทรงนำมาไว้รอบตัวเราอย่างแท้จริง และตอบสนองต่อความต้องการของพวกเขา"},
    IWS:{name:"การนมัสการที่สร้างแรงบันดาลใจ",lines:[{text:"การนมัสการ",emphasis:false},{text:"ที่สร้างแรงบันดาลใจ",emphasis:true}],heartQuestion:"ฉันได้พบพระเจ้าที่นี่จริง ๆ หรือไม่?",description:"การนมัสการที่สร้างแรงบันดาลใจช่วยให้ผู้คนพบพระเจ้าในแบบที่ฟื้นฟูความเชื่อ ความหวัง และความพร้อมที่จะตอบสนอง"},
    PS: {name:"ชีวิตฝ่ายวิญญาณที่ร้อนรน",lines:[{text:"ชีวิตฝ่ายวิญญาณ",emphasis:false},{text:"ที่ร้อนรน",emphasis:true}],heartQuestion:"ฉันวางใจในพระเจ้าจริง ๆ หรือไม่?",description:"ชีวิตฝ่ายวิญญาณที่ร้อนรนเติบโตเมื่อความเชื่อถูกดำเนินชีวิตจากความสัมพันธ์กับพระเจ้าที่แท้จริงและให้ชีวิต"},
    HSG:{name:"กลุ่มย่อยแบบองค์รวม",lines:[{text:"กลุ่มย่อย",emphasis:false},{text:"แบบองค์รวม",emphasis:true}],heartQuestion:"คุณรู้จักฉันจริง ๆ หรือไม่?",description:"กลุ่มย่อยแบบองค์รวมสร้างพื้นที่ที่ผู้คนได้รับการรู้จักอย่างแท้จริง ได้รับการสนับสนุน และได้รับการท้าทายให้เติบโต"}
  }
};
