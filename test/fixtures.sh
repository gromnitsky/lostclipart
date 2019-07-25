#!/bin/sh

server='http://127.0.0.1:3000'

set -ex
curl -fS $server/api/user/new -d name=bob -d password=1234567890
curl -fS $server/api/user/new -d name=alice -d password=1234567890

[ "$1" = users ] && exit 0

eval `curl -fS $server/api/user/login -d name=bob -d password=1234567890 | \
    ruby -rjson -ne 'JSON.parse($_).each {|k,v| puts "#{k}=#{v}" }'`

token="uid=$uid; token=$token; exp_date=$exp_date"
__dirname="$(dirname "$(readlink -f "$0")")"

upload() {
    curl -fS $server/api/image/upload -b "$token" \
	 -F svg=@"$__dirname/$1.svg" \
	 -F thumbnail=@"$__dirname/$1.png" \
	 -F lid=2 -F tags="$2" -F title="$3" -F desc="$4"
}

upload 2ATCHART 'man, woman, man' one "foo"
upload 18WHLTRK 'cat, track' two "bar"
upload AIRPASS 'man, plane' three "foo bar"
