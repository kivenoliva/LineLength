/*

en historia[1,2];

el 1 es la línea más antigua en el pasado.
iria el 1, luego el 2 y luego la linea actual

*/


"use strict";

// Cargamos las librerías necesarias
require("./lib/connectMongoose");
require("./models/linea_models");
require("./models/repositorio_models");

var mongoose = require('mongoose'); 
var linea_BD = mongoose.model("Linea");
var repositoriosBD = mongoose.model("Repositorios");
var fs = require('fs');

//Variables globales
//LA LINEA SE QUEDA IGUAL PERO SE ACORTA POR TABULACIONES
var acortaPorTabulaciones = [];
//LA LINEA SE ACORTA POR  EL CAMBIO DE UNA SOLA PALABRA. POSIBLE VARIABLE
var acortaPorUnaPalabra = [];
//LA LINEA SE ACORTA POR EL CAMBIO DE TABULACIONES Y ADEMAS UNA SOLA PALABRA, QUE PUEDE SER UNA VARIABLE
var acortaPorTabsYPalabra = [];
//RESTO DE LINEAS QUE NO SE CLASIFICAN
var restoPalabras = [];


/******************************************************************************************************************************
/******************************************************************************************************************************
/******************************************************************************************************************************
/****************************************** DECLARACIÓN DE FUNCIONES**********************************************************
/******************************************************************************************************************************
/******************************************************************************************************************************
/*****************************************************************************************************************************/

function compruebaPorTabsYPalabra(lineaAntigua, lineaActual, numLinea, fichero){
    var resultado = false;

    if(lineaAntigua.length >= 80){
        var contador = 0;
        var objetoGuardado = {};
        var result1 = lineaAntigua.split(" ");
        var result2 =  lineaActual.split(" ");
        var result1SinEspacios = [];
        var result2SinEspacios = [];

        //Hacemos primero dos arrays sólo con las palabras, sin espacios.
        for(var i = 0; i< result1.length; i++){
            if(result1[i] != ""){
                result1SinEspacios.push(result1[i]);
            }    
        }

        for(var j = 0; j< result2.length; j++){
            if(result2[j] != ""){
                result2SinEspacios.push(result2[j]);
            }    
        }


        //Si en un principio son diferentes y despues de los espacios son iguales estamos en nuestro caso
        if(result1.length != result2.length && result1SinEspacios.length == result2SinEspacios.length){
            for(var i = 0; i< result1SinEspacios.length; i++){
                if(result1SinEspacios[i] != result2SinEspacios[i]){
                    contador ++;
                }
            }
            if(contador === 1){
                objetoGuardado.lineaSiguiente = lineaActual;
                objetoGuardado.lineaAntigua = lineaAntigua;
                objetoGuardado.numLinea =  numLinea;
                objetoGuardado.fichero = fichero;
                acortaPorTabsYPalabra.push(objetoGuardado);
                resultado = true;
                console.log("Añadimos una línea del tipo: LA LINEA SE ACORTA POR TABULACIONES Y UNA SOLA PALABRA");
            }
        }
    }
    return resultado;
}


function compruebaPorUnaPalabra(lineaAntigua, lineaActual, numLinea, fichero){
    var resultado = false;

    if(lineaAntigua.length >= 80){
        var contador = 0;
        var objetoGuardado = {};
        var result1 = lineaAntigua.split(" ");
        var result2 =  lineaActual.split(" ");

        if(result1.length === result2.length){
            for(var i = 0; i< result1.length; i++){
                if(result1[i] != result2[i]){
                    contador ++;
                }
            }
            if(contador === 1){
                objetoGuardado.lineaSiguiente = lineaActual;
                objetoGuardado.lineaAntigua = lineaAntigua;
                objetoGuardado.numLinea =  numLinea;
                objetoGuardado.fichero = fichero;
                acortaPorUnaPalabra.push(objetoGuardado);
                resultado = true;
                console.log("Añadimos una línea del tipo: LA LINEA SE ACORTA POR UNA SOLA PALABRA");
            }
        }
    }

    return resultado;

}

