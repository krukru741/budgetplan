const fs = require('fs');
let content = fs.readFileSync('supabase/migrations/002_rls_and_triggers.sql', 'utf8');

content = content.replace(/CREATE POLICY "([^"]+)"[\s]+ON public\.(\w+)/g, (match, policyName, tableName) => {
  return `DROP POLICY IF EXISTS "${policyName}" ON public.${tableName};\n${match}`;
});

fs.writeFileSync('supabase/migrations/002_rls_and_triggers.sql', content);
