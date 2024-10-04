#!/bin/bash

file=$1
command=$2
target=$3

if [ $command == "goes_to" ]; then
	jq_query=".blocks_info.loop_order_blocks[] | select(any(.next_block_numbers; contains([\"$target\"])))"
	echo $jq_query
	jq -r "$jq_query" $file
fi

if [ $command == "block" ]; then
	jq_query=".blocks_info.memory_order_blocks[] | select(.name | contains(\"$target\"))"
	echo $jq_query
	jq -r "$jq_query" $file
fi
