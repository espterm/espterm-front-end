#!/bin/bash

export FRONT_END_HASH=$(git rev-parse --short HEAD)

if [ -z "$ESP_LANG" ]; then
	export ESP_LANG=en
fi
