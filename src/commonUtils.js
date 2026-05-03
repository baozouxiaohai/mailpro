export function generateRandomId(length = 8) {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789._-';
  let result = '';
  const len = Math.max(4, Math.min(32, Number(length) || 8));
  for (let i = 0; i < len; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function generateRealNameLocalPart(maxLength = 16) {
  const firstNames = [
    'alex', 'andrew', 'anna', 'ava', 'ben', 'brian', 'chloe', 'david', 'emma', 'eric',
    'grace', 'henry', 'jack', 'james', 'jason', 'john', 'kevin', 'laura', 'leo', 'lily',
    'lucas', 'lucy', 'maria', 'mark', 'michael', 'mia', 'nina', 'olivia', 'peter', 'sarah',
    'sophia', 'tom', 'victor', 'wendy', 'william', 'zoe'
  ];
  const lastNames = [
    'adams', 'allen', 'baker', 'brown', 'campbell', 'carter', 'chen', 'clark', 'davis', 'evans',
    'green', 'hall', 'harris', 'hill', 'jackson', 'johnson', 'king', 'lee', 'lewis', 'lin',
    'martin', 'miller', 'moore', 'nelson', 'parker', 'roberts', 'scott', 'smith', 'taylor', 'thomas',
    'walker', 'wang', 'white', 'wilson', 'wong', 'wu', 'young', 'zhang', 'zhao', 'zhou'
  ];
  const max = Math.max(6, Math.min(64, Number(maxLength) || 16));
  const first = firstNames[Math.floor(Math.random() * firstNames.length)];
  const last = lastNames[Math.floor(Math.random() * lastNames.length)];
  const numberSuffix = () => String(Math.floor(Math.random() * 90) + 10);
  const yearSuffix = () => String(new Date().getFullYear()).slice(2);
  const variants = [
    `${first}.${last}`,
    `${first}${last}`,
    `${first}.${last}${numberSuffix()}`,
    `${first}${last}${numberSuffix()}`,
    `${first}${last}${yearSuffix()}`,
    `${first[0]}${last}${numberSuffix()}`,
    `${first}${last[0]}${numberSuffix()}`
  ];
  const candidates = variants.filter(value => value.length <= max);
  if (candidates.length) return candidates[Math.floor(Math.random() * candidates.length)];

  const compact = `${first}${last}`.replace(/[^a-z0-9]/g, '');
  if (compact.length >= 6) return compact.slice(0, max);
  return `${compact}${numberSuffix()}`.slice(0, max);
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

