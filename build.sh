find . -not -wholename ./node_modules\* -name \*coffee -printf " %h %h/%f\n" |  xargs -l1 ./compile.sh
find . -not -wholename ./node_modules\* -name \*styl -printf " %h %h/%f\n" |  xargs -l1 ./stylin.sh