function meterEnRestoDePalabras(lineaAntigua, lineaActual, numLinea, fichero){
    console.log("Me han llamado a meterEnRestoDePalabras");

    if(lineaAntigua.length >= 80){

        var resultado;
        var objetoGuardado = {};

        objetoGuardado.lineaSiguiente = lineaActual;
        objetoGuardado.lineaAntigua = lineaAntigua;
        objetoGuardado.numLinea =  numLinea;
        objetoGuardado.fichero = fichero;
        restoPalabras.push(objetoGuardado);
        resultado = true;
        console.log("Añadimos una línea del tipo: METER EN RESTO DE PALABRAS");

        return resultado;
    }
}

function compruebaPorTabulaciones(lineaAntigua, lineaActual, numLinea, fichero){
    
    var resultado = false;
    if(lineaAntigua.length >= 80){
        //Comprobamos si la línea se acorta sólo por tema de tabulaciones al principio.
        //Cogemos a partir de los 4 primeros caracteres, si la línea restante es igual, y los 4 primeros caracteres son espacios, entra.
        var restoLinea4 = lineaAntigua.slice(4);
        var principioDeLinea4 = lineaAntigua.substring(0, 4);

        var restoLinea8 = lineaAntigua.slice(8);
        var principioDeLinea8 = lineaAntigua.substring(0, 8);

        var objetoGuardado = {};

        if(restoLinea4 === lineaActual && (principioDeLinea4 === "    " || principioDeLinea4 === "\t")){
            console.log("Añadimos una línea del tipo: LA LINEA SE QUEDA IGUAL PERO SE ACORTA POR 4 TABULACIONES");
            objetoGuardado.lineaSiguiente = lineaActual;
            objetoGuardado.lineaAntigua = lineaAntigua;
            objetoGuardado.numLinea =  numLinea;
            objetoGuardado.fichero = fichero;
            acortaPorTabulaciones.push(objetoGuardado);
            resultado = true;
        }

        if(restoLinea8 === lineaActual && (principioDeLinea8 === "        " || principioDeLinea8 === "\t\t")){
            console.log("Añadimos una línea del tipo: LA LINEA SE QUEDA IGUAL PERO SE ACORTA POR 8 TABULACIONES");
            objetoGuardado.lineaSiguiente = lineaActual;
            objetoGuardado.lineaAntigua = lineaAntigua;
            objetoGuardado.numLinea =  numLinea;
            objetoGuardado.fichero = fichero;
            acortaPorTabulaciones.push(objetoGuardado);
            resultado = true;
        }
    }

    return resultado;
}


