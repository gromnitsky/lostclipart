var Ajv = require('ajv')

exports.schema = {
    upload:
    {
	files: {
	    "$schema": "http://json-schema.org/draft-07/schema#",

	    type: "object",
	    properties: {
		svg: { type: "array", minItems: 1 },
		thumbnail: { type: "array", minItems: 1 }
	    },
	    required: ["svg", "thumbnail"]
	},
	fields: {
	    "$schema": "http://json-schema.org/draft-07/schema#",

	    definitions: {
		nums: {
		    type: 'array',
		    minItems: 1,
		    items: { type: "string", pattern: '^[0-9]+$' }
		}
	    },

	    type: "object",
	    properties: {
		lid: { '$ref': '#/definitions/nums' },
		mtime: { '$ref': '#/definitions/nums' },
		desc: {
		    type: 'array',
		    minItems: 1,
		    items: { type: "string", maxLength: 512 }
		}
	    },
	    required: ["lid"]
	}
    }
}

exports.validate = function(schema, json) {
    let ajv = new Ajv()
    if (!ajv.validate(schema, json)) throw new Error(ajv.errorsText())
    return true
}
