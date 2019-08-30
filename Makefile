SHELL := bash -o pipefail
out := _out
web := _out/client
all:

vendor.src := /node_modules/bytesize-icons/dist/bytesize-inline.svg \
	$(shell adieu -pe '$$("link,script").map((_,e) => $$(e).attr("href") || $$(e).attr("src")).get().filter(v => /^\/node_modules\//.test(v)).join`\n`' client/index.html)
vendor.dest := $(patsubst /%, $(web)/%, $(vendor.src))

$(web)/node_modules/%: node_modules/%; $(copy)

src := client

files := $(shell find $(src) -type f)
jsx.src := $(filter %.jsx, $(files))
jsx.dest := $(patsubst $(src)/%.jsx, $(web)/%.js, $(jsx.src))

$(web)/%.js: $(src)/%.jsx
	$(mkdir)
	node_modules/.bin/babel -s true $< -o $@

static.src := $(filter-out $(jsx.src), $(files))
static.dest := $(patsubst $(src)/%, $(web)/%, $(static.src))

$(web)/%: $(src)/%; $(copy)

$(web)/lib/search.js: lib/search.js
	$(mkdir)
	browserify -s search -d $< | exorcist $@.map > $@

$(out)/%.json: %.json.example; $(copy)

compile := $(vendor.dest) $(jsx.dest) $(static.dest) $(web)/lib/search.js
all: $(compile) $(web)/clipart $(out)/server.conf.json

$(web)/clipart:
	mkdir -p $(web)/../img
	cd $(web) && ln -s ../img $(notdir $@)



devel: all
	-systemctl --user stop lostclipart
	systemd-run --user --collect --unit=lostclipart -d node server.js

node.dir := /opt/s/node-v12.9.1-linux-x64
chroot.dir := $(abspath ../chroot)
prod: all
	$(call chroot,/bin/sh -c 'node server.js')

test-chroot:
	$(call chroot,/bin/sh,--wait --tty)

define chroot =
-sudo systemctl stop lostclipart
rm -rf $(chroot.dir)
mkdir -p $(chroot.dir)/{bin,lib64}
echo /bin/busybox --install -s /bin > $(chroot.dir)/busybox-install.sh
cp `which busybox` $(chroot.dir)/bin/sh
$(if $2,cp `which busybox` $(chroot.dir)/bin)
for lib in `ldd $(node.dir)/bin/node | awk '/=> \/lib/ {print $$3}'`; do mkdir -p $(chroot.dir)/`dirname $$lib`; cp $$lib $(chroot.dir)/`dirname $$lib`; done
cp /lib64/ld-linux-* $(chroot.dir)/lib64
sudo systemd-run $2 --collect --unit=lostclipart \
 -p RootDirectory=$(chroot.dir) -p BindReadOnlyPaths=$(node.dir):/usr \
 -p MountAPIVFS=true -p PrivateDevices=true \
 -p User=$(USER) -p SyslogIdentifier=node \
 -p Environment=PATH=/bin:/usr/bin -p Environment=NODE_ENV=production \
 -p BindReadOnlyPaths=`pwd`:/app -p BindPaths=`pwd`/_out:/app/_out \
 -p WorkingDirectory=/app $1
endef

o := cat
is_devel = $(shell systemctl is-active --quiet lostclipart || echo inactive)
log:
	journalctl -b -f -u lostclipart -o $(o) $(if $(is_devel),--user)

cloc:
	cloc --script-lang=JavaScript,node --exclude-ext=md client lib *.sql *.js Makefile



mkdir = @mkdir -p $(dir $@)
define copy =
$(mkdir)
cp $< $@
@[ ! -r $<.map ] || cp $<.map $@.map
endef
