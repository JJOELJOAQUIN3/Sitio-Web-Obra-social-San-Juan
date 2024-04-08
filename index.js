const express = require("express");
const path = require("path");
const axios = require("axios");

const app = express();
const port = 3000;

let data = null; // Variable global para almacenar los datos de la API


app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Establecer el directorio de vistas y el motor de vistas EJS
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

// Función para realizar la autenticación y obtener el token
async function loginToAPI() {
  try {
    const loginParams = {
      CompanyDB: "SBOAUDIFRPRDAR",
      UserName: "blx",
      Password: "Audi.2021"
    };

    const response = await axios.post("https://app-afiliados.audifarmsalud.com:50000/b1s/v1/Login", loginParams);
    return response.data.SessionId; // Asumiendo que el token de autenticación es SessionId
  } catch (error) {
    console.error("Error en la autenticación:", error);
    throw error;
  }
}

// Función para obtener los datos desde la API
async function obtenerDatosDesdeAPI(U_NroAfiliado) {
  try {
    // Realizar la autenticación antes de la solicitud a la API principal
    const authToken = await loginToAPI();

    // Construir la URL de la API con el número de afiliado
    const apiUrl = `https://app-afiliados.audifarmsalud.com:50000/b1s/v1/sml.svc/VFCV_AUDI_PEDIDOSPRD?$filter=U_Nroafiliado eq '${U_NroAfiliado}'`;

    // Realizar la solicitud a la API
    const apiResponse = await axios.get(apiUrl, {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    });

    // Extraer y formatear los datos específicos de la respuesta de la API
    data = apiResponse.data.value.map(item => ({
      DOCDUEDATE_ORDV: item.DOCDUEDATE_ORDV,
      U_REMITO: item.U_REMITO,
      U_NOMBRE_FD: item.U_NOMBRE_FD,
      ESTADO: item.ESTADO,
      Dscription: item.Dscription
    }));

    return data; // Devolver los datos extraídos

  } catch (error) {
    console.error("Error al obtener los datos:", error);
    throw error;
  }
}

// Ruta para manejar la solicitud POST desde el formulario
app.post("/", async (req, res) => {
  try {
    const U_NroAfiliado = req.body.U_Nroafiliado;

    // Obtener datos desde la API utilizando la función auxiliar
    const data = await obtenerDatosDesdeAPI(U_NroAfiliado);


 // Renderizar la vista index.ejs con los datos obtenidos
 if (data && Array.isArray(data) && data.length > 0) {
  res.render("index", { data });
} else {
  res.render("index", { error: "No se encontraron datos." });
}
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    res.render("index", { error: "Hubo un error al obtener los datos." });
  }
});

// Ruta para manejar la solicitud GET y renderizar el formulario
app.get("/", async (req, res) => {
  try {
    // Llamar a la función para obtener los datos utilizando un valor por defecto
    const defaultData = await obtenerDatosDesdeAPI("algun-valor-por-defecto");

    // Verificar si se obtuvieron datos
    if (defaultData && Array.isArray(defaultData) && defaultData.length > 0) {
      // Si se obtuvieron datos, renderizar la vista con los datos
      res.render("index", { data: defaultData, error: null });
    } else {
      // Si no se obtuvieron datos (por ejemplo, mostrar un mensaje de error)
      res.render("index", { data: null, error: "No se encontraron datos." });
    }
  } catch (error) {
    // Capturar y manejar cualquier error que ocurra al obtener los datos
    console.error("Error al obtener los datos:", error);
    res.render("index", { data: null, error: "Hubo un error al obtener los datos." });
  }
});



app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
