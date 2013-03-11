find . -not -wholename ./node_modules\* -name \*coffee -printf " %h %h/%f\n" |  xargs -t -l1 ./compile.sh
