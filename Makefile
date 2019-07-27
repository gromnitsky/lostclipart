out := _out/client
all:

vendor.src := react/umd/react.production.min.js \
	react-dom/umd/react-dom.production.min.js \
	js-cookie/src/js.cookie.js \
	@reach/router/umd/reach-router.min.js \
	awesomplete/awesomplete.min.js \
	awesomplete/awesomplete.min.js.map \
	awesomplete/awesomplete.css \
	awesomplete/awesomplete.css.map \
	bytesize-icons/dist/bytesize-inline.svg
vendor.dest := $(addprefix $(out)/vendor/, $(vendor.src))

$(out)/vendor/%: node_modules/%; $(copy)

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
	browserify -s search -d $< | exorcist $@.map > $@

compile := $(vendor.dest) $(jsx.dest) $(static.dest) $(out)/lib/search.js
all: $(compile) $(out)/clipart

$(out)/clipart:
	mkdir -p $(out)/../img
	cd $(out) && ln -s ../img $(notdir $@)

include server.mk
devel: all server

cloc:
	cloc --script-lang=JavaScript,node *.sql *.js client/* Makefile search



mkdir = @mkdir -p $(dir $@)
define copy =
$(mkdir)
cp $< $@
endef
