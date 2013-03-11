#!/bin/bash
function exitonfail {
    "$@"
    status=$?
    if [ $status -ne 0 ]; then
        exit $status
	fi
	return $status
}

outpath=$1
infile=$2
outfile=$(echo $infile | sed -e "s/coffee/js/g")
filename=$(basename "$outfile")
coffeelint -f ~/cslint.cfg $infile
exitonfail coffee -cm -o $outpath $infile
