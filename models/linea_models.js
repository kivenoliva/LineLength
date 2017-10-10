"use strict";

var mongoose = require('mongoose');

//El esquema tendrá una línea de código.
var lineaSchema = mongoose.Schema({
    linea: String,
    fichero: String,
    numLinea: String,
    longitudLinea: String,
    pasadoRojo: Boolean,
    analizada: Boolean,
    historia: []
});

var Linea = mongoose.model("Linea", lineaSchema);