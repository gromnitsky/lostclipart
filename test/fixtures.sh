#!/bin/sh

server='http://127.0.0.1:3000'

set -ex
curl -fS $server/api/user/new -d name=bob -d password=1234567890
eval `curl -fS $server/api/user/login -d name=bob -d password=1234567890 | \
    ruby -rjson -ne 'JSON.parse($_).each {|k,v| puts "#{k}=#{v}" }'`

token="uid=$uid; token=$token; exp_date=$exp_date"
__dirname="$(dirname "$(readlink -f "$0")")"

upload() {
    curl -fS $server/api/image/upload -b "$token" \
	 -F svg=@"$__dirname/$1.svg" \
	 -F thumbnail=@"$__dirname/$1.png" \
	 -F lid=2 -F tags="$2" -F title="$3"
}

upload 2ATCHART 'man, woman' one
upload 18WHLTRK 'cat, track' two
upload AIRPASS 'man, plane' three
