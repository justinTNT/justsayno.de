#!/bin/bash
outpath=$1
infile=$2
outfile=$(echo $infile | sed -e "s/styl/css/g")
if test $outfile -nt $infile; then
	exit 0
fi
stylus $infile
