// Внешняя резервная копия: база и CSV заказов уходят в приватный репозиторий GitHub и возвращаются оттуда,
// если сервис поднялся с пустой диском (бесплатный Render стирает файлы при каждом перезапуске).
// Включается переменными BACKUP_GITHUB_REPO (владелец/репозиторий) и BACKUP_GITHUB_TOKEN (токен с правом записи содержимого).
const fs = require('fs');
const path = require('path');

const repo = process.env.BACKUP_GITHUB_REPO || '';
const token = process.env.BACKUP_GITHUB_TOKEN || '';
const branch = process.env.BACKUP_GITHUB_BRANCH || 'main';
const enabled = /^[\w.-]+\/[\w.-]+$/.test(repo) && !!token;

const gh = (method, url, body, accept = 'application/vnd.github+json') => fetch((process.env.BACKUP_GITHUB_API || 'https://api.github.com') + '/repos/' + repo + url, {
  method,
  headers: { Authorization: 'Bearer ' + token, Accept: accept, 'User-Agent': 'drinkstar-backup', 'X-GitHub-Api-Version': '2022-11-28', ...(body ? { 'Content-Type': 'application/json' } : {}) },
  body: body ? JSON.stringify(body) : undefined,
  signal: AbortSignal.timeout(25000)
});

async function put(name, buf, message) {
  const g = await gh('GET', `/contents/${name}?ref=${encodeURIComponent(branch)}`);
  let sha;
  if (g.ok) sha = (await g.json()).sha; else if (g.status !== 404) throw new Error('GitHub GET ' + g.status);
  const r = await gh('PUT', `/contents/${name}`, { message, content: Buffer.from(buf).toString('base64'), branch, ...(sha ? { sha } : {}) });
  if (!r.ok) throw new Error('GitHub PUT ' + r.status + ' ' + (await r.text()).slice(0, 160));
}

async function fetchRaw(name) {
  const r = await gh('GET', `/contents/${name}?ref=${encodeURIComponent(branch)}`, null, 'application/vnd.github.raw+json');
  if (r.status === 404) return null;
  if (!r.ok) throw new Error('GitHub GET ' + r.status);
  return Buffer.from(await r.arrayBuffer());
}

// при старте: если файла базы нет (чистый диск), берём последнюю внешнюю копию
async function restoreIfEmpty(dir) {
  if (!enabled) return false;
  const file = path.join(dir, 'drinkstar.db');
  if (fs.existsSync(file)) return false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const buf = await fetchRaw('backups/drinkstar-latest.db');
      if (!buf) { console.log('Внешней копии ещё нет: начинаем с чистой базы.'); return false; }
      if (buf.subarray(0, 15).toString() !== 'SQLite format 3') throw new Error('файл копии повреждён');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(file, buf);
      for (const ext of ['-wal', '-shm']) fs.rmSync(file + ext, { force: true });
      console.log(`Данные восстановлены из внешней копии (${Math.round(buf.length / 1024)} КБ).`);
      return true;
    } catch (e) {
      console.error(`Восстановление из внешней копии, попытка ${attempt}: ${e.message}`);
      await new Promise(r => setTimeout(r, 1500 * attempt));
    }
  }
  console.error('ВНИМАНИЕ: внешняя копия не прочитана, старт с чистой базы. Старые версии лежат в истории репозитория.');
  return false;
}

module.exports = { enabled, put, restoreIfEmpty, repo };
