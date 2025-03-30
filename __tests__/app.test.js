const request = require('supertest');
const express = require('express');
const bodyParser = require('body-parser');
const app = require('../app');
const consultarCNPJ = require('consultar-cnpj');

jest.mock('consultar-cnpj');

describe('API de Consulta de CNPJ', () => {
    let server;

    beforeAll((done) => {
        server = app.listen(0, done); // Usa porta aleatória
    });

    afterAll((done) => {
        server.close(done);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    describe('GET / - Rota principal', () => {
        it('deve retornar status 200 e renderizar a página inicial', async () => {
            const response = await request(app)
                .get('/')
                .expect(200)
                .expect('Content-Type', /html/);
            
            expect(response.text).toContain('Consulta de CNPJ');
            expect(response.text).toContain('<form action="/consultar" method="POST">');
        });
    });

    describe('POST /consultar - Rota de consulta', () => {
        const mockEmpresa = {
            nome: 'Empresa Teste Ltda',
            razao_social: 'Empresa Teste Ltda',
            estabelecimento: {
                cnpj: '12345678000195',
                data_inicio_atividade: '2020-01-01',
                tipo: 'Matriz',
                tipo_logradouro: 'Rua',
                logradouro: 'Teste',
                numero: '123',
                bairro: 'Centro',
                cidade: { nome: 'São Paulo' },
                estado: { sigla: 'SP' },
                cep: '01001000',
                ddd1: '11',
                telefone1: '999999999',
                email: 'contato@empresateste.com.br',
                atividade_principal: { descricao: 'Comércio varejista' }
            },
            porte: { descricao: 'ME' },
            natureza_juridica: { descricao: 'Sociedade Limitada' }
        };

        it('deve retornar dados da empresa para um CNPJ válido', async () => {
            consultarCNPJ.mockResolvedValue(mockEmpresa);

            const response = await request(app)
                .post('/consultar')
                .send('cnpj=12.345.678/0001-95')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(200);

            expect(response.text).toContain('Empresa Teste Ltda');
            expect(response.text).toContain('12345678000195');
            expect(response.text).toContain('São Paulo - SP');
            expect(consultarCNPJ).toHaveBeenCalledWith('12345678000195');
        });

        it('deve lidar com CNPJ não encontrado', async () => {
            const error = new Error('CNPJ não encontrado');
            error.response = { status: 404 };
            
            consultarCNPJ.mockRejectedValue(error);

            const response = await request(app)
                .post('/consultar')
                .send('cnpj=00.000.000/0000-00')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(200);

            expect(response.text).toContain('CNPJ não encontrado');
            expect(consultarCNPJ).toHaveBeenCalledWith('00000000000000');
        });

        it('deve lidar com erros genéricos na consulta', async () => {
            const error = new Error('Erro na API');
            
            consultarCNPJ.mockRejectedValue(error);

            const response = await request(app)
                .post('/consultar')
                .send('cnpj=11.111.111/1111-11')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(200);

            expect(response.text).toContain('Erro ao consultar CNPJ');
            expect(consultarCNPJ).toHaveBeenCalledWith('11111111111111');
        });

        it('deve limpar caracteres não numéricos do CNPJ', async () => {
            consultarCNPJ.mockResolvedValue(mockEmpresa);

            await request(app)
                .post('/consultar')
                .send('cnpj=12.345.678/0001-95')
                .set('Content-Type', 'application/x-www-form-urlencoded');

            expect(consultarCNPJ).toHaveBeenCalledWith('12345678000195');
        });

        it('deve lidar com CNPJ não fornecido', async () => {
            const response = await request(app)
                .post('/consultar')
                .send('')
                .set('Content-Type', 'application/x-www-form-urlencoded')
                .expect(400);

            expect(response.text).toContain('CNPJ não fornecido');
        });
    });
});