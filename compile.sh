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

if test $outfile -nt $infile; then
	exit 0
fi

filename=$(basename "$outfile")
if [ $(echo $outfile | grep browser | wc -l) -ne 0 ]; then
	flags="-c"
else
	flags="-cm"
fi
coffeelint -f ~/coffeelint.json $infile
exitonfail coffee $flags -o $outpath $infile
