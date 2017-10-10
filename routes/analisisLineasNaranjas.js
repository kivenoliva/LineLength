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
var trazaPasadaAsync = 0;

//Función que realiza la distancia de levenshtein para determinar cuanto se parecen dos strings.
function levenshtein(s1, s2) {
    var l1 = s1.length;
    var l2 = s2.length;
    var d = [];
    var c = 0;
    var a = 0;

    if(l1 == 0)
    return l2;

    if(l2 == 0)
    return l1;

    var d = new Buffer((l1 + 1) * (l2 + 1));
    a = l1 + 1;

    for(var i = 0; i <= l1; d[i] = i++);
    for(var j = 0; j <= l2; d[j * a] = j++);

    for(var i = 1; i <= l1; i++) {
        for(var j = 1; j <= l2; j++) {
            if(s1[i - 1] == s2[j - 1])
                c = 0;
            else
                c = 1;
            var r = d[j * a + i - 1] + 1;
            var s = d[(j - 1) * a + i] + 1;
            var t = d[(j - 1) * a + i - 1] + c;

            d[j * a + i] = Math.min(Math.min(r, s), t);
        }
    }

    return(d[l2 * a + l1]);
}


//Función que mira el pasado de una línea naranja que en algún momento ha sido roja, para ver si el pasado es
//real o es basura que ha metido el comando gitLog, 
function limpiaBasuraHistoria(data, arrayHistoriaLinea, cb){
    var arrayHistoriaLineaReal = [];
    for(var i = 0; i<arrayHistoriaLinea.length; i++){
        //console.log("metemos en LEVENSTEIN: linea: " + data.linea + " y " + arrayHistoriaLinea[i]);
        var dist = levenshtein(data.linea, arrayHistoriaLinea[i]);
            
        //El umbral lo hemos puesto en 30, si esta por debajo de 30 es que la línea se parece tanto que decidimos
        //que la historia es correcta para nuestro caso.
        if(dist < 30){
            console.log("ENTRA ALGUNA LINEA BUENA DESPUES DE LEVENSTEIN");
            arrayHistoriaLineaReal.push(arrayHistoriaLinea[i]);
        }
    }

    //Si terminamos y este array está vacío quiere decir que la historia que venia era toda basura, si tiene algo, 
    //quiere decir que aceptamos esa línea del pasado. Actualizamos la línea en la base de datos sólo si se da 
    //ese caso.
    if(arrayHistoriaLineaReal.length !== 0){

        //console.log("Entramos a actualizar la linea " + data.linea);
        //Actualizamos línea en la base de datos.
        var objLinea = {
            linea: data.linea,
            fichero: data.fichero,
            numLinea: data.numLinea,
            longitudLinea: data.longitudLinea,
            pasadoRojo: true, 
            historia: arrayHistoriaLineaReal
        }
        var options = {};
        linea_BD.update({ _id: data._id }, { $set: objLinea }, options,
        function(err, data) {
            if (err) {
                cb("Error al actualizar la línea después de limpiar toda la basura de su pasado: " + err);
            }
            //Hemos actualizado a false=true las que verdaderamente nos valen, ahora borramos el resto para que la base de datos este limpia para la siguiente pasada
            linea_BD.remove({pasadoRojo: false}, function(err, result) {
                if (err) {
                    cb("Error al las líneas que nos sobran al terminar de analizar y limpiar para el siguiente repo " + err);
                }               
                cb();
            });
        });
    }else{
        //Pasamos directamente a la siguiente pasadad de la funcion async
        cb();
    }
};

/*Función en la que ejecutamos el comando gitLog utilizando la librería javascript.*/
function ejecutaGitLog(data, cb){
    
    var arrayHistoriaLinea = [];
    var lineaConPasadoRojo = false;
    var pathEntero = data.fichero;    
    var path_simple_git = pathEntero.split('/')[0];
    var fichero = pathEntero.split('/')[1];
    var simpleGit = require('simple-git')(path_simple_git);

    var numLinea = data.numLinea;
    var option = numLinea + ',' + numLinea + ':' + fichero;
    simpleGit.log( [ '-L', option], function(err, out){
        if (err){
            cb("Se ha producido un error al ejecutar el comando gitLog en  " + data.fichero + "-> linea: "  + data.numLinea + " ERROR: " + err);
            return;
        }

        for(var i=0; i<out.all.length; i++){
            
            if(out.all[i].hash.indexOf("--- /dev/null") ===  -1  && out.all[i].hash.indexOf("--- a/") != -1 && out.all[i].hash.indexOf("+++ b/") != -1 ){
                if(out.all[i].hash.split('\n')[4].slice(1).length >= 80){
                        lineaConPasadoRojo = true;
                        arrayHistoriaLinea.push(out.all[i].hash.split('\n')[4].slice(1));
                }
            }
            
        }
        
        //Si se mete aqui es que esa línea tiene pasado rojo
        if(lineaConPasadoRojo){
            //Antes de nada debo quitar la basura que me ha podido meter el comando gitLog en la historia de una línea
            //es decir, algunas línea que ahora mismo tienen pasado rojo, le pondremos un false, ya que el pasado que 
            //tengan será basura que le haya introducido gitLog.
            limpiaBasuraHistoria(data, arrayHistoriaLinea, cb);
        }else{
            //Si no tiene pasado rojo, directamente pasamos a la siguiente pasada de la función async
            //Antes de pasar a la siguiente lo que hacemos es borrar la línea porque entonces ya no nos hace falta en la base de datos
            linea_BD.remove({_id:data._id}, function(err, result) {
                if (err) {
                    cb("Error al las líneas que nos sobran al terminar de analizar y limpiar para el siguiente repo " + err);
                }             
                cb();
            });
        }
    });
};


function analizarLineasNaranjas(res){
    console.log("Llamamos a la función analizarLineasNaranjas:");
    /**Sacamos todas las líneas que tenemos en la base de datos, ya que solo hemos guardado las líneas naranjas en la pasada anterior**/    
    var query = linea_BD.find({pasadoRojo: false});
    query.exec(function(err, rows){
        if (err){
            res.status(500).send({err:err});
            return;
        }

         /**Vamos a utilizar ahora la funciónn async.each*/
        /** La función toma una matriz de elementos e itera sobre ellos llamando a una función de encapsulamiento que acepta el elemento
        como un argumento. Cuando todas las llamadas se hayan completado, se especifica una función final a ser llamada.**/
        console.log("Tenemos estas lineas naranjas para analizar: " + rows.length);
        async.each(rows, function(item, cb){
            trazaPasadaAsync ++;
            //console.log("Nueva pasada por async  " + trazaPasadaAsync  + " " + item.fichero + " en la linea: " + item.numLinea);
            ejecutaGitLog(item, cb);
        }, function(err){
            //Cuando todas las pasadas han terminado se llama a esta función.
            if (err){
                res.status(500).send({err:err});
                return;
            }
            var query = linea_BD.find({pasadoRojo: true});
            query.exec(function(err, rows){
                if (err){
                    res.status(500).send({err:err});
                    return;
                }
                var objetoRespuesta = {};
                objetoRespuesta.numeroDeLineasConflictivas = rows.length;
                res.send(objetoRespuesta);
                return;
            });
        });
     });
};


router.get('/', function(req, res, next) {
    console.log("Me llaman a analisis de Lineas naranjas: ");
    analizarLineasNaranjas(res);
});

module.exports = router;