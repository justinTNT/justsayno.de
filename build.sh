find . -not -wholename ./node_modules\* -name \*coffee -printf " %h %h/%f\n" |  xargs -l1 ./compile.sh
ls -1 apps | xargs -l1 ./stylin.sh
