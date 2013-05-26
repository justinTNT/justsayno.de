#!/bin/bash
if test apps/$1/browser/$1.styl -nt apps/$1/browser/$1.css; then
	stylus apps/$1/browser/$1.styl
fi
