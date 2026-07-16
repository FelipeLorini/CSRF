const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Configuracao da sessao
app.use(session({
    secret: 'segredo-super-secreto',
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false,
        sameSite: 'lax'
    }
}));

// Middleware para verificar autenticacao
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
        <a href="/logout">Sair</a>
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

// Rota de logout
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.send('Logout realizado! <a href="/login">Fazer login novamente</a>');
    });
});

// Rota para verificar se esta logado
app.get('/status', (req, res) => {
    if (req.session.usuarioId) {
        res.json({ logado: true, usuario: req.session.usuario });
    } else {
        res.json({ logado: false });
    }
});

app.listen(PORT, () => {
    console.log('Servidor VULNERAVEL rodando em: http://localhost:' + PORT);
    console.log('ATENCAO: Este servidor esta VULNERAVEL a CSRF!');
    console.log('Acesse http://localhost:' + PORT + '/login para fazer login');
});