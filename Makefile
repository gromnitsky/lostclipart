out := _out/client
all:

vendor.src := react/umd/react.production.min.js \
	react-dom/umd/react-dom.production.min.js \
	js-cookie/src/js.cookie.js \
	@reach/router/umd/reach-router.min.js \
	awesomplete/awesomplete.min.js \
	awesomplete/awesomplete.css
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

compile := $(vendor.dest) $(jsx.dest) $(static.dest)
all: $(compile) $(out)/clipart

$(out)/clipart:
	mkdir -p $(out)/../img
	cd $(out) && ln -s ../img $(notdir $@)

include server.mk
devel: all server

cloc:
	cloc *.sql *.js client/* Makefile



mkdir = @mkdir -p $(dir $@)
define copy =
$(mkdir)
cp $< $@
endef
