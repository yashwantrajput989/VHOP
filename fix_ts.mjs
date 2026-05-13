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

        if (content.includes("from '../lib/mockDb'")) {
            content = content.replace(/from '\.\.\/lib\/mockDb'/g, "from '../../lib/mockDb'");
            modified = true;
        }

        if (content.includes("supabase")) {
            content = content.replace(/supabase/g, "dbClient");
            modified = true;
        }
        
        // fix authStore types import
        if (file.includes('authStore.ts') && content.includes("import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';")) {
            content = content.replace("import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';", "import { signInWithPopup, signOut, onAuthStateChanged, type User } from 'firebase/auth';");
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(file, content);
            console.log(`Updated ${file}`);
        }
    }
});
