# Chácara Santa Fé

Landing page da **Chácara Santa Fé**: espaço para festas infantis, casamentos e estadia familiar com pernoite.

Instagram: [@chacara.santafe1](https://instagram.com/chacara.santafe1)

## Estrutura

```
index.html   página completa (HTML, CSS e JavaScript num só arquivo)
img/         fotos da chácara e logotipo (logo.png em alta, logo-256.png no site)
```

## Como editar os contatos

No final do `index.html`, altere o objeto `CONFIG`:

```js
const CONFIG = {
  whatsapp: "",                 // só números com DDI e DDD, ex.: 5562999999999
  phone: "(00) 00000-0000",
  instagram: "@chacara.santafe1",
  address: "Endereço da chácara, Cidade – UF"
};
```

Com o número de WhatsApp preenchido, todos os botões de reserva passam a abrir a conversa automaticamente.

## Publicar no GitHub Pages

Settings → Pages → Branch `main` / pasta `/ (root)` → Save. O site fica em `https://<usuario>.github.io/chacara-santa-fe/`.
