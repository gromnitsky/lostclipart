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

include server.mk
devel: all server

cloc:
	cloc --script-lang=JavaScript,node *.sql *.js client/* Makefile lib/*



mkdir = @mkdir -p $(dir $@)
define copy =
$(mkdir)
cp $< $@
@[ ! -r $<.map ] || cp $<.map $@.map
endef
