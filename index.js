import express from "express";
import bodyParser from "body-parser";
import axios from "axios";
import path from "path"; // Importa el módulo 'path' para manejar rutas de archivos

const app = express();
const port = 3000;

// Configuración del motor de vistas EJS
app.set("views", path.join(__dirname, "views")); // Establece la carpeta de vistas
app.set("view engine", "ejs"); // Establece EJS como el motor de vistas

// Middleware para parsear las solicitudes con body-parser
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Función para realizar la autenticación y obtener el token
async function loginToAPI() {
  try {
    const loginParams = {
      CompanyDB: "SBOAUDIFRPRDAR",
      UserName: "blx",
      Password: "Audi.2021"
    };

    const response = await axios.post("https://app-afiliados.audifarmsalud.com:50000/b1s/v1/Login", loginParams);
    return response.data.SessionId; // Suponiendo que el token de autenticación es SessionId
  } catch (error) {
    console.error("Error en la autenticación:", error);
    throw error;
  }
}

// Función para obtener los datos desde la API
async function obtenerDatosDesdeAPI(U_NroAfiliado) {
  try {
    const authToken = await loginToAPI();
    const apiUrl = `https://app-afiliados.audifarmsalud.com:50000/b1s/v1/sml.svc/VFCV_AUDI_PEDIDOSPRD?$filter=U_Nroafiliado eq '${U_NroAfiliado}'`;
    const apiResponse = await axios.get(apiUrl, { headers: { Authorization: `Bearer ${authToken}` } });

    if (Array.isArray(apiResponse.data.value)) {
      return apiResponse.data.value.map(item => ({
        DOCDUEDATE_ORDV: item.DOCDUEDATE_ORDV,
        U_REMITO: item.U_REMITO,
        U_NOMBRE_FD: item.U_NOMBRE_FD,
        ESTADO: item.ESTADO,
        Dscription: item.Dscription
      }));
    } else {
      return []; // Devuelve un array vacío si no hay datos
    }
  } catch (error) {
    console.error("Error al obtener los datos:", error);
    throw error;
  }
}

app.post("/nroDNI", async (req, res) => {
  console.log("Se recibió una solicitud POST en /nroDNI");
  const DatosAfiliado = req.body.U_Nroafiliado;
  console.log("Datos recibidos:", DatosAfiliado);

  try {
    // Lógica para obtener los datos utilizando DatosAfiliado
    const data = await obtenerDatosDesdeAPI(DatosAfiliado);
    
    // Renderizar la vista con los datos obtenidos
    res.render("index", { locals: { U_NroAfiliado: data } });
  } catch (error) {
    console.error("Error al procesar la solicitud:", error);
    res.status(500).send("Hubo un error al procesar la solicitud.");
  }
});

// Ruta para manejar la solicitud GET y renderizar el formulario inicial
app.get("/", (req, res) => {
  res.render("index", { U_NroAfiliado: null }); // Renderizar el formulario inicial sin datos
});

// Configuración del servidor para escuchar en el puerto definido
app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});
