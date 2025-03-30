const express = require('express');
const bodyParser = require('body-parser');
const consultarCNPJ = require("consultar-cnpj");

const app = express();

// Configurações
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Rota principal
app.get('/', (req, res) => {
    res.render('index');
});

// Rota para consulta
app.post('/consultar', async (req, res) => {
    if (!req.body || !req.body.cnpj) {
        return res.status(400).render('resultado', {
            empresa: null,
            erro: 'CNPJ não fornecido'
        });
    }

    const cnpj = req.body.cnpj.replace(/\D/g, '');
    
    try {
        const empresa = await consultarCNPJ(cnpj);
        res.render('resultado', { 
            empresa,
            erro: null
        });
    } catch (error) {
        let mensagem = "Erro ao consultar CNPJ";
        if (error.response && error.response.status === 404) {
            mensagem = "CNPJ não encontrado";
        }
        res.render('resultado', { 
            empresa: null,
            erro: `${mensagem}: ${error.message}` 
        });
    }
});

// Exporta apenas o app, sem iniciar o servidor
module.exports = app; 