
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
let env = {};
try {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^"|"$/g, '');
      env[key] = value;
    }
  });
} catch (e) {
  console.log("Could not read .env.local, checking process.env");
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
const NAVER_CLIENT_ID = "lxwho2zsgs"; 
const NAVER_CLIENT_SECRET = "YdiyudFtd5YYpJ9FuMdyU9xlMdgx0pIb1bAsSyDg";

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials.");
  console.log("Env keys found:", Object.keys(env));
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function getCoordinates(address) {
  try {
    const url = `https://maps.apigw.ntruss.com/map-geocode/v2/geocode?query=${encodeURIComponent(address)}`;
    const response = await fetch(url, {
      headers: {
        'X-NCP-APIGW-API-KEY-ID': NAVER_CLIENT_ID,
        'X-NCP-APIGW-API-KEY': NAVER_CLIENT_SECRET,
        'Accept': 'application/json'
      }
    });
    const data = await response.json();
    if (data.addresses && data.addresses.length > 0) {
      const { x, y, roadAddress } = data.addresses[0];
      return { lng: parseFloat(x), lat: parseFloat(y), roadAddress };
    } else {
      console.log(`[DEBUG] No results for '${address}'. Response:`, JSON.stringify(data));
    }
    return null;
  } catch (e) {
    console.error(`Error fetching coords for ${address}:`, e);
    return null;
  }
}

const RINK_ADDRESSES = {
  "제니스스포츠클럽아이스링크": "서울특별시 구로구 안양천로 539-10",
  "목동종합운동장실내아이스링크": "서울특별시 양천구 안양천로 939",
  "고려대학교서울캠퍼스아이스링크": "서울특별시 성북구 안암로 145",
  "광운대학교 아이스링크장": "서울특별시 노원구 광운로 21",
  "동천재활체육센터동천빙상경기장": "서울특별시 노원구 노원로18길 41",
  "태릉선수촌실내빙상장": "서울특별시 노원구 화랑로 727",
  "의정부 실내빙상장": "경기도 의정부시 체육로 90",
  "고양어울림누리 얼음마루": "경기도 고양시 덕양구 어울림로 33",
  "아이스하우스": "경기도 수원시 권선구 수인로 296",
  "탄천종합운동장 빙상장": "경기도 성남시 분당구 탄천로 215",
  "분당올림픽 스포츠센터 아이스링크": "경기도 성남시 분당구 중앙공원로 35",
  "과천시민회관빙상장": "경기도 과천시 통영대전고속도로 1", 
  "안양종합운동장 실내빙상장": "경기도 안양시 동안구 평촌대로 389",
  "선학국제빙상경기장": "인천광역시 연수구 경원대로 526",
  "춘천송암스포츠타운빙상경기장": "강원도 춘천시 스포츠타운길 113",
  "강릉실내빙상장": "강원도 강릉시 포남동 200", 
  "강릉올림픽파크강릉하키센터": "강원도 강릉시 수리골길 102",
  "동래아이스링크": "부산광역시 동래구 쇠미로 219",
  "아르떼수성랜드 아이스링크": "대구광역시 수성구 무학로 42",
  "대구공공시설관리공단 대구실내빙상장": "대구광역시 북구 고성로 191",
  "남선공원 종합체육관": "대전광역시 서구 남선로 66",
  "울산과학대학교동부캠퍼스아이스링크": "울산광역시 동구 봉수로 101",
  "청주실내빙상장": "충청북도 청주시 청원구 사천로 33",
  "이순신 빙상장": "충청남도 아산시 남부로 370-24",
  "전주화산체육관빙상경기장": "전라북도 전주시 완산구 백제대로 310",
  "부영국제빙상장": "전라남도 나주시 빛가람로 793",
  "포항아이스링크": "경상북도 포항시 북구 장량로 18",
  "금오랜드 아이스링크": "경상북도 구미시 금오산로 341",
  "의창 스포츠센터빙상장": "경상남도 창원시 의창구 원이대로 56",
  "브랭섬홀 아시아 아이스링크": "제주특별자치도 서귀포시 대정읍 글로벌에듀로 234"
};


const HARDCODED_COORDS = {
  "제니스스포츠클럽아이스링크": { lat: 37.4998, lng: 126.8681, address: "서울특별시 구로구 안양천로 539-10" },
  "목동종합운동장실내아이스링크": { lat: 37.530734, lng: 126.879257, address: "서울특별시 양천구 안양천로 939" },
  "고려대학교서울캠퍼스아이스링크": { lat: 37.589964, lng: 127.031827, address: "서울특별시 성북구 안암로 145" },
  "광운대학교 아이스링크장": { lat: 37.62031, lng: 127.05716, address: "서울특별시 노원구 광운로 21" },
  "안양종합운동장 실내빙상장": { lat: 37.4050, lng: 126.9480, address: "경기도 안양시 동안구 평촌대로 389" },
  "과천시민회관빙상장": { lat: 37.42825, lng: 126.98909, address: "경기도 과천시 통영대전고속도로 1" }
};

const RINK_TYPES = {
  "제니스스포츠클럽아이스링크": "FULL",
  "목동종합운동장실내아이스링크": "FULL",
  "고려대학교서울캠퍼스아이스링크": "FULL",
  "광운대학교 아이스링크장": "FULL",
  "안양종합운동장 실내빙상장": "FULL"
};

async function generateSQL() {
  const { data: rinks, error } = await supabase.from('rinks').select('*');
  if (error) {
    console.error("Error fetching rinks:", error);
    return;
  }

  let sqlStatements = "-- Rink Data Updates\n";
  console.log(`Processing ${rinks.length} rinks...`);

  for (const rink of rinks) {
    let searchName = RINK_ADDRESSES[rink.name_ko] || rink.name_ko;
    let coords = await getCoordinates(searchName);
    
    // Fallback to hardcoded
    if (!coords && HARDCODED_COORDS[rink.name_ko]) {
      console.log(`[FALLBACK] Using hardcoded coords for ${rink.name_ko}`);
      coords = HARDCODED_COORDS[rink.name_ko];
    }
    
    const rinkType = RINK_TYPES[rink.name_ko] || 'FULL'; // Default to FULL for now

    if (coords) {
      console.log(`Found: ${rink.name_ko}`);
      sqlStatements += `UPDATE rinks SET lat=${coords.lat}, lng=${coords.lng}, address='${coords.address || coords.roadAddress}', rink_type='${rinkType}' WHERE id='${rink.id}';\n`;
    } else {
      console.log(`Skipped: ${rink.name_ko}`);
      sqlStatements += `-- Could not find address for ${rink.name_ko} (Search: ${searchName})\n`;
    }
    // Rate limit slighty
    await new Promise(r => setTimeout(r, 100));
  }

  fs.writeFileSync('rink_updates.sql', sqlStatements);
  console.log("Done. SQL written to rink_updates.sql");
}

generateSQL();
