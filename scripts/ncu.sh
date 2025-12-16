#!/bin/bash

for dir in */; do echo "=== $dir ===" && (cd "$dir" && ncu -u); done