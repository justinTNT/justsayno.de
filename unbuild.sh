find . -not -wholename ./node_modules\* -name \*coffee -printf " %h/%f\n" |  xargs -l1 ./remove.sh
find . -not -wholename ./node_modules\* -name \*styl -printf " %h/%f\n" |  xargs -l1 ./remove.sh
find . -not -wholename ./node_modules\* -name \*map -printf " %h/%f\n" |  xargs -l1 rm
