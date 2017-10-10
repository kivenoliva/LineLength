//Requires necesarios
var express = require('express');
var router = express.Router();
var carpetaLocalRepos = "DB_repos";
var mongoose = require('mongoose'); 
var linea_BD = mongoose.model("Linea");
var repositoriosBD = mongoose.model("Repositorios");
var fs = require('fs');
var readline = require('readline');
var walk = require("walk");
var path = require("path");
var async = require("async");

//Variables globales 
var trazaPasadaAsync = 0;
var resumenRepositorios = "";
var numeroDeLineasConflictivasTotales = "";
var resumenLineasConflicitvas = "";
var nombreRepo = "";
var inicioComentario = "'''";
var inicioComentarioDobles = '"""';


/**En esta llamada a la api nos recorremos nuestra fuente de datos donde tenemos todos los repositorios que vamos a estudiar,
leemos todos los archivos python y vamos clasificando las líneas en los 3 casos posibles. Las líneas naranjas las guardo en la base
de datos**/

//Función que se recorre un directorio indicado y lee todos sus ficheros python clasificando las líneas en los 3 casos posibles.
var recorrerDirectorio = function(res)  {
    var arrayNombresRepos = [];
    var numLineasVerdes = 0;
    var numLineasRojas = 0;
    var numLineasNaranjas = 0;
    var contador = 0;
    var estoyEnComentario = false;
    var estoyEnComentarioDobles=false;
    var lineasRojasComentarios = 0;
    var walker  = walk.walk(carpetaLocalRepos, { followLinks: false });
    var lineasVerdesCadaRepo = 0;
    var lineasNaranjasCadaRepo = 0;
    var lineasRojasCadaRepo = 0;
    var lineasRojasComentariosCadaRepo = 0;

    walker.on('file', function(root, stat, next) {

        var nombreRepoEntrante = root.split("\\")[1];
        if(nombreRepo == nombreRepoEntrante || nombreRepo == ""){
            nombreRepo = nombreRepoEntrante;
        }else if(nombreRepo != nombreRepoEntrante){
            console.log("CAMBIAMOS EL NOMBRE DEL REPO: GUARDAMOS EN EL QUE ESTAMOS: " + nombreRepo + " Y ACTUALIZAMOS EL NUEVO: " + nombreRepoEntrante);
            var objetoRepo = {};
            objetoRepo.nombreRepo = nombreRepo;
            objetoRepo.lineasVerdesRepo = lineasVerdesCadaRepo;
            objetoRepo.lineasNaranjasRepo = lineasNaranjasCadaRepo;
            objetoRepo.lineasRojasRepo = lineasRojasCadaRepo;  
            objetoRepo.lineasRojasComentariosRepo = lineasRojasComentariosCadaRepo;           
            
            arrayNombresRepos.push(objetoRepo);
            nombreRepo = nombreRepoEntrante;
            lineasVerdesCadaRepo = 0;
            lineasNaranjasCadaRepo = 0;
            lineasRojasCadaRepo = 0;
            lineasRojasComentariosCadaRepo = 0;
        }
        
        // Add this file to the list of files
        if(path.extname(stat.name) == ".py"){
            console.log("Encuentro un fichero '.py'. Lo abro y leemos línea a línea");
            //Leemos el fichero línea por línea
            var rl = readline.createInterface({
              input: fs.createReadStream(root + '/' + stat.name)
            });
            //Pasada por cada línea
            rl.on("line", function(line){
                contador ++;

                //Miro si es el inicio de un comentario de mas de una linea
                if(line.indexOf(inicioComentario) === 0){
                    if(estoyEnComentario){
                        estoyEnComentario = false;
                    }else{
                        estoyEnComentario = true;
                    }
                }

                if(line.indexOf(inicioComentarioDobles) === 0){
                    if(estoyEnComentarioDobles){
                        estoyEnComentarioDobles = false;
                    }else{
                        estoyEnComentarioDobles = true;
                    }
                }

                if(line.length < 70){
                    numLineasVerdes ++;
                    lineasVerdesCadaRepo ++;
                }else if(line.length >= 70 && line.length < 80){

                    if(!estoyEnComentario && !estoyEnComentarioDobles && line.indexOf("#") != 0){
                        var objLinea = {
                            linea: line,
                            fichero: root + '/' + stat.name,
                            numLinea: contador,
                            longitudLinea: line.length,
                            pasadoRojo: false,
                            historia: []
                        }

                        var nueva_linea = new linea_BD(objLinea);
                        nueva_linea.save(function(err, newRow){
                            if(err){
                                reject(new Error("Se ha producido un error al guardar en la colección linea_BS: " + err));
                                return;
                            }
                            numLineasNaranjas ++;
                            lineasNaranjasCadaRepo ++;
                            return;
                        });
                    }

                }else if(line.length >= 80){
                    if(estoyEnComentario || estoyEnComentarioDobles || line.indexOf("#") == 0){
                        lineasRojasComentarios ++;
                        lineasRojasComentariosCadaRepo ++;
                    }
                    numLineasRojas ++;
                    lineasRojasCadaRepo ++;
                }
            });

            //Termina el fichero
            rl.on("close", function(){
                contador = 0;
                estoyEnComentario = false;
                estoyEnComentarioDobles = false;
                next();
            });

        }else{
            next();
        }
                
    });

    walker.on('end', function() {

        //Guardamos en el array el ultimo repositorio
        var objetoRepo = {};
        objetoRepo.nombreRepo = nombreRepo;
        objetoRepo.lineasVerdesRepo = lineasVerdesCadaRepo;
        objetoRepo.lineasNaranjasRepo = lineasNaranjasCadaRepo;
        objetoRepo.lineasRojasRepo = lineasRojasCadaRepo;  
        objetoRepo.lineasRojasComentariosRepo = lineasRojasComentariosCadaRepo;           
        
        arrayNombresRepos.push(objetoRepo);

        //Termina de recorrer un repositorio.
        var objetoRespuesta = {};
        objetoRespuesta.lineasVerdes = numLineasVerdes;
        objetoRespuesta.lineasNaranjas = numLineasNaranjas;
        objetoRespuesta.lineasRojas = numLineasRojas;
        objetoRespuesta.nombreRepo = arrayNombresRepos;
        objetoRespuesta.lineasRojasComentarios = lineasRojasComentarios;

        var resumen = new repositoriosBD(objetoRespuesta);
        resumen.save(function(err, newRow){
            if(err){
                res.status(500).send({err:err});
                return;
            }
            console.log("Terminamos la función 'recorrerDirectorio'. La respuesta obtenida despúes de analizar este directorio es: ");
            console.log(objetoRespuesta);
            res.send(objetoRespuesta);
            return;
        });
    });
  
}


router.get('/', function(req, res, next) {
    console.log("Me llaman a datosIniciales: ");
    recorrerDirectorio(res);
});

module.exports = router;