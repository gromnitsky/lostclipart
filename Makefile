out := _out/client
all:

vendor.src := /node_modules/bytesize-icons/dist/bytesize-inline.svg \
	$(shell adieu -pe '$$("link,script").map((_,e) => $$(e).attr("href") || $$(e).attr("src")).get().filter(v => /^\/node_modules\//.test(v)).join`\n`' client/index.html)
vendor.dest := $(patsubst /%, $(out)/%, $(vendor.src))

$(out)/node_modules/%: node_modules/%; $(copy)

src := client

jsx.src := $(wildcard $(src)/*.jsx)
jsx.dest := $(patsubst $(src)/%.jsx, $(out)/%.js, $(jsx.src))

$(out)/%.js: $(src)/%.jsx
	$(mkdir)
	node_modules/.bin/babel -s true $< -o $@

static.src := $(filter-out $(jsx.src), $(wildcard $(src)/*))
static.dest := $(patsubst $(src)/%, $(out)/%, $(static.src))

$(out)/%: $(src)/%; $(copy)

$(out)/lib/search.js: lib/search.js
	$(mkdir)
	browserify -s search -d $< | exorcist $@.map > $@

compile := $(vendor.dest) $(jsx.dest) $(static.dest) $(out)/lib/search.js
all: $(compile) $(out)/clipart

$(out)/clipart:
	mkdir -p $(out)/../img
	cd $(out) && ln -s ../img $(notdir $@)



devel: all
	-systemctl --user stop lostclipart
	systemd-run --user --collect --unit=lostclipart -d node server.js

node.dir := /opt/s/node-v12.8.0-linux-x64
chroot.dir := $(realpath ../chroot)
prod:
	$(call chroot,/bin/sh -c 'node server.js')

test-chroot:
	$(call chroot,/bin/sh,--wait --tty)

define chroot =
-sudo systemctl stop lostclipart
rm -rf $(chroot.dir)
mkdir -p $(chroot.dir)/{bin,lib64}
cp `which busybox` $(chroot.dir)/bin/sh
$(if $2,cp `which busybox` $(chroot.dir)/bin)
ldd $(node.dir)/bin/node | awk '/=> \/lib64\// {print $$3}' | xargs install -t $(chroot.dir)/lib64
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
log:
	journalctl --user -b -f -u lostclipart -o $(o)

cloc:
	cloc --script-lang=JavaScript,node *.sql *.js client/* Makefile lib/*



mkdir = @mkdir -p $(dir $@)
define copy =
$(mkdir)
cp $< $@
@[ ! -r $<.map ] || cp $<.map $@.map
endef
