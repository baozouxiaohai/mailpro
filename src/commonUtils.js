export function generateRandomId(length = 8) {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789._-';
  let result = '';
  const len = Math.max(4, Math.min(32, Number(length) || 8));
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateRealNameLocalPart() {
  const firstNames = [
    'aaron', 'adam', 'adrian', 'aiden', 'alan', 'albert', 'alex', 'alexander', 'alice', 'alyssa',
    'amanda', 'amber', 'amy', 'andrew', 'angela', 'anna', 'anthony', 'ashley', 'austin', 'ava',
    'barbara', 'ben', 'benjamin', 'brandon', 'brenda', 'brian', 'brittany', 'brooke', 'caleb', 'cameron',
    'carla', 'carlos', 'caroline', 'catherine', 'charles', 'charlie', 'chloe', 'christian', 'christina', 'christopher',
    'claire', 'daniel', 'david', 'derek', 'diana', 'donald', 'dylan', 'edward', 'elena', 'elizabeth',
    'ella', 'emily', 'emma', 'eric', 'ethan', 'eva', 'felix', 'frank', 'gabriel', 'george',
    'grace', 'hannah', 'harry', 'helen', 'henry', 'ian', 'isaac', 'isabella', 'jack', 'jacob',
    'james', 'jane', 'jason', 'jeffrey', 'jennifer', 'jessica', 'john', 'jonathan', 'jordan', 'joseph',
    'joshua', 'julia', 'justin', 'karen', 'kate', 'katherine', 'kevin', 'kimberly', 'laura', 'lauren',
    'leo', 'lily', 'linda', 'logan', 'lucas', 'lucy', 'luke', 'madison', 'maria', 'mark',
    'martha', 'mary', 'matthew', 'megan', 'melissa', 'michael', 'michelle', 'mike', 'nathan', 'nicole',
    'nina', 'noah', 'oliver', 'olivia', 'owen', 'patrick', 'paul', 'peter', 'rachel', 'rebecca',
    'richard', 'robert', 'ryan', 'samantha', 'samuel', 'sarah', 'scott', 'sean', 'sophia', 'stephanie',
    'steven', 'susan', 'thomas', 'timothy', 'tom', 'victoria', 'victor', 'wendy', 'william', 'zoe'
  ];
  const lastNames = [
    'adams', 'allen', 'anderson', 'bailey', 'baker', 'barnes', 'bell', 'bennett', 'brooks', 'brown',
    'bryant', 'butler', 'campbell', 'carter', 'chen', 'clark', 'collins', 'cook', 'cooper', 'cox',
    'davis', 'diaz', 'edwards', 'evans', 'fisher', 'flores', 'foster', 'garcia', 'gibson', 'gomez',
    'gonzalez', 'gray', 'green', 'griffin', 'hall', 'harris', 'hayes', 'hill', 'howard', 'hughes',
    'jackson', 'james', 'jenkins', 'johnson', 'jones', 'kelly', 'king', 'lee', 'lewis', 'lin',
    'lopez', 'martin', 'martinez', 'miller', 'mitchell', 'moore', 'morgan', 'morris', 'murphy', 'nelson',
    'nguyen', 'ortiz', 'parker', 'patel', 'perez', 'perry', 'peterson', 'phillips', 'powell', 'price',
    'reed', 'reyes', 'richardson', 'rivera', 'roberts', 'robinson', 'rogers', 'ross', 'russell', 'sanchez',
    'sanders', 'scott', 'smith', 'stewart', 'sullivan', 'taylor', 'thomas', 'thompson', 'torres', 'turner',
    'walker', 'wang', 'ward', 'watson', 'white', 'williams', 'wilson', 'wood', 'wright', 'wu',
    'young', 'zhang', 'zhao', 'zhou'
  ];
  const pick = (items) => items[Math.floor(Math.random() * items.length)];
  const first = pick(firstNames);
  const last = pick(lastNames);
  const twoDigits = () => String(Math.floor(Math.random() * 90) + 10);
  const threeDigits = () => String(Math.floor(Math.random() * 900) + 100);
  const yearLike = () => String(Math.random() < 0.65 ? Math.floor(Math.random() * 30) + 70 : Math.floor(Math.random() * 10)).padStart(2, '0');
  const variants = [
    `${first}.${last}`,
    `${first}${last}`,
    `${first}_${last}`,
    `${first}-${last}`,
    `${first}.${last}${twoDigits()}`,
    `${first}${last}${twoDigits()}`,
    `${first}_${last}${twoDigits()}`,
    `${first}${last}${yearLike()}`,
    `${first[0]}${last}${twoDigits()}`,
    `${first[0]}.${last}`,
    `${first}${last[0]}${twoDigits()}`,
    `${first}.${last[0]}${twoDigits()}`,
    `${first}${threeDigits()}`,
    `${last}.${first}`,
    `${last}${first[0]}${twoDigits()}`
  ];
  const candidates = variants
    .map(value => value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))
    .filter(value => value.length >= 8 && value.length <= 24 && /^[a-z0-9]/.test(value) && /[a-z0-9]$/.test(value));

  if (candidates.length) return pick(candidates);

  const compact = `${first}${last}`.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (compact.length >= 8) return compact.slice(0, 24);
  return `${compact}${twoDigits()}`.slice(0, 24);
}

export function extractEmail(emailString) {
  const match = emailString.match(/<(.+?)>/) || emailString.match(/([^\s<>]+@[^\s<>]+)/);
  return match ? match[1] : emailString;
}
// 将 D1 返回的 UTC 时间（YYYY-MM-DD HH:MM:SS）格式化为东八区显示
export function formatTs(ts){
  if (!ts) return '';
  try {
    // 统一转成 ISO 再追加 Z 标记为 UTC
    const iso = ts.includes('T') ? ts.replace(' ', 'T') : ts.replace(' ', 'T');
    const d = new Date(iso + 'Z');
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      hour12: false,
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(d);
  } catch (_) { return ts; }
}

