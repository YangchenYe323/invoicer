import fs from 'fs';
import path from 'path';

// Remove drizzle generated schema file
fs.unlinkSync(
  path.join('drizzle', 'schema.ts')
);

console.log('✓ Drizzle generated schema file removed');

// Move drizzle generated relations file to src/db/relations.ts
fs.renameSync(
  path.join('drizzle', 'relations.ts'),
  path.join('src', 'db', 'relations.ts')
);

console.log('✓ Drizzle generated relations file moved to src/db/relations.ts');