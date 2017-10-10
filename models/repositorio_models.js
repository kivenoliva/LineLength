"use strict";

var mongoose = require('mongoose');

//El esquema tendrá información sobre los repositorios analizados
var repositorioSchema = mongoose.Schema({
    nombreRepo: Array,
    lineasVerdes: String,
    lineasRojas: String,
    lineasNaranjas: String,
    lineasRojasComentarios : String
});

var Linea = mongoose.model("Repositorios", repositorioSchema);