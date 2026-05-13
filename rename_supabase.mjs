import fs from 'fs';
import path from 'path';

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(filePath));
        } else {
            results.push(filePath);
        }
    });
    return results;
}

const files = walkDir('src');

files.forEach(file => {
    if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        let content = fs.readFileSync(file, 'utf8');
        let modified = false;

        if (content.includes('supabase')) {
            content = content.replace(/import { supabase } from '(\.\.\/)*lib\/supabase';/g, "import { mockDb as dbClient } from '$1lib/mockDb';");
            content = content.replace(/supabase\./g, 'dbClient.');
            content = content.replace(/isSupabaseConfigured/g, 'isDbConfigured');
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(file, content);
            console.log(`Updated ${file}`);
        }
    }
});

// Rename supabase.ts to mockDb.ts, wait we already created mockDb.ts
if (fs.existsSync('src/lib/supabase.ts')) {
    fs.unlinkSync('src/lib/supabase.ts');
    console.log('Deleted src/lib/supabase.ts');
}
