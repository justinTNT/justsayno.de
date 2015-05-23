#!/bin/bash
outfile=$(echo $1 | sed -e "s/coffee$/js/g" | sed -e "s/styl$/css/")
rm $outfile