function clasificacionLineas(row){
    console.log("Comenzamos a clasificar las líneas conflictivas");
    
    if(row.historia.length == 1){

        console.log("Una línea en la historia");


        if(!compruebaPorTabulaciones(row.historia[0], row.linea, row.numLinea, row.fichero)){
            //Se hace otra comprobacion, vamos a tener que ir anidando todas
            console.log("Comprobacion por tabulaciones da FALSE, pasamos a comprobar si es por una sola palabra.");
            if(!compruebaPorUnaPalabra(row.historia[0], row.linea, row.numLinea, row.fichero)){
                console.log("Comprobacion por una sola palabra da FALSE, pasamos a comprobar si es por tabulaciones y ademas por una palabra."); 
                if(!compruebaPorTabsYPalabra(row.historia[0], row.linea, row.numLinea, row.fichero)){
                    console.log("Comprobacion por tabulaciones y además una sola palabra da FALSE, pasamos a meter en el resto 1");
                    meterEnRestoDePalabras(row.historia[0], row.linea, row.numLinea, row.fichero);
                }
            }
        }

           

        
    }else{
        console.log("Más de una linea en la historia");
        //Miramos primero si tenemos que comparar las líneas que hay en el array historia entre si, si se cumplen las condiciones que
        //deben cumplirse con los tamaños, etc..
        var lineaAntigua = "";
        var lineaModerna = "";
        var contadorAntes = acortaPorTabulaciones.length;

        //Me lo recorro al revés porque en el array de historia[], la primera línea es la más antigua.
        for (var i = (row.historia.length-1); i>=0; i--){
            if((row.historia[i-1] != undefined) && (row.historia[i-1].length >= 70 && row.historia[i-1].length < 80) && (row.historia[i].length >= 80)){
                lineaAntigua = row.historia[i];
                lineaModerna = row.historia[i-1];
                console.log("Comprobamos si es por tabulaciones dentro del for con : ");
                if(!compruebaPorTabulaciones(lineaAntigua,lineaModerna, row.numLinea, row.fichero)){
                    //Se hace otra comprobacion, vamos a tener que ir anidando todas
                    console.log("Comprobacion por tabulaciones da FALSE, pasamos a comprobar si es por una sola palabra.");
                    if(!compruebaPorUnaPalabra(lineaAntigua, lineaModerna, row.numLinea, row.fichero)){
                        console.log("Comprobacion por una sola palabra da FALSE, pasamos a comprobar"); 
                        if(!compruebaPorTabsYPalabra(lineaAntigua, lineaModerna, row.numLinea, row.fichero)){
                            console.log("Comprobacion por tabulaciones y además una sola palabra da FALSE, pasamos a meter en el resto 2");
                            meterEnRestoDePalabras(lineaAntigua, lineaModerna, row.numLinea, row.fichero);
                        }
                    }
                }
            }
        }

        //Cuando nos hemos recorrido todo el for queda comprobar la última línea en la historia con la actual.
        console.log("Comprobamos si es por tabulaciones despúes de recorrernos el for con: ");
        if(!compruebaPorTabulaciones(row.historia[0], row.linea, row.numLinea, row.fichero)){
            //Se hace otra comprobacion, vamos a tener que ir anidando todas
            console.log("Comprobacion por tabulaciones da FALSE, pasamos a comprobar si es por una sola palabra.");
            if(!compruebaPorUnaPalabra(row.historia[0], row.linea, row.numLinea, row.fichero)){
                console.log("Comprobacion por una sola palabra da FALSE, pasamos a comprobar"); 
                if(!compruebaPorTabsYPalabra(row.historia[0], row.linea, row.numLinea, row.fichero)){
                    console.log("Comprobacion por tabulaciones y además una sola palabra da FALSE, pasamos a meter en el resto 3");
                            meterEnRestoDePalabras(row.historia[0], row.linea, row.numLinea, row.fichero);
                }
            }
        }
    }
}

function calcularDatosInicialesTotales(row){
    var objetoRespuesta = {};
    var lineasVerdes = 0;
    var lineasRojas = 0;
    var lineasNaranjas = 0;

    for(var i=0; i<row.length; i++){
        lineasVerdes = Number(lineasVerdes) + Number(row[i].lineasVerdes);
        lineasRojas = Number(lineasRojas) + Number(row[i].lineasRojas);
        lineasNaranjas = Number(lineasNaranjas) + Number(row[i].lineasNaranjas);
    }

    objetoRespuesta.NumeroTotalLineasVerdesAnalizadas = lineasVerdes;
    objetoRespuesta.NumeroTotalLineasNaranjasAnalizadas = lineasNaranjas;
    objetoRespuesta.NumeroTotalLineasRojasAnalizadas = lineasRojas;

    return objetoRespuesta;
}




/******************************************************************************************************************************
/******************************************************************************************************************************
/******************************************************************************************************************************
/****************************************** FIN DECLARACIÓN DE FUNCIONES******************************************************
/******************************************************************************************************************************
/******************************************************************************************************************************
/*****************************************************************************************************************************/


