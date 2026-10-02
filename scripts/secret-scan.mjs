import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const files = execSync('git ls-files', { encoding: 'utf8' })
  .split(/\r?\n/)
  .filter(Boolean);

const rules = [
  { name: 'aws-access-key', pattern: /AKIA[0-9A-Z]{16}/ },
  { name: 'private-key', pattern: /-----BEGIN (?:RSA |OPENSSH |EC )?PRIVATE KEY-----/ },
  { name: 'mongodb-credential', pattern: /mongodb(?:\+srv)?:\/\/[^<\s:@]+:[^<\s@]+@/ },
  { name: 'github-token', pattern: /gh[pousr]_[A-Za-z0-9]{20,}/ },
  { name: 'render-hook', pattern: /https:\/\/api\.render\.com\/deploy\/srv-/ },
];

const findings = [];
for (const file of files) {
  if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.zip')) {
    continue;
  }
  let text = '';
  try {
    text = readFileSync(file, 'utf8');
  } catch {
    continue;
  }
  for (const rule of rules) {
    if (rule.pattern.test(text)) {
      findings.push(`${rule.name} in ${file}`);
    }
  }
}

if (findings.length > 0) {
  console.error(findings.join('\n'));
  process.exit(1);
}
console.log(`Secret scan checked ${files.length} tracked files`);
