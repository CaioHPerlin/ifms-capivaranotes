import { openDB } from "idb";

let db;
async function criarDB(){
    try {
        db = await openDB('banco', 1, {
            upgrade(db, oldVersion, newVersion, transaction){
                switch  (oldVersion) {
                    case 0:
                    case 1:
                        const store = db.createObjectStore('anotacao', {
                            keyPath: 'titulo'
                        });
                        store.createIndex('id', 'id');
                        console.log("banco de dados criado!");
                }
            }
        });
        console.log("banco de dados aberto!");
    }catch (e) {
        console.log('Erro ao criar/abrir banco: ' + e.message);
    }
}

window.addEventListener('DOMContentLoaded', async event =>{
    criarDB();
    document.getElementById('btnCadastro').addEventListener('click', adicionarAnotacao);

    document.getElementById('btnCarregar').addEventListener('click', buscarTodasAnotacoes);
    document.getElementById('btnBusca').addEventListener('click', buscarUmaAnotacao);

    document.getElementById('btnPreenche').addEventListener('click', preencherForm);
    document.getElementById('btnAtualiza').addEventListener('click', atualizarAnotacao);
    document.getElementById('btnCancelaAtualizacao').addEventListener('click', fecharAtualizacao);

    document.getElementById('btnRemocao').addEventListener('click', removerAnotacao);
});

async function buscarTodasAnotacoes(){
    if(db == undefined){
        console.log("O banco de dados está fechado.");
    }
    const tx = await db.transaction('anotacao', 'readonly');
    const store = await tx.objectStore('anotacao');
    const anotacoes = await store.getAll();
    if(anotacoes){
        const divLista = anotacoes.map(anotacao => novaDiv(anotacao.titulo, anotacao.categoria, anotacao.data, anotacao.descricao));
        listagem(divLista.join(' '));
    }
}

async function buscarUmaAnotacao(){
    const titulo = document.getElementById("tituloBusca").value;

    const anotacao = await buscarNoBanco(titulo)
    if(anotacao) listagem(novaDiv(anotacao.titulo, anotacao.categoria, anotacao.data, anotacao.descricao));
}

async function adicionarAnotacao() {
    let titulo = document.getElementById("titulo").value;
    let categoria = document.getElementById("categoria").value;
    let descricao = document.getElementById("descricao").value;
    let data = document.getElementById("data").value;
    const tx = await db.transaction('anotacao', 'readwrite')
    const store = tx.objectStore('anotacao');
    try {
        await store.add({ titulo: titulo, categoria: categoria, descricao: descricao, data: data });
        await tx.done;
        limparCampos();
        buscarTodasAnotacoes();
        console.log('Registro adicionado com sucesso!');
    } catch (error) {
        console.error('Erro ao adicionar registro:', error);
        tx.abort();
    }
}

async function atualizarAnotacao(){
    const titulo = document.getElementById('tituloUpdate').value;
    const categoria = document.getElementById('categoriaUpdate').value;
    const data = document.getElementById('dataUpdate').value;
    const descricao = document.getElementById('descricaoUpdate').value;

    const tx = await db.transaction('anotacao', 'readwrite');
    const store = tx.objectStore('anotacao');
    try {
        await store.put({ titulo: titulo, categoria: categoria, descricao: descricao, data: data });
        await tx.done;
        fecharAtualizacao();
        buscarTodasAnotacoes();
        console.log('Anotação atualizada com sucesso!');
    } catch (error) {
        console.error('Erro ao atualziar anotação:', error);
        tx.abort();
    }
}

async function removerAnotacao() {
    const tituloInput = document.getElementById('tituloRemocao');
    const anotacao = await buscarNoBanco(tituloInput.value);
    if(anotacao){
        const tx = await db.transaction('anotacao', 'readwrite');
        const store = tx.objectStore('anotacao');
        await store.delete(tituloInput.value);
        await tx.done;
        tituloInput.value = '';
        buscarTodasAnotacoes();
        console.log("Anotação removida com sucesso!");
    }else{
        console.log("Anotação não encontrada no banco")
    }
}

async function preencherForm() {
    const tituloInput = document.getElementById('tituloUpdate')
    const anotacao = await buscarNoBanco(tituloInput.value);
    if(anotacao){
        tituloInput.setAttribute('readonly', 'readonly');
        document.getElementById('updateForm').style.display = 'block';
        document.getElementById('categoriaUpdate').value = anotacao.categoria;
        document.getElementById('dataUpdate').value = anotacao.data;
        document.getElementById('descricaoUpdate').value = anotacao.descricao;
    }else{
        console.log("Anotação não encontrada.");
    }
}

function fecharAtualizacao() {
    document.getElementById('tituloUpdate').removeAttribute('readonly');
    document.getElementById('tituloUpdate').value = '';
    document.getElementById('categoriaUpdate').value = '';
    document.getElementById('dataUpdate').value = '';
    document.getElementById('descricaoUpdate').value = '';
    document.getElementById('updateForm').style.display = 'none';
}

async function buscarNoBanco(titulo){
    if(db == undefined){
        return console.log("O banco de dados está fechado.");
    }
    const tx = await db.transaction('anotacao', 'readonly');
    const store = await tx.objectStore('anotacao');
    const anotacao = await store.get(titulo);
    await tx.done;
    if(anotacao) return anotacao;

    console.log("Anotação não encontrada.")
}

function limparCampos() {
    document.getElementById("titulo").value = '';
    document.getElementById("categoria").value = '';
    document.getElementById("descricao").value = '';
    document.getElementById("data").value = '';
}

function listagem(text){
    document.getElementById('resultados').innerHTML = text;
}

function novaDiv(titulo, categoria, data, descricao){
    return `<div class="item">
        <p>Anotação</p>
        <p>${titulo} - ${data} | ${categoria} </p>
        <p>${descricao}</p>
   </div>`
}