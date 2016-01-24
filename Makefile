SHELL := /bin/bash

HASH=$(shell git rev-parse master | cut -c 1-8)

all: copy
	@git commit -a -t <(echo "Release based on $(HASH)")

copy:
	rm -rf lib tasks package.json
	cp -r build/lib .
	cp -r build/tasks .
	cp -r build/package.json .
