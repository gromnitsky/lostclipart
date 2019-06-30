out := _out/client
all:

vendor.src := react/umd/react.production.min.js \
	react-dom/umd/react-dom.production.min.js \
	js-cookie/src/js.cookie.js
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
all: $(compile)



mkdir = @mkdir -p $(dir $@)
define copy =
$(mkdir)
cp $< $@
endef
