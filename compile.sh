find . -not -wholename ./node_modules\* -name \*coffee -printf "-j -i %h/%f -o %h/%f.js\n" | sed s/.coffee.js/.js/ | xargs -t -l1 CSR
find . -not -wholename ./node_modules\* -name \*coffee -printf "--source-map -i %h/%f -o %h/%f.js.map\n" | sed s/.coffee.js/.js/ | xargs -t -l1 CSR