var query = linea_BD.find({pasadoRojo: true});
query.exec(function(err, rows){
    if (err){
        throw new Error("Se ha producido un error al obtener las líneas naranjas con pasadoRojo = true: " + err);
        return;
    }

    for(var i = 0; i < rows.length; i++){
        console.log("···············································");
        for(var j = 0; j < rows[i].historia.length; j++){
            console.log("1 - " + rows[i].historia[j]);
        }
        console.log("2 - " + rows[i].linea);
        console.log("···············································");
        clasificacionLineas(rows[i]);
    }

    console.log("Empezamos a pintar el resultado: ");
    var query = repositoriosBD.find({});
    query.exec(function(err, resumen){
        //Ahora vamos a escribir en un fichero.txt los resultados obtenidos.
        var textoEnFichero = "";
        textoEnFichero += "RESUMEN DE LOS REPOSITORIOS ANALIZADOS: " + "\n\n";
        textoEnFichero += resumen;
        textoEnFichero += "\n\n";

        var resumenTotalDeLineas = calcularDatosInicialesTotales(resumen);

        textoEnFichero += "********************************************************************************************************************************************************************";
        textoEnFichero += "\n\n";

        textoEnFichero += "RESUMEN DE TODAS LAS LINEAS QUE HEMOS ANALIZADO EN TOTAL: " + "\n\n";
        textoEnFichero += "LÍNEAS VERDES ANALIZADAS EN TOTAL: " + resumenTotalDeLineas.NumeroTotalLineasVerdesAnalizadas;
        textoEnFichero += "\n";

        textoEnFichero += "LÍNEAS NARANJA ANALIZADAS EN TOTAL: " + resumenTotalDeLineas.NumeroTotalLineasNaranjasAnalizadas;
        textoEnFichero += "\n";

        textoEnFichero += "LÍNEAS ROJAS ANALIZADAS EN TOTAL: " + resumenTotalDeLineas.NumeroTotalLineasRojasAnalizadas;
        textoEnFichero += "\n\n";

        textoEnFichero += "********************************************************************************************************************************************************************";
        textoEnFichero += "\n\n";

        textoEnFichero += "NÚMERO DE LÍNEAS CONFLICTIVAS OBTENIDAS: " + rows.length;
        textoEnFichero += "\n\n";

        textoEnFichero += "********************************************************************************************************************************************************************";
        textoEnFichero += "\n\n";

        textoEnFichero += "INFORMACIÓN DE LAS LÍNEAS CONFLICTIVAS: " + "\n\n\n"; 

        textoEnFichero += "LÍNEAS QUE SE ACORTAN POR TABULACIONES: " + acortaPorTabulaciones.length + "\n\n";
        for(var k = 0; k < acortaPorTabulaciones.length; k++){
            textoEnFichero +=  "Línea Actual ----------> " +  acortaPorTabulaciones[k].lineaSiguiente +  "\n";
            textoEnFichero +=  "Línea en el Pasado ----> " +  acortaPorTabulaciones[k].lineaAntigua +  "\n\n";
        }         

        textoEnFichero += "LA LÍNEA SE ACORTA POR  EL CAMBIO DE UNA SOLA PALABRA. POSIBLE VARIABLE: " + acortaPorUnaPalabra.length + "\n\n";
        for(var k = 0; k < acortaPorUnaPalabra.length; k++){
            textoEnFichero +=  "Línea Actual ----------> " +  acortaPorUnaPalabra[k].lineaSiguiente +  "\n";
            textoEnFichero +=  "Línea en el Pasado ----> " +  acortaPorUnaPalabra[k].lineaAntigua +  "\n\n";
        }       

        textoEnFichero += "LA LÍNEA SE ACORTA POR EL CAMBIO DE TABULACIONES Y UNA SOLA PALABRA, POSIBLE VARIABLE:  " + acortaPorTabsYPalabra.length + "\n\n";
        for(var k = 0; k < acortaPorTabsYPalabra.length; k++){
            textoEnFichero +=  "Línea Actual ----------> " +  acortaPorTabsYPalabra[k].lineaSiguiente +  "\n";
            textoEnFichero +=  "Línea en el Pasado ----> " +  acortaPorTabsYPalabra[k].lineaAntigua +  "\n\n";
        }       

        textoEnFichero += "RESTO DE LINEAS QUE NO SE CLASIFICAN: " + restoPalabras.length + "\n\n";
        for(var k = 0; k < restoPalabras.length; k++){
            textoEnFichero +=  "Línea Actual ----------> " +  restoPalabras[k].lineaSiguiente +  "\n";
            textoEnFichero +=  "Línea en el Pasado ----> " +  restoPalabras[k].lineaAntigua +  "\n\n";
        }             

        fs.writeFile('resultados.txt', textoEnFichero, function(error){
            if (error){
                reject(new Error("Se ha producido un error al intentar escribir en el fichero txt: " + error));
            }else{
                console.log('El fichero txt se crea correctamente.');
                process.exit(0);
            }
        });
    });
});

